require('ts-node').register();
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiSubset = require('chai-subset');
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(chaiSubset);
chai.use(sinonChai);

// expose global variable 'expect'
expect = chai.expect;
