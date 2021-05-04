const env = require("dotenv").config(); // import environment variables
const axios = require("axios"); // axios
const apiCalls = require("./modules/schematics");

const schematics = new apiCalls(axios, process.env.IBM_CLOUD_API_KEY);

let repoName = "baremetal-test",
  repoUrl = "https://github.ibm.com/Jennifer-Valle/baremetal-on-schematics",
  resourceGroupId = "271bbee55baf463e81cec7de47d4b219",
  tfvars = {
    iaas_classic_username: process.env.CLASSIC_USERNAME,
    iaas_classic_api_key: process.env.CLASSIC_API_KEY,
  },
  timeout = 10000;

let workspaceId;

schematics
  .create(repoName, repoUrl, resourceGroupId, tfvars)
  .then((data) => {
    workspaceId = data.id;
  })
  .then(() => {
    // await workspace unlocked before plan
    return schematics.awaitWorkspaceUnlocked(workspaceId, timeout)
  })
  .then(() => {
    // plan workspace
    return schematics.plan(workspaceId, timeout)
  })
  .then(() => {
    // apply workspace
    return schematics.apply(workspaceId, timeout)
  })
  .catch((err) => console.log(err));