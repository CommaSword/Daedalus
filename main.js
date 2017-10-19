require('source-map-support').install();
const path = require('path');

require('./dist/src/index').main({
    resources : path.join(__dirname, 'resources'),
    terminalsPort: 8888,
    eeHost:'10.0.0.7'
});
