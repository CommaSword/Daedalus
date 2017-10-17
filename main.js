require('source-map-support').install();
const path = require('path');

require('./dist/src/fugazi/index').run(path.join(__dirname, 'resources'));
require('./dist/src/core/server').startServer({
    terminalsPort: 8888,
    eeHost:'10.0.0.7'
});
