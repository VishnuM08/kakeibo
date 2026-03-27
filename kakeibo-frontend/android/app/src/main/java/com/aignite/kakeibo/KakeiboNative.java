package com.aignite.kakeibo;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import java.util.ArrayList;
import java.util.List;
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
            List<String> perms = new ArrayList<>();
            perms.add(Manifest.permission.RECEIVE_SMS);
            perms.add(Manifest.permission.READ_SMS);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                perms.add(Manifest.permission.POST_NOTIFICATIONS);
            }
            
            ActivityCompat.requestPermissions(getActivity(), perms.toArray(new String[0]), 101);
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
        call.resolve(ret);
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
