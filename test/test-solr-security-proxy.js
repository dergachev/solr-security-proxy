var request = require('request'),
    vows = require('vows'),
    assert = require('assert'),
    http = require('http'),
    express = require('express'),
    util = require('util');
    SolrSecurityProxy = require('../solr-security-proxy.js');

var startSimpleBackendServer = function(port) {
  http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Fake SOLR server processed request');
    res.end();
  }).listen(port);
  util.puts('fake-solr-back: listening on port ' + port);
}

startSimpleBackendServer(8080);
SolrSecurityProxy.options.listenPort = 8008;
SolrSecurityProxy.start();

suite = vows.describe('solr-security-proxy')
            .addBatch({
              'POST /solr': respondsWith(403),
              'GET /solr/select': respondsWith(200),
              'GET /solr/admin': respondsWith(403),
              'GET /solr/update': respondsWith(403),
              'GET /solr/select?q=balloon': respondsWith(200),
              'GET /solr/select?qt=/update': respondsWith(403),
              'GET /solr/select?stream.body=EVIL': respondsWith(403),
            })
            .export(module)

// Return a vows context for each of the above tests.
// Taken almost verbatim from http://vowsjs.org/#-macros
function respondsWith(status) {
  var executeRequest = function() {
    // this.context.name should be of form "GET /solr"
    var contextNameTokens = this.context.name.split(/ +/),
        requestOptions = {
          method: contextNameTokens[0].toLowerCase(),
          uri: 'http://localhost:8008' + contextNameTokens[1]
        };
    request(requestOptions, this.callback); //executes http request specified by contex
  };

  var context = {};
  context['topic'] = executeRequest;
  context['ensure correct response code: ' +status] = function(res) {
    assert.equal(res.statusCode, status);
  }
  return context;
}
