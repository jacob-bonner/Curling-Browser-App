/*
COMP 2406 Server Base
(c) Louis D. Nel 2018

Edited by: Jacob Bonner
Last Edited: December 2022

Use browser to view pages at http://localhost:3000/curling.html
*/

//Server Code
const server = require('http').createServer(handler)
const io = require('socket.io')(server) //wrap server app in socket io capability
const fs = require('fs') //file system to server static files
const url = require('url'); //to parse url strings
const PORT = process.env.PORT || 3000 //useful if you want to specify port through environment variable

const ROOT_DIR = "html" //dir to serve static files from

const MIME_TYPES = {
  css: "text/css",
  gif: "image/gif",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript", //should really be application/javascript
  json: "application/json",
  png: "image/png",
  svg: "image/svg+xml",
  txt: "text/plain"
}

// Tracking if and what players are registered
let homeExists = false;
let visitorExists = false;

// Important information related to the stones
let setOfStones = null;
let turn = null;
let shots = 8;

function get_mime(filename) {
  //Get MIME type based on extension of requested file name
  //e.g. index.html --> text/html
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES["txt"]
}

server.listen(PORT) //start http server listening on PORT

// Handling server requests and responses
function handler(request, response) {
  //handler for http server requests
  let urlObj = url.parse(request.url, true, false)
  console.log('\n============================')
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  let filePath = ROOT_DIR + urlObj.pathname
  if (urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html'

  fs.readFile(filePath, function(err, data) {
    if (err) {
      //report error to console
      console.log('ERROR: ' + JSON.stringify(err))
      //respond with not found 404 to client
      response.writeHead(404);
      response.end(JSON.stringify(err))
      return
    }
    response.writeHead(200, {
      'Content-Type': get_mime(filePath)
    })
    response.end(data)
  })

}

//Socket Server
io.on('connection', function(socket) {

  // Sending info to a client upon connection to the server
  let connectInfo = {}
  connectInfo.home = homeExists
  connectInfo.visitor = visitorExists
  connectInfo.allStones = setOfStones
  connectInfo.turn = turn;
  connectInfo.shotsLeft = shots;
  let travelCon = JSON.stringify(connectInfo)
  io.emit('connected', travelCon)

  // Processing that a client is a particular role
  socket.on('roleChosen', function(role) {

    // Parsing data
    dataObj = JSON.parse(role)
    data = dataObj.role

    // Initializing variable for locking out buttons
    let fullLock = false;

    // Checking to see what player was selected
    if (data === "visitor") {
      visitorExists = true;
    } else if (data === "home") {
      homeExists = true;
    }

    // Checking to see if both player and visitor buttons should be locked out
    if (homeExists == true && visitorExists == true) {
      fullLock = true;
    }

    // Emitting information to lock out unselected roles for the clients
    io.emit('lockOut', role, fullLock)

  })

  // Processing that a stone shooting cue should be displayed to other clients
  socket.on('newCue', function(data) {

    // Emitting information to create the new cue for other clients
    socket.broadcast.emit('setCue', data)

  })

  // Processing the movement of the aiming cue to other clients
  socket.on('aiming', function(data) {

    // Emitting information to move the cue for other clients
    socket.broadcast.emit('watchCue', data)

  })

  // Processing the deletion of the aiming cue for other clients
  socket.on('nilCue', function() {

    // Emitting information to delete the aiming cue for other clients
    socket.broadcast.emit('delCue', data)

  })

  // Processing a request for stone information from the clients
  socket.on('getInfo', function() {

    // Checking if the set of stones as recorded by the server is null
    if (setOfStones !== null) {

      // Sending all server stone info to client
      let info = {}
      info.allStones = setOfStones
      info.turn = turn
      info.shotsLeft = shots;
      io.emit('returnInfo', JSON.stringify(info))
    } else {

      // Sending that the server has no stone info to share
      let info = {}
      info.skip = true
      io.emit('returnInfo', JSON.stringify(info))
    }
  })

  // Receiving updated stone info from the client
  socket.on('updateInfo', function(info) {

    // Updating stone information from received parsed data
    data = JSON.parse(info)
    setOfStones = data.allStones;
    turn = data.turn;
    shots = data.shotsLeft;
  })



  // Processing a client disconnecting
  socket.on("disconnect", function() {

    // Emitting for the client to send what role it is to the server
    homeExists = false
    visitorExists = false
    io.emit('sendRole')
  })
})

console.log("Server Running at PORT 3000  CNTL-C to quit")
console.log("To Test")
console.log("http://localhost:3000/curling.html")
