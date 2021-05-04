module.exports = {
  // List of variables to be automatically marked as sensitive
  sensitiveVariables: ["ibmcloud_api_key", "ibmcloud_apikey", "ssh_public_key", "iaas_classic_username", "iaas_classic_api_key"],

  /**
   * Build axios headers based on a token
   * @param {*} token Either a string or an object
   */
  buildHeaders: function(token) {
    let headers = {
      "content-type": "application/json"
    };
    if (typeof token === "string") {
      headers.Authorization = token;
    } else if (
      typeof token === "object" &&
      token.access_token &&
      token.refresh_token
    ) {
      headers.Authorization = token.access_token;
      headers.refresh_token = token.refresh_token;
    } else {
      throw new Error("Incorrect token format");
    }
    return {
      headers: headers
    };
  },

  /**
   * Creates the terraform repo in schematics using a set of tfvars
   * @param {string} repoName The name for the schematics workspace to be created
   * @param {string} repoUrl url for the repo to create workspace
   * @param {string} rgId Resource group ID where the workspace will be created
   * @param {Object} tfvars An object of tfvar strings as key value pairs
   */

  buildPostPayload: function(repoName, repoUrl, rgId, tfvars) {
    // JSON payload for schematics POST request
    let payload = {
        name: repoName,
        type: ["terraform_v0.12"],
        description: "A test build repo for testing",
        location: "US",
        resource_group: rgId,
        shared_data: {
          resource_group_id: rgId
        },
        tags: ["asset-development"],
        template_repo: {
          branch: "master",
          repo_sha_value: "",
          url: repoUrl
        },
        template_ref: "string",
        template_data: [
          {
            folder: ".",
            env_values: [{}],
            type: "terraform_v0.14",
            variablestore: []
          }
        ]
      },
      tfVarKeys = tfvars ? Object.keys(tfvars) : []; // List of keys in tfvars

    // For each of the keys in the `tfvars` object, add a key value pair
    // to the payload variable store
    tfVarKeys.forEach(key => {
      let keyVariable = {
        name: key,
        value: tfvars[key]
      };
      if (this.sensitiveVariables.indexOf(key) !== -1) {
        keyVariable.secure = true;
      }
      payload.template_data[0].variablestore.push(keyVariable);
    });

    return JSON.stringify(payload);
  },

  /**
   * Takes an error and removes all characters leading up to the first {
   * in the message to format into JSON
   * @param {Error} err Thrown errror
   */
  getJsonFromError: function(err) {
    let errMessage = err.message.split("");
    while(errMessage[0] !== "{") {
      errMessage.shift()
    }
    return errMessage.join("")
  }

};
