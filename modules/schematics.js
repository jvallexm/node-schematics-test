const utils = require("./utils");

/**
 * Requires axios to be passed in for unit testing
 * @param {Object} axios require('axios') object
 * @param {string} apikey IBM Cloud api key
 */

const apiCalls = function (axios, apikey) {
  /**
   * Fetches an ibm oauth token for the API key for the application.
   * @param {boolean} refresh Return both access and refresh tokens
   */

  // Enable logs
  this.enableLogs = true;

  /**
   * Fetch IAM authorization token.
   * @param {boolean} refresh if true, this will return a refresh token in addition to the access token
   */

  this.fetchToken = function (refresh) {
    // Set options for axios to get IBM Cloud API token from api key
    let options = {
      method: "POST",
      data: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apikey}`,
      url: "https://iam.cloud.ibm.com/identity/token",
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization" : "Basic Yng6Yng="
      }
    };

    // Log if able
    if (this.enableLogs) console.log("Fetching token...");

    // Return a promise with API Token
    return axios(options)
      .then((data) => {
        // Log if able
        if (this.enableLogs) console.log("Token fetch successful!");
        let token = data.data.access_token, // Access token
          refreshToken = data.data.refresh_token, // Refresh token
          accessToken = "Bearer " + token; // Add bearer to compose headers using token
        if (refresh) {
          // Return object containing refresh token if enabled
          return {
            access_token: accessToken,
            refresh_token: refreshToken,
          };
        } else {
          // Otherwise return access token
          return accessToken;
        }
      })
      .catch((err) => {
        // Handle errors
        throw err;
      });
  };

  /**
   * Creates an api call to
   * @param {string} method API call method to use
   * @param {string} path   API sub URL
   * @param {Object} body   API body object
   * @param {string} token  IBM Cloud API Token
   */
  this.axiosSchematics = function (method, path, body, token) {
    // Log if able
    if (this.enableLogs) console.log("Calling schematics " + path);

    // Build schematics api url
    let url = "https://schematics.cloud.ibm.com/v1/workspaces" + path;

    // Fetch a token, then...
    return this.fetchToken(token)
      .then((token) => {
        // Log if able
        if (this.enableLogs) console.log("Schematics " + path + " successful!");

        let methodBody = body || utils.buildHeaders(token); // If no body, add headers
        methodOptions = body ? utils.buildHeaders(token) : null; // Otherwise add options

        // Return axios command to the chosen method with the url, body, and options
        return axios[method](url, methodBody, methodOptions);
      })
      .catch((err) => {
        // Throw error
        throw new Error(err);
      });
  };

  /**
   * Creates the terraform repo in schematics using a set of tfvars
   * @param {string} repoName The name for the schematics workspace to be created
   * @param {string} repoUrl url for the repo to create workspace
   * @param {string} rgId Resource group ID where the workspace will be created
   * @param {Object} tfvars An object of tfvar strings
   */

  this.create = function (repoName, repoUrl, rgId, tfvars) {
    let requestBody = utils.buildPostPayload(repoName, repoUrl, rgId, tfvars);
    // Send POST request to schematics. If there's an error, send the error
    // otherwise send a message showing complete
    return this.axiosSchematics("post", "", requestBody)
      .then((data) => {
        return data.data;
      })
      .catch((err) => {
        throw new Error(err);
      });
  };

  /**
   * Delete a workspace
   * @param {string} id ID of the workspace to delete
   */

  this.delete = function (id) {
    return this.axiosSchematics("delete", `/${id}`)
      .then((data) => {
        return data;
      })
      .catch((err) => {
        throw new Error(err);
      });
  };

  /**
   * Gets the status of a workspace
   * @param {string} id Id of the workspace
   */
  this.status = function (id) {
    return this.axiosSchematics("get", `/${id}`)
      .then((data) => {
        return data.data;
      })
      .catch((err) => {
        throw new Error(err);
      });
  };

  /**
   * Awaits a workspace to be unlocked
   * @param {string} id Workspace id
   * @param {number} timeout Seconds to timeout before making the next get call
   */

  this.awaitWorkspaceUnlocked = async function (id, timeout) {
    // Logs
    console.log("Awaiting workspace unlocked...");
    // Recursive await function. This function will run until the workspace is no longer frozen or locked
    let recursiveAwait = async (id) => {
      // Get workspace status
      return await this.status(id)
        .then(async (data) => {
          // Disable logs until function is over
          this.enableLogs = false;
          // If the workspace is locked or frozen
          if (data.workspace_status.frozen || data.workspace_status.locked) {
            // Return a promise that will resolve afer the timeout has elapsed. The resolution of the promise
            // will call the recursive await function
            return await new Promise((resolve) => {
              setTimeout(() => {
                console.log("Awaiting workspace unlocked...");
                resolve(recursiveAwait(id));
              }, timeout);
            });
          } else {
            // If the workspace isn't frozen, enable the logs and resolve the chain
            // this.enableLogs = true;
            return Promise.resolve(data);
          }
        })
        .catch((err) => {
          // Handle errors and turn logging back on
          this.enableLogs = true;
          return new Error(err);
        });
    };

    return await recursiveAwait(id);
  };

  /**
   * Fetches a token and performs axios get on a url with the token in the headers
   * @param {string} url url to get data from
   */
  this.fetchTokenAndGet = function (url) {
    return this.fetchToken()
      .then((token) => {
        return axios.get(url, utils.buildHeaders(token));
      })
      .then((data) => {
        return data;
      })
      .catch((err) => {
        throw new Error(err);
      });
  };

  /**
   * Handles action promise return
   * @param {*} data data returned by promise
   */
  this.handleAction = function (data) {
    if (data.status === "FAILED") {
      // If the action failed, get and return both the data and logs for the workspace
      return this.fetchTokenAndGet(data.runtime_data[0].log_store_url)
        .then((logs) => {
          throw new Error(
            JSON.stringify({
              data: data,
              logs: logs.data,
            })
          );
        })
        .catch((err) => {
          // Handle errors
          throw new Error(err);
        });
    } else {
      // Return workspace data
      return data;
    }
  };

  /**
   * Run plan on workspace
   * @param {string} activity Activity, can be plan or apply
   * @param {string} id ID of the workspace to delete
   * @param {number} timeout length of timeout between api calls to schematics workspace
   * @param {object?} body (Optional) body for POST and PUT requests
   * @param {string} templateId (Optional) ID for workspace template 
   */

  this.activity = async function (activity, id, timeout, body, templateId) {
    let method; // Declare method

    // Change axios method
    if (activity === "plan") {
      method = "post";
    } else {
      method = "put";
    }

    // Change path for updating variables
    if (activity === "updateVariables") {
      activity = `template_data/${templateId}/values`;
    }

    // Call schematics API
    return await this.axiosSchematics(method, `/${id}/${activity}`, body || {}, true)
      .then(() => {
        // Wait for workspace to be unlocked to perform additional commands
        return this.awaitWorkspaceUnlocked(id, timeout);
      })
      .then((data) => {
        // Handle failed actions
        return this.handleAction(data);
      })
      .then((data) => {
        // Return data on success
        return data;
      })
      .catch((err) => {
        // Throw errors
        throw new Error(err);
      });
  };

  /**
   * Run activity on workspace without waiting for the workspace to be unfrozen
   * @param {string} activity Activity, can be plan or apply
   * @param {string}  id ID of the workspace to delete
   * @param {Object?} body Body for schematics call
   * @param {string?} templateID Template ID
   */

  this.activityNoWait = function (activity, id, body, templateId) {
    let method; // Declare method

    // Change axios method
    if (activity === "plan") {
      method = "post";
    } else {
      method = "put";
    }

    // Change path for updating variables
    if (activity === "updateVariables") {
      activity = `template_data/${templateId}/values`;
    }

    // Run schematics command
    return this.axiosSchematics(method, `/${id}/${activity}`, body || {}, true)
      .then((data) => {
        // Return data
        return data;
      })
      .catch((err) => {
        // Handle errors
        throw new Error(err);
      });
  };

  /**
   * Update variables for a schematics workspace
   * @param {string} id ID of workspace to update
   * @param {number} timeout Number of seconds to wait while polling the workspace to unlock
   * @param {Array<Object>} body Array of objects containing variables to update. This will update all variables not listed as the default value
   * @param {string} templateId Template ID for the workspace to update. Usually this will be template[0]
   */

  this.updateVariables = function (id, timeout, body, templateId) {
    return this.activity("updateVariables", id, timeout, {
      variablestore: body
    }, templateId);
  };

  /**
   * Plan schematics workspace
   * @param {string} id ID of workspace to plan
   * @param {number} timeout Seconds to timeout while waiting for workspace to be unlocked
   */

  this.plan = function (id, timeout) {
    return this.activity("plan", id, timeout);
  };

  /**
   * Apply schematics workspace
   * @param {string} Id of workspace to apply
   * @param {number} timeout Seconds to timeout while waiting for workspace to be unlocked
   */

  this.apply = function (id, timeout) {
    return this.activity("apply", id, timeout);
  };

  /**
   * Apply schematics workspace. will not wait for workspace to finish
   * @param {string} id ID of the workspace to be called
   */

  this.applyNoWait = function (id) {
    return this.activityNoWait("apply", id);
  };

  /**
   * Destroy schematics resources
   * @param {string} Id of workspace to apply
   * @param {number} timeout Seconds to timeout while waiting for workspace to be unlocked
   */

  this.destroy = function (id, timeout) {
    return this.activity("destroy", id, timeout);
  };
};

module.exports = apiCalls;
