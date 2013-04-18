var httpProxy = require('http-proxy'),
    util = require('util'),
    url = require('url'),
    SolrSecurityProxy = exports;

SolrSecurityProxy.options = {
  listenPort: 8008,
  invalidHttpMethods: ['POST'],
  validPaths: ['/solr/select'],
  invalidParams: ['qt', 'stream'],
  backend: { 
    host: 'localhost',
    port: 8080
  }
};

var validateRequest = function(request) {
  var parsedUrl = url.parse(request.url, true),
      path = parsedUrl.pathname,
      queryParams = Object.keys(parsedUrl.query);

  return SolrSecurityProxy.options.invalidHttpMethods.indexOf(request.method) === -1 &&
         SolrSecurityProxy.options.validPaths.indexOf(parsedUrl.pathname) !== -1 &&
         queryParams.every(function(p) {
           var paramPrefix = p.split('.')[0]; // invalidate not just "stream", but "stream.*"
           return SolrSecurityProxy.options.invalidParams.indexOf(paramPrefix) === -1;
         }); 
};

// adapted from http://git.io/k5dCxQ
SolrSecurityProxy.server = httpProxy.createServer(function(request, response, proxy) {
  if (validateRequest(request)) {
    proxy.proxyRequest(request, response, SolrSecurityProxy.options.backend);
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


SolrSecurityProxy.start = function() {
  util.puts('solr-security-proxy: listening on port ' + SolrSecurityProxy.options.listenPort);
  SolrSecurityProxy.server.listen(SolrSecurityProxy.options.listenPort);
}

// if invoked directly, (eg "node solr-security-proxy.js"), start automatically
if (require.main === module) { 
  SolrSecurityProxy.start();
}
