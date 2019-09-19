const fs = require('fs');
const path = require('path');
const naming = require('naming');

const infraSystems = [
    'A1',
    'A2',
    'A3',
    'B1',
    'B2',
    'B3'
];

const panelsTab = (sysname) => {
    const label = naming(sysname, 'kebab');
    const address = `/d/repairs/${sysname}`;
    return {
        "type": `tab`,
        "id": sysname,
        "label": label,
        "color": `auto`,
        "css": ``,
        "layout": ``,
        "spacing": 0,
        "value": ``,
        "precision": 0,
        "address": ``,
        "preArgs": [],
        "target": [],
        "variables": `@{parent.variables}`,
        "widgets": [
            {
                "type": `led`,
                "top": 60,
                "left": 80,
                "id": `${label}_led_1`,
                "width": `auto`,
                "height": `auto`,
                "label": `ONLINE`,
                "color": `green`,
                "css": ``,
                "widgetId": ``,
                "range": {
                    "min": 0,
                    "max": 1
                },
                "logScale": false,
                "value": ``,
                "preArgs": [],
                "address": `${address}/is-online`
            },
            {
                "type": `led`,
                "top": 60,
                "left": 200,
                "id": `${label}_led_2`,
                "width": `auto`,
                "height": `auto`,
                "label": `ERROR`,
                "color": `yellow`,
                "css": ``,
                "widgetId": ``,
                "range": {
                    "min": 0,
                    "max": 1
                },
                "logScale": false,
                "value": ``,
                "preArgs": [],
                "address": `${address}/is-error`
            },
            {
                "type": `led`,
                "top": 60,
                "left": 320,
                "id": `${label}_led_3`,
                "width": `auto`,
                "height": `auto`,
                "label": `STABLE`,
                "color": `blue`,
                "css": ``,
                "widgetId": ``,
                "range": {
                    "min": 0.001,
                    "max": 0
                },
                "logScale": false,
                "value": ``,
                "preArgs": [],
                "address": `${address}/load`
            },
            {
                "type": `push`,
                "top": 200,
                "left": 190,
                "id": `${label}_off_button`,
                "linkId": ``,
                "width": `auto`,
                "height": `auto`,
                "label": `OFF`,
                "color": `auto`,
                "css": ``,
                "on": 1,
                "off": 0,
                "norelease": false,
                "precision": 2,
                "address": `${address}/shut-down`,
                "preArgs": [],
                "target": []
            },
            {
                "type": `push`,
                "top": 200,
                "left": 330,
                "id": `${label}_on_button`,
                "width": `auto`,
                "height": `auto`,
                "label": `ON`,
                "color": `auto`,
                "css": ``,
                "on": 1,
                "off": 0,
                "norelease": false,
                "precision": 2,
                "address": `${address}/start-up`,
                "preArgs": [],
                "target": [],
                "linkId": ``
            },
            {
                "type": "visualizer",
                "top": 290,
                "left": 70,
                "id": `${label}_load`,
                "width": 360,
                "height": "auto",
                "label": "load",
                "color": "auto",
                "css": "",
                "widgetId": "",
                "duration": 23,
                "range": {
                    "min": 0,
                    "max": 1
                },
                "origin": "auto",
                "logScale": false,
                "smooth": false,
                "pips": false,
                "value": "",
                "address": `${address}/load`,
                "preArgs": []
            },
            {
                "type": "push",
                "top": 200,
                "left": 70,
                "id": `${label}_set_error`,
                "linkId": "",
                "width": "auto",
                "height": "auto",
                "label": "ERROR",
                "color": "auto",
                "css": "",
                "on": 1,
                "off": 0,
                "norelease": false,
                "precision": 2,
                "address": `${address}/error`,
                "preArgs": [],
                "target": []
            },
            {
                "type": "fader",
                "top": 290,
                "left": 430,
                "id": `${label}_overload_threshold`,
                "width": "auto",
                "height": 200,
                "label": "threshold",
                "color": "auto",
                "css": "",
                "widgetId": "",
                "range": {
                    "min": 0,
                    "max": 1
                },
                "logScale": false,
                "origin": "auto",
                "unit": "",
                "alignRight": false,
                "horizontal": false,
                "pips": false,
                "dashed": false,
                "value": "",
                "address": `${address}/overload-threshold`,
                "preArgs": [],
                "compact": true,
                "input": false
            }
        ],
        "tabs": [],
        "scroll": true
    };
};
const gm = [
    {
        "type": `root`,
        "tabs": infraSystems.map(panelsTab),
        "color": `auto`,
        "css": ``,
        "value": ``,
        "precision": 0,
        "address": `/root`,
        "preArgs": [],
        "target": [],
        "variables": {},
        "id": `root`,
        "scroll": true,
        "label": false
    }
];
fs.writeFileSync(path.resolve(__dirname, 'gm.json'), JSON.stringify(panels, null, 4), 'utf8');

const ecr = {
    "type": "root",
    "id": "root",
    "linkId": "",
    "color": "auto",
    "css": "",
    "default": "",
    "value": "",
    "precision": 2,
    "address": "/root",
    "preArgs": "",
    "target": "",
    "bypass": false,
    "traversing": false,
    "variables": {},
    "tabs": [
        {
            "type": "tab",
            "id": "panels",
            "linkId": "",
            "label": "auto",
            "color": "auto",
            "css": "",
            "default": "",
            "value": "",
            "precision": 2,
            "address": "/tab_1",
            "preArgs": "",
            "target": "",
            "bypass": false,
            "variables": "@{parent.variables}",
            "widgets": [], // placeholder
            "tabs": [],
            "scroll": true
        }
    ],
    "scroll": true,
    "label": false
};
ecr.tabs[0].widgets = infraSystems.flatMap((sysname, idx) => {
    const label = naming(sysname, 'kebab');
    const name = label.split('_').join(' ');
    const address = `/d/repairs/${sysname}`;
    const top = 60 + 120 * (idx % 3);
    const left = 60 + 420 * Math.floor(idx / 3);
    return [
        {
            "type": `led`,
            "top": top,
            "left": left,
            "id": `${label}_online`,
            "width": `auto`,
            "height": `auto`,
            "label": `${name} ONLINE`,
            "color": `green`,
            "css": ``,
            "widgetId": ``,
            "range": {
                "min": 0,
                "max": 1
            },
            "logScale": false,
            "value": ``,
            "preArgs": [],
            "address": `${address}/is-online`
        },
        {
            "type": `led`,
            "top": top,
            "left": left + 120,
            "id": `${label}_error`,
            "width": `auto`,
            "height": `auto`,
            "label": `${name} ERROR`,
            "color": `yellow`,
            "css": ``,
            "widgetId": ``,
            "range": {
                "min": 0,
                "max": 1
            },
            "logScale": false,
            "value": ``,
            "preArgs": [],
            "address": `${address}/is-error`
        },
        {
            "type": `led`,
            "top": top,
            "left": left + 120 * 2,
            "id": `${label}_stable`,
            "width": `auto`,
            "height": `auto`,
            "label": `${name} STABLE`,
            "color": `blue`,
            "css": ``,
            "widgetId": ``,
            "range": {
                "min": 0.001,
                "max": 0
            },
            "logScale": false,
            "value": ``,
            "preArgs": [],
            "address": `${address}/load`
        }
    ];
});

fs.writeFileSync(path.resolve(__dirname, 'ecr.json'), JSON.stringify(ecr, null, 4), 'utf8');