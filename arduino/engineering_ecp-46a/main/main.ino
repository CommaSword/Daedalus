#include <Joystick.h>

// #define DEBUG

#ifdef DEBUG
#define PRINT(...) Serial.print(__VA_ARGS__)
#define PRINT_LN(...) Serial.println(__VA_ARGS__)
#else
#define PRINT(...)
#define PRINT_LN(...)
#endif

// Constant that maps the physical pin to the joystick button.
const int joystickId = 1;
const int AXIS_X_PIN = A1;
const int AXIS_Y_PIN = A8;
const int AXIS_Z_PIN = A2;
const int AXIS_RX_PIN = A7;
const int AXIS_RY_PIN = A3;
const int AXIS_RZ_PIN = A6;
// const int AXIS_THROTTLE_PIN = A6;

// Create the joystick
Joystick_ joystick(0x03 + joystickId, JOYSTICK_TYPE_JOYSTICK, 0, 0, true, true, true, true, true, true, false, false, false, false, false);

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
	// pinMode(AXIS_THROTTLE_PIN, INPUT);

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

	// PRINT("Throttlr: ");
	// joystick.setThrottle(readSlider(AXIS_THROTTLE_PIN));

	joystick.sendState();
	delay(50);
}
