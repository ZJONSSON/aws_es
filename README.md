# Minimal AWS Elasticsearch connector

Creates a clone of the http class that signs each request before its sent.

Usage:
```js
var elasticsearch = require('elasticsearch');
require('aws_es')(elasticsearch);

var client = new elasticsearch.Client({
  host : 'xxxxx.es.amazonaws.com',
  amazonES: {
    region : 'us-east-1',
    accessKey : 'XXXX',
    secretKey : 'XXXX'
  }
})

```

Config variables `service`, `region`, `accessKey` and `secretKey` can be defined in an `amazonES` object at client creation.  Alternatively, service defaults to 'es', region defaults to 'us-east-1' and the keys default to environment variables: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

The complete code is as follows: 

```js
var aws4 = require('aws4');

module.exports = function(es) {
  var pool = es.ConnectionPool,
      http = pool.connectionClasses.http;

  var aws = function() { http.apply(this,arguments); };
  require('util').inherits(aws,http);

  aws.prototype.createAgent = function(config) {
    this._amazonES = config.amazonES || {};
    http.prototype.createAgent.call(this,config);
  };

  aws.prototype.request = function(params) {
    var config = this._amazonES;
    params.service =  config.service || 'es';
    params.region = config.region || 'us-east-1';
    params.headers = {'Content-Type' : 'application/json'};
    
    aws4.sign(params,{
      accessKeyId: config.accessKey || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.secretKey || process.env.AWS_SECRET_ACCESS_KEY
    });
    
    return http.prototype.request.apply(this,arguments);
  };

  pool.defaultConnectionClass = 'aws';
  pool.connectionClasses.aws = aws;
  return es;
};
```