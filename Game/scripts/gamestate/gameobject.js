// An object that represents the state of the entire game
var Gameobject = function() {
	this.players = [];
	this.nextPlayerID = 0;
	
	this.units = [];
	this.buildings = [];
	
	this.rays = [];
	this.isServer = false;
	
	this.changes = []; // The changes to send to the server if this is a client, or the each client is this is the server
	this.timeSinceLastUpdate = 0;
	this.updatePause = 0.1; // The time to wait in between connections to the server
	
	// Create a new player
	this.createPlayer = function() {
		var player = new Player(this.nextPlayerID);
		this.players.push(player);
		this.nextPlayerID += 1;
		
		return player;
	};
	
	// Create a new unit
	this.createUnit = function(playerID) {
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].ID == playerID) {
				var u = this.players[i].createUnit();
				if (u != null) {
					this.units.push(u);
					this.changes.push({type: 'newUnit', from: playerID, unit: u});
				}
				return u;
			}
		}
	};
	
	// Create a new building
	this.createBuilding = function(playerID, type) {
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].ID == playerID) {
				var b = this.players[i].createBuilding(type);
				if (b != null) {
					this.buildings.push(b);
					this.changes.push({type: 'newBuilding', from: playerID, building: b});
				}
				return b;
			}
		}
		return null;
	};
	
	// Add a new ray
	this.addRay = function(ray) {
		this.rays.push(ray);
	};
	
	// Update the game object forward by 'delta' seconds
	this.update = function(delta) {
		for (var i = 0; i < this.players.length; i++)
			this.players[i].update(delta);
		
		for (var i = 0; i < this.rays.length; i++)
			this.rays[i].update(delta);
		
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].toDestroy) {
				if (this.isServer)
					this.deletePlayer(this.players[i].ID);
			}
		}
		
		for (var i = 0; i < this.rays.length; i++) {
			if (this.rays[i].toDestroy) {
				this.rays.splice(i,1);
				i--;
			}
		}
		
		for (var i = 0; i < this.units.length; i++) {
			if (this.units[i] == null || this.units[i].toDestroy) {
				this.units.splice(i,1);
				i--;
			}
		}
		
		for (var i = 0; i < this.buildings.length; i++) {
			if (this.buildings[i] == null || this.buildings[i].toDestroy) {
				this.buildings.splice(i,1);
				i--;
			}
		}
		
		// Check if the changes have to be sent through the network, and do so if necessary
		this.timeSinceLastUpdate += delta;
		if (this.timeSinceLastUpdate > this.updatePause && this.changes.length != 0) {
			this.timeSinceLastUpdate = 0;
			if (this.isServer) {
				for (var i = 0; i < this.players.length; i++) {
					sockets[this.players[i].socketID].emit('gameUpdate', this.changes);
				}
			} else {
				socket.emit('gameUpdate', this.changes);
			}
			this.changes = [];
		}
	};
	
	// Get the enemy closest to a certain location
	this.getClosestEnemy = function(pos, range, playerID) {
		var enemies = [];
		var distances = [];
		
		for (var i = 0; i < this.players.length; i++) {
			var p = this.players[i];
			if (p.ID == playerID)
				continue;
			
			for (var j = 0; j < p.units.length; j++) {
				var u = p.units[j];
				var dist = distanceSquared(u.pos, pos);
				if (dist < range * range) {
					enemies.push(u);
					distances.push(dist);
				}
			}
			
			for (var j = 0; j < p.buildings.length; j++) {
				var b = p.buildings[j];
				var dist = distanceSquared(b.pos, pos);
				if (dist < range * range) {
					enemies.push(b);
					distances.push(dist);
				}
			}
		}
		
		if (enemies.length == 0)
			return null;
		var min = range + 1;
		var minIndex = 0;
		// Find the closest of all the available enemies
		for (var i = 0; i < distances.length; i++) {
			if (distances[i] < min) {
				min = distances[i];
				minIndex = i;
			}
		}
		return enemies[minIndex];
	};
	
	// Get the player corresponding to this ID
	this.getPlayer = function(ID) {
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].ID == ID)
				return this.players[i];
		}
		return null;
	}
	
	// Get the unit corresponding to this ID
	this.getUnit = function(playerID, ID) {
		if (!this.getPlayer(playerID)) return; 
		return this.getPlayer(playerID).getUnit(ID);
	};
	
	// Get the building corresponding to this ID
	this.getBuilding = function(playerID, ID) {
		var p = this.getPlayer(playerID);
		if (p != null)
			return p.getBuilding(ID);
		return null;
	};
	
	// Delete the player corresponding to this ID
	this.deletePlayer = function(id) {
		if (!this.isServer && id == player.ID) {
			player.toDestroy = true;
			socket.emit('forceDisconnect');
		}
		var p = this.getPlayer(id);
		if (p == null)
			return false;
		
		for (var i = 0; i < this.rays; i++) {
			if (this.rays[i].playerID == id) {
				this.rays.splice(i,1);
				i--;
			}
		}
		
		var pUnits = [];
		for (var i = 0; i < p.units.length; i++)
			pUnits.push(p.units[i].ID);
		var pBuildings = [];
		for (var i = 0; i < p.buildings.length; i++)
			pBuildings.push(p.buildings[i].ID);
		
		for (var i = 0; i < pUnits.length; i++)
			this.deleteUnit(id, pUnits[i], false);
		for (var i = 0; i < pBuildings.length; i++)
			this.deleteBuilding(id, pBuildings[i], false);
		
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].ID == id) {
				if (this.isServer) {
					this.changes.push({type: 'deletePlayer', playerID: id, from: -1});
					sockets[this.players[i].socketID].emit('gameUpdate', this.changes);
				}
				this.players.splice(i, 1);
				return true;
			}
		}
		return false;
	};
	
	// Delete the unit corresponding to this ID
	this.deleteUnit = function(playerID, id, silent) {
		var p = this.getPlayer(playerID);
		if (p != null) {
			for (var i = 0; i < this.units.length; i++) {
				if (this.units[i].ID == id && this.units[i].playerID == playerID) {
					this.units[i].toDestroy = true;
					if (!silent) {
						var from = this.isServer? -1 : playerID;
						this.changes.push({type: 'deleteUnit', playerID: playerID, ID:id, from: from});
					}
					this.units.splice(i,1);
					return p.deleteUnit(id);
				}
			}
		}
		return false;
	};
	
	// Delete the building corresponding to this ID
	this.deleteBuilding = function(playerID, id, silent) {
		var p = this.getPlayer(playerID);
		if (p != null) {
			for (var i = 0; i < this.buildings.length; i++) {
				if (this.buildings[i].ID == id && this.buildings[i].playerID == playerID) {
					if (!silent) {
						var from = this.isServer? -1 : playerID;
						this.changes.push({type: 'deleteBuilding', playerID: playerID, ID:id, from: from});
					}
					this.buildings.splice(i,1);
					return p.deleteBuilding(id);
				}
			}
		}
		return false;
	};
	
	// Set a new destination for all the specified units
	this.setDestination = function(units, destination) {
		var n = Math.ceil(Math.sqrt(units.length));
		var areaSide = 20*Math.log(units.length) + 40;
		var distBetween = areaSide / n;
		
		var topx = destination.x - areaSide * 0.4;
		var topy = destination.y - areaSide * 0.4;
		
		for (var i = 0; i < units.length; i++) {
			var p = {x: topx + distBetween * (i % n),
					 y: topy + distBetween * Math.floor(i / n)};
			units[i].destination = p;
			this.changes.push({type: 'newDestination', unit: units[i].ID, from: units[i].playerID, destination: p});
		}
	};
	
	// Checks if a hex already has a building on it
	this.isHexFree = function(x, y) {
		for (var i = 0; i < this.buildings.length; i++) {
			var b = this.buildings[i];
			if (b.hex.x == x && b.hex.y == y)
				return false;
		}
		return true;
	};
	
	// Upgrade all the units of a player
	this.upgradeUnits = function(playerID, upgradeIndex, value, silent) {	
		this.getPlayer(playerID).units.forEach(function(u){
			u.upgradeStat(upgradeIndex, value);
		});
		if (!silent){
			var from = (this.isServer)? -1 : playerID;
			this.changes.push({type: 'upgradeUnits', from: from, to: playerID, upgrade: upgradeIndex, value: value});
		}
	};
	
	// Upgrade all the mines of a player
	this.upgradeMines = function(playerID, upgradeIndex, value, silent) {
		this.getPlayer(playerID).buildings.forEach(function(b){
			if (b.type == "Mine") //This should be switched to constant
				b.upgradeStat(upgradeIndex, value);
		});
		if (!silent){
			var from = (this.isServer)? -1 : playerID;
			this.changes.push({type: 'upgradeMines', from: from, to: playerID, upgrade: upgradeIndex, value: value});
		}
	};
	
	// Upgrade all the towers of a player
	this.upgradeTowers = function(playerID, upgradeIndex, value, silent) {
		this.getPlayer(playerID).buildings.forEach(function(b){
			if (b.type == "Tower") //This should be switched to constant
				b.upgradeStat(upgradeIndex, value);
		});
		if (!silent){
			var from = (this.isServer)? -1 : playerID;
			this.changes.push({type: 'upgradeTowers', from: from, to: playerID, upgrade: upgradeIndex, value: value});
		}
	};
	
	// Upgrade a player's fortress
	this.upgradeFortress = function(playerID, upgradeIndex, value, silent) {
		this.getPlayer(playerID).buildings.some(function(b){
			if (b.type == "Fortress"){ //This should be switched to constant
				b.upgradeStat(upgradeIndex, value);
				return true;
			}
			return false;
		});
		if (!silent){
			var from = (this.isServer)? -1 : playerID;
			this.changes.push({type: 'upgradeFortress', from: from, to: playerID, upgrade: upgradeIndex, value: value});
		}
	};
};
