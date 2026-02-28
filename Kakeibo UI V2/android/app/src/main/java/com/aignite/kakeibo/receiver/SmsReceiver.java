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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SmsReceiver extends BroadcastReceiver {

    private String normalizeMessage(String message) {
        return message
                .replace('\u00A0', ' ')   // non-breaking space → normal space
                .replaceAll("[^\\x00-\\x7F]", "") // remove hidden unicode
                .trim();
    }

    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?i)(₹|rs\\.?|inr)\\s*([0-9,]+(?:\\.\\d{1,2})?)"
    );


    private Double extractAmount(String rawMessage) {
        try {
            String message = normalizeMessage(rawMessage);

            Matcher matcher = AMOUNT_PATTERN.matcher(message);
            if (matcher.find()) {
                String amountStr = matcher.group(2).replace(",", "");
                return Double.parseDouble(amountStr);
            }
        } catch (Exception e) {
            Log.e("KAKEIBO_UPI", "Amount parse failed for message:\n" + rawMessage, e);
        }
        return null;
    }


    private boolean isUpiDebitSms(String message) {
        String msg = normalizeMessage(message).toLowerCase();

        boolean hasUpi = msg.contains("upi");
        boolean hasAmount = AMOUNT_PATTERN.matcher(msg).find();

        // Keywords commonly used by Indian banks
        boolean isTransaction =
                msg.contains("txn")
                        || msg.contains("transaction")
                        || msg.contains("spent")
                        || msg.contains("paid")
                        || msg.contains("debited")
                        || msg.contains("at ");

        return hasUpi && hasAmount && isTransaction;
    }

    // Inside your SmsReceiver class...
    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle == null)
                return;

            Object[] pdus = (Object[]) bundle.get("pdus");
            if (pdus == null)
                return;

            for (Object pdu : pdus) {
                SmsMessage sms = SmsMessage.createFromPdu((byte[]) pdu);
                String messageBody = sms.getMessageBody();

                if (isUpiDebitSms(messageBody)) {
                    Double amount = extractAmount(messageBody);
                    if (amount == null) {
                        Log.w("KAKEIBO_UPI", "Skipped SMS (amount not found)");
                        return;
                    }

                    // 1. Create the Data Object
                    JSObject data = new JSObject();
                    data.put("amount", amount);
                    data.put("description", messageBody);
                    data.put("source", "SMS_AUTO");
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        data.put("expenseDateTime", Instant.now().toString());
                    }

                    // 2. SAVE TO SHARED PREFERENCES (The Store Part)
                    saveToStorage(context, data);

                    // 3. Optional: Notify if app is currently open
                    if (SmsReaderPlugin.instance != null) {
                        SmsReaderPlugin.instance.notifySmsExpense(data);
                    }
                }
            }
        }
    }

    private void saveToStorage(Context context, JSObject data) {
        android.content.SharedPreferences prefs = context.getSharedPreferences("Kakeibo_SMS_Storage",
                Context.MODE_PRIVATE);
        String existing = prefs.getString("pending_transactions", "[]");
        try {
            org.json.JSONArray array = new org.json.JSONArray(existing);
            array.put(new org.json.JSONObject(data.toString()));
            prefs.edit().putString("pending_transactions", array.toString()).apply();
        } catch (Exception e) {
            Log.e("KAKEIBO", "Storage failed", e);
        }
    }
}