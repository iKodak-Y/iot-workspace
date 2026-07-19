package com.iot.residentapp;

import android.content.Context;
import android.content.SharedPreferences;
import android.nfc.cardemulation.HostApduService;
import android.os.Bundle;
import android.util.Log;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class MyHCEService extends HostApduService {
    private static final String TAG = "MyHCEService";
    // APDU SELECT COMMAND: 0x00, 0xA4, 0x04, 0x00, 0x07, 0xF0, 0x39, 0x41, 0x48, 0x14, 0x81, 0x00
    private static final byte[] APDU_SELECT = {
            (byte) 0x00, // CLA
            (byte) 0xA4, // INS
            (byte) 0x04, // P1
            (byte) 0x00, // P2
            (byte) 0x07, // Length
            (byte) 0xF0, (byte) 0x39, (byte) 0x41, (byte) 0x48, (byte) 0x14, (byte) 0x81, (byte) 0x00 // AID
    };

    private static final byte[] SUCCESS_SW = {(byte) 0x90, (byte) 0x00};
    private static final byte[] UNKNOWN_CMD_SW = {(byte) 0x00, (byte) 0x00};

    @Override
    public byte[] processCommandApdu(byte[] commandApdu, Bundle extras) {
        boolean match = true;
        if (commandApdu.length < APDU_SELECT.length) {
            match = false;
        } else {
            for (int i = 0; i < APDU_SELECT.length; i++) {
                if (commandApdu[i] != APDU_SELECT[i]) {
                    match = false;
                    break;
                }
            }
        }

        if (match) {
            Log.d(TAG, "APDU SELECT received");
            
            SharedPreferences prefs = getApplicationContext().getSharedPreferences("MyAppPrefs", Context.MODE_PRIVATE);
            String token = prefs.getString("deviceToken", "NO_TOKEN");
            
            Log.d(TAG, "Sending token: " + token);
            
            byte[] tokenBytes = token.getBytes(StandardCharsets.UTF_8);
            byte[] response = new byte[tokenBytes.length + SUCCESS_SW.length];
            System.arraycopy(tokenBytes, 0, response, 0, tokenBytes.length);
            System.arraycopy(SUCCESS_SW, 0, response, tokenBytes.length, SUCCESS_SW.length);
            
            return response;
        } else {
            Log.d(TAG, "Unknown APDU received");
            return UNKNOWN_CMD_SW;
        }
    }

    @Override
    public void onDeactivated(int reason) {
        Log.d(TAG, "Deactivated: " + reason);
    }
}
