/* 
    Primary file for the API
*/

// Dependencies
var http = require('http');
var url = require('url');   // url library
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
// When we are instantiating the HTTP Server
// We will need a way to read contents of 'cert.pem' and 'key.pem' files.
var fs = require('fs');    
var _data = require('./lib/data');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');

// Testing
// @TODO delete this
// _data.delete('test', 'newFile', function(err) {
//     console.log('This was the error', err);
// });

// The server should respond to all requests with a string
var server = http.createServer(function(req,res) {

    // unifiedServer(req, res);

    // Get the URL and parse it
    // 'true' - means Parse the 'query string'
    var parsedUrl = url.parse(req.url,true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payloud (if any)
    // We weill need 'StringDecoder' library
    var decoder = new StringDecoder('utf-8');
    var buffer = '';  // As new data comes in, we will append to it

    req.on('data', function(data) {
        buffer += decoder.write(data); // Binding 
    });

    // When request object is done
    req.on('end', function() {  
    buffer += decoder.end();

    // Choose the handler this request should go to.
    // If not foudn, use 'Not found' handler
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object ot send to the handler
    var data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject' : queryStringObject,
        'method' : method,
        'headers' : headers,
        'payload' : helpers.parseJsonToObject(buffer)
    }

    // Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload) {

        // Use the status code called back by the handler
        // or default to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

        // Use the payload called back by handler 
        // or default to empty object
        payload = typeof(payload) == 'object' ? payload : {};

        // Convert the payload to a string
        // Payload we are sending back to user
        var payloadString = JSON.stringify(payload)

        // Return the response
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadString);

        // Log the path user was asking for
        console.log('Returning this response: ', statusCode, payloadString);
        });
    });
});
 
// Start the server
server.listen(config.port, function(){
    console.log('The server is listening on port ' + config.port + ' in ' +config.envName);
});

// // All the server logic for both http and https server
// var unifiedServer = function(req, res) {

// };

// Define the request router
var router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens
};