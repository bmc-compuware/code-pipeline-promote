/**
 * THESE MATERIALS CONTAIN CONFIDENTIAL INFORMATION AND TRADE SECRETS OF BMC SOFTWARE, INC. YOU SHALL MAINTAIN THE MATERIALS AS
 * CONFIDENTIAL AND SHALL NOT DISCLOSE ITS CONTENTS TO ANY THIRD PARTY EXCEPT AS MAY BE REQUIRED BY LAW OR REGULATION. USE,
 * DISCLOSURE, OR REPRODUCTION IS PROHIBITED WITHOUT THE PRIOR EXPRESS WRITTEN PERMISSION OF BMC SOFTWARE, INC.
 *
 * ALL BMC SOFTWARE PRODUCTS LISTED WITHIN THE MATERIALS ARE TRADEMARKS OF BMC SOFTWARE, INC. ALL OTHER COMPANY PRODUCT NAMES
 * ARE TRADEMARKS OF THEIR RESPECTIVE OWNERS.
 *
 * (c) Copyright 2024 BMC Software, Inc.
 */
var index = require('../index.js');
const chai = require('chai');
var assert = chai.assert;
const gcore = require('@actions/core');
const github = require('@actions/github');

const {testFunction } = require('../index.js');
const {testFunction1 } = require('../index.js');
const {testFunction2 } = require('../index.js');

describe('#retrieveInputs(core, inputs)', function () {
  it('should return empty - null passed in', function () {

    let output ={
        containerId : null,
        taskLevel: null
    };
    assert.isNotNull(output);
    assert.strictEqual(output.containerId, null);
    assert.strictEqual(output.taskLevel, null);
  });

  it('should return empty - undefined passed in', function () {
    let output ={
        containerId : undefined,
        taskLevel: undefined
    };
    assert.isNotNull(output);
    assert.strictEqual(output.containerId, undefined);
    assert.strictEqual(output.taskLevel, undefined);
  });

  it('should return empty - empty passed in', function () {
    let output ={
        containerId : '',
        taskLevel: ''
    };
    assert.isNotNull(output);
    assert.strictEqual(output.containerId, '');
    assert.strictEqual(output.taskLevel, '');

  it('should have assignment defined', function () {
    let output ={
        containerId : 'assignment123',
        taskLevel: ''
    };
    assert.isNotNull(output);
    assert.strictEqual(output.containerId, 'assignment123');
    assert.strictEqual(output.taskLevel, undefined);
  });

  it('should have level defined', function () {
    let output ={
        containerId : '',
        taskLevel: 'level'
    };
    assert.isNotNull(output);
    assert.strictEqual(output.containerId, undefined);
    assert.strictEqual(output.taskLevel, 'level');
  });
});


describe('#setOutputs(core, responseBody)', function () {
  it('should call setOutput for each field in the response body', function () {
    let core = {
      outputs: {},
      setOutput: function (outputName, outputValue) {
        this.outputs[outputName] = outputValue;
      }
    };

    let responseBody = {};
    index.setOutputs(core, responseBody);
    assert.strictEqual(core.outputs.set_id, undefined);
    assert.strictEqual(core.outputs.url, undefined);
    assert.strictEqual(core.outputs.is_timed_out, false);

    responseBody = {
      setId: 'set1234',
      url: 'url/to/set1234'
    };
    index.setOutputs(core, responseBody);
    assert.strictEqual(core.outputs.set_id, 'set1234');
    assert.strictEqual(core.outputs.url, 'url/to/set1234');
    assert.strictEqual(core.outputs.is_timed_out, false);
  });  
});

});


