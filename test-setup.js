
const chaiSubset = require("chai-subset");
const sinonChai = require("sinon-chai");
const chai = require("chai");
chai.use(chaiSubset);
chai.use(sinonChai);

global.emptyEpsilonConfig = require('./empty-epsilon-config.json');
