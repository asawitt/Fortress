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

	this.timeSinceLastAttack = 0;
	this.target = null;
	//Stats/Upgrading
	this.stats = [];
	this.stats[MAX_HEALTH] = Tower.upgradeVals[MAX_HEALTH];
	this.health = this.stats[MAX_HEALTH];
	this.stats[ATTACK_SPEED] = Tower.upgradeVals[ATTACK_SPEED];
	this.stats[RANGE] = Tower.upgradeVals[RANGE];
	this.stats[DAMAGE] = Tower.upgradeVals[DAMAGE];
	this.upgradeStat = function(index, val){
		if (index == MAX_HEALTH)
			this.health += val - this.stats[MAX_HEALTH];
		this.stats[index] = val;
	}


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


//Static Upgrade Values for Mine
var MAX_HEALTH = Mine.MAX_HEALTH = 1; 
var YIELD = Mine.YIELD = 2; 

Mine.numberOfUpgrades = 2;

Mine.upgradeStrings = [];
Mine.upgradeStrings[MAX_HEALTH] = "Max Health: ";
Mine.upgradeStrings[YIELD] = "Gold Production/Sec: ";

Mine.upgradeVals = [];
Mine.upgradeVals[MAX_HEALTH] = 100;
Mine.upgradeVals[YIELD] = 1;

Mine.upgradeCosts = [];
Mine.upgradeCosts[MAX_HEALTH] = 20;
Mine.upgradeCosts[YIELD] = 10;

Mine.upgradeAmount = [];
Mine.upgradeAmount[MAX_HEALTH] = 25;
Mine.upgradeAmount[YIELD] = .2;

Mine.upgrade = function(num){
	Mine.upgradeVals[num] += Mine.upgradeAmount[num];
	Mine.upgradeCosts[num] = Math.floor(Mine.upgradeCosts[num] * 1.3);
}

//Static Upgrade Values for Tower
var MAX_HEALTH = Tower.MAX_HEALTH = 1; 
var ATTACK_SPEED = Tower.ATTACK_SPEED = 2; 
var RANGE = Tower.RANGE =  3; 
var DAMAGE = Tower.DAMAGE = 4;

Tower.numberOfUpgrades = 4;

Tower.upgradeStrings = [];
Tower.upgradeStrings[MAX_HEALTH] = "Max Health: ";
Tower.upgradeStrings[ATTACK_SPEED] = "Attack Speed: ";
Tower.upgradeStrings[RANGE] = "Range: ";
Tower.upgradeStrings[DAMAGE] = "Damage: ";

Tower.upgradeVals = [];
Tower.upgradeVals[MAX_HEALTH] = 100;
Tower.upgradeVals[ATTACK_SPEED] = 1;
Tower.upgradeVals[RANGE] = 150;
Tower.upgradeVals[DAMAGE] = 5;

Tower.upgradeCosts = [];
Tower.upgradeCosts[MAX_HEALTH] = 20;
Tower.upgradeCosts[ATTACK_SPEED] = 20;
Tower.upgradeCosts[RANGE] = 20;
Tower.upgradeCosts[DAMAGE] = 20;

Tower.upgradeAmount = [];
Tower.upgradeAmount[MAX_HEALTH] = 25;
Tower.upgradeAmount[ATTACK_SPEED] = .2;
Tower.upgradeAmount[RANGE] = 15;
Tower.upgradeAmount[DAMAGE] = 5;

Tower.upgrade = function(num){
	Tower.upgradeVals[num] += Tower.upgradeAmount[num];
	Tower.upgradeCosts[num] = Math.floor(Tower.upgradeCosts[num] * 1.1);
}



//Static Upgrade Values for Fortress
var MAX_HEALTH = Fortress.MAX_HEALTH = 1; 
var ATTACK_SPEED = Fortress.ATTACK_SPEED = 2; 
var RANGE = Fortress.RANGE =  3; 
var DAMAGE = Fortress.DAMAGE = 4;

Fortress.numberOfUpgrades = 1;

Fortress.upgradeStrings = [];
Fortress.upgradeStrings[MAX_HEALTH] = "Max Health: ";
Fortress.upgradeStrings[ATTACK_SPEED] = "Attack Speed: ";
Fortress.upgradeStrings[RANGE] = "Range: ";
Fortress.upgradeStrings[DAMAGE] = "Damage: ";

Fortress.upgradeVals = [];
Fortress.upgradeVals[MAX_HEALTH] = 100;
Fortress.upgradeVals[ATTACK_SPEED] = 1;
Fortress.upgradeVals[RANGE] = 150;
Fortress.upgradeVals[DAMAGE] = 5;

Fortress.upgradeCosts = [];
Fortress.upgradeCosts[MAX_HEALTH] = 20;
Fortress.upgradeCosts[ATTACK_SPEED] = 20;
Fortress.upgradeCosts[RANGE] = 20;
Fortress.upgradeCosts[DAMAGE] = 20;

Fortress.upgradeAmount = [];
Fortress.upgradeAmount[MAX_HEALTH] = 25;
Fortress.upgradeAmount[ATTACK_SPEED] = .2;
Fortress.upgradeAmount[RANGE] = 15;
Fortress.upgradeAmount[DAMAGE] = 5;

Fortress.upgrade = function(num){
	Fortress.upgradeVals[num] += Fortress.upgradeAmount[num];
	Fortress.upgradeCosts[num] = Math.floor(Fortress.upgradeCosts[num] * 1.1);
}