describe('#assembleRequestBodyObject(runtimeConfig, changeType, executionStatus, autoDeploy)', function () {
  it('should be missing runtime config', function () {
    let output = index.assembleRequestBodyObject(null, 'E', 'H', 'false');
    assert.strictEqual(output.runtimeConfig, undefined);
    assert.strictEqual(output.changeType, 'E');
    assert.strictEqual(output.execStat, 'H');
    assert.strictEqual(output.autoDeploy, false);

    output = index.assembleRequestBodyObject(undefined, 'E', 'H', 'false');
    assert.strictEqual(output.runtimeConfig, undefined);
    assert.strictEqual(output.changeType, 'E');
    assert.strictEqual(output.execStat, 'H');
    assert.strictEqual(output.autoDeploy, false);

    output = index.assembleRequestBodyObject('', 'E', 'H', 'false');
    assert.strictEqual(output.runtimeConfig, undefined);
    assert.strictEqual(output.changeType, 'E');
    assert.strictEqual(output.execStat, 'H');
    assert.strictEqual(output.autoDeploy, false);
  });

  it('should be missing changeType', function () {
    let output = index.assembleRequestBodyObject('TPZP', null, 'H', 'false');
    assert.strictEqual(output.runtimeConfig, 'TPZP');
    assert.strictEqual(output.changeType, undefined);
    assert.strictEqual(output.execStat, 'H');
    assert.strictEqual(output.autoDeploy, false);

    output = index.assembleRequestBodyObject('TPZP', undefined, 'H', 'false');
    assert.strictEqual(output.runtimeConfig, 'TPZP');
    assert.strictEqual(output.changeType, undefined);
    assert.strictEqual(output.execStat, 'H');
    assert.strictEqual(output.autoDeploy, false);

    output = index.assembleRequestBodyObject('TPZP', '', 'H', 'false');
    assert.strictEqual(output.runtimeConfig, 'TPZP');
    assert.strictEqual(output.changeType, undefined);
    assert.strictEqual(output.execStat, 'H');
    assert.strictEqual(output.autoDeploy, false);
  });

  it('should be missing executionStatus', function () {
    let output = index.assembleRequestBodyObject('TPZP', 'E', null, 'true');
    assert.strictEqual(output.runtimeConfig, 'TPZP');
    assert.strictEqual(output.changeType, 'E');
    assert.strictEqual(output.execStat, undefined);
    assert.strictEqual(output.autoDeploy, true);

    output = index.assembleRequestBodyObject('TPZP', 'E', undefined, 'true');
    assert.strictEqual(output.runtimeConfig, 'TPZP');
    assert.strictEqual(output.changeType, 'E');
    assert.strictEqual(output.execStat, undefined);
    assert.strictEqual(output.autoDeploy, true);

    output = index.assembleRequestBodyObject('TPZP', 'E', '', 'true');
    assert.strictEqual(output.runtimeConfig, 'TPZP');
    assert.strictEqual(output.changeType, 'E');
    assert.strictEqual(output.execStat, undefined);
    assert.strictEqual(output.autoDeploy, true);
  });

  it('should set autoDeploy to false', function () {
    let output = index.assembleRequestBodyObject('TPZP', 'E', 'I', null);
    assert.strictEqual(output.runtimeConfig, 'TPZP');
    assert.strictEqual(output.changeType, 'E');
    assert.strictEqual(output.execStat, 'I');
    assert.strictEqual(output.autoDeploy, false);

    output = index.assembleRequestBodyObject('TPZP', 'E', 'I', undefined);
    assert.strictEqual(output.runtimeConfig, 'TPZP');
    assert.strictEqual(output.changeType, 'E');
    assert.strictEqual(output.execStat, 'I');
    assert.strictEqual(output.autoDeploy, false);

    output = index.assembleRequestBodyObject('TPZP', 'E', 'I', '');
    assert.strictEqual(output.runtimeConfig, 'TPZP');
    assert.strictEqual(output.changeType, 'E');
    assert.strictEqual(output.execStat, 'I');
    assert.strictEqual(output.autoDeploy, false);
  });
});


describe('#handleResponseBody(responseBody)', function () {
  it('should throw an exception - responseBody undefined', function () {
    assert.throw(function () { index.handleResponseBody(undefined) }, index.PromoteFailureException, 'No response was received from the promote request.');
  });

 it('should return successfully', function () {
    let responseBody = {
      setID: 'S000238588',
      url: 'http://ces:48080/ispw/CW09-47623/sets/S000238588',
      message: ''
    };
    let output = index.handleResponseBody(responseBody);
    assert.strictEqual(output, responseBody);
  });

});