/* 
    Primary file for the API
*/

// Dependencies
var server = require('./lib/server');
var workers = require('./lib/workers');

// Declare the app
var app = {};

// Initialize
app.init = function() {
    // Start the server
    server.init();

    // Start the workers
    workers.init();
};

// Execute 
app.init();

module.exports = app;