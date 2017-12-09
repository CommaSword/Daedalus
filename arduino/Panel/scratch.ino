///* Click and Press+Hold Test Sketch
//By Jeff Saltzman
//To keep input interfaces simple, I want to use a single button to:
//1) click (fast press and release) for regular button use, and
//2) press and hold to enter a configuration mode.
//*/
//
//#define buttonPin 19 // analog input pin to use as a digital input
//#define ledPin1 9 // digital output pin for LED 1 indicator
//#define ledPin2 8 // digital output pin for LED 2 indicator
//
//#define debounce 20 // ms debounce period to prevent flickering when pressing or releasing the button
//#define holdTime 2000 // ms hold period: how long to wait for press+hold event
//
//// Button variables
//int buttonVal = 0; // value read from button
//int buttonLast = 0; // buffered value of the button's previous state
//long btnDnTime; // time the button was pressed down
//long btnUpTime; // time the button was released
//boolean ignoreUp = false; // whether to ignore the button release because the click+hold was triggered
//
//// LED variables
//boolean ledVal1 = false; // state of LED 1
//boolean ledVal2 = false; // state of LED 2
//
//
////=================================================
//
//
//void setup() {
//
//// Set button input pin
//    pinMode(buttonPin, INPUT);
//    digitalWrite(buttonPin, HIGH);
//
//// Set LED output pins
//    pinMode(ledPin1, OUTPUT);
//    digitalWrite(ledPin1, ledVal1);
//    pinMode(ledPin2, OUTPUT);
//    digitalWrite(ledPin2, ledVal2);
//
//}
//
//
////=================================================
//
//
//void loop() {
//
//// Read the state of the button
//    buttonVal = digitalRead(buttonPin);
//
//// Test for button pressed and store the down time
//    if (buttonVal == LOW && buttonLast == HIGH && (millis() - btnUpTime) > long(debounce)) {
//        btnDnTime = millis();
//    }
//
//// Test for button release and store the up time
//    if (buttonVal == HIGH && buttonLast == LOW && (millis() - btnDnTime) > long(debounce)) {
//        if (ignoreUp == false) event1();
//        else ignoreUp = false;
//        btnUpTime = millis();
//    }
//
//// Test for button held down for longer than the hold time
//    if (buttonVal == LOW && (millis() - btnDnTime) > long(holdTime)) {
//        event2();
//        ignoreUp = true;
//        btnDnTime = millis();
//    }
//
//    buttonLast = buttonVal;
//
//}
//
//
////=================================================
//// Events to trigger by click and press+hold
//
//void event1() {
//    ledVal1 = !ledVal1;
//    digitalWrite(ledPin1, ledVal1);
//}
//
//void event2() {
//    ledVal2 = !ledVal2;
//    digitalWrite(ledPin2, ledVal2);
//}
