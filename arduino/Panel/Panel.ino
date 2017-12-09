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
#define buttonOn 7
#define buttonOff 8
//jack
#define jack 9

// Enter a MAC address and IP address for your controller below.
// The IP address will be dependent on your local network:
byte mac[] = {
        0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED
};
IPAddress ip(192,168,1,10);

unsigned int localPort = 57122;      // local port to listen on

// buffers for receiving and sending data
char packetBuffer[UDP_TX_PACKET_MAX_SIZE]; //buffer to hold incoming packet,
char addressBuffer[100]; //buffer to hold incoming packet,

char ReplyBuffer[] = "acknowledged";       // a string to send back

// An EthernetUDP instance to let us send and receive packets over UDP
EthernetUDP Udp;

//// state of the panel:
//enum PanelState {
//    OFFLINE = 0,
//    ONLINE_PURE = 1,
//    ONLINE = 2,
//    ONLINE_ERROR = 3
//};
//PanelState panelState = OFFLINE;


// online state of the panel
boolean online = 0;

// mode of the panel
boolean error = 0;

// load of the panel
float load = 0;

//sate of buttons/jack

int onPressed = 0;
int offPressed = 0;
int jackIn = 0;

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

    applyStateToLeds();
}


void loop() {
    OSCErrorCode error;
    //make an empty message to fill with the incoming data
    OSCMessage msg;
    // if there's data available, read a packet
    int packetSize = Udp.parsePacket();
    if (packetSize) {
        //  printPacketMetadata(packetSize);
        while (packetSize--)
            msg.fill(Udp.read());
        if (msg.hasError()) {
            error = msg.getError();
            Serial.print("error: ");
            Serial.println(error);
        } else {
            //  printMessageData(msg);

            msg.dispatch("/d/repairs/switch_A/is-online", handleIsOnline);
            msg.dispatch("/d/repairs/switch_A/is-error", handleIsError);
            msg.dispatch("/d/repairs/switch_A/corruption", handleCorruption);
        }
    }

    applyStateToLeds();
    delay(10);
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
    Serial.println(msg.getFloat(0));
}

void handleIsError(OSCMessage &msg) {
    error = msg.getInt(0) == 1;
    Serial.print("error : ");
    Serial.println(msg.getInt(0));
}

void handleCorruption(OSCMessage &msg) {
    load = msg.getFloat(0);
    Serial.print("corruption : ");
    Serial.println(msg.getFloat(0));
}

void applyStateToLeds() {
    digitalWrite(greenLed, online ? HIGH : LOW);
    digitalWrite(yellowLed, error ? HIGH : LOW);
    digitalWrite(blueLed, load > 0.0 ? LOW : HIGH);
}
