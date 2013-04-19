var vows = require('vows'),
    url = require('url');
    SolrSecurityProxy = require('../solr-security-proxy.js'),
    vowsHelper = require('./vows-helper.js');

if (!process.env.TEST_SOLR) { 
  console.error("Skipping test-with-solr-instance.js, as TEST_SOLR is not set.");
  return;
}

// ensure we remove trailing slash
var solrUrl = url.parse(process.env.TEST_SOLR);

SolrSecurityProxy.start(8009, {
  backend: { host: solrUrl.hostname, port: solrUrl.port },
  validPaths: [solrUrl.pathname + 'select']
});

var batch = vowsHelper.testProxyBatch( 'http://localhost:8009' + solrUrl.pathname);
suite = vows.describe('test-with-solr-instance').addBatch(batch).export(module);
