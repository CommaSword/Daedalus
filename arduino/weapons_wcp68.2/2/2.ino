#include <Joystick.h>

/**
 * in arduino.json
    "buildPreferences": [
        [
            "build.extra_flags",
            "-DUSB_VID=0x9999 -DUSB_PID=0x9012 '-DUSB_MANUFACTURER=\"Helios\"' '-DUSB_PRODUCT=\"Helios Weapons 2\"'"
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
const int PUSH_BUTTON_PINS[] = {
	3,	// previous target
	4,	// next target
	5,	// previous sub-system
	6,	// next sub-system
	7,	// shield frequency left
	8,	// shield frequency right
	10,	// beam frequency left
	16,	// beam frequency right
};
const int pushButtonCount = 8;
const int TOGGLE_BUTTON_PINS[] = {
	2,	// trajectory control
	9,	// raise/lower shields
};
const int toggleButtonCount = 2;

const int AXIS_X_PIN = A3; // assuming manual aim axis

// Create the joystick
Joystick_ joystick(0x03, JOYSTICK_TYPE_JOYSTICK, pushButtonCount + toggleButtonCount * 2, 0, true, false, false, false, false, false, false, false, false, false, false);

#define MARGIN_FILTER 15
#define OUT_MAX 1023
#define S_IN_MIN MARGIN_FILTER
#define S_IN_MAX 1023 - MARGIN_FILTER

void setup()
{
	// Initialize Button Pins
	for (int buttonIndex = 0; buttonIndex < pushButtonCount; buttonIndex++)
	{
		pinMode(PUSH_BUTTON_PINS[buttonIndex], INPUT_PULLUP);
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

long readSlider(int pinId)
{
	long val = OUT_MAX - map(constrain(analogRead(pinId), S_IN_MIN, S_IN_MAX), S_IN_MIN, S_IN_MAX, 0, OUT_MAX);
	PRINT_LN(val);
	return val;
}

void readPushButton(const int buttonIndex)
{
	const int val = digitalRead(PUSH_BUTTON_PINS[buttonIndex]);
	PRINT_LN("button " buttonIndex "value " val);
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
	PRINT("X: ");
	joystick.setXAxis(readSlider(AXIS_X_PIN));

	for (int buttonIndex = 0; buttonIndex < pushButtonCount; buttonIndex++)
	{
		readPushButton(buttonIndex);
	}
	for (int buttonIndex = 0; buttonIndex < toggleButtonCount; buttonIndex++)
	{
		readToggleButton(buttonIndex);
	}
	joystick.sendState();
	delay(50);
}
