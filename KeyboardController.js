/*
Chromecast Receiver app for Achtung die Kurve! for Chromecast
KeyBoardController.js provides a way to test the game in a browser controlling it with a keyboard instead of throught Chromecast

Copyright (C) 2018  Hans Harmannij

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
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