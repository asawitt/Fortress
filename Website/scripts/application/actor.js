var Actor = function(){};

Actor.prototype = 
{
	update: function(delta) {},
	draw: function()
	{
		var posx = this.x * tileSize + this.y * tileSize/2.0;
		var posy = this.y * tileSize/4.0 * ator * 3.0;
		traceHex(posx, posy, tileSize);
		ctx.stroke();
	},
	interact: function(target) {},
	x: -1,
	y: -1,
	type: null,
	name: "Hex"
};

var actorBase = new Actor();
actorBase.copy = function(o)
{
	o.type = null;
	o.name = "Hex";
	o.draw = Actor.prototype.draw;
	o.update = Actor.prototype.update;
};

var actorMine = new Actor();
actorMine.copy = function(o) {
	actorBase.copy(o);
	o.type = "mine";
	o.draw = this.draw;
	o.update = this.update;
	o.resources = 10;
	o.done = false;
};
actorMine.draw = function() {
	var posx = this.x * tileSize + this.y * tileSize/2.0;
	var posy = this.y * tileSize/4.0 * ator * 3.0;
	traceHex(posx, posy, tileSize);
	ctx.fillStyle = "#0000FF";
	ctx.fill();
	ctx.fillStyle = "#FFFF00";
	ctx.fillText("Mine", posx-10, posy);
};
actorMine.update = function(delta) {
	if (this.resources <= 0)
		deleteObject(this);
};

