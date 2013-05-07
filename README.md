solr-security-proxy
===================

Node.js based reverse proxy to make a solr instance read-only, rejecting requests that have the potential to modify the solr index.

Intended for use with the [AJAX-Solr library](https://github.com/evolvingweb/ajax-solr)
and similar applications.

[![Build Status](https://secure.travis-ci.org/dergachev/solr-security-proxy.png)](http://travis-ci.org/dergachev/solr-security-proxy)

Installation and usage
----------------------

To install solr-security-proxy via npm:

```bash
npm install solr-security-proxy
```

To start the proxy directly via command-line, run

```bash
`npm bin`/solr-security-proxy --port 9090 --backend.host 127.0.0.1 --backend.port 8983

# solr-security-proxy: localhost:9090 --> 127.0.0.1:8983
```

The valid command-line options are as follows:

```
    Usage: node ./node_modules/.bin/solr-security-proxy

    Options:
      --port            Listen on this port                         [default: 8008]
      --backend.port    Solr backend port                           [default: 8080]
      --backend.host    Solr backend host                           [default: "localhost"]
      --validPaths      Only allow these paths (comma separated)    [default: "/solr/select"]
      --invalidParams   Block these query params (comma separated)  [default: "qt,stream"]
      --invalidMethods  Block these HTTP methods (comma separated)  [default: "POST"]
      --help, -h        Show usage
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

### Daemontools

For notes on how to setup daemontools to automatically start/restart the proxy, see 
[DAEMONTOOLS.md](https://github.com/dergachev/solr-security-proxy/blob/master/DAEMONTOOLS.md)

How it works
------------

Without this proxy, the following requests can cause trouble:

```bash
# access to /solr/admin
curl http://example.com:8080/solr/admin

# addition of a new document, via POST to /solr/update
curl http://example.com:8080/solr/update?comit=true
  -H "Content-Type: text/xml"
  --data-binary '<add><doc><field name="id">testdoc</field></doc></add>'

# deleting of all documents, via POST to /solr/update
curl http://example.com:8080/solr/update?comit=true
  -H "Content-Type: text/xml"
  --data-binary '<delete><query>*:*</query></delete>'

# deleting all the documents, via GET to /update?stream.body=<delete><query>*:*</query></delete>&commit=true
curl http://example.com:8080/solr/update?stream.body=%3Cdelete%3E%3Cquery%3E*%3A*%3C%2Fquery%3E%3C%2Fdelete%3E%0A
curl http://example.com:8080/solr/update?stream.body=%3Ccommit/%3E

# Triggering remote streaming via GET to /solr/selec
#   ?stream.url=http://example.com:8080/solr/update?commit=true
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


This proxy will not do anything unless you actually ensure that your
Solr container is only being served at 127.0.0.1. If you're using Tomcat with
the proxy on the same machine, then add the following to your solr instance's
server.xml:

```xml
<Valve className="org.apache.catalina.valves.RemoteAddrValve" allow="127\.0\.0\.1"/>
```

Even with the proxy, the entirety of your solr index is world accessible. If
you need to lock it down further, consider maintaining a second core with only
public data, or implementing additional Solr request handlers (via
solr-config.xml) that specify certain query invariants.

At the moment, the proxy blacklists the parameters `qt` and `stream.*`. It's
likely considerably safer instead whitelist only the parameters your
application uses, instead.

Furthermore, this proxy does not guard against simple D.O.S. attacks agains
solr, for example see [this post on Solr DOS by David
Smiley](https://groups.google.com/d/msg/ajax-solr/zhrG-CncrRE/HsyRwmR4mEsJ).

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
git clone https://github.com/dergachev/solr-security-proxy.gi
cd solr-security-proxy
sudo npm link # installs this version via global symlink
```

Now you can reference your cloned version in a node app:

```bash
cd ~/my-node-app
npm link solr-security-proxy
```

To run the tests, simply run `npm test`.

If you want to run test-with-solr-instance.js, you need to set the `TEST_SOLR`
environment variable with the URL to your solr server, as follows:

```
TEST_SOLR=http://127.0.0.1:8081/solr/ npm test
```

The format is `PROTOCOL://ADDRESS:PORT/SOLR_PATH/` and must be followed
exactly.  If solr is on a remote machine, the following will set up an SSH
tunnel for 30 seconds and then run the tests:

```bash
ssh solrmachine -L 8081:127.0.0.1:8080 -f sleep 30 && TEST_SOLR=http://127.0.0.1:8081/solr/ npm test
```

### Vagrant

The accompanying `Vagrantfile` sets up an ubuntu-based node.js stack.
To use it to develop the solr-security-proxy:

```bash
vagrant up
vagrant ssh
cd /vagrant
npm test
```

### nodemon

For automatic restarting of the server upon code changes, install and run nodemon:

```bash
sudo npm install -g nodemon # install it globally
# runs the proxy (restarting upon file changes)
nodemon -L solr-security-proxy.js
# runs the tests (re-running upon code changes)
nodemon -L test/test-solr-security-proxy.js
```

Note that for nodemon to work under Vagrant, "-L" (--legacy) is required.

On VM suspend, nodemon annoyingly goes into the background. Kill it via `pkill -f nodemon`

For my notes on learning node.js development while building this module, see
[DEVNOTES.md](https://github.com/dergachev/solr-security-proxy/blob/master/DEVNOTES.md)
