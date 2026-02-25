package com.aignite.kakeibo.receiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import com.aignite.kakeibo.plugins.SmsReaderPlugin;
import com.getcapacitor.JSObject;

import java.time.Instant;

public class SmsReceiver extends BroadcastReceiver {

    private boolean isUpiDebitSms(String message) {
        String msg = message.toLowerCase();

        return msg.contains("upi")
                && (msg.contains("debited") || msg.contains("spent") || msg.contains("paid"))
                && (msg.contains("rs.") || msg.contains("₹"));
    }
    @Override
    public void onReceive(Context context, Intent intent) {

        if (intent.getAction().equals("android.provider.Telephony.SMS_RECEIVED")) {

            Bundle bundle = intent.getExtras();
            if (bundle == null) return;

            Object[] pdus = (Object[]) bundle.get("pdus");
            if (pdus == null) return;

            for (Object pdu : pdus) {
                SmsMessage sms = SmsMessage.createFromPdu((byte[]) pdu);
                String messageBody = sms.getMessageBody();
                String sender = sms.getOriginatingAddress();

                if (isUpiDebitSms(messageBody)) {
                    Log.d("KAKEIBO_UPI", "UPI SMS detected: " + messageBody);

                    JSObject data = new JSObject();
                    data.put("amount", 0); // TEMP
                    data.put("description", messageBody);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        data.put("expenseDateTime", Instant.now().toString());
                    }
                    data.put("source", "SMS_AUTO");

                    if (SmsReaderPlugin.instance != null) {
                        SmsReaderPlugin.instance.notifySmsExpense(data);
                    } else {
                        Log.e("KAKEIBO_UPI", "SmsReaderPlugin instance is NULL");
                    }
                }
            }
        }
    }
}