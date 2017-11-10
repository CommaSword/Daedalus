import {GeneratedSchema} from "./process-schema";

export default {
    "global": {
        "getPlayerShip": {
            "arguments": 1,
            "type": "PlayerSpaceship"
        }
    },
    "PlayerSpaceship": {
        "$inherits": "SpaceShip"
    },
    "SpaceShip": {
        "$inherits": "ShipTemplateBasedObject",
        "getSystemHealth": {
            "arguments": 1,
            "type": "float"
        },
        "getSystemHeat": {
            "arguments": 1,
            "type": "float"
        },
        "getSystemPower": {
            "arguments": 1,
            "type": "float"
        },
        "getSystemCoolant": {
            "arguments": 1,
            "type": "float"
        },
    },
    "ShipTemplateBasedObject": {
        "getHull": {
            "arguments": 0,
            "type": "float"
        },
        "getRotation": {
            "arguments": 0,
            "type": "float"
        },
        "getPosition": {
            "arguments": 0,
            "type": ["float", "float"]
        },
    }
} as GeneratedSchema;
