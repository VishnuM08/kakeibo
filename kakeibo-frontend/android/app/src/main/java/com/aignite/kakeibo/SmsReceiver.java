package com.aignite.kakeibo;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "KakeiboSMS";
    private static final String CHANNEL_ID = "SMS_TRANSACTIONS";
    private static final int NOTIFICATION_ID = 1001;

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "SmsReceiver: onReceive triggered with action: " + intent.getAction());
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                String format = bundle.getString("format");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu, format);
                        String messageBody = smsMessage.getMessageBody();
                        String sender = smsMessage.getDisplayOriginatingAddress();

                        Log.d(TAG, "SmsReceiver: SMS Detected from " + sender + ": " + messageBody);

                        // Save to pending in case app is opened later
                        MainActivity.pendingSms = messageBody;

                        if (isTransactionMessage(messageBody)) {
                            Log.d(TAG, "SmsReceiver: Transaction identified. Showing notification.");
                            showNotification(context, messageBody, sender);
                        }
                        
                        // Try to send to web immediately
                        MainActivity.updateActiveSms(messageBody);
                    }
                }
            }
        }
    }

    private boolean isTransactionMessage(String body) {
        if (body == null) return false;
        String lowerBody = body.toLowerCase();
        return (lowerBody.contains("debited") || 
                lowerBody.contains("spent") || 
                lowerBody.contains("credited") || 
                lowerBody.contains("vpa") || 
                lowerBody.contains("upi") || 
                lowerBody.contains("transaction") ||
                lowerBody.contains("a/c") ||
                lowerBody.contains("bal:") ||
                lowerBody.contains("bank") ||
                lowerBody.contains("otp"));
    }

    private void showNotification(Context context, String body, String sender) {
        createNotificationChannel(context);
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("sms_body", body);
        intent.putExtra("sms_sender", sender);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Kakeibo: Transaction Detected")
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
        try {
            notificationManager.notify(NOTIFICATION_ID, builder.build());
        } catch (SecurityException e) {
            Log.e(TAG, "SmsReceiver: Notification permission missing", e);
        }
    }

    private void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "SMS Transactions", NotificationManager.IMPORTANCE_HIGH);
            NotificationManager nm = context.getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }
}