// A generic kind of building owned by a player. This should never get instantiated
var Building = function(playerID, id) {
	this.playerID = playerID;
	this.ID = id;
	
	this.update = function(delta) {};
	this.changeHealth = function(amt) {
		this.health = Math.min(Math.max(this.health + amt, 0), this.maxHealth);
		if (this.health <= 0) {
			this.toDestroy = true;
		}
	};
	
	this.maxHealth = 100,
	this.health = 100,
	this.regen = 1;
	
	this.reward = 8;
	
	this.hex = {x: -1, y: -1},
	this.pos = {x: -1, y: -1},
	this.toDestroy = false,
	this.type = 'building'
};

// A building that generates gold
var Mine = function(playerID, id) {
	Building.call(this, playerID, id);
	this.yield = 1;
	this.type = 'mine';
};

// A building that attacks nearby enemies
var Tower = function(playerID, id) {
	Building.call(this, playerID, id);
	this.type = 'tower';
	
	this.reward = 10;
	
	this.range = 150;
	this.damage = 5;
	this.attackSpeed = .2; // attacks per second
	this.timeSinceLastAttack = 0;
	this.target = null;
	this.update = function(delta) {
		if (this.toDestroy)
				return;
			
		this.timeSinceLastAttack += delta;
		
		var timeBetweenAttacks = 1.0 / this.attackSpeed;
		if (this.timeSinceLastAttack > timeBetweenAttacks) {
			// Check if we need a new enemy
			if (this.target == null || this.target.toDestroy || 
				distanceSquared(this.pos, this.target.pos) > this.range * this.range)
				this.target = gameobject.getClosestEnemy(this.pos, this.range, this.playerID);
			
			if (this.target != null) {
				if (gameobject.isServer) {
					this.target.changeHealth(-this.damage);
					var from = {playerID: this.playerID, ID: this.ID, isUnit: false};
					var to = {playerID: this.target.playerID, ID: this.target.ID, isUnit: this.target.angle != undefined};
					
					gameobject.changes.push({type: 'healthChanged', from: from, to: to, amt: -this.damage});
				} else {
					var ray = new Ray(this.playerID, {x: this.pos.x, y: this.pos.y}, {x: this.target.pos.x, y: this.target.pos.y});
					gameobject.addRay(ray);
				}
				this.timeSinceLastAttack = 0;
			}
		}
	};
};

// The main building of a player. The player loses if this building is destroyed
var Fortress = function(playerID, id) {
	Building.call(this, playerID, id);
	// Tower.call(this, playerID, id); //Building acts as a tower
	this.type = 'fortress';
	this.yield = 1;
	// this.damage = 10;
	// this.attackSpeed = 1; 
	// this.range = 200;
	this.maxHealth = 300;
	this.health = 300;
	this.reward = 100;
};