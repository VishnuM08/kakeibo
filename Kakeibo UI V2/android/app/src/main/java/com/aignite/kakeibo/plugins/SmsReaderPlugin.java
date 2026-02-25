package com.aignite.kakeibo.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

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
}