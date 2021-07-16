#include <Joystick.h>

// Create the joystick
Joystick_ joystick(0x03, JOYSTICK_TYPE_JOYSTICK , 0, 0, true, true, true, true, true, true, false, false, false, false, false);

// Constant that maps the physical pin to the joystick button.
const int AXIS_X_PIN = A1;
const int AXIS_Y_PIN = A2;
const int AXIS_Z_PIN = A3;
const int AXIS_RUDDER_PIN = A9;
const int AXIS_RX_PIN = A8;
const int AXIS_RY_PIN = A7;
const int AXIS_RZ_PIN = A6;

void setup() {
	// Initialize Button Pins
	pinMode(AXIS_X_PIN, INPUT);
	pinMode(AXIS_Y_PIN, INPUT);
	pinMode(AXIS_Z_PIN, INPUT);
	pinMode(AXIS_RX_PIN, INPUT);
	pinMode(AXIS_RY_PIN, INPUT);
	pinMode(AXIS_RZ_PIN, INPUT);
	pinMode(AXIS_RUDDER_PIN, INPUT);

	// Initialize joystick Library
	joystick.begin(false);
}

void loop() {
  joystick.setXAxis(analogRead(AXIS_X_PIN));
  joystick.setYAxis(analogRead(AXIS_Y_PIN));
  joystick.setZAxis(analogRead(AXIS_Z_PIN));
  joystick.setRxAxis(analogRead(AXIS_RX_PIN));
  joystick.setRyAxis(analogRead(AXIS_RY_PIN));
  joystick.setRzAxis(analogRead(AXIS_RZ_PIN));
  joystick.setRudder(analogRead(AXIS_RUDDER_PIN));

  joystick.sendState();
	delay(50);
}
