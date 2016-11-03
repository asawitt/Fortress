var tileSize = 50;
var ator = 2.0 / Math.sqrt(3);
var minZoom = 0.4;
var maxZoom = 3;
var maxPan = 1000;
var panSpeed = 1;
var panDistance = 30;
var rightUIWidth = 200;

//Variables
var selectedHex = null;
var selected = null;
var mouseover = new vector();
var zoom = 1;
var panX = 0, panY = 0;
var mousePos = new vector(200, 200);
var mouseInWindow = false;
var objects = [];
var objectCounter = 0;
var map = null;
var resources = 0;

var imgActivator = new Image();
imgActivator.onload = function() {thread();};
imgActivator.src = "images/block16.png";

var Game = function() {};
Game.prototype = new State();

Game.prototype.init = function() 
{
	map = [];
	for(var i = 0; i < 30; i++)
	{
		for(var j = 0; j < 30; j++)
		{
			var o = new Actor();
			o.x = i;
			o.y = j;
			addHexToMap(o);
		}
	}
	objects = [];
};

Game.prototype.update = function(delta)
{
	if(selected != null && selected.type == null)
		selected = null;
	if(mouseInWindow)
	{
		if (mousePos.x < panDistance)
	    	panX = Math.min(panX + delta * panSpeed, maxPan);
	    if (mousePos.x > ctx.canvas.width - rightUIWidth - panDistance)
	    	panX = Math.max(panX - delta * panSpeed, -maxPan);
	    if (mousePos.y < panDistance)
	    	panY = Math.min(panY + delta * panSpeed, maxPan);
	    if (mousePos.y > ctx.canvas.height - panDistance)
	    	panY = Math.max(panY - delta * panSpeed, -maxPan);
	}
	for (var x = 0; x < map.length; x++) 
	{
		if (map[x] == undefined)
			continue;
		for (var y = 0; y < map[x].length; y++) 
		{
			if (map[x][y] != undefined)
				map[x][y].update(delta);
		}
	}
}

Game.prototype.draw = function()
{
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	canvas.width = canvas.width; //Clear screen
	ctx.save();
	ctx.translate(panX, panY);
	ctx.scale(zoom, zoom);

	var c = ctx.fillStyle;
    ctx.fillStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FF0000";
    for (var x = 0; x < map.length; x++) 
    {
    	if (map[x] == undefined)
    		continue;
    	for (var y = 0; y < map[x].length; y++) 
    	{
    		if (map[x][y] != undefined)
    			map[x][y].draw();
    	}
    }
    ctx.fillStyle = c;

    if(selectedHex != null)
    {
    	var posx = selectedHex.x * tileSize + selectedHex.y * tileSize/2.0;
		var posy = selectedHex.y * tileSize/4.0 * ator * 3.0;
		traceHex(posx, posy, tileSize);
		ctx.lineWidth = 4;
	    ctx.strokeStyle = "#00FFFF";
		ctx.stroke();
    }
    ctx.restore();
    var stats = 0;
    var target = 100;
    var spacing = 14;
    var right = canvas.width - rightUIWidth;
    var padding = 20;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(canvas.width - rightUIWidth, 0, rightUIWidth, canvas.height);
    ctx.fillStyle = "#000000";
    if (selected != null) 
    {
    	ctx.fillText("Selected: " + selected.name, right + padding, target);
    	if (selected.type == "mine") 
    	{
    		ctx.fillText("Resources: " + selected.resources.toFixed(2), right + padding, target + spacing);
    	}
    }
    ctx.fillText("Object count: " + objectCounter, right + padding, stats + spacing);
    ctx.fillText("Resources: " + resources.toFixed(2), right + padding, stats + 2 * spacing);
    if (selectedHex != null) 
    {
    	var o = getHex(selectedHex);
    	ctx.fillText("Pos: " + o.x + ", " + o.y, right + padding, target + 2*spacing);
    	ctx.fillText("NE: " + (o.NE==undefined? " ": o.NE.type) + "  E: " + (o.E==undefined? " ": o.E.type) + "  SE: " + (o.SE==undefined? " ": o.SE.type), right + padding, target + 3*spacing);
    	ctx.fillText("NW: " + (o.NW==undefined? " ": o.NW.type) + "  W: " + (o.W==undefined? " ": o.W.type) + "  SW: " + (o.SW==undefined? " ": o.SW.type), right + padding, target + 4*spacing);
    }
};

