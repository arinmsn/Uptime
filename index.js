/* 
    Primary file for the API
*/

// Dependencies
var http = require('http');
var url = require('url');   // url library
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

// The server should respond to all requests with a string
var server = http.createServer(function(req,res) {
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
            'payload' : buffer
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

// Define the handlers
var handlers = {};

handlers.sample = function(data, callback) {
    // Callback a http status code & payload object
    callback(406, {'name' : 'sample handler'});
};

// Not found 
handlers.notFound = function(data, callback) {
    callback(404);
};

// Define the request router
var router = {
    'sample' : handlers.sample
};