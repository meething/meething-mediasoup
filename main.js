const http = require("https");
const { WebSocketServer } = require("protoo-server");
const mediasoup = require("mediasoup");
const ConfRoom = require("./lib/Room");
const fs = require('fs');

// LRU with last used sockets
const QuickLRU = require("quick-lru");
const lru = new QuickLRU({ maxSize: 10, onEviction: false });

const path = require('path')
var options = {
    cert: fs.readFileSync('/etc/letsencrypt/live/meething.hepic.tel/cert.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/meething.hepic.tel/privkey.pem'),
}
const fastify = require('fastify')({https: options})
const fStatic = require('fastify-static');

(async () => {
  const worker = await mediasoup.createWorker({
    rtcMinPort: 10000,
    rtcMaxPort: 10100
  });

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

  fastify.register(fStatic, {
    root: path.join(__dirname, 'public/dist'),
    prefix: '/', // optional: default '/'
  })
  fastify.listen(1234, '0.0.0.0', err => {
    if (err) throw err
  });

  const wsServer = new WebSocketServer(httpServer);
  wsServer.on("connectionrequest", (info, accept) => {
    console.log(
      "protoo connection request [peerId:%s, address:%s, origin:%s]",
      info.socket.remoteAddress,
      info.origin
    );
    console.log('SOCKET',info.request.url);
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

  console.log("websocket server started on https://0.0.0.0:2345");
  // setInterval(() => console.log("room stat", room.getStatus()), 1000 * 5);
})();
