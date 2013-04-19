var request = require('request'),
    assert = require('assert');

/*
 * Return a vows context for each of the above tests.
 * Adapted from http://vowsjs.org/#-macros
*/
var respondsWith = function(status, solrPath) {
  var executeRequest = function() {
    // this.context.name should be of form "GET select?q=text:bob"
    var contextNameTokens = this.context.name.split(/ +/),
        requestOptions = {
          method: contextNameTokens[0].toLowerCase(),
          uri: solrPath + contextNameTokens[1]
        };
    request(requestOptions, this.callback); //executes http request specified by contex
  };

  var context = {};
  context['topic'] = executeRequest;
  context['expected response code: ' + status] = function(req, res) {
    assert.equal(res.statusCode, status, "actual response code: " + res.statusCode +"; url: " + this.uri.href);
  }
  return context;
}

exports.testProxyBatch = function(proxyUrl) {
  var proxyRespondsWith = function(status) {
    return respondsWith(status, proxyUrl);
  }
  return {
    'POST select':                  proxyRespondsWith(403),
    'GET  select?q=balloon':        proxyRespondsWith(200),
    'GET  admin':                   proxyRespondsWith(403),
    'GET  update':                  proxyRespondsWith(403),
    'GET  select?qt=/update':       proxyRespondsWith(403),
    'GET  select?stream.url=EVIL':  proxyRespondsWith(403),
    'GET  select?stream.body=EVIL': proxyRespondsWith(403)
  };
}