Game.prototype.mouseDown = function(event) 
{
	if (event.button == 0) {
		if (event.x < canvas.width - rightUIWidth) {
			select(mouseover);
		}
	} else if (event.button == 2) {
		if (selected != null && isHexValid(mouseover)) {
			var t = map[mouseover.x][mouseover.y];
			if (selected != t)
				selected.interact(t);
		}
	}
};

Game.prototype.mouseUp = function(event){};

Game.prototype.mouseMove = function(event)
{
	mousePos.x = event.x;
	mousePos.y = event.y;
	if (event.screenX < 7 || 
		event.screenY < 7 || event.screenY > window.screen.height - 7 ||
		event.x > 5 && event.x < canvas.width - rightUIWidth - 5 &&
		event.y > 5 && event.y < canvas.height - 5)
		mouseInWindow = true;
	else
		mouseInWindow = false;
	mouseover = getHexAtPos(canvasToGame(mousePos));
};

Game.prototype.mouseWheel = function(event) 
{
	var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
	if (delta == 1) 
	{
		zoom = Math.min(zoom * 1.1, maxZoom);
	} 
	else
		zoom = Math.max(zoom * 0.9, minZoom);
};

Game.prototype.mouseOut = function(event) 
{
	mouseInWindow = false;
};

Game.prototype.keyDown = function(event) {
	//console.log(event.keyCode);
	switch (event.keyCode) {
	case 46: //Delete
		deleteObject(selected);
		break;
	case 48: //0
		if (selectedHex != null) {
			var hex = mouseover;
			console.log("From " + selectedHex.x + "," + selectedHex.y + " to " + hex.x + "," + hex.y + " is " + 
						distance(selectedHex, hex));
		}
		break;
	case 49: //1
		if (isHexValid(mouseover)) {
			addObject(mouseover, actorMine);			
		}
		break;
	}
};


function addObject(v, t) 
{
	var added = map[v.x][v.y].type == null;
	t.copy(map[v.x][v.y]);
	map[v.x][v.y].name = map[v.x][v.y].type + " " + +Math.random().toFixed(4);
	
	if (added) {
		objectCounter++;
		objects.push(map[v.x][v.y]);
	}		
}

function select(v) 
{
	if (!isHexValid(v)) 
	{
		selectedHex = null;
		return;
	}
	if (selectedHex == null)
		selectedHex = new vector(v.x, v.y);
	else 
	{
		selectedHex.x = v.x;
		selectedHex.y = v.y;
	}
	selected = null;
	if (map[v.x][v.y].type != null)
		selected = map[v.x][v.y];
}

function canvasToGame(v) 
{
	return new vector((v.x - panX) / zoom, (v.y - panY) / zoom);
}

function getHexAtPos(v) 
{
	var x = v.x;
	var y = v.y;
	var width = tileSize;
	var height = tileSize/4.0 * ator * 3.0;
	x += width / 2.0;
	y += height * 2.0/3.0;
	
	//Determines the row and column of the "rectangle"
	var row = intRound(y/height);
	x -= row * width / 2.0;
	var column = intRound(x/width);
	
	//Adjusts if point is in one of the top corners of the "rectangle"
	x /= width;
	x -= column;
	y /= height;
	y -= row;
	if (y < 1.0/3.0 - x * 2.0/3.0)
		row--;
	if (y < x * 2.0/3.0 - 1.0/3.0) 
	{
		row--;
		column++;
	}
	
	return new vector(column, row);
}

function distance(v1, v2) 
{
	var z1 = -v1.x - v1.y;
	var z2 = -v2.x - v2.y;
	return (Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y) + Math.abs(z1 - z2))/2.0;
}

function isHexValid(v) 
{
	return map[v.x] != undefined && map[v.x][v.y] != undefined;
}

function traceHex(x, y, size) 
{
	ctx.beginPath();
	ctx.moveTo(x, y - size/2.0 * ator);
	ctx.lineTo(x + size/2.0, y - size/4.0 * ator);
	ctx.lineTo(x + size/2.0, y + size/4.0 * ator);
	ctx.lineTo(x, y + size/2.0 * ator);
	ctx.lineTo(x - size/2.0, y + size/4.0 * ator);
	ctx.lineTo(x - size/2.0, y - size/4.0 * ator);
	ctx.closePath();
}

