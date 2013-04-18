var httpProxy = require('http-proxy'),
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
  var parsedUrl = require('url').parse(request.url, true),
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
  } else {
    response.writeHead(403, 'Illegal request');
    response.write("solrProxy: access denied\n");
    response.end();
  }
})

SolrSecurityProxy.start = function () {
  require('util').puts('solr-security-proxy: listening on port ' + SolrSecurityProxy.options.listenPort);
  SolrSecurityProxy.server.listen(SolrSecurityProxy.options.listenPort);
}

// if invoked directly, eg "node solr-security-proxy.js"
if (require.main === module) { 
  SolrSecurityProxy.start();
}
