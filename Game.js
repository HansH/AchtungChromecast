const gameArea = document.getElementById("game_area");
const scoreboard = document.getElementById("scoreboard");
const winnerMessage = document.getElementById("winnerMessage");
const waitingRoomOverlay = document.getElementById("waitingRoomOverlay");
const newGameOrRoundSpan = document.getElementById("newGameOrRoundSpan");
const ctx = gameArea.getContext("2d");
const FPS = 30;
const PLAYER_SPEED = 0.05;
const PLAYER_STEERING_SPEED = 0.003;
const AREA_WIDTH = 500;
const AREA_HEIGHT = 250;
const LINE_WIDTH = 5;
const LINE_WIDTH_SQR = LINE_WIDTH * LINE_WIDTH;
const BIN_SIZE = 25;
const NUM_BINS_W = AREA_WIDTH / BIN_SIZE;
const NUM_BINS_H = AREA_HEIGHT / BIN_SIZE;
const CLEAR_LIMIT = 50;
const MIN_GAP_TIME = 2500;
const MAX_GAP_TIME = 7500;
const GAP_DURATION = 400;
const GOAL = 5;

//var colors = ["Yellow", "Red", "Cyan", "Lime", "HotPink", "LightGrey"];
var colors = ["#FFFF00", "#FF0000", "#00FFFF", "#00FF00", "#FF69B4", "#D3D3D3"];
var colorNames = ["Yellow", "Red", "Blue", "Green", "Pink", "Gray"];
var numAlive;
var generation = 0;
var gameRunning = false;
var resetScore = false;

var bins = new Array(NUM_BINS_W * NUM_BINS_H);
bins.fill([]);

function crossProduct(x1, y1, x2, y2) {
    return x1 * y2 - x2 * y1;
}


function Line(x1, y1, x2, y2, playerId) {
	this.x1 = x1;
	this.y1 = y1;
	this.x2 = x2;
	this.y2 = y2;

	var dx = x2-x1;
	var dy = y2-y1;
	this.length = Math.sqrt(dx*dx+dy*dy);

	dy = Math.abs(dy * LINE_WIDTH / 2 / this.length);
	dx = Math.abs(dx * LINE_WIDTH / 2 / this.length);
	this.minX = Math.min(x1, x2) - dy;
	this.minY = Math.min(y1, y2) - dx;
	this.maxX = Math.max(x1, x2) + dy;
	this.maxY = Math.max(y1, y2) + dx;

	this.playerId = playerId;
	this.generation = generation;


	this.boundingBoxesIntersect = function(other) {
		return this.minX <= other.maxX
    		&& this.maxX >= other.minX
    		&& this.minY <= other.maxY
    		&& this.maxY >= other.minY;
	}

	this.isPointOnLine = function(x, y) {
        return Math.abs(crossProduct(this.x2 - this.x1, this.y2 - this.y1, x - this.x1, y - this.y1)) < LINE_WIDTH*this.length;
    }

    this.isPointRightOfLine = function(x, y) {
    	return crossProduct(this.x2 - this.x1, this.y2 - this.y1, x - this.x1, y - this.y1) < 0;
    }

    this.touchesOrCrossesLine = function(other) {
        return this.isPointOnLine(other.x1, other.y1)
                || this.isPointOnLine(other.x2, other.y2)
                || (this.isPointRightOfLine(other.x1, other.y1) ^ this.isPointRightOfLine(other.x2, other.y2));
    }

	this.intersects = function(other) {
	    return this.boundingBoxesIntersect(other)
        	&& this.touchesOrCrossesLine(other)
        	&& other.touchesOrCrossesLine(this);
	}
}

function Player(color, name, playerId) {
	this.reset = function() {
		this.x = Math.random() * AREA_WIDTH;
		this.y = Math.random() * AREA_HEIGHT;
		var minDirection = 0; // times PI
		var maxDirection = 2; // times PI
		if(this.x < CLEAR_LIMIT) {
			minDirection = -0.5;
			maxDirection = 0.5;
		}
		else if(this.x > CLEAR_LIMIT) {
			minDirection = 0.5;
			maxDirection = 1.5;
		}
		if(this.y < CLEAR_LIMIT) {
			minDirection = Math.max(minDirection, 0);
			maxDirection = Math.min(maxDirection, 1);
		}
		else if(this.y > CLEAR_LIMIT) {
			if(minDirection == -0.5) {
				maxDirection = 0;
			}
			else {
				minDirection = 1;
				maxDirection = Math.min(maxDirection, 2);
			}
		}
		this.direction = (Math.random() * (maxDirection - minDirection) + minDirection) * Math.PI;
		this.steering = 0;
		this.alive = true;
		this.path = new Path2D();
		this.path.moveTo(this.x, this.y);
		this.ready = false;
		this.nextGap = Math.random() * (MAX_GAP_TIME - MIN_GAP_TIME) + MIN_GAP_TIME;
		this.gapDurationLeft = GAP_DURATION;
	}
	this.reset();

	this.color = color;
	this.name = name;
	this.playerId = playerId;
	this.points = 0;

	this.die = function() {
		if(this.alive) {
			this.alive = false;
			numAlive--;
		}
	}
	

	this.update = function(elapsedTime) {
		this.direction += elapsedTime * this.steering * PLAYER_STEERING_SPEED;
		this.direction %= Math.PI * 2;

		var dx = Math.cos(this.direction) * PLAYER_SPEED * elapsedTime;
		var dy = Math.sin(this.direction) * PLAYER_SPEED * elapsedTime;

			var oldX = this.x;
			var oldY = this.y;

		this.x += dx;
		this.y += dy;

		this.nextGap -= elapsedTime;
		if(this.nextGap <= 0) {
			this.gapDurationLeft -= elapsedTime;
			if(this.gapDurationLeft <= 0) {
				this.gapDurationLeft = GAP_DURATION;
				this.nextGap = Math.random() * (MAX_GAP_TIME - MIN_GAP_TIME) + MIN_GAP_TIME;
			}
			else {
				this.path.moveTo(this.x, this.y);
				return;
			}
		}

		this.path.lineTo(this.x, this.y);

		var newLine = new Line(oldX, oldY, this.x, this.y, this.playerId);

		if(newLine.minX < 0 || newLine.maxX > AREA_WIDTH || newLine.minY < 0 || newLine.maxY > AREA_HEIGHT) {
			this.die();
		}

		var minBinX = Math.max(0, Math.floor(newLine.minX / BIN_SIZE));
		var minBinY = Math.max(0, Math.floor(newLine.minY / BIN_SIZE));
		var maxBinX = Math.min(NUM_BINS_W - 1, Math.floor(newLine.maxX / BIN_SIZE));
		var maxBinY = Math.min(NUM_BINS_H - 1, Math.floor(newLine.maxY / BIN_SIZE));

		for(var binX = minBinX; binX <= maxBinX; binX++) {
			for(var binY = minBinY; binY <= maxBinY; binY++) {
				var lines = bins[binY * NUM_BINS_W + binX];
				if(this.alive) {
	        		for(var i in lines) {
	        			var line = lines[i];
	        			if((line.playerId != this.playerId || generation - line.generation > 50) && line.intersects(newLine)) {
        					this.die();
        					break;
	        			}
	        		}
	        	}
        		lines.push(newLine);
        	}
		}
	}
}

