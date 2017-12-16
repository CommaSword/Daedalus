/*
 Panel
 */
#include <SPI.h>         // needed for Arduino versions later than 0018
#include <Ethernet2.h>
#include <EthernetUdp2.h>     // UDP library from: bjoern@cs.stanford.edu 12/30/2008

#include <OSCMessage.h>        // https://github.com/CNMAT/OSC

#define DEBUG
#define ID "switch_A"
byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};


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

#define BLINK_INTERVAL 1000
#define BLINK_STATE ((millis() / BLINK_INTERVAL) % 2)            // ledState used to set the LED

#define localPort 57122

#define ZERO_LOAD 0.0001

#ifdef DEBUG
#define SHUTDOWN_DELAY 5000
#define STARTUP_DELAY 5000
#define PRINT(...)  Serial.print(__VA_ARGS__)
#define PRINT_LN(...)  Serial.println(__VA_ARGS__)
#else
#define SHUTDOWN_DELAY 30000
#define STARTUP_DELAY 30000
#define PRINT(...)
#define PRINT_LN(...)
#endif
enum PowerState {
    STARTUP_PENDING,
    ONLINE,
    SOFT_RESET_PENDING,
    SOFT_RESET,
    SHUTDOWN_PENDING,
    OFFLINE
};

char packetBuffer[UDP_TX_PACKET_MAX_SIZE]; //buffer to hold incoming packet,


//the Arduino's IP
IPAddress serverIp(255, 255, 255, 255);

// An EthernetUDP instance to let us send and receive packets over UDP
EthernetUDP udp;

// STATE FLAGS
boolean online = 0; // online state of the switch
boolean error = 0; // mode of the panel
float load = 0.0; // load of the panel
enum PowerState currentState = OFFLINE;
unsigned long endOfPendingTime = 0;        // will store last time LED was updated

void lightTest() {

    for (int i = 0; i < 5; i++) {
        delay(i * 50);
        digitalWrite(greenLed, HIGH);
        delay(i * 50);
        digitalWrite(yellowLed, HIGH);
        delay(i * 50);
        digitalWrite(blueLed, HIGH);
        digitalWrite(greenLed, LOW);
        delay(i * 50);
        digitalWrite(yellowLed, LOW);
        delay(i * 50);
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

#ifdef DEBUG
    Serial.begin(9600);
#endif


    digitalWrite(greenLed, HIGH);
    digitalWrite(yellowLed, HIGH);
    digitalWrite(blueLed, HIGH);

    PRINT_LN("loading...");


    if (Ethernet.begin(mac) == 0) {
        PRINT_LN("Failed to configure Ethernet using DHCP");

        digitalWrite(greenLed, LOW);
        digitalWrite(yellowLed, HIGH);
        digitalWrite(blueLed, LOW);
        // no point in carrying on, so do nothing forevermore:
        for (;;);
    }
    PRINT("My IP address: ");
    for (byte thisByte = 0; thisByte < 4; thisByte++) {
        // print the value of each byte of the IP address:
        PRINT(Ethernet.localIP()[thisByte], DEC);
        PRINT(".");
    }

    // reset leds state
    applyStateToLeds();
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
            handlePacket(packetSize);
            // delay(1);
            packetSize = udp.parsePacket();
        }
    }
    enum PowerState oldState = currentState;

    applyServerInputToState();
    handleButtons();

    if (oldState != currentState) {
        PRINT("STATE : ");
        PRINT(oldState);
        PRINT(" => ");
        PRINT_LN(currentState);
    }

    applyTimeouts();
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
         PRINT("1");
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
            msg.dispatch("/d/repairs/" ID "/load", handleOverload);
        }
        msg.empty();
    } else {
        PRINT("0");
    }
}

void applyServerInputToState() {
    switch (currentState) {
        case ONLINE:
        case SOFT_RESET_PENDING:
        case SOFT_RESET:
        case SHUTDOWN_PENDING:
            if (!online) {
                currentState = OFFLINE;
            }
            break;
        case OFFLINE:
        case STARTUP_PENDING:
            if (online) {
                currentState = ONLINE;
            }
            break;
    }
}

void applyTimeouts() {
    switch (currentState) {
        case STARTUP_PENDING:
            if (millis() > endOfPendingTime) {
                PRINT_LN("sending startup command");
                sendMessage("/d/repairs/" ID "/start-up");
            }
            break;
        case SOFT_RESET_PENDING:
            if (millis() > endOfPendingTime) {
                currentState = SOFT_RESET;
            }
            break;
        case SOFT_RESET:
            if (millis() > endOfPendingTime) {
                PRINT_LN("sending reset-load command");
                sendMessage("/d/repairs/" ID "/load", 0.0);
            }
            break;
        case SHUTDOWN_PENDING:
            if (millis() > endOfPendingTime) {
                PRINT_LN("sending shutdown command");
                sendMessage("/d/repairs/" ID "/shut-down");
            }
            break;
    }
}

void handleButtons() {
    // Read the state of the button
    int buttonOffVal = digitalRead(buttonOff);
    int buttonOnVal = digitalRead(buttonOn);
    int jackVal = digitalRead(jack);

    switch (currentState) {
        case ONLINE:
            if (buttonOffVal == LOW) {
                PRINT_LN("Button OFF is pressed");
                endOfPendingTime = millis() + SHUTDOWN_DELAY;
                if (jackVal == HIGH) {
                    PRINT_LN("SOFT_RESET started");
                    currentState = SOFT_RESET_PENDING;
                } else {
                    PRINT_LN("SHUTDOWN started");
                    currentState = SHUTDOWN_PENDING;
                }
            }
            break;
        case SOFT_RESET:
            if (jackVal == LOW) {
                PRINT_LN("SOFT_RESET completed");
                currentState = online ? ONLINE : OFFLINE;
            }
            break;
        case OFFLINE:
            if (buttonOnVal == HIGH) {
                PRINT_LN("Button ON is pressed");
                endOfPendingTime = millis() + STARTUP_DELAY;
                PRINT_LN("STARTUP started");
                currentState = STARTUP_PENDING;
            }
            break;
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

void sendMessage(char msg[], float data) {
    PRINT("sending to ");
    PRINT_LN(udp.remoteIP());
    OSCMessage msgOut(msg);
    msgOut.add((float) data);
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
    digitalWrite(greenLed, (currentState == ONLINE || (BLINK_STATE && (currentState != OFFLINE))) ? HIGH : LOW);
    digitalWrite(yellowLed, error ? HIGH : LOW);
    digitalWrite(blueLed, (!error && (load <= ZERO_LOAD)) ? HIGH : LOW);
}
