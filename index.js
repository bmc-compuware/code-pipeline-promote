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

const core = require("@actions/core");
const github = require("@actions/github");
const utils = require("@bmc-compuware/ispw-action-utilities");

try {
  // Inputs received from workflow
  let inputs = [
    "ces_url",
    "srid",
    "container_id",
    "level",
    "ces_token",
    "runtime_configuration",
    "task_id",
    "change_type",
    "execution_status",
    "auto_deploy",
    "dpenvlst",
    "system",
    "override",
  ];

  //retrieve input values
  inputs = utils.retrieveInputs(core, inputs);

  let setId;
  core.debug(
    "Code Pipeline: parsed inputs: " + utils.convertObjectToJson(inputs)
  );

  if (!validateRequiredParms(inputs)) {
    throw new MissingArgumentException(
      "Inputs required for Code Pipeline Promote are missing. " +
        "\nSkipping the promote request."
    );
  }

  // base url for promote
  const requestBasePath = `/ispw/${inputs.srid}/assignments/${inputs.container_id}/tasks/promote?level=${inputs.level}`;
  // add request query parameters
  let requestQueryPath = prepareRequestQueryPath(inputs);
  // final request url
  const requestUrl = utils.assembleRequestUrl(
    inputs.ces_url,
    requestBasePath.concat(requestQueryPath)
  );
  core.debug("Code Pipeline: request url: " + requestUrl.href);

  //request body parameters
  const reqBodyObj = assembleRequestBodyObject(
    inputs.runtime_configuration,
    inputs.change_type,
    inputs.execution_status,
    inputs.auto_deploy,
    inputs.dpenvlst,
    inputs.system,
    inputs.override
  );

  //send promote request to CES
  utils
    .getHttpPostPromise(requestUrl, inputs.ces_token, reqBodyObj)
    .then(
      (response) => {
        core.debug(
          "Code Pipeline: received response body: " +
            utils.convertObjectToJson(response.data)
        );
        // promote could have passed or failed
        setOutputs(core, response.data);
        setId = response.data.setId;
        return handleResponseBody(response.data);
      },
      (error) => {
        // there was a problem with the request to CES
        if (error.response !== undefined) {
          core.debug(
            "Code Pipeline: received error code: " + error.response.status
          );
          core.debug(
            "Code Pipeline: received error response body: " +
              utils.convertObjectToJson(error.response.data)
          );
          setOutputs(core, error.response.data);
          throw new PromoteFailureException(error.response.data.message);
        }
        throw error;
      }
    )
    .then(
      (response) => {
        console.log("The promote request submitted successfully.");
      },
      (error) => {
        core.debug(error.stack);
        core.setFailed(error.message);
      }
    );

  // the following code will execute after the HTTP request was started,
  // but before it receives a response.
} catch (error) {
  if (error instanceof MissingArgumentException) {
    // this would occur if there was nothing to load during the sync process
    // no need to fail the action if the promote is never attempted
    console.log(error.message);
  } else {
    core.debug(error.stack);
    console.error("An error occurred while starting the promote.");
    core.setFailed(error.message);
  }
}

/** *****************************************************************************************/
// END OF MAIN SCRIPT, START OF FUNCTION DEFINITIONS
/** *****************************************************************************************/

/**
 * Validate inputs
 */
function validateRequiredParms(input) {
  let isValid = true;
  if (!utils.stringHasContent(input.ces_url)) {
    isValid = false;
    console.error(`Missing input:ces_url must be specified.`);
  }

  if (!utils.stringHasContent(input.ces_token)) {
    isValid = false;
    console.error(`Missing input:ces_token must be specified.`);
  }

  if (!utils.stringHasContent(input.srid)) {
    isValid = false;
    console.error(`Missing input:srid must be specified.`);
  }

  if (!utils.stringHasContent(input.container_id)) {
    isValid = false;
    console.error(`Missing input: Container id must be specified.`);
  }

  if (!utils.stringHasContent(input.level)) {
    isValid = false;
    console.error(`Missing input: Level must be specified.`);
  }

  return isValid;
}

