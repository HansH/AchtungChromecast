const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();
const options = new cast.framework.CastReceiverOptions();
const CUSTOM_CHANNEL = 'urn:x-cast:nl.harmannij.achtungchromecast';

var currentMedia;
var loopMedia = true;

function sendMessage(message, senderId) {
	console.log("Sending message '" + message + "' to sender " + senderId);
	context.sendCustomMessage(CUSTOM_CHANNEL, senderId, message);
}

function loadMedia(media) {
	if(media == currentMedia && playerManager.getPlayerState() == cast.framework.messages.PlayerState.PLAYING)
		return;
	currentMedia = media;
	const loadRequestData = new cast.framework.messages.LoadRequestData();
	loadRequestData.media = new cast.framework.messages.MediaInformation();
	loadRequestData.media.contentId = media;
	loadRequestData.autoplay = true;
	playerManager.load(loadRequestData).then(
	    function() { console.log('Load succeed'); },
	    function(errorCode) { console.log('Error code: ' + errorCode); }
	);
}
function reloadMedia() {
	if(currentMedia)
		loadMedia(currentMedia);
}

function runController(players) {
	options.maxInactivity = 3600;

	context.addCustomMessageListener(CUSTOM_CHANNEL, function(customEvent) {

		if(customEvent.data == "Ready") {
			for(var i in waitingRoom) {
				if(waitingRoom[i].senderId == customEvent.senderId) {
					playerReady(waitingRoom[i]);
				}
			}
		}
		else if(customEvent.data == "Left") {
			for(var i in players){
				if(players[i].senderId == customEvent.senderId){
					players[i].steering = -1;
				}
			}
		}
		else if(customEvent.data == "Right") {
			for(var i in players){
				if(players[i].senderId == customEvent.senderId){
					players[i].steering = 1;
				}
			}			}
		else if(customEvent.data == "Released") {
			for(var i in players){
				if(players[i].senderId == customEvent.senderId){
					players[i].steering = 0;
				}
			}
		}
		else {
			console.log(customEvent);
		}
	});

	context.addEventListener(cast.framework.system.EventType.SENDER_CONNECTED, function(event){
		console.log(event);
		var player = registerPlayer();
		if(player) {
			player.senderId = event.senderId;
			setTimeout(function(){
				sendMessage(gameRunning ? "GameStarted" : "WaitingRoom", event.senderId);
				sendMessage({"name": player.name, "color": player.color}, event.senderId);
			}, 500);
		}
	});

	context.addEventListener(cast.framework.system.EventType.SENDER_DISCONNECTED, function(event){
		console.log(event);
		for(var i in waitingRoom) {
			if(waitingRoom[i].senderId == event.senderId) {
				unregisterPlayer(waitingRoom[i]);
			}
		}
	});

	context.start(options);

	playerManager.addEventListener(cast.framework.events.EventType.MEDIA_FINISHED, function(event){
		console.log(event);
		if(event.endedReason == cast.framework.events.EndedReason.END_OF_STREAM //Don't endlessly retry on error
			&& gameRunning && loopMedia) 
			reloadMedia();
	})

	loadMedia("dance.mp3");
}

function onGameStart() {
	sendMessage("GameStarted");
}

function onGameEnd() {
	sendMessage("WaitingRoom");
}