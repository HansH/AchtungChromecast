/*
Chromecast Receiver app for Achtung die Kurve! for Chromecast
CastController.js takes care of the communication with the sender app

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
const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();
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

function checkSenders() {
	var senders = context.getSenders();
	for(var s in senders) {
		var sender =  senders[s];
		var found = false;
		for(var i = players.length; !found && i >= 0; i--) {
			var player = players[i];
			found = player.senderId == sender.senderId;
		}
		if(!found) {
			var player = registerPlayer();
			if(player) {
				player.senderId = sender.senderId;
				setTimeout(function(){
					sendMessage(gameRunning ? "GameStarted" : "WaitingRoom", sender.senderId);
					sendMessage({"name": player.name, "color": player.color}, sender.senderId);
				}, 500);
			}
		}
	}
	for(var p in players) {
		var player =  players[p];
		var found = false;
		for(var i = senders.length; !found && i >= 0; i--) {
			var sender = senders[i];
			found = player.senderId == sender.senderId;
		}
		if(!found) {
			unregisterPlayer(player);
		}
	}
}

function runController(players) {
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
		checkSenders();
	});

	context.addEventListener(cast.framework.system.EventType.SENDER_DISCONNECTED, function(event){
		console.log(event);
		checkSenders();
	});

	context.start();

	playerManager.addEventListener(cast.framework.events.EventType.MEDIA_FINISHED, function(event){
		console.log(event);
		if(event.endedReason == cast.framework.events.EndedReason.END_OF_STREAM //Don't endlessly retry on error
			&& gameRunning && loopMedia) 
			reloadMedia();
	})

	loadMedia("dance.mp3");
}

function onGameStart() {
	loadMedia("dance.mp3");
	sendMessage("GameStarted");
}

function onGameEnd() {
	sendMessage("WaitingRoom");
}