function addHexToMap(v) 
{
	set(map, v.x, v.y, v);
	var o = getHex(new vector(v.x+1, v.y-1)); //NE
	if (o != undefined) 
	{
		o.SW = v;
		v.NE = o;
	}
	o = getHex(new vector(v.x+1, v.y)); //E
	if (o != undefined) 
	{
		o.W = v;
		v.E = o;
	}
	o = getHex(new vector(v.x, v.y+1)); //SE
	if (o != undefined) 
	{
		o.NW = v;
		v.SE = o;
	}
	o = getHex(new vector(v.x-1, v.y+1)); //SW
	if (o != undefined) 
	{
		o.NE = v;
		v.SW = o;
	}
	o = getHex(new vector(v.x-1, v.y)); //W
	if (o != undefined) 
	{
		o.E = v;
		v.W = o;
	}
	o = getHex(new vector(v.x, v.y-1)); //NW
	if (o != undefined) 
	{
		o.SE = v;
		v.NW = o;
	}
}

function intRound(x) 
{
	if (x < 0)
		x--;
	return ~~x;
}

function getHex(v) 
{
	if (map[v.x] != undefined)
		return map[v.x][v.y];
	return undefined;
}

function set(a, x, y, v) 
{
	if (a[x] == undefined) 
	{
		a[x] = [];
	}
	a[x][y] = v;
}

//Returns the next tile to walk onto
function pathFinding(pos, target) {
	if (!isHexValid(pos) || !isHexValid(target))
		return null;
	for (var i = 0; i < map.length; i++) {
		if (map[i] != undefined) {
			for (var j = 0; j < map[i].length; j++) {
				if (map[i][j] != undefined)
					map[i][j].pfstatus = 0;
			}
		}
	}
	var open = [];
	var closed = [];
	open.push({tile:pos, G:0, H:distance(pos, target), parent: null});
	var found = false;
	while (!found && open.length != 0) {
		var current = open.shift();
		for (var i = 0; i < open.length; i++) {
			var o = open.shift();
			if (current.G + current.H > o.G + o.H) {
				open.push(current);
				current = o;
			} else
				open.push(o);
		}
		closed.push(current);
		if (current.tile == target)
			found = true;
		
		var list = ["NE", "E", "SE", "SW", "W", "NW"];
		for (var j = 0; j < list.length; j++) {
			var e = list[j];
			if (current.tile[e] != undefined && (current.tile[e].type == null || current.tile[e] == target) && current.tile[e].pfstatus != 2) {
				if (current.tile[e].pfstatus == 0) {
					current.tile[e].pfstatus = 1;
					open.push({tile:current.tile[e], G:current.G + 1, H: distance(current.tile[e], target), parent: current});
				} else if (current.tile[e].pfstatus = 1) {
					var it = null;
					for (var i = 0; i < open.length; i++) {
						if (open[i] != undefined && open[i].tile == current.tile[e]) {
							it = open[i];
						}
					}
					if (it != null) {
						if (current.G + 1 < it.G) {
							it.parent = current;
							it.G = current.G + 1;
						}
					}
				}
			}
		}
		
	}
	if (found) {
		var c = null;
		for (var i = 0; i < closed.length; i++) {
			if (closed[i] != undefined) {
				c = closed[i];
				if (c.tile == target)
					break;
			}
		}
		var path = [];
		path.unshift(c);
		if (c.parent != null) {
			while (c.parent.tile != pos) {
				c = c.parent;
				path.unshift(c);
			}
		}
		return (c.tile == target && target.type != null)? null: c.tile;
	}
	return null;
}

function move(object, target) {
	if (target == null)
		return;
	if (object == selected) {
		selected = target;
		selectedHex.x = target.x;
		selectedHex.y = target.y;
	}
	var tmp = {};
	for (var p in object) {
		if (p == "x" || p == "y" || p == "NE" || p == "E" || p == "SE" || p == "SW" || p == "W" || p == "NW")
			continue;
		tmp[p] = object[p];
		object[p] = target[p];
	}
	for (var p in tmp) {
		if (p == "x" || p == "y" || p == "NE" || p == "E" || p == "SE" || p == "SW" || p == "W" || p == "NW")
			continue;
		target[p] = tmp[p];
	}
}

function deleteObject(target) {
	if (target != null) {
		for (var i = 0; i < objects.length; i++) {
			var o = objects.shift();
			if (target == o)
				break;
			objects.push(o);
		}
		actorBase.copy(target);
		objectCounter--;
	}
}

function nearest(object, type) {
	var closest = null;
	var dist = Number.MAX_VALUE;
	for (var i = 0; i < objects.length; i++) {
		var o = objects[i];
		if (o.type != type)
			continue;
		var newDist = distance(object, o);
		if (o != object && newDist < dist) {
			closest = o;
			dist = newDist;
		}
	}
	return closest;	
}












































