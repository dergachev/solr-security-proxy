# Development notes 

Misc resources I drew upon while learning node.js and writing this script.

## Node.js (general)

* http://stackoverflow.com/questions/2353818/how-do-i-get-started-with-node-js (didn't really use it, but seems good)
* https://github.com/remy/nodemon/issues/146 (need to launch "nodemon -L" under Vagrant!)
* https://github.com/nodejitsu/node-http-proxy#setup-a-stand-alone-proxy-server-with-custom-server-logic
* https://github.com/joyent/node/wiki/ECMA-5-Mozilla-Features-Implemented-in-V8
* http://docs.nodejitsu.com/articles/javascript-conventions/using-ECMA5-in-nodejs
* http://nodejs.org/api/http.html#http_http_request_options_callback
* https://github.com/cloudhead/vows/blob/master/lib/vows.js (copied how options are handled)
* If I ever want to parse args with node: https://github.com/substack/node-optimist

## Packaging

* https://npmjs.org/doc/json.html
* https://github.com/nodeapps/http-server/blob/master/package.json
* https://github.com/madhums/nodejs-express-mongoose-demo/blog/master/package.json (and general app layout)
* https://npmjs.org/ (looked at top modules for examples of how to package)

## Testing 

### general

* http://expressjs.com/guide.html
* https://github.com/mikeal/request
* https://github.com/cloudhead/journey/blob/master/test/journey-test.js
* http://stackoverflow.com/questions/9399365/deep-extend-like-jquerys-for-nodejs
* http://nodejs.org/api/assert.html
* http://stackoverflow.com/questions/7254025/node-js-unit-testing

### vows

* http://vowsjs.org/#-macros (Read all of this!!)
* http://codyaray.com/2011/09/simple-rest-api-testing-setup-using-vows-js-tobi-and-node-js
* https://github.com/cloudhead/vows/issues/257 (potential issue)
* https://github.com/reid/pact (vows macros for http testing)

There's a lot to learn about how node-http-proxiy tests are written:

* https://github.com/nodejitsu/node-http-proxy/blob/master/test/http/http-test.js
* https://github.com/nodejitsu/node-http-proxy/blob/master/test/helpers/index.js
* https://github.com/nodejitsu/node-http-proxy/blob/master/test/macros/http.js

### vows alternatives

* https://github.com/visionmedia/supertest
* http://brianstoner.com/blog/testing-in-nodejs-with-mocha/
* https://github.com/nodejitsu/node-http-proxy/blob/master/test/core/simple/test-http.js
* https://github.com/nodejitsu/node-http-proxy/blob/master/examples/http/latent-proxy.js

### Apieasy

* https://github.com/flatiron/api-easy
* http://blog.nodejitsu.com/rest-easy-test-any-api-in-nodejs
* http://flatiron.github.io/api-easy/

At some point, I actually implemented my tests using APIEasy, but then I decided to remove it as a dependency.
For posterity, here's the code:

```js
// Helper function to convert @table@, a 2d array, into an array of objects.
// Example usage:
//   convertToAssoc( [[1,2],[3,4]], ["a","b"]) 
//   => [ {a:1, b:2}, {a:3, b:4}]
var convertToAssoc = function(headers, table) {
  var assocTable = [];
  for (var i = 0; i < table.length; i++) {
    var assoc = {}
    for (var j=0; j < headers.length; j++) {
      assoc[headers[j]] = table[i][j];
    }
    assocTable.push(assoc);
  }
  return assocTable;
}

var tests = convertToAssoc(
    ["backend_code", "proxy_code", "method", "path", "description"],
    [ [200, 403, 'POST', '/solr', 'Proxy blocks all POST requests'],
      [200, 200, 'GET',  '/solr/select', 'Proxy allows /solr/select requests'],
      [200, 403, 'GET',  '/solr/admin', 'Proxy blocks /solr/admin requests (not in whitelist)'],
      [200, 403, 'GET',  '/solr/update', 'Proxy blocks /solr/update requests (not in whitelist)'],
      [200, 200, 'GET',  '/solr/select?q=balloon', 'Proxy allows random /solr/select queries'],
      [200, 403, 'GET',  '/solr/select?qt=/update', 'Proxy blocks queries with qt= param'],
      [200, 403, 'GET',  '/solr/select?stream.body=EVIL', 'Proxy blocks queries with stream.* param']
    ]);

var APIeasy = require('api-easy'),
    assert = require('assert');

var suite = APIeasy.describe('solr-security-proxy');

tests.forEach(function(test) { 
  suite.discuss(test.description)
         .discuss('(without proxy)')
           .use('localhost', 8080)
             .get(test.path)
               .expect(test.backend_code)
           .undiscuss()
         .discuss('(via proxy)')
           .use('localhost', 8008)
             .get(test.path)
               .expect(test.proxy_code)
           .undiscuss()
         .undiscuss();
})

suite.export(module);
```
