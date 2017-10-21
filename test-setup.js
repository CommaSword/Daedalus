
require('source-map-support').install();
const chaiSubset = require("chai-subset");
const chai = require("chai");
chai.use(chaiSubset);

global.emptyEpsilonConfig = require('./empty-epsilon-config.json');
