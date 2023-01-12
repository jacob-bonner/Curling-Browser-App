// Edited by: Jacob Bonner
// Last Edited: December 2022

function handleJoinAsHomeButton(){
  // Setting the client's choice of role to the home player
  hasRole = true
  console.log(`handleJoinAsHomeButton()`)
  let btn = document.getElementById("JoinAsHomeButton")
  btn.disabled = true //disable button
  btn.style.backgroundColor="lightgray"

  // Updating client role information and sending the information to the server
  let role = {}
  if(!isHomePlayerAssigned){
    role.role = "home"
    isHomePlayerAssigned = true
    isHomeClient = true
  }
  let travelObj = JSON.stringify(role)
  socket.emit('roleChosen', travelObj)
}

function handleJoinAsVisitorButton(){
  // Setting the client's choice of role to the visitor player
  hasRole = true
  console.log(`handleJoinAsVisitorButton()`)
  let btn = document.getElementById("JoinAsVisitorButton")
  btn.disabled = true //disable button
  btn.style.backgroundColor="lightgray"

  // Updating client role information and sending the information to the server
  let role = {}
  if(!isVisitorPlayerAssigned) {
    role.role = "visitor"
    isVisitorPlayerAssigned = true
    isVisitorClient = true
  }
  let travelObj = JSON.stringify(role)
  socket.emit('roleChosen', travelObj)
}

function handleJoinAsSpectatorButton(){
  // Setting the client's choice of role to a spectator
  hasRole = true
  isSpectatorClient = true;
  console.log(`handleJoinAsSpectatorButton()`)
  let btn = document.getElementById("JoinAsSpectatorButton")
  btn.disabled = true //disable button
  btn.style.backgroundColor="lightgray"
}

// Locking out buttons of roles the client should not be able to select
socket.on('lockOut', function(role, fullLock) {

  // Parsing server data
  dataObj = JSON.parse(role)
  data = dataObj.role

  // Locking out the visitor button
  if (data === "visitor") {
    let btn = document.getElementById("JoinAsVisitorButton")
    btn.disabled = true //disable button
    btn.style.backgroundColor="lightgray"

    if (isVisitorClient == true) {
      let firstBtn = document.getElementById("JoinAsHomeButton")
      let secondBtn = document.getElementById("JoinAsSpectatorButton")
      if (fullLock == true) {
        firstBtn.disabled = true //disable button
        firstBtn.style.backgroundColor="lightgray"
      }
      secondBtn.disabled = true //disable button
      secondBtn.style.backgroundColor="lightgray"
    }
    isSpectatorClient = false;

  // Locking out the home button
  } else if (data === "home") {
    let btn = document.getElementById("JoinAsHomeButton")
    btn.disabled = true //disable button
    btn.style.backgroundColor="lightgray"

    if (isHomeClient == true) {
      let firstBtn = document.getElementById("JoinAsVisitorButton")
      let secondBtn = document.getElementById("JoinAsSpectatorButton")
      if (fullLock == true) {
        firstBtn.disabled = true //disable button
        firstBtn.style.backgroundColor="lightgray"
      }
      secondBtn.disabled = true //disable button
      secondBtn.style.backgroundColor="lightgray"
    }
    isSpectatorClient = false;

  // Locking out the spectator button
  } else if (data === "spectator") {
    let btn = document.getElementById("JoinAsSpectatorButton")
    btn.disabled = true //disable button
    btn.style.backgroundColor="lightgray"
  }
})

// Updating button information when clients disconnect
socket.on('updateButton', function(role) {

  // Parsing server data
  data = JSON.parse(role)
  console.log(data)

  // Re-enabling visitor button
  if (data.visitor == false) {
    let btn = document.getElementById("JoinAsVisitorButton")
    btn.disabled = false //re-enable button
    btn.style.backgroundColor=VISITOR_PROMPT_COLOUR

  }

  // Re-enabling home button
  if (data.home == false) {
    let btn = document.getElementById("JoinAsHomeButton")
    btn.disabled = false //re-enable button
    btn.style.backgroundColor=HOME_PROMPT_COLOUR
  }
})