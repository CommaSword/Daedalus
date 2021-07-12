/*
 Panel
 */
#include <SPI.h>         // needed for Arduino versions later than 0018
#include <Ethernet2.h>
#include <PubSubClient.h> // https://github.com/knolleary/pubsubclient
#include <stdlib.h>

// #define DEBUG
#define ID "B3"
byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xF0, 0x01};


//leds
#define greenLed 4
#define yellowLed 5
#define blueLed 6
//buttons
#define buttonOff 7
#define buttonOn 8
//jack
#define jack 9

#define RECONNECT_INTERVAL 5000

// server data
#define BLINK_INTERVAL 1000
#define BLINK_STATE ((millis() / BLINK_INTERVAL) % 2)            // ledState used to set the LED

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
IPAddress serverIp(192, 168, 1, 173);
EthernetClient ethClient;
PubSubClient client(serverIp, 1883, onMessage, ethClient);

// MQTT connection 
long lastReconnectAttempt = 0;

// STATE FLAGS
boolean online = 0; // online state of the switch
boolean error = 0; // mode of the panel
float load = 0.0; // load of the panel
enum PowerState currentState = OFFLINE;
unsigned long endOfPendingTime = 0;        // when current _PENDING state should end

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

void onMessage(char* topic, byte* payload, unsigned int length) {
    // print message
    PRINT("Message arrived [");
    PRINT(topic);
    PRINT("] ");
    for (int i=0;i<length;i++) {
        PRINT((char)payload[i]);
    }
    PRINT_LN();
    String topicStr(topic);

    if (topicStr == "/d-out/" ID "/is-online"){
        online = payload[0] == '1';
        PRINT("online : ");
        PRINT_LN(payload[0]);
    } else if (topicStr == "/d-out/" ID "/is-error"){
        error = payload[0] == '1';
        PRINT("error : ");
        PRINT_LN(payload[0]);
    }  else if (topicStr == "/d-out/" ID "/load"){
        // Copy the payload to a new buffer
        char* p = (char*)malloc(length + 1);
        memcpy(p, payload, length);
        p[length] = NULL;
        String payloadStr(p);
        load = payloadStr.toFloat();
        PRINT("overload : ");
        PRINT_LN(payloadStr);
        free(p);
    } else {
        PRINT_LN(">> Unhandled!");
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
}

boolean reconnectLoop() {
    PRINT("Attempting MQTT connection...");
    long now = millis();
    if (now - lastReconnectAttempt > RECONNECT_INTERVAL) {
        lastReconnectAttempt = now;
        if (client.connect("panel " ID)) {
            PRINT("connected");
            // resubscribe to all daedalus output of this panel
            client.subscribe("d-out/" ID "/#");
        } else {
            PRINT("failed, rc=");
            PRINT(client.state());
            PRINT_LN(" try again");
        }
        if (client.connected()){
            lastReconnectAttempt = 0;
        }
    }
}

void loop() {
    enum PowerState oldState = currentState;
    if (client.connected()) {
        // handle messages
        client.loop();
    } else {
        reconnectLoop();
    }
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
                sendMessage("/d-in/" ID "/start-up");
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
                sendMessage("/d-in/" ID "/reset-load");
            }
            break;
        case SHUTDOWN_PENDING:
            if (millis() > endOfPendingTime) {
                PRINT_LN("sending shutdown command");
                sendMessage("/d-in/" ID "/shut-down");
            }
            break;
    }
}

void sendMessage(const char *topic){
    if(client.connected()){
        client.publish(topic, "");
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

void applyStateToLeds() {
    if (client.connected()) {
        digitalWrite(greenLed, (currentState == ONLINE || (BLINK_STATE && (currentState != OFFLINE))) ? HIGH : LOW);
        digitalWrite(yellowLed, error ? HIGH : LOW);
        digitalWrite(blueLed, (!error && (load <= ZERO_LOAD)) ? HIGH : LOW);
    } else {
        digitalWrite(greenLed, BLINK_STATE ? HIGH : LOW);
        digitalWrite(yellowLed, BLINK_STATE ? HIGH : LOW);
        digitalWrite(blueLed, BLINK_STATE ? HIGH : LOW);
    }
}