/**
 * Prepare request url using input parameters
 */
function prepareRequestQueryPath(inputs) {
  let requestQueryPath = "&";
  if (utils.stringHasContent(inputs.mname)) {
    requestQueryPath = requestQueryPath.concat(`mname=${inputs.mname}&`);
  }
  if (utils.stringHasContent(inputs.mtype)) {
    requestQueryPath = requestQueryPath.concat(`mtype=${inputs.mtype}&`);
  }
  if (
    requestQueryPath.endsWith("&") ||
    requestQueryPath.endsWith("?") ||
    requestQueryPath.endsWith("&&")
  ) {
    requestQueryPath = requestQueryPath.substring(
      0,
      requestQueryPath.length - 1
    );
  }
  core.debug(
    "Code Pipeline: Final request query url path: " + requestQueryPath
  );
  return requestQueryPath;
}

/**
 * Takes the fields from the response body and sends them to the outputs of
 * the job
 * @param {core} core github actions core
 * @param {*} responseBody the response body received from the REST API request
 */
function setOutputs(core, responseBody) {
  if (responseBody) {
    core.setOutput("output_json", utils.convertObjectToJson(responseBody));
    core.setOutput("set_id", responseBody.setId);
    core.setOutput("url", responseBody.url);

    const isTimedOut =
      utils.stringHasContent(responseBody.message) &&
      responseBody.message.includes("timed out");
    core.setOutput("is_timed_out", isTimedOut);
  }
}

/**
 * Assembles an object for the CES request body.
 */
function assembleRequestBodyObject(
  runtimeConfig,
  changeType,
  executionStatus,
  autoDeploy,
  dpenvlst,
  system,
  override
) {
  const requestBody = {};
  if (utils.stringHasContent(runtimeConfig)) {
    requestBody.runtimeConfig = runtimeConfig;
  }
  if (utils.stringHasContent(changeType)) {
    requestBody.changeType = changeType;
  }
  if (utils.stringHasContent(executionStatus)) {
    requestBody.execStat = executionStatus;
  }
  requestBody.autoDeploy = autoDeploy === "true";
  if (utils.stringHasContent(dpenvlst)) {
    requestBody.dpenvlst = dpenvlst;
  }
  if (utils.stringHasContent(system)) {
    requestBody.system = system;
  }
  if (utils.stringHasContent(override)) {
    requestBody.override = override;
  }

  return requestBody;
}

/**
 * Examines the given response body to determine whether an error occurred
 * during the promote.
 * @param {*} responseBody The body returned from the CES request
 * @return {*} The response body object if the promote was successful,
 * else throws an error
 * @throws PromoteFailureException if there were failures during the promote
 */
function handleResponseBody(responseBody) {
  if (responseBody === undefined) {
    // empty response
    throw new PromoteFailureException(
      "No response was received from the promote request."
    );
  } else {
    // success
    console.log(utils.getStatusMessageToPrint(responseBody.message));
    return responseBody;
  }
}

/**
 * Error to throw when not all the arguments have been specified for the action.
 * @param  {string} message the message associated with the error
 */
function MissingArgumentException(message) {
  this.message = message;
  this.name = "MissingArgumentException";
}
MissingArgumentException.prototype = Object.create(Error.prototype);

/**
 * Error to throw when the response for the promote request is incomplete
 *  or indicates errors.
 * @param  {string} message the message associated with the error
 */
function PromoteFailureException(message) {
  this.message = message;
  this.name = "PromoteFailureException";
}
PromoteFailureException.prototype = Object.create(Error.prototype);

module.exports = {
  validateRequiredParms,
  setOutputs,
  assembleRequestBodyObject,
  handleResponseBody,
  MissingArgumentException,
  PromoteFailureException,
};
