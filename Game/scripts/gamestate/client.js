var socket = io();
socket.emit('serverNewConnection');

// References to the gameobject and the player associated with this client
var gameobject = null;
var player = 'uninitialized';

var imagesLoaded = false;
// Successfully connected to the server
socket.on('newConnection', function(msg) {
	var go = msg.gameobject;
	gameobject = new Gameobject();

	for (var i = 0; i < go.players.length; i++) {
		var p = copyPlayer(go.players[i]);
		if (p.ID == msg.player.ID)
			player = p;
		gameobject.players.push(p);
		for (var j = 0; j < p.units.length; j++)
			gameobject.units.push(p.units[j]);
		for (var j = 0; j < p.buildings.length; j++)
			gameobject.buildings.push(p.buildings[j]);
	}

	gameobject.nextPlayerID = go.nextPlayerID;
	
	
	serverLoaded = true;
	if (imagesLoaded)
		begin(); // Start the game
});

// Another player has joined the game
socket.on('newPlayer', function(msg) {
	gameobject.players.push(copyPlayer(msg));
});

// Process the changes to the game object coming from the server
socket.on('gameUpdate', function(msg) {
	for (var i = 0; i < msg.length; i++) {
		if (msg[i].from == player.ID)
			continue;
		if (gameobject == null)
			continue;
		
		switch(msg[i].type) {
		case 'newDestination':
			var u = gameobject.getUnit(msg[i].from, msg[i].unit);
			if (u != null)
				u.destination = msg[i].destination;
			break;
		case 'healthChanged':
			if (msg[i].to.isUnit) {
				var u = gameobject.getUnit(msg[i].to.playerID, msg[i].to.ID);
				if (u != null) {
					u.changeHealth(msg[i].amt);
					if (u.toDestroy && !u.rewardClaimed) {
						var p = gameobject.getPlayer(msg[i].from.playerID);
						p.gold += u.reward;
						u.rewardClaimed = true;
					}
				}
			} else {
				var b = gameobject.getBuilding(msg[i].to.playerID, msg[i].to.ID);
				if (b != null) {
					b.changeHealth(msg[i].amt);
					if (b.toDestroy && !b.rewardClaimed) {
						var p = gameobject.getPlayer(msg[i].from.playerID);
						p.gold += b.reward;
						b.rewardClaimed = true;
					}
				}
			}
			break;
		case 'newUnit':
			var u = copyUnit(msg[i].unit);
			gameobject.getPlayer(msg[i].from).units.push(u);
			gameobject.units.push(u);
			break;
		case 'newBuilding':
			var b = copyBuilding(msg[i].building);
			gameobject.getPlayer(msg[i].from).buildings.push(b);
			gameobject.buildings.push(b);
			break;
		case 'deleteUnit':
			gameobject.deleteUnit(msg[i].playerID, msg[i].ID, true);
			break;
		case 'deleteBuilding':
			gameobject.deleteBuilding(msg[i].playerID, msg[i].ID, true);
			break;
		case 'deletePlayer':
			gameobject.deletePlayer(msg[i].playerID);
			break;
		case 'upgradeUnits':
			gameobject.upgradeUnits(msg[i].to, msg[i].upgrade, msg[i].value, true);
			break;
		case 'upgradeMines':
			gameobject.upgradeMines(msg[i].to, msg[i].upgrade, msg[i].value, true);
			break;
		case 'upgradeTowers':
			gameobject.upgradeTowers(msg[i].to, msg[i].upgrade, msg[i].value, true);
			break;
		case 'upgradeFortress':
			gameobject.upgradeFortress(msg[i].to, msg[i].upgrade, msg[i].value, true);
			break;
		}
	}
});
