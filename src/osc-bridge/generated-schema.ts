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
        "setSystemMaxPower": { // this is an addition to the game's API
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
        "setCombatManeuver": {
            "arguments": ["float"/* boost */, "float" /* strafe */],
            "type": []
        },
        "getWeaponStorage": {
            "arguments": ["EMissileWeapons"],
            "type": ["integer"]
        },
        "setWeaponStorage": {
            "arguments": ["EMissileWeapons", "integer"],
            "type": []
        }, "getWeaponStorageMax": {
            "arguments": ["EMissileWeapons"],
            "type": ["integer"]
        },
        "setWeaponStorageMax": {
            "arguments": ["EMissileWeapons", "integer"],
            "type": []
        },
        "getEnergy": {
            "arguments": [],
            "type": ["float"]
        },
        "setEnergy": {
            "arguments": ["float"],
            "type": []
        },
        "getMaxEnergy": {
            "arguments": [],
            "type": ["float"]
        },
        "setMaxEnergy": {
            "arguments": ["float"],
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
        "getHullMax": {
            "arguments": [],
            "type": ["float"]
        },
        "setHullMax": {
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
        "getCanBeDestroyed": {
            "arguments": [],
            "type": ["bool"]
        },
        "setCanBeDestroyed": {
            "arguments": ["bool"],
            "type": []
        },
    }
} as GeneratedSchema;
