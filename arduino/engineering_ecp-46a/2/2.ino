#include <Joystick.h>

/**
 * in arduino.json
    "buildPreferences": [
        [
            "build.extra_flags",
            "-DUSB_VID=0x9999 -DUSB_PID=0x9002 '-DUSB_MANUFACTURER=\"Helios\"' '-DUSB_PRODUCT=\"Helios ECR2\"'"
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

/**
 * Physical pinout
 * 
 * A1 - cool nuvering
 * A2 - cool impulse
 * A3 - cool warp
 * A6 - power front
 * A7 - power warp
 * A8 - power impulse
 * A9 - power nuvering
 **/

// Constant that maps the physical pin to the joystick button.
const int joystickId = 0;
const int AXIS_X_PIN = A1; // cool nuvering
const int AXIS_Y_PIN = A9; // power nuvering
const int AXIS_Z_PIN = A2; // cool impulse
const int AXIS_RX_PIN = A8; // power impulse
const int AXIS_RY_PIN = A6; // power front
const int AXIS_RZ_PIN = A7; // power warp
const int HAT_0_PIN = A3; //cool warp

// Create the joystick
Joystick_ joystick(0x03 + joystickId, JOYSTICK_TYPE_JOYSTICK, 0, 1, true, true, true, true, true, true, false, false, false, false, false);

#define MARGIN_FILTER 15
#define OUT_MAX 1023
#define S_IN_MIN MARGIN_FILTER
#define S_IN_MAX 1023 - MARGIN_FILTER

void setup()
{
	// Initialize Button Pins
	pinMode(AXIS_X_PIN, INPUT);
	pinMode(AXIS_Y_PIN, INPUT);
	pinMode(AXIS_Z_PIN, INPUT);
	pinMode(AXIS_RX_PIN, INPUT);
	pinMode(AXIS_RY_PIN, INPUT);
	pinMode(AXIS_RZ_PIN, INPUT);
	pinMode(HAT_0_PIN, INPUT);

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

long readHatSlider(int pinId)
{
	long val = 360 - map(constrain(analogRead(pinId), S_IN_MIN, S_IN_MAX), S_IN_MIN, S_IN_MAX, 0, 180);
	PRINT_LN(val);
	return val;
}

void loop()
{
	PRINT("X: ");
	joystick.setXAxis(readSlider(AXIS_X_PIN));

	PRINT("Y: ");
	joystick.setYAxis(readSlider(AXIS_Y_PIN));

	PRINT("Z: ");
	joystick.setZAxis(readSlider(AXIS_Z_PIN));

	PRINT("RZ: ");
	joystick.setRzAxis(readSlider(AXIS_RZ_PIN));

	PRINT("RX: ");
	joystick.setRxAxis(readSlider(AXIS_RX_PIN));
	
	PRINT("RY: ");
	joystick.setRyAxis(readSlider(AXIS_RY_PIN));

	PRINT("setHatSwitch 0: ");
	joystick.setHatSwitch(0, readHatSlider(HAT_0_PIN));

	joystick.sendState();
	delay(50);
}
