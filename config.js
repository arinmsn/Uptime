/*

    Create and export configuration variables

*/

// Container for all the environments
var environments = {};

// 'Staging' (default) environment
environments.staging = {
    'port' : 3000,
    'envName' : 'staging'
};

// 'Production' environment
environments.production = {
    'port' : 5000,
    'envName' : 'production'
};

// Determine which environemnt was
// passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check to ensure current environemnt is one of 
// the above enviornemtns. If not, default to staging.
var environemntToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environemntToExport;

