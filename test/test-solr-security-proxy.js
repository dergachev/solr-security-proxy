var request = require('request'),
    vows = require('vows'),
    assert = require('assert'),
    http = require('http'),
    express = require('express'),
    util = require('util');
    SolrSecurityProxy = require('../solr-security-proxy.js'); 

// start fake solr on port 8080
var startBackendServer = function(port) { 
  var app = express();
  app.use(express.logger('dev'))
  app.get(/solr.*/, function(req, res){
    res.send("GET processed\n");
  });
  app.post(/solr.*/, function(req, res){
    res.send("POST / - processed\n");
  });
  app.listen(port);
  util.puts('mock-solr: listening on port ' + port);
}

startBackendServer(8080);
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
    request(requestOptions, this.callback); //executes http request specified by context
  };

  var context = {};
  context['topic'] = executeRequest;
  context['ensure correct response code: ' +status] = function(res) {
    assert.equal(res.statusCode, status);
  }
  return context;
}
