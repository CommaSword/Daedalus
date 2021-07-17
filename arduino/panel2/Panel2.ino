int led1 = 4;
int led2 = 5;
int led3 = 6;
int button1 = 7;
int button2 = 8;
int button3 = 9;

void setup() {
Serial.begin(9600);
pinMode(led1, OUTPUT);
pinMode(led2, OUTPUT);
pinMode(led3, OUTPUT);
pinMode(button1, INPUT_PULLUP);
pinMode(button2, INPUT_PULLUP);
pinMode(button3, INPUT_PULLUP);
}

void loop() {
  delay(500);
  digitalWrite(led1,HIGH);
  delay(500);
  digitalWrite(led1,LOW);
  delay(500);
  digitalWrite(led2,HIGH);
  delay(500);
  digitalWrite(led2,LOW);
  delay(500);
  digitalWrite(led3,HIGH);
  delay(500);
  digitalWrite(led3,LOW);
  delay(500);
  int b1 = digitalRead(button1);
  delay(10);
  int b2 = digitalRead(button2);
  delay(10);
  int b3 = digitalRead(button3);

 Serial.println(b1);
 Serial.println(b2);
 Serial.println(b3);
 Serial.println("#############");
}
