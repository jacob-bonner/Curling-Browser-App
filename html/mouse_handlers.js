// Edited by: Jacob Bonner
// Last Edited: December 2022

function getCanvasMouseLocation(e) {
  //provide the mouse location relative to the upper left corner
  //of the canvas

  /*
  This code took some trial and error. If someone wants to write a
  nice tutorial on how mouse-locations work that would be great.
  */
  let rect = canvas.getBoundingClientRect()

  //account for amount the document scroll bars might be scrolled

  //get the scroll offset
  const element = document.getElementsByTagName("html")[0]
  let scrollOffsetX = element.scrollLeft
  let scrollOffsetY = element.scrollTop

  let canX = e.pageX - rect.left - scrollOffsetX
  let canY = e.pageY - rect.top - scrollOffsetY

  return {
    x: canX,
    y: canY
  }
}

// Initializing a cue object variable to display other player's shots
let cueObj = null;

// Creating a cue object to display other player's shots
socket.on('setCue', function(data) {

  // Parsing received cue data
  cueData = JSON.parse(data)

  // Setting the stone being shot
  stoneBeingShot = allStones.stoneAtLocation(cueData.x, cueData.y)
  if(stoneBeingShot === null){
    if(iceSurface.isInShootingCrosshairArea(cueData.location)){
      if(shootingQueue.isEmpty()) stageStones()
      stoneBeingShot = shootingQueue.front()
      stoneBeingShot.setLocation(cueData.location)
      //we clicked near the shooting crosshair
    }
  }

  // Actually initializing cue object
  cueObj = new Cue(cueData.x, cueData.y)
})

// Handling a mouse press
function handleMouseDown(e) {

  if(enableShooting === false) return //cannot shoot when stones are in motion
  if(!isClientFor(whosTurnIsIt)) return //only allow controlling client

  // Getting the mouse location
  let canvasMouseLoc = getCanvasMouseLocation(e)
  let canvasX = canvasMouseLoc.x
  let canvasY = canvasMouseLoc.y

  // Setting the stone currently being shot
  stoneBeingShot = allStones.stoneAtLocation(canvasX, canvasY)

  // Getting the bounds of the shooting area
  upperX = iceSurface.getShootingCrossHairArea().x + iceSurface.getShootingCrossHairArea().width
  lowerX = iceSurface.getShootingCrossHairArea().x
  upperY = iceSurface.getShootingCrossHairArea().y + iceSurface.getShootingCrossHairArea().height
  lowerY = iceSurface.getShootingCrossHairArea().y

  // Setting the stone being shot
  if(stoneBeingShot === null){
    if(iceSurface.isInShootingCrosshairArea(canvasMouseLoc)){
      if(shootingQueue.isEmpty()){
        stageStones()
      }
      stoneBeingShot = shootingQueue.front()
      stoneBeingShot.setLocation(canvasMouseLoc)
      //we clicked near the shooting crosshair
    }
  }

  // Checking if there is a stone being shot
  if (stoneBeingShot != null
      && (canvasX <= upperX && canvasX >= lowerX)
      && (canvasY <= upperY && canvasY >= lowerY)) {
    shootingCue = new Cue(canvasX, canvasY)
    document.getElementById('canvas1').addEventListener('mousemove', handleMouseMove)
    document.getElementById('canvas1').addEventListener('mouseup', handleMouseUp)

    // Sending cue information to other clients
    let sendCue = {}
    sendCue.location = canvasMouseLoc
    sendCue.x = canvasX
    sendCue.y = canvasY
    socket.emit('newCue', JSON.stringify(sendCue))

    // Updating server stone information
    let update = {}
    update.allStones = allStones
    update.turn = whosTurnIsIt
    update.shotsLeft = shootingQueue.collection.length
    socket.emit('updateInfo', JSON.stringify(update))
  }

  // Stop propagation of the event and stop any default
  //  browser action
  e.stopPropagation()
  e.preventDefault()

  // Drawing the canvas
  drawCanvas()
}

// Receiving cue aiming information from user shooting a stone
socket.on('watchCue', function(data) {

  // Parsing server data
  let cueData = JSON.parse(data)

  // Getting cue x and y positions from the data
  let canvasX = cueData.x
  let canvasY = cueData.y

  // Aiming the cue alongside the player taking the shot
  if (cueObj != null) {
    cueObj.setCueEnd(canvasX, canvasY)
  }

  // Drawing the canvas
  drawCanvas()
})

// Handling the client moving the mouse
function handleMouseMove(e) {

  // Parsing server informaton
  let cueData = {}
  cueData.mouse = e

  // Getting mouse information
  let canvasMouseLoc = getCanvasMouseLocation(e)
  let canvasX = canvasMouseLoc.x
  let canvasY = canvasMouseLoc.y

  // Setting the cue location information
  cueData.location = canvasMouseLoc
  cueData.x = canvasX
  cueData.y = canvasY

  // Setting the endpoints of the cue
  if (shootingCue != null) {
    shootingCue.setCueEnd(canvasX, canvasY)
  }

  // Drawing the canvas
  e.stopPropagation()
  drawCanvas()

  // Sending the server updated cue position information
  let data = JSON.stringify(cueData)
  socket.emit('aiming', data)
}

// Deleting the aiming cue once a player takes a shot
socket.on('delCue', function(data) {

  // Deleting the cue and showing the shot
  if (cueObj != null) {
    let cueVelocity = cueObj.getVelocity()
    if (stoneBeingShot != null) stoneBeingShot.addVelocity(cueVelocity)
    cueObj = null
    shootingQueue.dequeue()
    enableShooting = false //disable shooting until shot stone stops
  }
  cueObj = null

  drawCanvas() //redraw the canvas
})

// Handling lifting the mouse
function handleMouseUp(e) {
  e.stopPropagation()

  // Shooting the stone
  if (shootingCue != null) {
    let cueVelocity = shootingCue.getVelocity()
    if (stoneBeingShot != null) stoneBeingShot.addVelocity(cueVelocity)
    shootingCue = null
    shootingQueue.dequeue()
    enableShooting = false //disable shooting until shot stone stops

    // Updating server stone information
    let update = {}
    update.allStones = allStones
    update.turn = whosTurnIsIt
    update.shotsLeft = shootingQueue.collection.length
    socket.emit('updateInfo', JSON.stringify(update))
  }

  // Deleting the aiming cue on other clients' screens
  socket.emit('nilCue')
  console.log(shootingQueue)

  //remove mouse move and mouse up handlers but leave mouse down handler
  document.getElementById('canvas1').removeEventListener('mousemove', handleMouseMove)
  document.getElementById('canvas1').removeEventListener('mouseup', handleMouseUp)

  drawCanvas() //redraw the canvas
}
