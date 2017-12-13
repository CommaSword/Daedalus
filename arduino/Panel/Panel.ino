/*
 Panel
 */
#include <SPI.h>         // needed for Arduino versions later than 0018
#include <Ethernet2.h>
#include <EthernetUdp2.h>     // UDP library from: bjoern@cs.stanford.edu 12/30/2008

#include <OSCMessage.h>        // https://github.com/CNMAT/OSC

//leds
#define greenLed 4
#define yellowLed 5
#define blueLed 6
//buttons
#define buttonOn 8
#define buttonOff 7
//button functionality
#define debounce 20 // ms debounce period to prevent flickering when pressing or releasing the button
#define holdTime 2000 // ms hold period: how long to wait for press+hold event
//jack
#define jack 9
// server data
#define serverPort 57121

// Enter a MAC address and IP address for your controller below.
// The IP address will be dependent on your local network:
byte mac[] = {
        0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED
};

IPAddress ip(192,168,1,10);

unsigned int localPort = 57122;      // local port to listen on

//the Arduino's IP
IPAddress serverIp(0, 0, 0, 0);

// buffers for receiving and sending data
char packetBuffer[UDP_TX_PACKET_MAX_SIZE]; //buffer to hold incoming packet,
char addressBuffer[100]; //buffer to hold incoming packet,

char ReplyBuffer[] = "acknowledged";       // a string to send back

// An EthernetUDP instance to let us send and receive packets over UDP
EthernetUDP Udp;

boolean online = 0; // online state of the panel
boolean error = 0; // mode of the panel
float load = 0; // load of the panel

//state of buttons/jack
long timeSinceOffPress; // time the button was pressed down
int defaultTimeToWait = 30000; // 30 sec 
boolean ignoreAll = false; // whether to ignore every other button press and command
long flickerTime;

int jackIn = 0;

// LED variables
boolean ledVal1 = false; // state of LED 1
boolean ledVal2 = false; // state of LED 2

void setup() {
    Serial.begin(9600);
    // start the Ethernet and UDP:
    Ethernet.begin(mac, ip);
    Udp.begin(localPort);

    //set led pins as output
    pinMode(greenLed, OUTPUT);
    pinMode(yellowLed, OUTPUT);
    pinMode(blueLed, OUTPUT);

    //set button and jack pins as input

    pinMode(buttonOn, INPUT);
    pinMode(buttonOff, INPUT);
    pinMode(jack, INPUT);
    Udp.remoteIP() = serverIp;
    applyStateToLeds();
}


void loop() {
    OSCErrorCode error;
    //make an empty message to fill with the incoming data
    OSCMessage msg;
    // Read the state of the button
    int buttonOffVal = digitalRead(buttonOff);
    int buttonOnVal = digitalRead(buttonOn);
    if (ignoreAll == true){
        while ((millis() - timeSinceOffPress) > defaultTimeToWait){
            
            if ((millis() - flickerTime) > long(debounce)){
                eventFlicker();
                flickerTime = millis();
            }
        }
        ignoreAll = false;
    }else{
        if (online == 1){ // We're online
            if (buttonOffVal == LOW){
                Serial.println("Button off is pressed");
                timeSinceOffPress = millis();
                sendMessage("/d/repairs/switch_A/shut-down");
                ignoreAll = true;
            }
        }else{ // Offline
            if (buttonOnVal == HIGH){
                Serial.println("Button on is pressed");
                sendMessage("/d/repairs/switch_A/start-up");
            }
        }

        // if there's data available, read a packet
        int packetSize = Udp.parsePacket();
        if (packetSize) {
            //  printPacketMetadata(packetSize);
            while (packetSize--)
                msg.fill(Udp.read());
            if (msg.hasError()) {
                error = msg.getError();
                Serial.print("************ mesage error : ");
                Serial.println(error);
            } else {
                //  printMessageData(msg);
                msg.dispatch("/d/repairs/switch_A/is-online", handleIsOnline);
                msg.dispatch("/d/repairs/switch_A/is-error", handleIsError);
                msg.dispatch("/d/repairs/switch_A/overload", handleOverload);
            }
        }
        
        applyStateToLeds();
        delay(10);
    }
}

void eventFlicker() {
    ledVal1 = !ledVal1;
    digitalWrite(greenLed, ledVal1);
 }

void sendMessage(char msg[]){
    Serial.println(Udp.remoteIP());
    OSCMessage msgOut(msg);
    Udp.beginPacket(Udp.remoteIP(), serverPort);
    msgOut.send(Udp);
    Udp.endPacket();
    if (msgOut.hasError()){
      Serial.println(msgOut.hasError());
    }
    msgOut.empty();
}

void printPacketMetadata(int packetSize) {
    Serial.print("Received packet of size ");
    Serial.println(packetSize);
    Serial.print("From ");
    IPAddress remote = Udp.remoteIP();
    for (int i = 0; i < 4; i++) {
        Serial.print(remote[i], DEC);
        if (i < 3) {
            Serial.print(".");
        }
    }
    Serial.print(", port ");
    Serial.println(Udp.remotePort());
}

void printMessageData(OSCMessage &msg) {
    Serial.println("message!");
    Serial.print("Address ");
    msg.getAddress(addressBuffer);
    Serial.println(addressBuffer);
    Serial.print("Size: ");
    Serial.println(msg.size());

    for (int i = 0; i < msg.size(); i++) {
        char type = msg.getType(i);

        Serial.print(i);
        Serial.print(" is ");
        Serial.println(type);
        //returns true if the data in the first position is an integer
        if (msg.isFloat(i)) {
            //get that integer
            int data = msg.getFloat(i);

            Serial.print(i);
            Serial.print(" is float: ");
            Serial.println(data);
        } else if (msg.isString(i)) {
            //get that string
            msg.getString(i, addressBuffer, 100);

            Serial.print(i);
            Serial.print(" is string: ");
            Serial.println(addressBuffer);
        }
    }
}

void handleIsOnline(OSCMessage &msg) {
    online = msg.getInt(0) == 1;
    Serial.print("online : ");
    Serial.println(msg.getInt(0));
}

void handleIsError(OSCMessage &msg) {
    error = msg.getInt(0) == 1;
    Serial.print("error : ");
    Serial.println(msg.getInt(0));
}

void handleOverload(OSCMessage &msg) {
    load = msg.getFloat(0);
    Serial.print("overload : ");
    Serial.println(msg.getFloat(0));
}

void applyStateToLeds() {
    digitalWrite(greenLed, online ? HIGH : LOW);
    digitalWrite(yellowLed, error ? HIGH : LOW);
    digitalWrite(blueLed, load > 0.0 && !error ? LOW : HIGH);
}
