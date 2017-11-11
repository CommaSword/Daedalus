import {GeneratedSchema} from "./process-schema";

export default {
    "global": {
        "getPlayerShip": {
            "arguments": ["integer"],
            "type": ["PlayerSpaceship"]
        }
    },
    "PlayerSpaceship": {
        "$inherits": "SpaceShip"
    },
    "SpaceShip": {
        "$inherits": "ShipTemplateBasedObject",
        "getSystemHealth": {
            "arguments": ["ESystem"],
            "type": ["float"]
        },
        "setSystemHealth": {
            "arguments": ["ESystem", "float"],
            "type": []
        },
        "getSystemHeat": {
            "arguments": ["ESystem"],
            "type": ["float"]
        },
        "setSystemHeat": {
            "arguments": ["ESystem", "float"],
            "type": []
        },
        "getSystemPower": {
            "arguments": ["ESystem"],
            "type": ["float"]
        },
        "setSystemPower": {
            "arguments": ["ESystem", "float"],
            "type": []
        },
        "getSystemCoolant": {
            "arguments": ["ESystem"],
            "type": ["float"]
        },
        "setSystemCoolant": {
            "arguments": ["ESystem", "float"],
            "type": []
        },
    },
    "ShipTemplateBasedObject": {
        "getHull": {
            "arguments": [],
            "type": ["float"]
        },
        "setHull": {
            "arguments": ["float"],
            "type": []
        },
        "getRotation": {
            "arguments": [],
            "type": ["float"]
        },
        "setRotation": {
            "arguments": ["float"],
            "type": []
        },
        "getPosition": {
            "arguments": [],
            "type": ["float", "float"]
        },
        "setPosition": {
            "arguments": ["float", "float"],
            "type": []
        },
    }
} as GeneratedSchema;
