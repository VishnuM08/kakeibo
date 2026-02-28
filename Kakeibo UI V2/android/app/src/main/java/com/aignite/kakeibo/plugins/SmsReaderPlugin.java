package com.aignite.kakeibo.plugins;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

@CapacitorPlugin(name = "SmsReader")
public class SmsReaderPlugin extends Plugin {

    public static SmsReaderPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    // This will be called from SmsReceiver
    public void notifySmsExpense(JSObject data) {
        notifyListeners("onSmsExpenseDetected", data);
    }

    @PluginMethod
    public void getPendingExpenses(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences("Kakeibo_SMS_Storage", Context.MODE_PRIVATE);
        String data = prefs.getString("pending_transactions", "[]");

        JSObject ret = new JSObject();
        try {
            ret.put("expenses", new JSArray(data));
            // Removed: Clear storage after sending to React.
            // Now cleared explicitly via clearPendingExpenses.
            call.resolve(ret);
        } catch (JSONException e) {
            call.reject("Failed to parse stored expenses");
        }
    }

    @PluginMethod
    public void clearPendingExpenses(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences("Kakeibo_SMS_Storage", Context.MODE_PRIVATE);
        prefs.edit().remove("pending_transactions").apply();
        call.resolve();
    }
}