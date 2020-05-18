/*
 * Meething Mediasoup Server
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
const lru = new QuickLRU({ maxSize: 100, onEviction: false });

const path = require('path')
var options = {
    cert: process.env.SSLCERT ? fs.readFileSync('/etc/letsencrypt/live/us.meething.space/cert.pem') : false,
    key: process.env.SSLKEY ? fs.readFileSync('/etc/letsencrypt/live/us.meething.space/privkey.pem') : false,
};


(async () => {

  var serverOptions = {
    rtcMinPort: 20000,
    rtcMaxPort: 29999
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
    httpServer.listen(2345, "0.0.0.0", resolve);
  });

  const wsServer = new WebSocketServer(httpServer);
  wsServer.on("connectionrequest", (info, accept) => {
    console.log(
      "protoo connection request [peerId:%s, address:%s, room:%s]",
      info.socket.remoteAddress,
      info.request.url
    );
    var roomId = info.request.url || 'lobby';
    if(roomId.substr(-1) === '/') {
        roomId = roomId.substr(0, str.length - 1);
    }
    if (lru.has(roomId)) {
	    var room = lru.get(roomId);
	    room.handlePeerConnect({
	      peerId: `p${String(Math.random()).slice(2)}`,
	      protooWebSocketTransport: accept()
	    });
            console.log("existing room stat", roomId, room.getStatus() );
    } else {
	    var room = new ConfRoom(router);
	    lru.set(roomId,room);
	    room.handlePeerConnect({
	      peerId: `p${String(Math.random()).slice(2)}`,
	      protooWebSocketTransport: accept()
	    });
            console.log("new room stat", roomId, room.getStatus() );
    }

  });

  console.log("MediaSoup server started on wss://0.0.0.0:2345");

})();
