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

  aws.prototype.makeReqParams = function (_params) {
    var params = http.prototype.makeReqParams.call(this,_params);
    params.body = _params.body;
    params.headers = params.headers || {};
    params.headers['Content-Type'] = params.headers['Content-Type'] || 'application/json';
    if (params.gzip === undefined) params.gzip = true;

    var config = this._amazonES;
    params.service =  config.service || 'es';
    params.region = config.region || 'us-east-1';
    
    aws4.sign(params,{
      accessKeyId: config.accessKey || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.secretKey || process.env.AWS_SECRET_ACCESS_KEY
    });
    
    return params;
  };

  pool.defaultConnectionClass = 'aws';
  pool.connectionClasses.aws = aws;
  return es;
};