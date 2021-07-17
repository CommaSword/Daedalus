int b1 = 8;

void setup() {
  // put your setup code here, to run once:
Serial.begin(9600);
pinMode (b1,INPUT_PULLUP);
}

void loop() {
  // put your main code here, to run repeatedly:
digitalRead(b1);
Serial.print(b1);}
