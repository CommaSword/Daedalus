
require('source-map-support').install();
const cap = require("chai-as-promised");
const chaiSubset = require("chai-subset");
const chai = require("chai");
chai.use(chaiSubset);
chai.use(cap);

global.emptyEpsilonConfig = require('./empty-epsilon-config.json');
