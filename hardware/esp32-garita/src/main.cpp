#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include "secrets.h"

// Pines de los componentes
#define SS_PIN 5
#define RST_PIN 22
#define RELAY_PIN 25
#define SERVO_PIN 26
#define BUZZER_PIN 27
#define LED_VERDE 32
#define LED_ROJO 33

MFRC522 mfrc522(SS_PIN, RST_PIN);
Servo gateServo;

void setup() {
  Serial.begin(115200);
  
  // Configurar pines de actuadores y LEDs
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);
  
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_ROJO, LOW);

  // Configurar Servo
  gateServo.attach(SERVO_PIN);
  gateServo.write(0); // Posición inicial (Puerta cerrada)

  // Inicializar RFID
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("Lector RFID inicializado.");

  // Conectar a WiFi
  Serial.print("Conectando a WiFi ");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi conectado!");
}

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // Leer UID
  String uidHex = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if(mfrc522.uid.uidByte[i] < 0x10) uidHex += "0";
    uidHex += String(mfrc522.uid.uidByte[i], HEX);
  }
  uidHex.toUpperCase();
  
  Serial.println("\n💳 Tarjeta: " + uidHex);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");

    JsonDocument doc;
    doc["uidHex"] = uidHex;
    doc["puntoAccesoId"] = PUNTO_ACCESO_ID;
    doc["tokenSeguridad"] = SECURITY_TOKEN;
    String requestBody;
    serializeJson(doc, requestBody);
    
    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      JsonDocument responseDoc;
      deserializeJson(responseDoc, response);
      
      bool autorizado = responseDoc["autorizado"];
      
      if (autorizado) {
        Serial.println("🟢 ACCESO PERMITIDO - Abriendo barrera...");
        // Encender luz verde y relé, levantar servo
        digitalWrite(LED_VERDE, HIGH);
        digitalWrite(RELAY_PIN, HIGH);
        gateServo.write(90); 
        
        // Pitido rápido y feliz de éxito
        digitalWrite(BUZZER_PIN, HIGH);
        delay(200);
        digitalWrite(BUZZER_PIN, LOW);
        
        // Esperar el resto de los 3 segundos para que pase el auto
        delay(2800); 
        
        // Apagar todo y cerrar puerta
        gateServo.write(0);
        digitalWrite(RELAY_PIN, LOW);
        digitalWrite(LED_VERDE, LOW);

      } else {
        Serial.println("🔴 ACCESO DENEGADO");
        // Encender luz roja inmediatamente
        digitalWrite(LED_ROJO, HIGH);
        
        // Tres pitidos cortos de alerta
        for(int i = 0; i < 3; i++){
          digitalWrite(BUZZER_PIN, HIGH);
          delay(100);
          digitalWrite(BUZZER_PIN, LOW);
          delay(100);
        }
        
        // Mantener el LED rojo encendido un instante más
        delay(1500);
        digitalWrite(LED_ROJO, LOW);
      }
    } else {
      Serial.println("⚠️ Error de conexión con NestJS");
      digitalWrite(LED_ROJO, HIGH);
      delay(2000);
      digitalWrite(LED_ROJO, LOW);
    }
    http.end();
  }

  mfrc522.PICC_HaltA();
  delay(1000);
}