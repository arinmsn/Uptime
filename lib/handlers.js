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
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement) {
        // Ensure user does not already exist!
        _data.read('users', phone, function(err, data) {
            if(err) {
                // Hash that password
                var hashedPassword = helpers.hash(password);

                // Create the user object
                if (hashedPassword) {
                    var userObject = {
                        'firstName' : firstName,
                        'lastName'  : lastName,
                        'phone'     : phone,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement'   : true
                    };
    
                    // Store the user (persist the user to disk)
                    _data.create('users', phone, userObject, function(err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error' : 'Could not create the new user.'});
                        }
                    });
                } else {
                    callback(500, { 'Error' : 'Could not hash the user\'s password.'});
                }
                
            } else {
                callback(400, {'Error' : ' A user with that phone number already exists!'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required fields!'});
    }
};

// Users - get
// Required data: phone, 
// Optional data: none
// @TODO: Only let authenticated user access their own object
// Don't let them access others' objects!
handlers._users.get = function(data, callback) {
    // Phone number validation
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // Get the token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that given toekn is valid for the phone #
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if (tokenIsValid) {
                // Looking up user
            _data.read('users', phone, function(err, data) {
            if(!err && data) {
                // Remove the hashed password first before
                // showing it to the user
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        });
            } else {
                callback(403, {'Error' : 'Missing required token in header or token is invalid'})
            }
        });
    } else {
        callback(400, {'Error':'Missing required field (phone #).'})
    }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one)
handlers._users.put = function(data, callback) {
    // Check for the required field
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // Check for optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phone is invalid
    if (phone) {
        // Error if nothing is sent to update
        if (firstName || lastName || password) {

            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            // Verify that given toekn is valid for the phone #
            handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
                if (tokenIsValid) {
                    // Lookup the user
            _data.read('users', phone, function(err, userData) {
                if (!err && userData) {
                    // Update the fields necessary

                    if (firstName) {
                        userData.firstName = firstName;
                    }

                    if (lastName) {
                        userData.lastName = lastName;
                    }

                    if (password) {
                        userData.hashedPassword = helpers.hash(password);
                    }

                    // Store the new updates 
                    _data.update('users', phone, userData, function(err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error' : 'Could not update the user'});
                        }
                    });
                } else {
                    callback(403, {'Error' : 'Missing required token in header or token is invalid'});
                }
            });
                } else {
                    callback(400, {'Error' : 'The specified user does not exist!'});
                }
            })
        } else {
            callback(400, {'Error' : 'Missing fields to update'});
        }
    } else { 
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Users - delete
// Required field: phone
// @TODO: Authenticated users can only delete their own object.
// @TODO: Cleanup (delete) any other data files assocaites with this specific user.
handlers._users.delete = function(data, callback) {
    // Phone number validation
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {

         // Get the token from headers
         var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

         // Verify that given toekn is valid for the phone #
         handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if (tokenIsValid) {
            // Looking up user
            _data.read('users', phone, function(err, data) {
            if(!err && data) {
               _data.delete('users', phone, function(err){
                   if (!err) {
                       callback(200);
                   } else {
                       callback(500, {'Error' : 'Could not delete the specified user!'})
                   }
               });
            } else {
                callback(400, {'Error' : 'Specified user cannot be found!'});
            }
        });
            } else {
                callback(403, {'Error' : 'Missing required token in header or token is invalid'});
            };
        });
    } else {
        callback(400, {'Error':'Missing required field (phone #).'})
    }
};

// Users - Will figure out which methods we are requesting
// Then will pass it to sub-handlers
handlers.tokens = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

//   Container for all the tokens methods
handlers._tokens = {};

// POST method
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback){
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        // Lookup the user who matches the phone number
        _data.read('users', phone, function(err, userData) {
            if (!err && userData) {
                // First, hash the password
                // Second, compare it to the password stored in user object
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword) { 
                    // If password is valid, create a toekn with a random name.
                    // Set expiration date 1 hour in the future
                    var tokenId = helpers.createRandomString(20);

                    // 1 hour = 1000 ms x 60 seconds in 1 min x 60 mins in 1 hour
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'phone' : phone,
                        'id'    : tokenId,
                        'expires' : expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function(err) {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error' : 'We could not create the new token.'})
                        }
                    });
                } else {
                    callback(400, {'Error' : 'Password did not match the specified user.'})
                }
            } else {
                callback(400, {'Error' : 'Could not find the specified user!'})
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required fields(s).'})
    }
};

/* 
    Tokens - get
    Required data: id
    Optional data: none
*/
handlers._tokens.get = function(data, callback){
    // Ensure that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // Looking up token
        _data.read('tokens', id, function(err, tokenData) {
            if(!err && tokenData) {
                // Remove the hashed password first before
                // showing it to the user
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error':'Missing required field (phone #).'})
    }

};

/*
    Tokens - put
    Required data: id, extend
    No reason to modify about the token.
    We will extend the expiration by 1 hour.
    Optional data: none
*/
handlers._tokens.put = function(data, callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if (id && extend) {
        // Lookup the token
        _data.read('tokens', id, function(err, tokenData) {
            if (!err && tokenData) {
                // Check to ensure the toekn hasn't expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiratin an hour from now
                    tokenData.expires = Date.now() + 100 * 60 * 60;

                    // Store the new updates
                    _data.update('tokens', id, tokenData, function(err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error' : 'Could not extend the expiration for token.'})
                        }
                    });
                } else {
                    callback(400, {'Error' : 'The toekn has already expired and cannot be extended.'})
                }
            } else {
                callback(400, {'Error' : 'Specified toekn does not exist!'})
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required field(s) or field(s) are invalid.'})
    }
};

/*
    Tokens - Delete
    Required data: id
    Optional data: none
*/
handlers._tokens.delete = function(data, callback){
    // Ensure that the id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // Looking up user
        _data.read('tokens', id, function(err, data) {
            if(!err && data) {
               _data.delete('tokens', id, function(err){
                   if (!err) {
                       callback(200);
                   } else {
                       callback(500, {'Error' : 'Could not delete the specified token!'})
                   }
               });
            } else {
                callback(400, {'Error' : 'Specified token cannot be found!'});
            }
        });
    } else {
        callback(400, {'Error':'Missing required field (Id).'})
    }
};

// Verify if a given token id is valid for the user 
handlers._tokens.verifyToken = function(id, phone, callback) {
    // Look up the token
    _data.read('tokens', id, function(err, tokenData){
        if (!err && tokenData) {
            // Ensure the token is for the given user and has not expired
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

handlers.ping = function(data, callback) {
    callback(200);
};

// Not found 
handlers.notFound = function(data, callback) {
    callback(404);
};

module.exports = handlers;