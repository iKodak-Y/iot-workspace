package com.iot.residentapp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NfcPlugin.class);   // ← ahora primero
        super.onCreate(savedInstanceState); // ← después
    }
}