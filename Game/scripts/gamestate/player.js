// A player. Each client is associated with a player
var Player = function(id) {
	this.ID = id;
	
	// Generate a random color for the player, and calculate the opposite color
	this.hue = Math.random() * 360;
	this.rgb = hsl2rgb(this.hue, 0.5, 0.5);
	this.rgb = {r: Math.floor(this.rgb.r),
				g: Math.floor(this.rgb.g),
				b: Math.floor(this.rgb.b)};
	this.rgbOpposite = {r: 255 - this.rgb.r,
						g: 255 - this.rgb.g,
						b: 255 - this.rgb.b};
	this.color = "rgb(" + this.rgb.r + "," + 
						  this.rgb.g + "," + 
						  this.rgb.b + ")";
	this.colorOpposite = "rgb(" + this.rgbOpposite.r + "," + 
								  this.rgbOpposite.g + "," + 
								  this.rgbOpposite.b + ")";
						
	this.toDestroy = false;
	
	this.units = [];
	this.nextUnitID = 0;
	this.maxUnits = 100000;
	
	this.buildings = [];
	this.nextBuildingID = 0;
	
	this.gold = 100;
	
	this.createUnit = function() {
		var u = new Unit(this.ID, this.nextUnitID);
		var cost = this.getUnitCost();

		if (this.units.length >= this.maxUnits || this.gold < cost)
			return null;

		this.units.push(u);
		this.nextUnitID += 1;
		this.gold -= cost;
		
		return u;
	};
	
	this.createBuilding = function(type) {
		var typeClass = Fortress;
		var cost = 0;
		if (type == 'tower') {
			typeClass = Tower;
			cost = this.getTowerCost();
		} else if (type == 'mine') {
			typeClass = Mine;
			cost = this.getMineCost();
		}
		
		var b = new typeClass(this.ID, this.nextBuildingID);
		if (this.gold < cost)
			return null;
		
		if (!gameobject.isServer) {
			if (type == 'tower') {
				b.maxHealth = towerMaxHealth;
				b.health = towerMaxHealth;
				b.damage = towerDamage;
				b.range = towerRange;
				b.attackSpeed = towerAttackSpeed;
			} else if (type == 'mine') {
				b.maxHealth = mineMaxHealth;
				b.health = mineMaxHealth;
				b.yield = mineYield;
			}
		}
		
		this.buildings.push(b);
		this.nextBuildingID += 1;
		this.gold -= cost;
		
		return b;
	};
	
	this.update = function(delta) {
		for (var i = 0; i < this.units.length; i++) {
			this.units[i].update(delta);
			if (gameobject.isServer && !this.units[i].toDestroy && this.units[i].regen != 0) {
				this.units[i].changeHealth(this.units[i].regen * delta);
				var to = {playerID: this.units[i].playerID, ID: this.units[i].ID, isUnit: true};
				gameobject.changes.push({type: 'healthChanged', from: -1, to: to, amt: this.units[i].regen * delta});
			}
		}
		for (var i = 0; i < this.buildings.length; i++) {
			var b = this.buildings[i];
			b.update(delta);
			if (gameobject.isServer && b.toDestroy && b.type == 'fortress') {
				this.toDestroy = true;	
			}
			if (gameobject.isServer && !b.toDestroy && b.regen != 0) {
				b.changeHealth(b.regen * delta);
				var to = {playerID: b.playerID, ID: b.ID, isUnit: false};
				gameobject.changes.push({type: 'healthChanged', from: -1, to: to, amt: b.regen * delta});
			}			
		}
		
		for (var i = 0; i < this.units.length; i++) {
			if (this.units[i].toDestroy) {
				gameobject.changes.push({type: 'deleteUnit', playerID: this.ID, ID:this.units[i].ID, from: this.ID});
				this.units.splice(i,1);
				i--;
			}
		}
		for (var i = 0; i < this.buildings.length; i++) {
			if (this.buildings[i].toDestroy) {
				gameobject.changes.push({type: 'deleteBuilding', playerID: this.ID, ID:this.buildings[i].ID, from: this.ID});
				this.buildings.splice(i,1);
				i--;
			}
		}
		
		var yield = 0;
		for (var i = 0; i < this.buildings.length; i++) {
			if (this.buildings[i].yield != undefined)
				yield += this.buildings[i].yield;
		}
		
		this.gold += 100*yield * delta;
	};
	
	this.getUnit = function(id) {
		for (var i = 0; i < this.units.length; i++) {
			if (this.units[i].ID == id)
				return this.units[i];
		}
		return null;
	};
	
	this.getBuilding = function(id) {
		for (var i = 0; i < this.buildings.length; i++) {
			if (this.buildings[i].ID == id)
				return this.buildings[i];
		}
		return null;
	};
	
	this.deleteUnit = function(id) {
		for (var i = 0; i < this.units.length; i++) {
			if (this.units[i].ID == id) {
				this.units[i].toDestroy = true;
				this.units.splice(i,1);
				return true;
			}
		}
		return false;
	};
	
	this.deleteBuilding = function(id) {
		for (var i = 0; i < this.buildings.length; i++) {
			if (this.buildings[i].ID == id) {
				this.buildings[i].toDestroy = true;
				this.buildings.splice(i,1);
				return true;
			}
		}
		return false;
	};
	
	this.getUnitCost = function() {
		return 10 + this.units.length * 10; 
	};
	
	this.getTowerCost = function() {
		return 20;
	};
	
	this.getMineCost = function() {
		var count = 0;
		for (var i = 0; i < this.buildings.length; i++) {
			if (this.buildings[i].type == 'mine')
				count++;
		}
		return 20 * Math.pow(1.1, count); // exponential cost to discourage spamming mines
	};
};