<img src="https://i.imgur.com/XS79fTC.png" width=200> 

<img width="200" alt="mozilla-builders" src="https://user-images.githubusercontent.com/1423657/81992335-85346480-9643-11ea-8754-8275e98e06bc.png">


# Meething : MediaSoup

This is the awesome [mediasoup](https://mediasoup.org) multiroom server implementation for [meething](https://github.com/meething/meething) 

### Why?
There are many like it, but this one provides transparent routing based on `wss` paths for room insolation.

```
 const wsTransport = new WebSocket("wss://meething-mediasoup:2345/" + roomId, "protoo");
```

## Service
```
pm2 start --name mediasoup npm -- start
```
