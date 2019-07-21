/*
    Helpers for various tasks
*/

// Dependencies
var crypto = require('crypto');
var config = require('./config');

var helpers = {};

// Create a SHA256 hash
helpers.hash = function(str) {
    if(typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases 
// w/o throwing error
helpers.parseJsonToObject = function(str) {
    try{
        var obj = JSON.parse(str);
        return obj;
    } catch(e) {
        return {};
    }
};

// Create a string of random alphanumeric characters
helpers.createRandomString = function(strLength) {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        // Define all the possible characters that could go in the string
        var possibleCharacters = 'abcdefghijklmnopqrstuvwyz0123456789';
        var str = ''; // Start the final string

        for(i = 1; i <= strLength; i++) {
            // Get a random character
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to final string
            str += randomCharacter;
        }

        // Return the final string
        return str;  
    } else {
        return false;
    }
};
 
module.exports = helpers;