// Custod — desk-sensor firmware (Arduino Uno / Nano).
//
// CONNECTION: this device pairs ONLY with the Custod Chrome extension, over USB
// via the Web Serial API (the extension's Desk-device portal, extension/arduino.html).
// The macOS and iOS apps do NOT connect to it. Open the popup → "Connect desk
// device" to pair.
//
// Serial @ 9600 baud:
//   device → host : {"type":"reading","therm_temp":..,"distance_cm":..,
//                    "posture_score":..,"light_level":..,"dark_room":..}  every 30s
//                   plus "BURNOUTCHECK_READY" once on boot.
//   host → device : "SCORE:<0-100>:<green|yellow|red>"  (drives the RGB lamp)
//                   "BUZZ"                                (short alert tone)
//                   "LED:r,g,b"                           (manual color)
//
// Sensors: NTC 10k thermistor (A0), HC-SR04 ultrasonic posture/distance (7/8),
// photoresistor (A1). Outputs: common RGB LED (9/10/11) + piezo buzzer (3).

#include <NewPing.h>
#include <math.h>

// ── Pin definitions ───────────────────────────
#define TRIG_PIN       7
#define ECHO_PIN       8
#define LED_R          9
#define LED_G          10
#define LED_B          11
#define BUZZER_PIN     3
#define THERM_PIN      A0
#define PHOTO_PIN      A1
#define MAX_DISTANCE  150

// Thermistor constants (NTC 10k, B=3950)
#define SERIES_RESISTOR    10000.0
#define NOMINAL_RESISTANCE 10000.0
#define NOMINAL_TEMP       25.0
#define BCOEFFICIENT       3950.0
// ─────────────────────────────────────────────

NewPing sonar(TRIG_PIN, ECHO_PIN, MAX_DISTANCE);

int    currentScore  = 0;
String currentStatus = "green";

unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 30000UL;

// Helper function for a manual buzzer tone without using Timer 2
void manualTone(int pin, int frequency, int duration_ms) {
  long period_us = 1000000L / frequency;
  long half_period_us = period_us / 2;
  long iterations = (long)duration_ms * 1000L / period_us;
  
  for (long i = 0; i < iterations; i++) {
    digitalWrite(pin, HIGH);
    delayMicroseconds(half_period_us);
    digitalWrite(pin, LOW);
    delayMicroseconds(half_period_us);
  }
}

void setup() {
  Serial.begin(9600);

  pinMode(LED_R,      OUTPUT);
  pinMode(LED_G,      OUTPUT);
  pinMode(LED_B,      OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Startup color sweep
  setLED(255, 0,   0);   delay(300);
  setLED(0,   255, 0);   delay(300);
  setLED(0,   0,   255); delay(300);
  setLED(0,   0,   0);   delay(200);

  Serial.println("BURNOUTCHECK_READY");
}

void loop() {
  // Handle commands from the Custod Chrome extension (Web Serial)
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    handleCommand(line);
  }

  // Every 30s: read sensors and send JSON
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = millis();
    readAndSend();
  }
}

void readAndSend() {
  // Thermistor
  int    thermRaw  = analogRead(THERM_PIN);
  float thermTemp = rawToThermistorCelsius(thermRaw);

  // HC-SR04
  delay(30);
  int distance     = sonar.ping_cm();
  int postureScore = distanceToPostureScore(distance);

  // Photoresistor
  int   lightLevel = analogRead(PHOTO_PIN);
  bool darkRoom   = (lightLevel < 300);

  // Send JSON over Serial
  Serial.print(F("{"));
  Serial.print(F("\"type\":\"reading\","));
  Serial.print(F("\"therm_temp\":"));    Serial.print(thermTemp, 1);  Serial.print(F(","));
  Serial.print(F("\"distance_cm\":"));   Serial.print(distance);      Serial.print(F(","));
  Serial.print(F("\"posture_score\":")); Serial.print(postureScore);  Serial.print(F(","));
  Serial.print(F("\"light_level\":"));   Serial.print(lightLevel);    Serial.print(F(","));
  Serial.print(F("\"dark_room\":"));     Serial.print(darkRoom ? F("true") : F("false"));
  Serial.println(F("}"));
}

float rawToThermistorCelsius(int raw) {
  if (raw <= 0 || raw >= 1023) return -99;
  float resistance = SERIES_RESISTOR / (1023.0 / raw - 1.0);
  float steinhart  = resistance / NOMINAL_RESISTANCE;
  steinhart = log(steinhart);
  steinhart /= BCOEFFICIENT;
  steinhart += 1.0 / (NOMINAL_TEMP + 273.15);
  steinhart = 1.0 / steinhart;
  return steinhart - 273.15;
}

int distanceToPostureScore(int cm) {
  if (cm <= 0)    return 60;
  if (cm < 35)    return 20;
  if (cm <= 70)   return 90;
  return 55;
}

void handleCommand(String line) {
  if (line.startsWith("SCORE:")) {
    int c1 = line.indexOf(':');
    int c2 = line.indexOf(':', c1 + 1);
    currentScore  = line.substring(c1 + 1, c2).toInt();
    currentStatus = line.substring(c2 + 1);
    currentStatus.trim();
    updateLED();
    return;
  }
  if (line == "BUZZ") {
    alertBuzz();
    return;
  }
  if (line.startsWith("LED:")) {
    String rgb = line.substring(4);
    int c1 = rgb.indexOf(',');
    int c2 = rgb.indexOf(',', c1 + 1);
    int r  = rgb.substring(0, c1).toInt();
    int g  = rgb.substring(c1 + 1, c2).toInt();
    int b  = rgb.substring(c2 + 1).toInt();
    setLED(r, g, b);
    return;
  }
}

void updateLED() {
  if (currentScore <= 33) {
    setLED(0, 200, 0);
  } else if (currentScore <= 66) {
    setLED(200, 120, 0);
  } else {
    for (int i = 0; i < 2; i++) {
      setLED(255, 0, 0); delay(180);
      setLED(0,   0, 0); delay(90);
    }
    setLED(255, 0, 0);
  }
}

void alertBuzz() {
  // Uses our manual function instead of the conflicting built-in tone()
  manualTone(BUZZER_PIN, 880,  100); delay(200);
  manualTone(BUZZER_PIN, 880,  100); delay(200);
  manualTone(BUZZER_PIN, 1046, 150);
}

void setLED(int r, int g, int b) {
  analogWrite(LED_R, r);
  analogWrite(LED_G, g);
  analogWrite(LED_B, b);
}