// A ray between two locations. To visualize an attack done by a unit or building to some target.
var Ray = function(playerID, start, end) {
	this.playerID = playerID;
	this.start = {x: start.x, y: start.y};
	this.end = {x: end.x, y: end.y};
	
	this.age = 0;
	this.lifespan = 0.05;
	this.toDestroy = false;
	
	this.update = function(delta) {
		this.age += delta;
		if (this.age > this.lifespan)
			this.toDestroy = true;
	}
}