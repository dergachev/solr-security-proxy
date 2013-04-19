solr-security-proxy
===================

Node.js based reverse proxy to make a solr instance read-only, rejecting requests that have the potential to modify the solr index. 

Intended for use with the [AJAX-Solr library](https://github.com/evolvingweb/ajax-solr)
and similar applications.

Installation and usage
----------------------

To install solr-security-proxy via npm:

```bash
npm install solr-security-proxy
```

To start the server from your own app, potentially overriding some default options:

```js
var SolrSecurityProxy = require('solr-security-proxy');
SolrSecurityProxy.start(8008, {validPaths: ['/solr/core1/select']);
```

Here are the default options:

```js
var defaultOptions = {
  invalidHttpMethods: ['POST'],     // all other HTTP methods (eg GET, HEAD, PUT, etc) will be allowed
  validPaths: ['/solr/select'],     // all other paths will be denied
  invalidParams: ['qt', 'stream'],  // blocks requests with params qt or stream.* (all other params are allowed)
  validator: function(){},          // customized validator function; receives (request, options) as arguments
  backend: {                        // proxy to solr at this location
    host: 'localhost',
    port: 8080
  }
};
```

How it works
------------

Without this proxy, the following requests can cause trouble:

```bash
# access to /solr/admin
curl http://example.com:8080/solr/admin

# addition of a new document, via POST to /solr/update
curl http://example.com:8080/solr/update?comit=true \
  -H "Content-Type: text/xml" \
  --data-binary '<add><doc><field name="id">testdoc</field></doc></add>'

# deleting of all documents, via POST to /solr/update
curl http://example.com:8080/solr/update?comit=true \
  -H "Content-Type: text/xml" \
  --data-binary '<delete><query>*:*</query></delete>'

# deleting all the documents, via GET to /update?stream.body=<delete><query>*:*</query></delete>&commit=true
curl http://example.com:8080/solr/update?stream.body=%3Cdelete%3E%3Cquery%3E*%3A*%3C%2Fquery%3E%3C%2Fdelete%3E%0A  
curl http://example.com:8080/solr/update?stream.body=%3Ccommit/%3E

# Triggering remote streaming via GET to /solr/select\
#   ?stream.url=http://example.com:8080/solr/update?commit=true\
#   &stream.body=<delete><query>*:*</query></delete>
# See https://issues.apache.org/jira/browse/SOLR-2854
curl http://example.com:8080/solr/select?q=*:*&indent=on&wt=ruby&rows=2&stream.url=http%3A%2F%2Fexample.com%3A8080%2Fsolr%2Fupdate%3Fcommit%3Dtruetream.body%3D%3Cdelete%3E%3Cquery%3E*%3A*%3C%2Fquery%3E%3C%2Fdelete%3E

# deleting of all documents, via GET to 
#   /solr/select?qt=/update&stream.body=<delete><query>*:*</query></delete>
# See https://issues.apache.org/jira/browse/SOLR-1233#comment-13169425
# See https://issues.apache.org/jira/browse/SOLR-3161
curl http://example.com:8080/solr/select?qt=/update&stream.body=%3Cd%3E%3Cdelete%3E%3Cquery%3E*%3A*%3C%2Fquery%3E%3C%2Fdelete%3E%3Ccommit%2F%3E%3C%2Fd%3E

```

Currently, solr-security-proxy addresses these holes by applying the following rules:

* Reject any POST requests
* Only accept other requests (GET, HEAD, etc...) at "/solr/select"
* Block requests with the following query params: `qt`, `stream.*`

If there are other types of requests that should be blocked, please open an issue.

Caveats
-------

Even with the proxy, the entirety of your solr index is world accessible. If
you need to lock it down further, consider maintaining a second core with only
public data, or implementing additional Solr request handlers (via
solr-config.xml) that specify certain query invariants.

At the moment, the proxy blacklists the parameters `qt` and `stream.*`. It's
likely considerably safer instead whitelist only the parameters your
application uses, instead.

Furthermore, this proxy does not guard against simple D.O.S. attacks against
solr, for example see [this post on Solr DOS by David
Smiley](https://groups.google.com/d/msg/ajax-solr/zhrG-CncrRE/HsyRwmR4mEsJ).

Finally, this proxy will not do anything unless you actually ensure that your
Solr container is only being server at 127.0.0.1. If you're using Tomcat with
the proxy on the same machine, then add the following to your solr instance's
server.xml:

```xml
<Valve className="org.apache.catalina.valves.RemoteAddrValve" allow="127\.0\.0\.1"/>
```

Solr Security Resources
-----------------------

For more info about solr security issues, see:

* http://wiki.apache.org/solr/SolrSecurity
* http://wiki.apache.org/solr/UpdateXmlMessages
* https://issues.apache.org/jira/browse/SOLR-2854 (remote streaming bug)
* https://issues.apache.org/jira/browse/SOLR-1233#comment-13169425 (?qt=/update hole)
* https://issues.apache.org/jira/browse/SOLR-3161 (?qt=/update hole, part 2)
* http://wiki.apache.org/solr/SolrRequestHandler

For other solr security proxies, see https://github.com/evolvingweb/ajax-solr/wiki/Solr-proxies 

Development
-----------

To work on solr-security-proxy, install it as follows:

```bash
git clone https://github.com/dergachev/solr-security-proxy.git
cd solr-security-proxy
sudo npm link # installs this version via global symlink
```

Now you can reference your cloned version in a node app:

```bash
cd ~/my-node-app
npm link solr-security-proxy
```

Now run the tests:

```
npm test # run the test once
```

To start the proxy server with default options, and have it auto-restart on changes to code, do the following:

```bash
npm start 
```

### Vagrant

Don't have node/npm installed? The accompanying `Vagrantfile` sets up an ubuntu-based node.js stack:
To use it to develop the solr-security-proxy:

```bash
vagrant up
vagrant ssh
cd /vagrant

# to run the tests
npm test

# ... or continuously (-L is important for Vagrant compatibility)
./node_modules/.bin/nodemon -L test/test-solr-security-proxy.js 

# to start the server on the default settings
npm start

# ... or continuously (-L is important for Vagrant compatibility)
./node_modules/.bin/nodemon -L solr-security-proxy.js
```

For my notes on learning node.js development while building this module, see
[DEVNOTES.md](https://github.com/dergachev/solr-security-proxy/blob/master/DEVNOTES.md)
