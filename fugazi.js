require('source-map-support').install();
const path = require('path');

// require('./dist/src/index').main({
require('./src/fugazi-server').main({
    resources: path.join(__dirname, 'resources')
});
