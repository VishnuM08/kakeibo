package com.aignite.kakeibo;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "KakeiboSMS";
    public static String pendingSms = null;
    private static MainActivity instance;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        instance = this;
        registerPlugin(KakeiboNative.class);
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }


    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null)
            return;

        String smsBody = intent.getStringExtra("sms_body");
        if (smsBody != null) {
            Log.d(TAG, "Opening from SMS Notification: " + smsBody);
            pendingSms = smsBody;
            sendSmsToWeb(smsBody);
        }
    }

    public static void updateActiveSms(String message) {
        if (instance != null) {
            Log.d(TAG, "MainActivity instance found, sending SMS to web");
            instance.runOnUiThread(() -> instance.sendSmsToWeb(message));
        } else {
            Log.d(TAG, "MainActivity instance is null, cannot send directly to web");
        }
    }

    private void sendSmsToWeb(String message) {
        if (message == null || this.bridge == null)
            return;

        String escapedMsg = message.replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");

        String js = "window.dispatchEvent(new CustomEvent('nativeSmsReceived', { detail: { body: '" + escapedMsg
                + "' } }));";
        Log.d(TAG, "Injecting JS to Bridge: " + js);
        this.bridge.eval(js, null);
    }
}
