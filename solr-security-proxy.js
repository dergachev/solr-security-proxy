#!/usr/bin/env node

var httpProxy = require('http-proxy'),
    util = require('util'),
    url = require('url'),
    optimist = require('optimist'),
    SolrSecurityProxy = exports;

/*
 * Returns true if the request satisfies the following conditions:
 *  - HTTP method (eg. GET,POST,..) is not in options.invalidHttpMethods
 *  - Path (eg. /solr/update) is in options.validPaths
 *  - All request query params (eg ?q=, ?stream.url=) not in options.invalidParams
 */
var validateRequest = function(request, options) {
  var parsedUrl = url.parse(request.url, true),
      path = parsedUrl.pathname,
      queryParams = Object.keys(parsedUrl.query);

  return options.invalidHttpMethods.indexOf(request.method) === -1 &&
         options.validPaths.indexOf(parsedUrl.pathname) !== -1 &&
         queryParams.every(function(p) {
           var paramPrefix = p.split('.')[0]; // invalidate not just "stream", but "stream.*"
           return options.invalidParams.indexOf(paramPrefix) === -1;
         });
};


var defaultOptions = {
  listenPort: 8008,
  invalidHttpMethods: ['POST'],
  validPaths: ['/solr/select'],
  invalidParams: ['qt', 'stream'],
  backend: {
    host: 'localhost',
    port: 8080
  },
  validator: validateRequest
};

/*
 * Merge user-supplied options with @defaultOptions*.
 */
var mergeDefaultOptions = function(defaultOptions, options) {
  var mergedOptions = {};

  options = options || {};
  options.backend = options.backend || {};
  mergedOptions.invalidHttpMethods = options.invalidHttpMethods || defaultOptions.invalidHttpMethods;
  mergedOptions.validPaths = options.validPaths || defaultOptions.validPaths;
  mergedOptions.invalidParams = options.invalidParams || defaultOptions.invalidParams;
  mergedOptions.backend = options.backend || {};
  mergedOptions.backend.host = options.backend.host || defaultOptions.backend.host;
  mergedOptions.backend.port = options.backend.port || defaultOptions.backend.port;
  mergedOptions.validator = options.validator || defaultOptions.validator;

  return mergedOptions;
}

SolrSecurityProxy.createServer = function(options) {
  var options = mergeDefaultOptions(defaultOptions, options);

  // console.log(options);

  // adapted from http://git.io/k5dCxQ
  var server = httpProxy.createServer(function(request, response, proxy) {
    if (options.validator(request, options)) {
      proxy.proxyRequest(request, response, options.backend);
      proxy.on('proxyError', function(err, req, res) {
        res.writeHead(502, {  'Content-Type': 'text/plain' });
        res.end('Proxy error: ' + err);
      });
    } else {
      response.writeHead(403, 'Illegal request');
      response.write("solrProxy: access denied\n");
      response.end();
    }
  });
  return server;
}

SolrSecurityProxy.start = function(port, options) {
  var server = SolrSecurityProxy.createServer(options);
  server.listen(port);
  return server;
}

// if invoked directly, (eg "node solr-security-proxy.js"), start automatically
if (require.main === module) {
  // TODO: refactor these; write tests
  var options = {
    'port':           { description: "Listen on this port", default: 8008},
    'backendPort':   { description: "Solr backend port", default: 8080},
    'backendHost':   { description: "Solr backend host", default: 'localhost'},
    'validPaths':     { description: "Only allow these paths (comma separated)", default: '/solr/select'},
    'invalidParams':  { description: "Block these query params (comma separated)", default: 'qt,stream'},
    'invalidMethods': { description: "Block these HTTP methods (comma separated)", default: 'POST'},
    'help':           { description: "Show usage", alias: 'h'},
  };
  var argv = optimist.usage('Usage: $0', options).argv
  if (argv.help) {
    optimist.showHelp();
  } else {
    var proxyOptions = {
      backend: { port: argv.backendPort, host:argv.backendHost},
      invalidHttpMethods: argv.invalidMethods.split(","),
      invalidParams: argv.invalidParams.split(","),
      validPaths: argv.validPaths.split(",")
    };
    SolrSecurityProxy.start(argv.port, proxyOptions);
    util.puts("solr-security-proxy: localhost:" + argv.port + " --> " + argv.backendHost + ":" + argv.backendPort);
    return;
  }
}
