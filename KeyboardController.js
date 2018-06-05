function runController(players) {
	var player = registerPlayer();
	var player2 = registerPlayer();
	document.addEventListener("keydown", (event) => {
  		if(event.code == "ArrowLeft") {
  			player.steering = -1;
  			return false;
  		}
  		else if(event.code == "ArrowRight") {
  			player.steering = 1;
  			return false;
  		}
  		if(event.code == "KeyA") {
  			player2.steering = -1;
  			return false;
  		}
  		else if(event.code == "KeyD") {
  			player2.steering = 1;
  			return false;
  		}
  		else if(event.code == "Space") {
  			playerReady(player);
  			return false;
  		}
      else if(event.code == "KeyX") {
        playerReady(player2);
        return false;
      }
  		return true;
	});
	document.addEventListener("keyup", (event) => {
  		if(event.code == "ArrowLeft" || event.code == "ArrowRight") {
  			player.steering = 0;
  			return false;
  		}
  		if(event.code == "KeyA" || event.code == "KeyD") {
  			player2.steering = 0;
  			return false;
  		}
  		return true;
	});
}

function onGameStart() {}

function onGameEnd() {}