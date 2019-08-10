/*
    Server-related tasks
*/

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');   // url library
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
// When we are instantiating the HTTP Server
// We will need a way to read contents of 'cert.pem' and 'key.pem' files.
var fs = require('fs');    
var _data = require('./lib/data');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');

// Instantiate the server module object
var server = {};

// @TODO Get rid of this
// helpers.sendTwilioSms('4158375309', 'Hello!', function(err) {
//     console.log('This was th error', err);
//     // If we get a '400' error, it means phone # doesn't exist.
//     // 'error false' means that SMS would have given through.
// });

// Instanatiate the HTTP Server
server.httpServer = http.createServer(function(req,res) {
    server.unifiedServer(req, res);
});
 
// Instantiate the HTTPS server
server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pen')),
    'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, function(req,res) {
    server.unifiedServer(req, res);
});

// All the server logic for both http and https server
server.unifiedServer = function(req, res) {

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
    var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

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
};

// Define the request router
server.router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'checks' : handlers.checks
};

// Init script
server.init = function(){
    // Start the HTTP Server
    server.httpServer.listen(config.httpPort, function(){
        console.log('The server is listening on port ' + config.httpPort);
    });

    // Start the HTTP server
    server.httpsServer.listen(config.httpsPort, function(){
        console.log('The server is listening on port ' + config.httpsPort);
    });
}

module.exports = server;