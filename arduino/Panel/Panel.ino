/*
 Panel
 */
#include <SPI.h>         // needed for Arduino versions later than 0018
#include <Ethernet2.h>
#include <EthernetUdp2.h>     // UDP library from: bjoern@cs.stanford.edu 12/30/2008

#include <OSCMessage.h>        // https://github.com/CNMAT/OSC

// print debug messages
#define DEBUG

// ID of this switch
#define ID "switch_A"

//leds
#define greenLed 4
#define yellowLed 5
#define blueLed 6
//buttons
#define buttonOff 7
#define buttonOn 8
//jack
#define jack 9

// server data
#define serverPort 57121

#define SHUTDOWN_DELAY 30000
#define BLINK_INTERVAL 1000
#define BLINK_STATE ((millis() / BLINK_INTERVAL) % 2)             // ledState used to set the LED

#define localPort 57122

#ifdef DEBUG
#define PRINT(...)  Serial.print(__VA_ARGS__)
#define PRINT_LN(...)  Serial.println(__VA_ARGS__)
#else
#define PRINT(...)
#define PRINT_LN(...)
#endif
// TODO ifdef serial port
// TODO dhcp, mac address from chip

byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};

char packetBuffer[UDP_TX_PACKET_MAX_SIZE]; //buffer to hold incoming packet,


//the Arduino's IP
IPAddress serverIp(255, 255, 255, 255);

// An EthernetUDP instance to let us send and receive packets over UDP
EthernetUDP udp;

// STATE FLAGS
boolean online = 0; // online state of the switch
boolean error = 0; // mode of the panel
float load = 0; // load of the panel
unsigned long timeSinceOffPress = 0;        // will store last time LED was updated

void lightTest() {

    for (int i = 0; i < 5; i++) {
        delay(i * 100);
        digitalWrite(greenLed, HIGH);
        delay(i * 100);
        digitalWrite(yellowLed, HIGH);
        delay(i * 100);
        digitalWrite(blueLed, HIGH);
        digitalWrite(greenLed, LOW);
        delay(i * 100);
        digitalWrite(yellowLed, LOW);
        delay(i * 100);
        digitalWrite(blueLed, LOW);
    }
}

void setup() {

    //set led pins as output
    pinMode(greenLed, OUTPUT);
    pinMode(yellowLed, OUTPUT);
    pinMode(blueLed, OUTPUT);

    //set button and jack pins as input
    pinMode(buttonOn, INPUT);
    pinMode(buttonOff, INPUT);
    pinMode(jack, INPUT);

    lightTest();
    // reset leds state
    applyStateToLeds();

#ifdef DEBUG
    Serial.begin(9600);
#endif

    PRINT_LN("loading...");

    if (Ethernet.begin(mac) == 0) {
        PRINT_LN("Failed to configure Ethernet using DHCP");
        // no point in carrying on, so do nothing forevermore:
        for (;;);
    }
    PRINT("My IP address: ");
    for (byte thisByte = 0; thisByte < 4; thisByte++) {
        // print the value of each byte of the IP address:
        PRINT(Ethernet.localIP()[thisByte], DEC);
        PRINT(".");
    }
    // start the Ethernet and UDP
    udp.begin(localPort);
}

OSCMessage msg;

void loop() {
    //make an empty message to fill with the incoming data

    // if there's data available, read a packet
    int packetSize = udp.parsePacket();

    if (packetSize) {
        PRINT_LN("");
        // read all pending packets
        while (packetSize) {
            PRINT("!");
            handlePacket(packetSize);
            // delay(1);
            packetSize = udp.parsePacket();
        }
    }

    handleButtons();

    applyStateToLeds();

    PRINT("Zz");
    delay(10);
}

void handlePacket(int packetSize) {
    serverIp = udp.remoteIP();
    //  printPacketMetadata(packetSize);

    // read ahead first 2 characters to decide if this message should be parsed
    packetSize = packetSize - 2;
    udp.read(packetBuffer, 2);
    if (packetBuffer[1] == 'd') {
        msg.fill(packetBuffer, 2);
        while (packetSize--) {
            msg.fill(udp.read());
        }
        if (msg.hasError()) {
            OSCErrorCode errorCode = msg.getError();
            PRINT("************ mesage error code : ");
            PRINT_LN(errorCode);
        } else {
            //   printMessageData(msg);
            msg.dispatch("/d/repairs/" ID "/is-online", handleIsOnline);
            msg.dispatch("/d/repairs/" ID "/is-error", handleIsError);
            msg.dispatch("/d/repairs/" ID "/overload", handleOverload);
        }
        msg.empty();
    }
}

void handleButtons() {
    // Read the state of the button
    int buttonOffVal = digitalRead(buttonOff);
    int buttonOnVal = digitalRead(buttonOn);

    if (online) {
        if (timeSinceOffPress) { // during shutdown
            if (millis() > SHUTDOWN_DELAY + timeSinceOffPress) {
                PRINT_LN("sending shutdown command");
                sendMessage("/d/repairs/" ID "/shut-down");
            }
        } else if (buttonOffVal == LOW) {
            PRINT_LN("Button OFF is pressed");
            timeSinceOffPress = millis();
        }
    } else { // Offline
        if (timeSinceOffPress) {
            PRINT_LN("clear shutdown state");
            timeSinceOffPress = 0;
        }
        if (buttonOnVal == HIGH) {
            PRINT_LN("Button ON is pressed");
            sendMessage("/d/repairs/" ID "/start-up");
        }
    }
}

void sendMessage(char msg[]) {
    PRINT("sending to ");
    PRINT_LN(udp.remoteIP());
    OSCMessage msgOut(msg);
    udp.beginPacket(udp.remoteIP(), serverPort);
    msgOut.send(udp);
    udp.endPacket();
    if (msgOut.hasError()) {
        PRINT_LN(msgOut.hasError());
    }
    msgOut.empty();
}


void handleIsOnline(OSCMessage &msg) {
    // printMessageData(msg);
    online = msg.getInt(0) == 1;
    PRINT("online : ");
    PRINT_LN(msg.getInt(0));
}

void handleIsError(OSCMessage &msg) {
    // printMessageData(msg);
    error = msg.getInt(0) == 1;
    PRINT("error : ");
    PRINT_LN(msg.getInt(0));
}

void handleOverload(OSCMessage &msg) {
    // printMessageData(msg);
    load = msg.getFloat(0);
    PRINT("overload : ");
    PRINT_LN(msg.getFloat(0));
}

void applyStateToLeds() {
    digitalWrite(greenLed, (online && (!timeSinceOffPress || BLINK_STATE)) ? HIGH : LOW);
    digitalWrite(yellowLed, error ? HIGH : LOW);
    digitalWrite(blueLed, (!error && (load <= 0.0001)) ? HIGH : LOW);
}
