module.exports = {
  apps : [{
    name: 'meething-mediasoup',
    script: 'main.js',
    env : {
      SSL : true,
      SSLKEY : 'privkey.pem',
      SSLCERT  : 'fullchain.pm',
      DEBUG : false
  }]
};
