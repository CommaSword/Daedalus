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
        "$inherits": "ShipTemplateBasedObject"
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
    }
};
