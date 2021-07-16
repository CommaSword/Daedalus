// Program used to test the USB Joystick library when used as 
// a Flight Controller on the Arduino Leonardo or Arduino 
// Micro.
//
// Matthew Heironimus
// 2016-05-29 - Original Version
//------------------------------------------------------------

#include "Joystick.h"

Joystick_ joystick(JOYSTICK_DEFAULT_REPORT_ID, 
  JOYSTICK_TYPE_MULTI_AXIS, 32, 0,
  true, true, false, false, false, false,
  true, true, false, false, false);

// Set to true to test "Auto Send" mode or false to test "Manual Send" mode.
//const bool testAutoSendMode = true;
const bool testAutoSendMode = false;

const unsigned long gcCycleDelta = 1000;
const unsigned long gcAnalogDelta = 25;
const unsigned long gcButtonDelta = 500;
unsigned long gNextTime = 0;
unsigned int gCurrentStep = 0;

void testSingleButtonPush(unsigned int button)
{
  if (button > 0)
  {
    joystick.releaseButton(button - 1);
  }
  if (button < 32)
  {
    joystick.pressButton(button);
  }
}

void testMultiButtonPush(unsigned int currentStep) 
{
  for (int button = 0; button < 32; button++)
  {
    if ((currentStep == 0) || (currentStep == 2))
    {
      if ((button % 2) == 0)
      {
        joystick.pressButton(button);
      } else if (currentStep != 2)
      {
        joystick.releaseButton(button);
      }
    } // if ((currentStep == 0) || (currentStep == 2))
    if ((currentStep == 1) || (currentStep == 2))
    {
      if ((button % 2) != 0)
      {
        joystick.pressButton(button);
      } else if (currentStep != 2)
      {
        joystick.releaseButton(button);
      }
    } // if ((currentStep == 1) || (currentStep == 2))
    if (currentStep == 3)
    {
      joystick.releaseButton(button);
    } // if (currentStep == 3)
  } // for (int button = 0; button < 32; button++)
}

void testXYAxis(unsigned int currentStep)
{
  int xAxis;
  int yAxis;
  
  if (currentStep < 256)
  {
    xAxis = currentStep - 127;
    yAxis = -127;
    joystick.setXAxis(xAxis);
    joystick.setYAxis(yAxis);
  } 
  else if (currentStep < 512)
  {
    yAxis = currentStep - 256 - 127;
    joystick.setYAxis(yAxis);
  }
  else if (currentStep < 768)
  {
    xAxis = 128 - (currentStep - 512);
    joystick.setXAxis(xAxis);
  }
  else if (currentStep < 1024)
  {
    yAxis = 128 - (currentStep - 768);
    joystick.setYAxis(yAxis);
  }
  else if (currentStep < 1024 + 128)
  {
    xAxis = currentStep - 1024 - 127;
    joystick.setXAxis(xAxis);
    joystick.setYAxis(xAxis);
  }
}

void testThrottleRudder(unsigned int value)
{
  joystick.setThrottle(value);
  joystick.setRudder(255 - value);
}

void setup() {

  joystick.setXAxisRange(-127, 127);
  joystick.setYAxisRange(-127, 127);
  joystick.setZAxisRange(-127, 127);
  joystick.setThrottleRange(0, 255);
  joystick.setRudderRange(0, 255);
  
  if (testAutoSendMode)
  {
    joystick.begin();
  }
  else
  {
    joystick.begin(false);
  }
  
  pinMode(A0, INPUT_PULLUP);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {

  // System Disabled
  if (digitalRead(A0) != 0)
  {
    // Turn indicator light off.
    digitalWrite(LED_BUILTIN, 0);
    return;
  }

  // Turn indicator light on.
  digitalWrite(LED_BUILTIN, 1);
  
  if (millis() >= gNextTime)
  {
   
    if (gCurrentStep < 33)
    {
      gNextTime = millis() + gcButtonDelta;
      testSingleButtonPush(gCurrentStep);
    } 
    else if (gCurrentStep < 37)
    {
      gNextTime = millis() + gcButtonDelta;
      testMultiButtonPush(gCurrentStep - 33);
    }
    else if (gCurrentStep < (37 + 256))
    {
      gNextTime = millis() + gcAnalogDelta;
      testThrottleRudder(gCurrentStep - 37);
    }
    else if (gCurrentStep < (37 + 256 + 1024 + 128))
    {
      gNextTime = millis() + gcAnalogDelta;
      testXYAxis(gCurrentStep - (37 + 256));
    }
    
    if (testAutoSendMode == false)
    {
      joystick.sendState();
    }
    
    gCurrentStep++;
    if (gCurrentStep >= (37 + 256 + 1024 + 128))
    {
      gNextTime = millis() + gcCycleDelta;
      gCurrentStep = 0;
    }
  }
}

