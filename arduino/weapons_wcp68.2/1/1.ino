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
	9,	// fire left 1
	8,	// fire left 2
	A4,	// fire right 1
	A2,	// fire right 2
	A0,	// fire rear
	3,	// select cruise
	10,	// select emp
	7,	// select heavy
	11,	// select hvli
	12,	// select mine
	13,	// select nuke
	4	// select torpedo
};
const int pushButtonCount = 12;
const int TOGGLE_BUTTON_PINS[] = {
	6,	// load left 1
	2,	// load left 2
	0,	// load right 1
	A3,	// load right 2
	1	// load rear
};
const int toggleButtonCount = 5;

// Create the joystick
Joystick_ joystick(0x03, JOYSTICK_TYPE_JOYSTICK, pushButtonCount + toggleButtonCount * 2, 0, true, false, false, false, false, false, false, false, false, false, false);

void setup()
{
	// Initialize Button Pins
	for (int buttonIndex = 0; buttonIndex < pushButtonCount; buttonIndex++)
	{
		pinMode(BUTTON_PINS[buttonIndex], INPUT_PULLUP);
	}	
	// Initialize Button Pins
	for (int buttonIndex = 0; buttonIndex < toggleButtonCount; buttonIndex++)
	{
		pinMode(TOGGLE_BUTTON_PINS[buttonIndex], INPUT_PULLUP);
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

void readToggleButton(const int buttonIndex)
{
	const int val = digitalRead(TOGGLE_BUTTON_PINS[buttonIndex]);
	PRINT_LN("toggle button " buttonIndex "value " val);
	const int firstButtonId = pushButtonCount + buttonIndex * 2;
	joystick.setButton(firstButtonId, val);
	joystick.setButton(firstButtonId + 1, !val);
}

void loop()
{
	for (int buttonIndex = 0; buttonIndex < pushButtonCount; buttonIndex++)
	{
		readPushButton(buttonIndex);
	}
	for (int buttonIndex = 0; buttonIndex < toggleButtonCount; buttonIndex++)
	{
		readToggleButton(buttonIndex);
	}

	joystick.sendState();
	PRINT_LN("##################");
	delay(50);
}
