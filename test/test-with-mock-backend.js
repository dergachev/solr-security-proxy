var vows = require('vows'),
    http = require('http'),
    util = require('util');
var SolrSecurityProxy = require('../solr-security-proxy.js'),
    respondsWith = require('./vows-helper.js').respondsWith;

var startSimpleBackendServer = function(port) {
  http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Fake SOLR server processed request');
    res.end();
  }).listen(port);
}

startSimpleBackendServer(8080);
SolrSecurityProxy.start(8008);

suite = vows.describe('solr-security-proxy').addBatch({
  'POST http://localhost:8008/solr':                        respondsWith(403),
  'GET http://localhost:8008/solr/select':                  respondsWith(200),
  'GET http://localhost:8008/solr/admin':                   respondsWith(403),
  'GET http://localhost:8008/solr/update':                  respondsWith(403),
  'GET http://localhost:8008/solr/select?q=balloon':        respondsWith(200),
  'GET http://localhost:8008/solr/select?qt=/update':       respondsWith(403),
  'GET http://localhost:8008/solr/select?stream.body=EVIL': respondsWith(403),
})
.export(module)
