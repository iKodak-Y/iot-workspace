package com.iot.residentapp;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Nfc")
public class NfcPlugin extends Plugin {

    @PluginMethod
    public void setDeviceToken(PluginCall call) {
        String token = call.getString("token");
        if (token == null) {
            call.reject("Must provide a token");
            return;
        }

        SharedPreferences prefs = getContext().getSharedPreferences("MyAppPrefs", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("deviceToken", token);
        editor.apply();

        call.resolve();
    }
}
