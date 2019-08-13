/*
    Worker-related tasks
*/

// Dependencies
var path = require('path');
var fs = require('fs');
var _data = require('./data');
var https = require('https');
var http = require('http');
var helpers = require('./helpers');
var url = require('url');

// Instantiate the worker object
var workers = {};

// Lookup all checks, get their data, send to a validator
workers.gatherAllChecks = function(){
    // Get all the checks
    _data.list('checks', function(err, checks){
        if (!err && checks && checks.length > 0) {
            checks.forEach(function(check) {
                // Read in the check data
                _data.read('checks', check, function(err, originalCheckData) {
                    if (!err && originalCheckData){
                        // Pass it to the check validator
                        workers.validateCheckData(originalCheckData); 

                    } else {
                        console.log("Error reading one of the check's data.")
                    }
                });
            });
        } else {
            console.log("Error: Could not find any checks to process");
        }
    })
};

// Validating check-data
workers.validateCheckData = function(originalCheckData){
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
    originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol.trim() : false;
    originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method.trim() : false;
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >=1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

    // Set the keys that may not be setup (if workers have never seen this check before)
    originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    // If all the checks pass, pass the data to the next prcoess
    if (originalCheckData.id && 
        originalCheckData.userPhone &&
        originalCheckData.protocol &&
        originalCheckData.url &&
        originalCheckData.method &&
        originalCheckData.successCodes &&
        originalCheckData.timeoutSeconds) {
        workers.performCheck(originalCheckData);
    } else {
        console.log("Error: One of the checks is not properly formatted. Skipping it.")
    }
};

// Perform the check, send originalCheckData and the outcome of the check process
// to the next step in the process
workers.performCheck(originalCheckData){
    // Prepare the initial check outcome
    var checkOutcome = {
        'error' : false,
        'responseCode' : false
    };

    // Mark that the outcome has not been sent yet
    var outcomeSent = false;

    // Parse the hostname and the path out of the original check data
    var parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);
    var hostName = parsedUrl.hostname;
    var path = parsedUrl.path; // Using path and not "pathname" ; we want the full query string

    // Construct the request 
    var requestDetails = {
        'protocol' : originalCheckData.protocol+':',
        'hostname' : hostName,
        'method' : originalCheckData.method.toUpperCase(),
        'path' : path,
        'timeout' : originalCheckData.timeoutSeconds * 1000
    };

    // Instantiate the request object (using either http or https module)
    var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
    // Crafting the request
    var req = _moduleToUse.request(requestDetails, function(res){
        // Grab the status of the sent request
        var status = res.statusCode;

        // Update the checkOutcome and pass the data along
        checkOutcome.responseCode = status;
        if (!outcomeSent) {
            workers.procesCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Error is thrown
    // Bind to the error event so it doesn't get thrown
    req.on('error', function(e){
       // Update the checkOutcome and pass the data along
       checkOutcome.error = {
           'error' : true,
           'value' : e
       };
       if (!outcomeSent){
          workers.procesCheckOutcome(originalCheckData, checkOutcome);
          outcomeSent = true;
       }
    });

    // Error that's a result of a timeout
    // Bind to the timeout event
    req.on('timeout', function(e){
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error' : true,
            'value' : timeout
        };
        if (!outcomeSent){
           
            (originalCheckData, checkOutcome);
           outcomeSent = true;
        }
     });

    // End the request
     req.end();
};

// Process the check outcome, updat the check data as needed
// Trigger an alert to user (if needed)
// Special logic for accomdating a check that has not been tested (no alert on it)
workers.procesCheckOutcome = function(originalCheckData, checkOutcome) {
    // Decide if the check is considered up or down
    var state = !checkOutcome.error && checkOutcome.responseCode
                && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    // Decide if an alert is warranted
    // Is it worth texting user? 
    var alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

    // Update the check data
    var newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    // Save the updates to disk
    _data.update('checks', newCheckData.id, newCheckData, function(err){
        if (!err) {
            // Send the new check data to the next phase in the process (if necessary)
            if (alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Check outcome has not changed, no alert needed');
            }
        } else {   
            console.log("Error trying to save updates to one of the checks");
        }
    });
};

// Alert the user as to a change in their check status
workers.alertUserToStatusChange = function(newCheckData){
    var msg = 'Alert: Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
    helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err){
        if (!err){
            console.log("Success: User was alerted to a status change in their check, vis SMS", msg);
        } else {
            console.log("Error: Could not send SMS alert to user who had a state change in their check");
        }
    });
};

// Timer to execute the worker-process Once per minute
workers.loop = function(){
    setInterval(function(){
        workers.gatherAllChecks();
    }, 1000 * 60)
};

// Init script
workers.init = function(){
    // Execute all the checks immediately
    workers.gatherAllChecks();

    // Call the loop so checks will execute later on
    workers.loop();
};

// Export the module
module.exports = workers;