/*
 * Meething Mediasoup Server
 * Meething Mediasoup SFU
 * https://github.com/meething
 *
 */

const http = require("https");
const { WebSocketServer } = require("protoo-server");
const mediasoup = require("mediasoup");
const ConfRoom = require("./lib/Room");
const fs = require('fs');
const stun = require('stun');

// LRU with last used sockets
const QuickLRU = require("quick-lru");
const lru = new QuickLRU({ maxSize: 1000, onEviction: false });

const path = require('path')
var options = {
    cert: process.env.SSLCERT ? fs.readFileSync(process.env.SSLCERT) : false,
    key:  process.env.SSLKEY  ? fs.readFileSync(process.env.SSLKEY)  : false,
};


(async () => {

  var serverOptions = {
    rtcMinPort: process.env.MINPORT || 20000,
    rtcMaxPort: process.env.MAXPORT || 29999
  };
  const res = await stun.request('stun.l.google.com:19302');
  var pubIp = res.getXorAddress().address;
  if(pubIp) {
    console.log('Detected Server IP', pubIp);
    serverOptions.rtcAnnouncedIPv4 = pubIp;
  }
  const worker = await mediasoup.createWorker(serverOptions);

  worker.on("died", () => {
    console.log("mediasoup Worker died, exit..");
    process.exit(1);
  });

  const router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: "audio",
        name: "opus",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2
      },
      {
        kind: "video",
        name: "VP8",
        mimeType: "video/VP8",
        clockRate: 90000
      }
    ]
  });

  const httpServer = http.createServer(options);
  await new Promise(resolve => {
    httpServer.listen(process.env.PORT || 2345, "0.0.0.0", resolve);
  });

  const wsServer = new WebSocketServer(httpServer);
  wsServer.on("connectionrequest", (info, accept) => {
    console.log(
      "protoo connection request [peerId:%s, address:%s, room:%s]",
      info.socket.remoteAddress,
      info.request.url
    );
	  
    // Parse WSS Query Paraemters
    var queryString = info.request.url || '';
    if(queryString.substr(0,1) === '/') { queryString = queryString.substr(1, queryString.length); }
    const urlParams = new URLSearchParams(queryString);
    const roomId = urlParams.get('roomId') || 'lobby';
    const peerId = urlParams.get('peerId') ||  `p${String(Math.random()).slice(2)}`;
	  	  
    if (lru.has(roomId)) {
	    var room = lru.get(roomId);
	    room.handlePeerConnect({
	      peerId: peerId,
	      protooWebSocketTransport: accept()
	    });
            console.log("existing room stat", roomId, peerId, room.getStatus() );
    } else {
	    var room = new ConfRoom(router);
	    lru.set(roomId,room);
	    room.handlePeerConnect({
	      peerId: peerId,
	      protooWebSocketTransport: accept()
	    });
            console.log("new room stat", roomId, peerId, room.getStatus() );
    }

  });

  console.log("MediaSoup server started on wss://0.0.0.0:",process.env.PORT||2345);

})();
