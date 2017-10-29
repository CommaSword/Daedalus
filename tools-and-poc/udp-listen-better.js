const osc = require('osc');

// Create an osc.js UDP Port listening on port 57121.
var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 8000,
    metadata : true,
});

// Listen for incoming OSC bundles.
udpPort.on("bundle", function (oscBundle, timeTag, info) {
    console.log("An OSC bundle just arrived for time tag", timeTag, ":", oscBundle);
    console.log("Remote info is: ", info);
});

// Listen for incoming OSC bundles.
udpPort.on("message", function (message, timeTag, info) {
    console.log("An OSC message just arrived :", message);
    console.log("Remote info is: ", info);
});

// Open the socket.
udpPort.open();
