#include <Joystick.h>

/**
 * in arduino.json
    "buildPreferences": [
        [
            "build.extra_flags",
            "-DUSB_VID=0x9999 -DUSB_PID=0x9011 '-DUSB_MANUFACTURER=\"Helios\"' '-DUSB_PRODUCT=\"Helios Weapons 1\"'"
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
	A0,	// fire rear
	A1,	// load rear
	A2,	// fire right 2
	A3,	// load right 2
	A4,	// fire right 1
	A5,	// load right 1
	13,	// nuke
	12,	// select mine
	11,	// select hvli
	10,	// select emp
	9,	// fire left 1
	8,	// fire left 2
	7,	// select heavy
	6,	// load left 1
	5,	// load left 2
	4,	// select torpedo
	3	// select cruise
};
const int buttonCount = 17;

// Create the joystick
Joystick_ joystick(0x03, JOYSTICK_TYPE_JOYSTICK, buttonCount, 0, false, false, false, false, false, false, false, false, false, false, false);

void setup()
{
	// Initialize Button Pins
	for (int buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
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
	PRINT_LN("button " buttonIndex "value " val);
	joystick.setButton(buttonIndex, val);
}

void loop()
{
	for (int buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
	{
		readPushButton(buttonIndex);
	}

	joystick.sendState();
	delay(50);
}
