#include <Joystick.h>

/**
 * in arduino.json
    "buildPreferences": [
        [
            "build.extra_flags",
            "-DUSB_VID=0x9999 -DUSB_PID=0x9013 '-DUSB_MANUFACTURER=\"Helios\"' '-DUSB_PRODUCT=\"Helios Weapons 3\"'"
        ]
    ]
**/

// #define DEBUG

#ifdef DEBUG
#define PRINT(...) Serial.print(__VA_ARGS__)
#define PRINT_LN(...) Serial.println(__VA_ARGS__)
#else
#define PRINT(...)
#define PRINT_LN(...)
#endif

// Constant that maps the physical pin to the joystick button.
const int BUTTON_PINS[] = {
	9,	// TARGET_NEAR_TOGGLE
	10,	// TARGET_ENEMY_TOGGLE
	6,	// SHIELD_CAL_START
};
const int pushButtonCount = 3;
// Create the joystick
Joystick_ joystick(0x03, JOYSTICK_TYPE_JOYSTICK, pushButtonCount, 0, true, false, false, false, false, false, false, false, false, false, false);

void setup()
{
	// Initialize Button Pins
	for (int buttonIndex = 0; buttonIndex < pushButtonCount; buttonIndex++)
	{
		pinMode(BUTTON_PINS[buttonIndex], INPUT_PULLUP);
	}

#ifdef DEBUG
	Serial.begin(9600);
#endif
	// Initialize joystick Library
	joystick.begin(false);
}

void readPushButton(const int buttonIndex)
{
	const int val = digitalRead(BUTTON_PINS[buttonIndex]);
	PRINT("button ");
	PRINT(buttonIndex);
	PRINT(" value ");
	PRINT_LN(val);
	joystick.setButton(buttonIndex, val);
}

void loop()
{
	for (int buttonIndex = 0; buttonIndex < pushButtonCount; buttonIndex++)
	{
		readPushButton(buttonIndex);
	}

	joystick.sendState();
	PRINT_LN("##################");
	delay(50);
}
