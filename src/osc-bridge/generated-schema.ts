import {GeneratedSchema} from "./process-schema";

export default {
    "global": {
        "getPlayerShip": {
            "arguments": ["integer"],
            "type": "PlayerSpaceship"
        }
    },
    "PlayerSpaceship": {
        "$inherits": "SpaceShip"
    },
    "SpaceShip": {
        "$inherits": "ShipTemplateBasedObject",
        "getSystemHealth": {
            "arguments": ["ESystem"],
            "type": "float"
        },
        "getSystemHeat": {
            "arguments": ["ESystem"],
            "type": "float"
        },
        "getSystemPower": {
            "arguments": ["ESystem"],
            "type": "float"
        },
        "getSystemCoolant": {
            "arguments": ["ESystem"],
            "type": "float"
        },
    },
    "ShipTemplateBasedObject": {
        "getHull": {
            "arguments": [],
            "type": "float"
        },
        "setHull": {
            "arguments": ["float"],
            "type": "void"
        },
        "getRotation": {
            "arguments": [],
            "type": "float"
        },
        "getPosition": {
            "arguments": [],
            "type": ["float", "float"]
        },
    }
} as GeneratedSchema;