var waitingRoom = [];
var players = [];

function updateScoreboard() {
	var scoreboardHTML = '<div style="font-size: xx-large;">Goal: ' + GOAL + '</div>';
	for(var i in waitingRoom) {
		scoreboardHTML += '<div style="color: ' + waitingRoom[i].color + ';">';
		if(waitingRoom[i].ready)
			scoreboardHTML += '&#x25cf;';
		else
			scoreboardHTML += '&#x25cb;';
		scoreboardHTML += waitingRoom[i].name + ': ' + waitingRoom[i].points + '</div>';
	}
	scoreboard.innerHTML = scoreboardHTML;
}

function registerPlayer() {
	if(colors.length > 0){
		var colorIndex = Math.floor(Math.random() * colors.length);
		var player = new Player(colors[colorIndex], colorNames[colorIndex], waitingRoom.length);
		colors.splice(colorIndex, 1);
		colorNames.splice(colorIndex, 1);
		waitingRoom.push(player);
		updateScoreboard();
		return player;
	}
	else {
		return false;
	}
}

function unregisterPlayer(player) {
	colors.push(player.color);
	colorNames.push(player.name);
	waitingRoom.splice(player.playerId, 1);
	updateScoreboard();
}

function playerReady(player) {
	if(!gameRunning) {
		player.ready = true;
		var allReady = true;
		for(var i = 0; allReady && i < waitingRoom.length; i++) {
			allReady &= waitingRoom[i].ready;
		}
		if(allReady && waitingRoom.length > 1) {
			prestartGame();
		}
		updateScoreboard();
	}
}

runController(waitingRoom);

ctx.lineWidth = LINE_WIDTH;
ctx.lineCap = "square";

function endGame() {
	var winner = null;
	for(var i in players) {
		if(players[i].alive) {
			players[i].points++;
			if(players[i].points >= GOAL) {
				winner = players[i];
			}
		}
		
		players[i].reset();
	}

	updateScoreboard();
	gameRunning = false;
	onGameEnd();

	if(winner != null) {
		winnerMessage.style.color = winner.color;
		winnerMessage.innerHTML = "Game Over.<br>"  + winner.name + " wins!";
		resetScore = true;
		newGameOrRoundSpan.innerHTML = "a new game";
	}
	else {
		winnerMessage.innerHTML = "";
		newGameOrRoundSpan.innerHTML = "the next round";
	}

	waitingRoomOverlay.style.display = "block";
}

function prestartGame() {
	gameRunning = true;
	waitingRoomOverlay.style.display = "none";

	players = waitingRoom.slice();
	if(resetScore) {
		for(var i in players) {
			players[i].points = 0;
		}
		resetScore = false;
	}
	updateScoreboard();


	numAlive = players.length;
	winnerMessage.innerHTML = "";
	generation = 0;

	bins = new Array(NUM_BINS_W * NUM_BINS_H);
	bins.fill([]);

	ctx.clearRect(0, 0, AREA_WIDTH, AREA_HEIGHT);

	for(var i in players) {
		players[i].update(100);
		ctx.strokeStyle = players[i].color;
		ctx.stroke(players[i].path);
	}

	onGameStart();

	setTimeout(startGame, 1500);
}

function startGame() {
	var previousTime = performance.now();
	var interval = setInterval(function() {
		var currentTime = performance.now();
		var elapsedTime = currentTime - previousTime;
		previousTime = currentTime;

		for(var i in players) {
			var player = players[i];
			if(player.alive) {
				player.update(elapsedTime);
				if(numAlive <= 1) {
					clearInterval(interval);
					endGame();
					return;
				}
			}
		}

		ctx.clearRect(0, 0, AREA_WIDTH, AREA_HEIGHT);

		for(var i in players) {
			ctx.strokeStyle = players[i].color;
			ctx.stroke(players[i].path);
		}

		generation++;
	}, 1000 / FPS);
}