interface Query {
    query: string;
    type: 'f' | 'i';
}

export function translateAddressToQuery(address: string): Query | null {
    const vals = address.split('/');
    if (vals[0] !== 'ee') {
        return null;
    }
    let i = 1;
    let commands: string[] = [];
    let commandType = 'string';

    while (i < vals.length) {
        if (isMethod(vals[i])) {
            const method = getMethod(vals[i]);
            commandType = method.type;
            commands.push(`${method.name}(${vals.slice(i + 1, i + method.argNum + 1).join(',')})`);
            i = i + method.argNum + 1;
        } else {
            i++;
        }
    }
    return {
        query: commands.join(':'),
        type: commandType as 'f' | 'i'
    }
}

function isMethod(name: string) {
    return !!methods[name];
}

function getMethod(name: string) {
    return methods[name];
}

const methods: any = {
    playership: {
        name: 'getPlayerShip',
        argNum: 1,
        type: 'ship'
    },
    hull: {
        name: 'getHull',
        argnum: 0,
        type: 'f'
    }
};

const generatedSchema = {
    "global": {
        "methods": {
            "getPlayerShip": {
                "argnum": 1,
                "type": "PlayerSpaceship"
            }
        }
    },
    "PlayerSpaceship": {
        "inherits": "SpaceShip"
    },
    "SpaceShip": {
        "inherits": "ShipTemplateBasedObject"
    },
    "ShipTemplateBasedObject": {
        "methods": {
            "getHull": {
                "argnum": 0,
                "type": "float"
            }
        }
    }
};

// Input: ee/playership/-1/hull
// Output: getPlayerShip(-1):getHull()
// value = await driver.query('getPlayerShip(-1):getHull()');
// this.cast({
//     address: address,
//     value: value,
//     type: number //The type is from the last call
// })

//driver.get('getPlayerShip(-1)','getHull()')
