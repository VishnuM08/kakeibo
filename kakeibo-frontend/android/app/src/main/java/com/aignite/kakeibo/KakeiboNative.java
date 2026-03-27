package com.aignite.kakeibo;

import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "KakeiboNative")
public class KakeiboNative extends Plugin {

    @PluginMethod
    public void requestSmsPermission(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), 
                new String[]{Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS}, 101);
            call.resolve();
        } else {
            JSObject ret = new JSObject();
            ret.put("status", "granted");
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void checkSmsPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED) {
            ret.put("status", "granted");
        } else {
            ret.put("status", "denied");
        }
    }

    @PluginMethod
    public void getPendingSms(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("sms", MainActivity.pendingSms);
        call.resolve(ret);
    }

    @PluginMethod
    public void clearPendingSms(PluginCall call) {
        MainActivity.pendingSms = null;
        call.resolve();
    }
}
