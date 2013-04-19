var httpProxy = require('http-proxy'),
    util = require('util'),
    url = require('url'),
    SolrSecurityProxy = exports;

var mergeDefaultOptions = function(options) {
  var defaultOptions = {
    listenPort: 8008,
    invalidHttpMethods: ['POST'],
    validPaths: ['/solr/select'],
    invalidParams: ['qt', 'stream'],
    backend: {
      host: 'localhost',
      port: 8080
    }
  };

  options = options || {};
  options.invalidHttpMethods = options.invalidHttpMethods || defaultOptions.invalidHttpMethods;
  options.validPaths = options.validPaths || defaultOptions.validPaths;
  options.invalidParams = options.invalidParams || defaultOptions.invalidParams;
  options.backend = options.backend || {};
  options.backend.host = options.backend.host || defaultOptions.backend.host;
  options.backend.port = options.backend.port || defaultOptions.backend.port;

  return options;
}

SolrSecurityProxy.createServer = function(options) {
  var options = mergeDefaultOptions(options);

  var validateRequest = function(request) {
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
  // adapted from http://git.io/k5dCxQ
  var server = httpProxy.createServer(function(request, response, proxy) {
    if (validateRequest(request)) {
      proxy.proxyRequest(request, response, options.backend);
      proxy.on('proxyError', function(err, req, res) {
        res.writeHead(500, {  'Content-Type': 'text/plain' });
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
  util.puts('solr-security-proxy: listening on port ' + port);
  return server;
}

// if invoked directly, (eg "node solr-security-proxy.js"), start automatically
if (require.main === module) {
  SolrSecurityProxy.start(8008);
}
