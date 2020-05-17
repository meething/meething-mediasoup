<img src="https://i.imgur.com/XS79fTC.png" width=200> <img  alt="mozilla-builders" src="https://user-images.githubusercontent.com/1423657/81992335-85346480-9643-11ea-8754-8275e98e06bc.png" width=100 />

### Meething MediaSoup

This is the awesome [mediasoup](https://mediasoup.org) multiroom server implementation for [meething](https://github.com/meething/meething) 

#### Why?
There are many servers like it, but this one provides transparent routing based on `wss` paths for room user isolation.

```
 const wsTransport = new WebSocket("wss://meething-mediasoup:2345/" + roomId, "protoo");
```

### Service
```
pm2 start meething-mediasoup.config.js
```

#### Credits

* [MediaSoup](https://mediasoup.org) its Authors get all the credit for the SFU magic and their help
  * Iñaki Baz Castillo [[website](https://inakibaz.me)|[github](https://github.com/ibc/)]
  * José Luis Millán [[github](https://github.com/jmillan/)]
* The Meething team for their enthusiasm and ideas
* [Mozilla Builders](https://builders.mozilla.community) program and its mentors for the guidance


