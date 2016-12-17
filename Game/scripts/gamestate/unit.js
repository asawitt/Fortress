// A unit owned by a player. Used for attacking enemies

var Unit = function(playerID, id) {

	this.playerID = playerID;
	this.ID = id;
	
	this.selected = false; 

	this.toDestroy = false;
	
	this.pos = {x: -1, y: -1};

	this.angle = 0;
	
	this.health = 50;
	this.regen = 1;
	
	this.reward = 3;
	this.rewardClaimed = false;
	
	this.destination = null;
	
	this.timeSinceLastAttack = 0;
	this.target = null;



	this.stats = [];
	this.stats[MAX_HEALTH] = Unit.upgradeVals[MAX_HEALTH];
	this.health = this.stats[MAX_HEALTH];
	this.stats[SPEED] = Unit.upgradeVals[SPEED];
	this.stats[ATTACK_SPEED] = Unit.upgradeVals[ATTACK_SPEED];
	this.stats[RANGE] = Unit.upgradeVals[RANGE];
	this.stats[DAMAGE] = Unit.upgradeVals[DAMAGE];

	this.upgradeStat = function(index, val){
		if (index == MAX_HEALTH)
			this.health += val - this.stats[MAX_HEALTH];

		this.stats[index] = val;
	}
	// Change the health of the unit by a certain amount
	this.changeHealth = function(amt) {
		this.health = Math.min(Math.max(this.health + amt, 0), this.stats[MAX_HEALTH]);
		if (this.health <= 0)
			this.toDestroy = true;
	};
	
	this.update = function(delta) {
		if (this.toDestroy)
			return;
		
		// Attacking
		this.timeSinceLastAttack += delta;
		
		var timeBetweenAttacks = 1.0 / this.stats[ATTACK_SPEED];
		if (this.timeSinceLastAttack > timeBetweenAttacks) {
		 	// Check if we need a new enemy
		 	if (this.target == null || this.target.toDestroy || 
				distanceSquared(this.pos, this.target.pos) > this.stats[RANGE]*this.stats[RANGE]) {
		 		this.target = gameobject.getClosestEnemy(this.pos, this.stats[RANGE], this.playerID);
			}
			
		 	if (this.target != null) {
		 		if (!this.destination){
		 			var dx = this.target.pos.x - this.pos.x;
					var dy = this.target.pos.y - this.pos.y;
		 			this.angle = ((this.target.pos.x < this.pos.x)? Math.PI : 0) + Math.atan(dy/dx);

		 		}
		 		if (gameobject.isServer) {
		 			this.target.changeHealth(-this.stats[DAMAGE]);
					var from = {playerID: this.playerID, ID: this.ID, isUnit: true};
					var to = {playerID: this.target.playerID, ID: this.target.ID, isUnit: this.target.angle != undefined};
					gameobject.changes.push({type: 'healthChanged', from: from, to: to, amt: -this.stats[DAMAGE]});
		 		} else {
		 			var rayX = (TILE_SIZE/4 - 4)*Math.cos(this.angle) + this.pos.x;
		 			var rayY = (TILE_SIZE/4 - 4)*Math.sin(this.angle) + this.pos.y;
		 			var ray = new Ray(this.playerID, {x: rayX, y: rayY}, {x: this.target.pos.x, y: this.target.pos.y});
		 			gameobject.addRay(ray);
		 		}
		 		this.timeSinceLastAttack = 0;
		 	}
		}
		
		// Moving
		if (this.destination != null) {
			var dx = this.destination.x - this.pos.x;
			var dy = this.destination.y - this.pos.y;
			
			var length = Math.sqrt(dx * dx + dy * dy); //distance between position and destination
			var distance = this.stats[SPEED] * delta; //distance travelled on this update

			this.angle = ((this.destination.x < this.pos.x)? Math.PI : 0) + Math.atan(dy/dx);
			if (length > distance) {
				dx *= distance / length;
				dy *= distance / length;

				this.pos.x += dx;
				this.pos.y += dy;

			} else {
				this.pos.x = this.destination.x;
				this.pos.y = this.destination.y;
				this.destination = null;
			}
		}
	};
};




//Static Upgrade Values for Unit Class
var MAX_HEALTH = Unit.MAX_HEALTH = 1; 
var SPEED = Unit.SPEED = 2; 
var ATTACK_SPEED = Unit.ATTACK_SPEED = 3; 
var RANGE = Unit.RANGE =  4 ; 
var DAMAGE = Unit.DAMAGE = 5;

Unit.numberOfUpgrades = 5;

Unit.upgradeStrings = [];
Unit.upgradeStrings[MAX_HEALTH] = "Max Health: ";
Unit.upgradeStrings[SPEED] = "Speed: ";
Unit.upgradeStrings[ATTACK_SPEED] = "Attack Speed: ";
Unit.upgradeStrings[RANGE] = "Range: ";
Unit.upgradeStrings[DAMAGE] = "Damage: ";

Unit.upgradeVals = [];
Unit.upgradeVals[MAX_HEALTH] = 50;
Unit.upgradeVals[SPEED] = 100;
Unit.upgradeVals[ATTACK_SPEED] = 1;
Unit.upgradeVals[RANGE] = 75;
Unit.upgradeVals[DAMAGE] = 1;

Unit.upgradeCosts = [];
Unit.upgradeCosts[MAX_HEALTH] = 25;
Unit.upgradeCosts[SPEED] = 25;
Unit.upgradeCosts[ATTACK_SPEED] = 25;
Unit.upgradeCosts[RANGE] = 25;
Unit.upgradeCosts[DAMAGE] = 25;

Unit.upgradeAmount = [];
Unit.upgradeAmount[MAX_HEALTH] = 25;
Unit.upgradeAmount[SPEED] = 10;
Unit.upgradeAmount[ATTACK_SPEED] = .2;
Unit.upgradeAmount[RANGE] = 15;
Unit.upgradeAmount[DAMAGE] = 1;

Unit.upgrade = function(num){
	Unit.upgradeVals[num] += Unit.upgradeAmount[num];
	Unit.upgradeCosts[num] = Math.floor(Unit.upgradeCosts[num] * 1.2);
}