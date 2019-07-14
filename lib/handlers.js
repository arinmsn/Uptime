/*
    Request Handlers
*/

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Define the handlers
var handlers = {};

// Users - Will figure out which methods we are requesting
// Then will pass it to sub-handlers
handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the users' sub-methods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback) {
    // Check that all req'd fields are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var firstName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.firstName.trim().length = 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement.trim().length == true ? data.payload.tosAgreement.trim() : false;

    if(firstName && lastName && phone && password && tosAgreement) {
        // Ensure user does not already exist!
        _data.read('users', phone, function(err, data) {
            if(err) {
                // Hash that password
                var hashedPassowrd = helpers.hash(passowrd);

                // Create the user object
                var userObject = {
                    'firstName' : firstName,
                    'lastName'  : lastName,
                    'phone'     : phone,
                    'hashedPassowrd' : hashedPassowrd,
                    'tosAgreement'   : true
                };

                // Store the user (persist the user to disk)
                _data.create('users')
            } else {
                callback(400, {'Error' : ' A user with that phone number already exists!'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// Users - get
handlers._users.get = function(data, callback) {

};

// Users - put
handlers._users.put = function(data, callback) {

};

// Users - delete
handlers._users.delete = function(data, callback) {

};



handlers.ping = function(data, callback) {
    callback(200);
};

// Not found 
handlers.notFound = function(data, callback) {
    callback(404);
};

module.exports = handlers;