module.exports = {
  apps : [{
    name: 'meething-mediasoup',
    script: 'main.js',
    env : {
      SSL : true,
      SSLKEY : 'certs/privkey.pem',
      SSLCERT  : 'certs/fullchain.pem',
      DEBUG : false
    }
  }]
};
