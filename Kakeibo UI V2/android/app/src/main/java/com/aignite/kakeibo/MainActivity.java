package com.aignite.kakeibo;

import com.getcapacitor.BridgeActivity;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.aignite.kakeibo.plugins.SmsReaderPlugin;

public class MainActivity extends BridgeActivity {

    private static final int SMS_PERMISSION_CODE = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        // ✅ REGISTER PLUGIN FIRST (CRITICAL)
        registerPlugin(SmsReaderPlugin.class);

        // ✅ THEN let Capacitor initialize
        super.onCreate(savedInstanceState);

        // ✅ THEN request permission
        requestSmsPermission();
    }

    private void requestSmsPermission() {
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.READ_SMS
        ) != PackageManager.PERMISSION_GRANTED) {

            ActivityCompat.requestPermissions(
                    this,
                    new String[]{
                            Manifest.permission.READ_SMS,
                            Manifest.permission.RECEIVE_SMS
                    },
                    SMS_PERMISSION_CODE
            );
        }
    }
}