var vows = require('vows'),
    http = require('http'),
    url = require('url'),
    SolrSecurityProxy = require('../solr-security-proxy.js'),
    vowsHelper = require('./vows-helper.js');

var startSimpleBackendServer = function(port) {
  http.createServer(function (req, res) {
    var params = url.parse(req.url,true).query;

    if (params.proxyError) {
        // Send something invalid to trigger proxyError event
        res.writeHead('abc');
        res.end();
        return;
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('mock backend processed request');
    res.end();
  }).listen(port);
}

startSimpleBackendServer(9090);
SolrSecurityProxy.start(8008, { backend: { port: 9090}});

var batch = vowsHelper.testProxyBatch('http://localhost:8008/solr/', {mocked: true});
suite = vows.describe('test-with-mock-backend').addBatch(batch).export(module);
