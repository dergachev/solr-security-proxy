var request = require('request'),
    assert = require('assert');

//
// Return a vows context for each of the above tests.
// Taken almost verbatim from http://vowsjs.org/#-macros
// 
exports.respondsWith = function(status) {
  var executeRequest = function() {
    // this.context.name should be of form "GET /solr"
    var contextNameTokens = this.context.name.split(/ +/),
        requestOptions = {
          method: contextNameTokens[0].toLowerCase(),
          uri: contextNameTokens[1]
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
