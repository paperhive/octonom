require('ts-node').register();
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

// expose global variable 'expect'
expect = chai.expect;
