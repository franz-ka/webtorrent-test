l=console.log

var Client = require('bittorrent-tracker')

var requiredOpts = {
  infoHash: 'e52e4965e02bd6eeaa5819cbe748858394d120c8', // hex string or Buffer
  peerId: new Buffer('01234567890123456789'), // hex string or Buffer
  announce: ['udp://localhost:6655'], // list of tracker server urls
  port: 6881 // torrent client port, (in browser, optional)
}

var optionalOpts = {
  getAnnounceOpts: function () {
    // Provide a callback that will be called whenever announce() is called
    // internally (on timer), or by the user
    return {
      uploaded: 0,
      downloaded: 0,
      left: 0,
      customParam: 'blah' // custom parameters supported
    }
  },
  // RTCPeerConnection config object (only used in browser)
  rtcConfig: {},
  // User-Agent header for http requests
  userAgent: '',
  // Custom webrtc impl, useful in node to specify [wrtc](https://npmjs.com/package/wrtc)
  wrtc: {},
}

var client = new Client(requiredOpts)

client.on('error', function (err) {
  // fatal client error!
  console.log('err',err.message)
})

client.on('warning', function (err) {
  // a tracker was unavailable or sent bad data to the client. you can probably ignore it
  console.log('warn',err.message)
})

// start getting peers from the tracker
client.start()
l('started')
client.on('update', function (data) {
  console.log('got an announce response from tracker: ' + data.announce)
  console.log('number of seeders in the swarm: ' + data.complete)
  console.log('number of leechers in the swarm: ' + data.incomplete)
})

client.once('peer', function (addr) {
  console.log('found a peer: ' + addr) // 85.10.239.191:48623
})

// announce that download has completed (and you are now a seeder)
client.complete()
l('completed')

setTimeout(function(){
	// force a tracker announce. will trigger more 'update' events and maybe more 'peer' events
	client.update()
	l('updated')

	// provide parameters to the tracker
	client.update({
	  uploaded: 0,
	  downloaded: 0,
	  left: 0,
	  customParam: 'blah' // custom parameters supported
	})

	// stop getting peers from the tracker, gracefully leave the swarm
	client.stop()
	l('stoped')

	// ungracefully leave the swarm (without sending final 'stop' message)
	client.destroy()

	// scrape
	client.scrape()

	client.on('scrape', function (data) {
	  console.log('got a scrape response from tracker: ' + data.announce)
	  console.log('number of seeders in the swarm: ' + data.complete)
	  console.log('number of leechers in the swarm: ' + data.incomplete)
	  console.log('number of total downloads of this torrent: ' + data.downloaded)
	})
},5000)
