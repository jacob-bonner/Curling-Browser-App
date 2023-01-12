// Edited by: Jacob Bonner
// Last Edited: December 2022

function handleTimer() {

  // Handling stone collisions
  allStones.advance(iceSurface.getShootingArea())
  for (let stone1 of allStones.getCollection()) {
    for (let stone2 of allStones.getCollection()) {
      //check for possible collisions
      if ((stone1 !== stone2) && stone1.isTouching(stone2) && (stone1.isStoneMoving() || stone2.isStoneMoving())) setOfCollisions.addCollision(new Collision(stone1, stone2))
    }
  }

  // Removing old stone collisions
  setOfCollisions.removeOldCollisions()

  // Swapping the client's turn based on who just shot
  if(allStones.isAllStonesStopped()){
    if(!shootingQueue.isEmpty()) whosTurnIsIt = shootingQueue.front().getColour()
    score = iceSurface.getCurrentScore(allStones)
    enableShooting = true
  }

  // Changing who's turn it is based on who has hammer in the next end
  if(allStones.isAllStonesStopped() && shootingQueue.isEmpty()){
    whosTurnIsIt = hammer()
    score = iceSurface.getCurrentScore(allStones)
    enableShooting = true
  }

  // Drawing the canvas
  drawCanvas()
}

// This function returns what user should have hammer in the next end
function hammer() {

  // Giving the hammer to the visitor player
  if (score.home > score.visitor) {
    whoHasHammer = VISITOR_COLOUR
    return whosTurnIsIt = HOME_COLOUR

  // Giving the hammer to the home player
  } else if (score.home < score.visitor) {
    whoHasHammer = HOME_COLOUR
    return whosTurnIsIt = VISITOR_COLOUR

  // Deciding who gets hammer based on a tied end
  } else {
    if (whosTurnIsIt == HOME_COLOUR) {
      whoHasHammer = HOME_COLOUR
      return whosTurnIsIt = VISITOR_COLOUR
    } else {
      whoHasHammer = VISITOR_COLOUR
      return whosTurnIsIt = HOME_COLOUR
    }
  }
}