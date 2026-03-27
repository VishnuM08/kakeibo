package com.aignite.kakeibo;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "KakeiboSMS";
    public static String pendingSms = null;
    private static MainActivity instance;
    private static final int PERMISSION_REQUEST_CODE = 123;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        instance = this;
        registerPlugin(KakeiboNative.class);
        super.onCreate(savedInstanceState);

        checkAndRequestPermissions();
        handleIntent(getIntent());
    }

    private void checkAndRequestPermissions() {
        List<String> permissionsNeeded = new ArrayList<>();
        permissionsNeeded.add(Manifest.permission.RECEIVE_SMS);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
        }

        List<String> listPermissionsNeeded = new ArrayList<>();
        for (String perm : permissionsNeeded) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                listPermissionsNeeded.add(perm);
            }
        }

        if (!listPermissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(this, listPermissionsNeeded.toArray(new String[0]),
                    PERMISSION_REQUEST_CODE);
        }
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
