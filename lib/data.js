// Library for storing and editing data

var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for the module
var lib = {};

// Base directory of the data folder
// __dirname is where we are 
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file
lib.create = function(dir, file, data, callback) {
    // 'wx' flag is for writing.
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Converting data to string
            var stringData = JSON.stringify(data);

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, function(err) {
                if(!err) {
                    fs.close(fileDescriptor, function(err) {
                        if (!err) {
                            callback(false); // a false error is a good thing!
                        } else {
                            callback('Error closing new file!');
                        }
                    })
                } else {
                    callback('Error writing to new file');
                }
            })
        } else {
            callback('Could not create new file, it may already exist!');
        }
    })
};

// Read data from a file
lib.read = function(dir, file, callback) {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function(err, data) {
        // If it's not error and if there is data
        // 
        if (!err && data) {
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    });
};
//

// Updating existing file with new data
lib.update = function(dir, file, data, callback) {
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function(err, fileDescriptor){
        if(!err && fileDescriptor) {
            // Converting data to string
            var stringData = JSON.stringify(data);

            // Truncate the file before we write on top of it
            fs.ftruncate(fileDescriptor, function(err) {
                if(!err) {
                    // Write to the file and close it
                    fs.writeFile(fileDescriptor, stringData, function(err) {
                        if (!err) {
                            fs.close(fileDescriptor, function(err) {
                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing existing file!');
                                }
                            })
                        } else {
                            callback('Error writing to existing file!');
                        }
                    });
                } else {
                    callback('Error truncating file');
                }
            })
        } else { 
            callback('Could not open the file for updating. It may not exist yet!');
        }
    });
};

// Delete the file
lib.delete = function(dir, file, callback) {
    // Unlinking - removing the file from the file system
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function(err) {
        if (!err) {
            callback(false);
        } else {
            callback('Error deleting file.');
        }
    });
};

module.exports = lib;