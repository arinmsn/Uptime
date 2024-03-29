/*
    Create and export configuration variables
*/

// Container for all the environments
var environments = {};

// 'Staging' (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashingSecret: "someNotSecretPassword",
  maxChecks: 5,
  twilio: {
    accountSid: "ACb32d411ad7fe886aac54c665d25e5c5d",
    authToken: "9455e3eb3109edc12e3d8c92768f7a67",
    fromPhone: "+15005550006"
  }
};

// 'Production' environment
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "ProSecretPassword",
  maxChecks: 10,
  twilio: {
    accountSid: "",
    authToken: "",
    fromPhone: ""
  }
};

// Determine which environemnt was
// passed as a command-line argument
var currentEnvironment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

// Check to ensure current environemnt is one of
// the above enviornemtns. If not, default to staging.
var environemntToExport =
  typeof environments[currentEnvironment] == "object"
    ? environments[currentEnvironment]
    : environments.staging;

module.exports = environemntToExport;
