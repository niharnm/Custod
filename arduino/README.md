# Custod — desk device (Arduino)

A small desk sensor that turns your physical workspace into one more Custod
signal. It reads **ambient** conditions only — temperature, distance (a proxy for
posture/lean), and light — and mirrors your live Custod burnout status on an RGB
lamp (green → amber → red), with an optional buzzer nudge when you're at risk.

> **It connects only through the Custod Chrome extension** (over USB, via the Web
> Serial API). The macOS and iOS apps do **not** talk to the device — by design.

## Hardware

| Part | Pin |
|---|---|
| RGB LED (common cathode) — R / G / B | 9 / 10 / 11 |
| HC-SR04 ultrasonic — TRIG / ECHO | 7 / 8 |
| NTC 10k thermistor (B=3950) + 10k series | A0 |
| Photoresistor (+ divider) | A1 |
| Piezo buzzer | 3 |

Board: Arduino Uno / Nano (anything with USB serial). Library: **NewPing**.

## Flash it

1. Open `Custod-Arduino.ino` in the Arduino IDE.
2. Install the **NewPing** library (Library Manager).
3. Select your board + port, then **Upload**.

On boot the LED sweeps R→G→B and the device prints `BURNOUTCHECK_READY`.

## Connect it (Chrome extension only)

1. Plug the device into USB.
2. Open the **Custod** extension popup → **Connect desk device**.
3. In the portal tab that opens, click **Connect device** and pick the Arduino
   (often listed as "USB Serial", "CH340", or "Arduino Uno").

The portal (`extension/arduino.html` / `arduino.js`) holds the connection, shows
live readings, and pushes your status to the lamp. A popup can't hold a serial
port open (it closes on blur), which is why the portal runs in its own tab.

## Serial protocol (9600 baud)

**Device → host**, every 30 s:

```json
{"type":"reading","therm_temp":23.4,"distance_cm":52,"posture_score":90,"light_level":410,"dark_room":false}
```

**Host → device:**

| Command | Effect |
|---|---|
| `SCORE:<0-100>:<green\|yellow\|red>` | Sets the RGB lamp from your Custod status |
| `BUZZ` | Short alert tone |
| `LED:r,g,b` | Manual color (0–255 each) |

## Privacy & safety

The sensor captures **only** temperature, distance, and light. There is **no
microphone, no camera**, and it never sees page contents, keystrokes, or app
data. It connects solely over USB through the extension. Like the rest of Custod,
it shows digital-strain patterns and reset suggestions — it is **not** a
diagnosis, therapy, or crisis-support tool.

Questions / data requests: **nihar.manchikalapudi@gmail.com**
