// This file contains everything a client needs to know to actually play the game. 
// Draws each frame the elements present on screen, and allows the players to send commands to the game object.

// Can be modified
var TILE_SIZE = 64;
var ator = 2.0 / Math.sqrt(3); // Used when drawing hexagons
var MAP_SIZE = 20; if (MAP_SIZE % 2) MAP_SIZE += 1; //Not sure why necessary. 
var PAN_SPEED = 0.5;
var PAN_DISTANCE = 100;
var HUD_HEIGHT = 70;

//Can't be modified
var TILE_HEIGHT = TILE_SIZE * ator;
var MAP_WIDTH = MAP_SIZE * TILE_SIZE; 
var MAP_HEIGHT = MAP_SIZE * 3*TILE_HEIGHT/4;

var MAX_PAN_X = MAP_WIDTH - Math.floor((window.innerWidth/TILE_SIZE))*TILE_SIZE; 
var MAX_PAN_Y = MAP_HEIGHT - Math.floor((window.innerHeight/(TILE_HEIGHT*1.5))) * TILE_HEIGHT * 1.5;
var MIN_ZOOM = 1; 
var MAX_ZOOM = 1;

var selectedHex = null;
var zoom = 1;
var panX = 0, panY = 0;

var mousePos = {x: 200, y: 200};
var mouseInWindow = false;

var units = null;
var selectedUnits = [];

var tCtxs = {};
var sTCtxs = {};

var buildings = null;

var rays = null;

var map = [];
var resources = 0;

//variables to keep track of FPS
var frames = 0;
var FPS = 0;

var serverLoaded = false;
var imagesLoaded = false;

// Not in use currently
var unitUpgradeReady = false;
var mineUpgradeReady = false;
var towerUpgradeReady = false;
var fortressUpgradeReady = false;

var nextObject // The HUD click determines the next object-type to be created
var UNIT = 0; var MINE = 1; var TOWER = 2; var FORTRESS = 3;//Enums


/* UPGRADES */ 
var upgradeCost = 25;
//Mine
var mineMaxHealth = 100;
var mineMaxHealthLevel = 1;
var mineYield = 1;
var mineYieldLevel = 1;
//Tower
var towerMaxHealth = 100;
var towerMaxHealthLevel = 1;
var towerDamage = 5;
var towerDamageLevel = 1;
var towerRange = 150;
var towerRangeLevel = 1;
var towerAttackSpeed = 1;
var towerAttackSpeedLevel = 1;
//Fortress
var fortressMaxHealth = 500; 
var fortressMaxHealthLevel = 1;
var fortressDamage = 10;
var fortressDamageLevel = 1;
var fortressAttackSpeed = 1;
var fortressAttackSpeedLevel = 1;
var fortressRange = 200;
var fortressRangeLevel = 1;

var Game = function(){};

// Images of the buildings
var imgMine = new Image();
imgMine.src = 'images/mine.png'
imgDataMine = null;
var imgFortress = new Image();
imgFortress.src = 'images/fortress.png';
imgDataFortress = null;
var imgTower = new Image();
imgTower.src = 'images/towers.png';
imgTower.onload = function() {imagesLoaded = true; if (serverLoaded) begin();};
imgDataTower = null;

// Start the game
function begin() {
	units = gameobject.units;
	buildings = gameobject.buildings;
	rays = gameobject.rays;
	game.init();
	thread();	
}

Game.prototype.init = function() 
{
	//Sets canvas sizes
	setCanvasSizes();

	//Starts monitoring frame rate
	resetFPS();

	//Initializes our map variable
	initializeMap();

	//Draws the cached background
	makeHexCanvas();

	//Make the player's fortress
	makeFortress();
};

Game.prototype.update = function(delta)
{
	//for fps calculation
	frames += 1;

	//Removes any buildings which have been destroyed from our map
	destroyBuildings();
	
	//Old code from when we had a selectedHex
	// var o = (selectedHex)? getHex(selectedHex) : null;
	// if (o && o.toDestroy)
	// 	selectedHex = null;
};

Game.prototype.drawGameOver = function() {
	ctx.font = "100px Georgia";
    ctx.fillStyle = "#FFFFFF";	
    ctx.fillText("GAME OVER", 100, 300);
};


Game.prototype.draw = function()
{
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
    //Draw cached hex-background
    drawHexBackground();
   	//Draw all objects
    drawBuildings(); 
	drawUnits();
	drawRays();
	
	//Changes the size of the selection-box
    if (selecting) 
		updateSelection();

	//Draw the HUD across the bottom of the screen
	drawHUD();
};

Game.prototype.mouseDown = function(event) {
	if (event.button == 0) {
		if (mousePos.y > canvas.height - HUD_HEIGHT){
			if (selectedHUDElement != null) //Checks if the user clicked an upgrade button				
				checkForUpgradeRequests();

			HUDSelected(null);
		} else {
			startPanning(event);
		}
	} else if (event.button == 2) {
		nextObject = null;
		selectedHUDElement = null;
		if (!selectedUnits.length) startSelection(event);
	}
};

Game.prototype.mouseUp = function(event){
	if (event.button == 0) {
		if (stopPanning(event)){
			if (selectedUnits.length) unselectUnits();
			//If there's an object to be placed
			if (nextObject != null) {
				switch (nextObject){
					case UNIT:
						addUnit(localToGlobal(mousePos));
						break;
					case MINE:
						var hex = getHexAtLocalPos({x: mousePos.x, y: mousePos.y});
						addBuilding(hex, 'mine');
						break;
					case TOWER:
						var hex = getHexAtLocalPos({x: mousePos.x, y: mousePos.y});
						addBuilding(hex, 'tower');
						break;
					}
			} 
		}
		//Select units/selectedHex
		else if (event.x < canvas.width && event.y < canvas.height - HUD_HEIGHT) {
			var currentPoint = localToGlobal(event);
			//We only want to select a hex if it was a click, not a selection
			if (!selecting || (Math.abs(currentPoint.x - selectionStartPoint.x) < 10 && Math.abs(currentPoint.y - selectionStartPoint.y) < 10)){
				//Not sure we really need this anymore
				// select(getHexAtLocalPos({x: event.x, y: event.y}));
			}
			
		}
		
	} else if (event.button = 2) {
		//Send units to the specified hex, if any are selected
		
		if (selectedUnits.length)
			gameobject.setDestination(selectedUnits, localToGlobal(mousePos));
		else if (selecting)
			endSelection(event);

	}
};

Game.prototype.mouseMove = function(event) {
	mousePos.x = event.x;
	mousePos.y = event.y;
	if (event.screenX < 7 || 
		event.screenY < 7 || event.screenY > window.screen.height - 7 ||
		event.x > 0 && event.x < canvas.width &&
		event.y > 5 && event.y < canvas.height - 5)
		mouseInWindow = true;
	else{
		mouseInWindow = false;
		stopPanning();
	}

	if (mousePos.y > canvas.height - HUD_HEIGHT) {
		highlightHUDElement(Math.floor(mousePos.x/(HUD_HEIGHT*2)));
	} else {
		unhighlightHUDElement();
	}
	if (panning) updatePanning(event);
};

Game.prototype.mouseWheel = function(event) {
	/* We don't use the zoom
	var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
	if (delta == 1) 
	{
		zoom = Math.min(zoom * 1.1, MAX_ZOOM);
	} 
	else
		zoom = Math.max(zoom * 0.9, MIN_ZOOM);
	*/
};

Game.prototype.mouseOut = function(event) {
	mouseInWindow = true;
};

Game.prototype.keyDown = function(event) {
	switch (event.keyCode){
	case 46: //Delete -- Delete selected objects
		if (selectedUnits.length) {
			for (var i = 0; i < selectedUnits.length; i++)
				gameobject.deleteUnit(player.ID, selectedUnits[i].ID, false);
			
			selectedUnits = [];
		}
		
		if (selectedHex) {
			var b = getHex(selectedHex);
			if (b && b.type != 'fortress') {
				gameobject.deleteBuilding(player.ID, b.ID, false);
				selectedHex = null;
			}
		}
		break;
	case 49: // 1 -- Select Unit
		HUDSelected(0);
		break;
	case 50: // 2 -- Select Mine
		HUDSelected(1);
		break;
	case 51: // 3 -- Select Tower
		HUDSelected(2);
		break;
	case 52: // 4 -- Select Fortress
		HUDSelected(3);
		break;
	case 27: // Esc -- Cancel selection
		nextObject = null;
		selectedHUDElement = null;
		break;
	}
};

Game.prototype.keyUp = function(event) {
};

// Add a building of type t to location v
function addBuilding(v, t) {
	if (!gameobject.isHexFree(v.x, v.y))
		return false;
	
	var b = gameobject.createBuilding(player.ID, t);
	if (b == null)
		return false;
	b.hex.x = v.x;
	b.hex.y = v.y;

	var p = hexToGlobalPos(v);
	b.pos.x = p.x;
	b.pos.y = p.y;
	map[v.x][v.y] = b;
	return true;
}

// Add a unit and send it to location v
function addUnit(v){
	var u = gameobject.createUnit(player.ID);
	if (u == null)
		return false;
	var fortress = player.buildings[0];
	u.pos.x = fortress.pos.x;
	u.pos.y = fortress.pos.y;
	u.destination = {x: v.x, y: v.y};
	return true;
}

function select(v) {
	if (selectedHex == null) {
		selectedHex = {x: v.x, y: v.y};
	}
	else {
		selectedHex.x = v.x;
		selectedHex.y = v.y;
	}
}

function canvasToGame(v) {
	return {x: (v.x - panX) / zoom, y: (v.y - panY) / zoom};
}

function getHexAtLocalPos(v) {
	var x = v.x;
	var y = v.y;

	//offset for panning
	x += panX - (MAP_WIDTH % TILE_SIZE)/2;
	y += panY - TILE_HEIGHT;// - TILE_HEIGHT/2;

	var width = TILE_SIZE;
	var height = (3*TILE_HEIGHT/4.0); // height of rectangle that represents hex
	

	//Determines the row and column of the "rectangle"
	var row = intRound(y/height) + 2;

	var column = intRound((x - (TILE_SIZE/2*(row-3)))/width) ;

	//Adjusts if point is in one of the bottom corners of the "rectangle"
	x = (row%2)? (x % width) : (x+(width/2)) % width; //changes x to relative to to the hex it's in
	y %= height;
	if (y < 0) y = height + y; 
	//Checks if y is in the bottom portion of the rectangle
	if (y < TILE_HEIGHT/4) {
		var yScale = TILE_HEIGHT/4;
		var xScale = width/2;
		y = height/3 - y;
		
		if (x < width/2 && yScale/xScale * x < y){
			row--;
		} 
		else if (x > width/2){
			x = width - x;
			if (yScale/xScale * x < y){
				row--;
				column++;
			} 
		}
	} 
	return {x: column, y: row};
}

//returns distance between two vectors
function distance(v1, v2) {
	var z1 = -v1.x - v1.y;
	var z2 = -v2.x - v2.y;
	return (Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y) + Math.abs(z1 - z2))/2.0;
}

function isHexValid(v) {
	return map[v.x] != undefined && (map[v.x][v.y] != undefined || map[v.x][v.y] == null);
}

// Trace a hexagon of the specified size
function traceHex(ctx, x, y, size) {
	ctx.beginPath(); 
	ctx.moveTo(x, y - size/2 * ator);
	ctx.lineTo(x + size/2, y - size/4 * ator);
	ctx.lineTo(x + size/2, y + size/4 * ator);
	ctx.lineTo(x, y + size/2 * ator);
	ctx.lineTo(x - size/2, y + size/4 * ator);
	ctx.lineTo(x - size/2, y - size/4 * ator);
	ctx.closePath();
}

function intRound(x) {
	if (x < 0)
		x--;
	return ~~x; // equivalent to Math.floor
}

function getHex(v) {
	if (map[v.x] != undefined)
		return map[v.x][v.y];
	return null;
}

function set(a, x, y, v) {
	if (a[x] == undefined) 
	{
		a[x] = [];
	}
	a[x][y] = v;
}

//Resets the frame-count once per second, and displays the current FPS
function resetFPS() {
	FPS = frames;
	frames = 0;
	setTimeout(resetFPS, 1000);
}

function makeHexCanvas() {
	var c = hCtx.strokeStyle;
    hCtx.lineWidth = 2;
    //Line color
    hCtx.strokeStyle = "#444444";

    var shift = 0;
    var numHexagonsWidth = Math.ceil((hexCacheCanvas.width)/TILE_SIZE);
	var numHexagonsHeight = Math.ceil(hexCacheCanvas.height/TILE_HEIGHT);
	//Draws entire cached background-canvas
	for (var x = 0; x < numHexagonsWidth; x++) 
    {
    	shift = 0;
    	for (var y = 0; y < numHexagonsHeight; y++) 
    	{
			if (map[x-shift] == undefined) continue;
			drawEmptyHex(x-shift, y);
			if (!(y%2)) shift++; //Hexagons in a square instead of parallelogram
    	}
    }
    hCtx.strokeStyle = c; 
}

function drawEmptyHex(x, y) {
	var posx = x * TILE_SIZE + y * TILE_SIZE/2;
	var posy = y * TILE_HEIGHT/4 * 3;
	traceHex(hCtx, posx, posy, TILE_SIZE);
	// hCtx.fillStyle = "#ffffff";
	// ctx.fillText(this.x + ", " + this.y, posx-10, posy);
	hCtx.stroke();
}

//Initializes the global map and all hexes
function initializeMap(){
	var shift = 0;
	var numHexagonsWidth = Math.ceil(MAP_WIDTH/TILE_SIZE);
	var numHexagonsHeight = Math.ceil(MAP_HEIGHT/TILE_HEIGHT);

	for(var i = 0; i < numHexagonsWidth; i++)
	{
		shift = 0
		for(var j = 0; j < numHexagonsHeight; j++)
		{
			set(map, i - shift, j, null);
			if (!(j%2)) shift++; //Hexagons in a square instead of parallelogram
		}
		
	}
}

function setCanvasSizes(){
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	hexCacheCanvas.width = window.innerWidth + TILE_SIZE;
	hexCacheCanvas.height = window.innerHeight + 6*TILE_SIZE;
}

function globalToLocal(pos){
	return {x: pos.x - panX, y: pos.y - panY};
}

function localToGlobal(pos){
	return {x: pos.x + panX, y: pos.y + panY};
}

function drawSelectedHex(){
	var v = hexToLocalPos(selectedHex);
	if (v){
		traceHex(ctx, v.x, v.y, TILE_SIZE);
		ctx.lineWidth = 2;
		var c = ctx.strokeStyle;
		ctx.strokeStyle = player.colorOpposite;
		ctx.stroke();
		ctx.strokeStyle = c;
	}
}

function hexToGlobalPos(hex) {
	var posX = hex.x * TILE_SIZE + hex.y * TILE_SIZE/2 - TILE_SIZE + (MAP_WIDTH%TILE_SIZE)/2;
	var posY = hex.y * 3.0*TILE_HEIGHT/4.0;
	return {x: posX, y: posY};
}

function hexToLocalPos(hex){
	var p = hexToGlobalPos(hex);
	return globalToLocal(p);
}

/*
//Tests whether a given vector/point/actor is on the users screen
function onScreen(actor){
	var minRow = Math.ceil(panY / ((TILE_HEIGHT * 1.5)/2)) + 1;
	if (actor.y < minRow || actor.y > (3 + minRow + window.innerHeight/TILE_HEIGHT)) {
		return false;
	}
	var minCol = Math.floor(panX/TILE_SIZE) - Math.ceil(minRow/2) + 1;
	var relativeRow = actor.y - minRow;
	var minColInRow = -(Math.floor(relativeRow/2))+ minCol; 
	if (actor.x < minColInRow || actor.x > minColInRow+window.innerWidth/TILE_SIZE) return false;
	return true;
}
*/
function unselectUnits(){
	selectedUnits.forEach(function(ele){
		ele.selected = false;
	});
	selectedUnits = [];
}
function drawHexBackground(){
	ctx.drawImage(hCtx.canvas, (MAX_PAN_X - panX)%TILE_SIZE-TILE_SIZE, (MAX_PAN_Y - panY)%(1.5*TILE_HEIGHT) - TILE_HEIGHT*1.5);
}
function drawUnits(){
	units.forEach(function(u){
		var id = "'" + u.playerID + "'";
		if (tCtxs[id] == undefined || tCtxs[id] == null) {
			cacheNewPlayerUnit(u.playerID);
		}
		
		var pos = globalToLocal(u.pos);
		ctx.translate(pos.x, pos.y);
		ctx.rotate(u.angle);
		if (u.selected) 
			ctx.drawImage(sTCtxs[id].canvas, -TILE_SIZE/4, -TILE_SIZE/4);
		else 
			ctx.drawImage(tCtxs[id].canvas, -TILE_SIZE/4, -TILE_SIZE/4);
		ctx.rotate(-u.angle);
		ctx.translate(-pos.x, -pos.y);


		//Healthbar-drawing
		pos.y -= TILE_SIZE/3;
		pos.x -= TILE_SIZE/4;
		drawHealthBar(pos,u.health/Unit.upgradeVals[Unit.MAX_HEALTH]);
	});
}

function drawBuildings() {
	buildings.forEach(function(b){
		var v = hexToLocalPos(b.hex);
		var posx = v.x
		var posy = v.y;

		var c = ctx.fillStyle;
		var c2 = ctx.strokeStyle;
		var lw = ctx.lineWidth;
		var p = gameobject.getPlayer(b.playerID);
		ctx.fillStyle = p.color;
		traceHex(ctx, posx, posy, TILE_SIZE-2);
		ctx.fill();
		if (b.playerID == player.ID) {
			ctx.strokeStyle = '#66FF66';
			ctx.lineWidth = 2;
			ctx.stroke();
		}
		
		if (b.type == 'mine') {
			ctx.drawImage(imgMine, posx-28, posy-31);
		} else if (b.type == 'fortress') {
			ctx.drawImage(imgFortress, posx-28, posy-31);
		} else if (b.type == 'tower') {
			ctx.drawImage(imgTower, posx-28, posy-31);
		}
		
		ctx.fillStyle = c;
		ctx.strokeStyle = c2;
		ctx.lineWidth = lw;

		v.y += TILE_HEIGHT/4;
		v.x -= TILE_SIZE/4;
		drawHealthBar(v, b.health/b.maxHealth);
	});
}
function drawRays(){
	rays.forEach(function (r){
		var start = globalToLocal(r.start);
		var end = globalToLocal(r.end);

		var style = ctx.strokeStyle;
		var p = gameobject.getPlayer(r.playerID);
		if (p == null)
			return;
		ctx.strokeStyle = p.color;
		var lineWidth = ctx.lineWidth;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(start.x, start.y);
		ctx.lineTo(end.x, end.y);
		ctx.stroke();
		ctx.strokeStyle = style;
		ctx.lineWidth = lineWidth;
	});
}
function drawHealthBar(pos, percent){
	if (percent >= .99) return; //Doesn't draw full health-bars
	ctx.fillStyle = '#000000';
	ctx.fillRect(pos.x, pos.y, TILE_SIZE/2, 5);
	ctx.fillStyle = '#FF0000';
	if (percent > 0) ctx.fillRect(pos.x, pos.y, TILE_SIZE/2 * percent, 5);
	ctx.strokeStyle = "000000";
	ctx.lineWidth = 1;
	ctx.strokeRect(pos.x, pos.y, TILE_SIZE/2, 5);
}
function destroyBuildings(){
	for (var i = 0; i < map.length; i++) {
		if (map[i] == null)
			continue;
		for (var j = 0; j < map[i].length; j++) {
			if (map[i][j] && map[i][j].toDestroy)
				map[i][j] = null;
		}
	}
}


function makeFortress(){
	var good = false;
	var row = 0, col = 0;
	while (!good) {
		row = Math.floor(Math.random() * (MAP_SIZE - 10) + 5);
		col = Math.floor(Math.random() * (MAP_SIZE - 10) - Math.floor(row/2) + 5);
		good = gameobject.isHexFree(row, col);
	}

	addBuilding({x: col, y: row}, 'fortress');
	var b = player.buildings[0];
	panX = Math.max(0, Math.min(b.pos.x - canvas.width / 2, MAX_PAN_X));
	panY = Math.max(0, Math.min(b.pos.y - canvas.height / 2, MAX_PAN_Y));
}

// When a new player is encountered, create and cache the drawings used for his units
function cacheNewPlayerUnit(playerID) {
	var id = "'" + playerID + "'";
	var p = gameobject.getPlayer(playerID);
	var cCanvas = document.createElement("canvas");
	var cCtx = cCanvas.getContext("2d");
	tCtxs[id] = cCtx;
	var scCanvas = document.createElement("canvas");
	var scCtx = scCanvas.getContext("2d");
	sTCtxs[id] = scCtx;
	cCanvas.width = scCanvas.width = TILE_SIZE / 2;
	cCanvas.height = scCanvas.height = TILE_SIZE / 2;
	
	cCtx.beginPath();
	cCtx.moveTo(4,TILE_SIZE/8);
	cCtx.lineTo(TILE_SIZE/2 - 4, TILE_SIZE/4);
	cCtx.lineTo(4, TILE_SIZE/2 - TILE_SIZE/8);
	cCtx.closePath();

	// the outline
	cCtx.lineWidth = 3;
	cCtx.strokeStyle = '#CCCCCC';
	if (player.ID == playerID)
		cCtx.strokeStyle = '#66FF66';
	cCtx.stroke();
 
	// the fill color
	cCtx.fillStyle = p.color;
	cCtx.fill();
	
	// Selected
	scCtx.beginPath();
	scCtx.moveTo(4,TILE_SIZE/8);
	scCtx.lineTo(TILE_SIZE/2 - 4, TILE_SIZE/4);
	scCtx.lineTo(4, TILE_SIZE/2 - TILE_SIZE/8);
	scCtx.closePath();
 
		// the outline
	scCtx.lineWidth = 5;
	scCtx.strokeStyle = p.colorOpposite;
	scCtx.stroke();
 
		// the fill color
	scCtx.fillStyle = p.color;
	scCtx.fill();
}

var panning = false;
var oldPanX; var oldPanY;
var panStartPoint;
//New Panning code
function startPanning(v){
	panning = true;
	panStartPoint = v;
	oldPanX = panX;
	oldPanY = panY;
}
function updatePanning(v){
	if (Math.abs(panStartPoint.x - v.x)/1.25 < 5 && Math.abs(panStartPoint.y - v.y)/1.25 < 5) return;
	panX = Math.max(0, (Math.min(oldPanX + (panStartPoint.x - v.x)/1.25, MAX_PAN_X)));
	panY = Math.max(0, (Math.min(oldPanY + (panStartPoint.y - v.y)/1.25, MAX_PAN_Y)));
}
function stopPanning(v){
	panning = false;
	if (!v) return true;
	if (!panStartPoint) return false;
	return (Math.abs(panStartPoint.x - v.x)/1.25 < 5 && Math.abs(panStartPoint.y - v.y)/1.25 < 5);
}
// UNIT SELECTION CODE
var selecting = false;
var selectionStartPoint;
function startSelection(v) {
	selecting = true;
	selectionStartPoint = localToGlobal(v);
}

function updateSelection() {
	var startPoint = globalToLocal(selectionStartPoint);
	if (Math.abs(startPoint.x - mousePos.x) < 20 && Math.abs(startPoint.y - mousePos.y) < 20) return; //start drawing once sufficiently large
	var c = ctx.strokeStyle;
	ctx.strokeStyle = "#FFFFFF";
	ctx.lineWidth = 1; 
	ctx.beginPath();
	ctx.moveTo(startPoint.x, startPoint.y);
	ctx.lineTo(startPoint.x, mousePos.y);
	ctx.lineTo(mousePos.x, mousePos.y);
	ctx.lineTo(mousePos.x, startPoint.y);
	ctx.closePath();
	ctx.stroke();
	ctx.strokeStyle = c;
}
function endSelection(v){
	selecting = false;
	selectedUnits = []
	//Selects all the units in range
	var startPoint = {x: selectionStartPoint.x, y: selectionStartPoint.y}; //Don't want to modify the original
	var endPoint = localToGlobal(v);
	if (startPoint.x > endPoint.x){
		var tmp = startPoint.x;
		startPoint.x = endPoint.x;
		endPoint.x = tmp;
	}
	if (startPoint.y > endPoint.y){
		var tmp = startPoint.y;
		startPoint.y = endPoint.y;
		endPoint.y = tmp;
	}
	units.forEach(function(ele){
		if (ele.playerID == player.ID && startPoint.x < ele.pos.x && endPoint.x > ele.pos.x && startPoint.y < ele.pos.y && endPoint.y > ele.pos.y){
			ele.selected = true;
			selectedUnits.push(ele);
		} else {
			ele.selected = false;
		}
	});
	if (selectedUnits.length)
		selectedHex = null;
}
function drawBorder(xPos, yPos, width, height, thickness = 3)
{
  ctx.fillStyle='#000';
  ctx.fillRect(xPos - (thickness), yPos - (thickness), width + (thickness * 2), height + (thickness * 2));
}



var HUD_IMAGE_WIDTH = HUD_HEIGHT*2;
var left = 48;
var bottom = 6;
var unitImage = new Image();
unitImage.src = "./images/unit.png";
var mineImage = new Image();
mineImage.src = "./images/mine.png";
var towerImage = new Image();
towerImage.src = "./images/towers.png";
var fortressImage = new Image();
fortressImage.src = "./images/fortress.png";

var selectedHUDElement = null;

function drawHUD(){
	drawBorder(0, canvas.height, canvas.width, HUD_HEIGHT);
	ctx.font = "bold 16px sans-serif";
	ctx.globalAlpha = .4;
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, canvas.height-HUD_HEIGHT, canvas.width, HUD_HEIGHT);
	ctx.globalAlpha = .4;
	ctx.strokeStyle = "#000000";
	ctx.lineWidth = 2;
	ctx.strokeRect(0,canvas.height-HUD_HEIGHT,canvas.width, HUD_HEIGHT);
	ctx.lineWidth = 6;
	ctx.beginPath();
	ctx.moveTo(4*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT);
	ctx.lineTo(4*HUD_IMAGE_WIDTH,canvas.height);
	ctx.stroke()
	ctx.closePath();
	ctx.globalAlpha = 1;
	ctx.fillStyle="#000000";


	ctx.fillText("unit (1)", left, canvas.height - bottom)
	ctx.drawImage(unitImage, left, canvas.height - HUD_HEIGHT);

	ctx.fillText("mine (2)", left + HUD_IMAGE_WIDTH, canvas.height - bottom);
	ctx.drawImage(mineImage, left + HUD_IMAGE_WIDTH - 8, canvas.height - HUD_HEIGHT);

	ctx.fillText("tower (3)", left + 2*HUD_IMAGE_WIDTH, canvas.height - bottom);
	ctx.drawImage(towerImage, left + HUD_IMAGE_WIDTH*2 - 6, canvas.height - HUD_HEIGHT);

	ctx.fillText("fortress (4)", left + 3*HUD_IMAGE_WIDTH - 8, canvas.height - bottom);
	// ctx.drawImage(fortressImage, 0, 0, Math.round(HUD_IMAGE_WIDTH), Math.round(HUD_HEIGHT), Math.round(fortressImage.width), Math.round(fortressImage.height),
		// Math.round(3*HUD_IMAGE_WIDTH + left), Math.round(canvas.height - HUD_HEIGHT + 5), Math.round(3*HUD_IMAGE_WIDTH/4), Math.round(3*HUD_HEIGHT/4));
	ctx.drawImage(fortressImage, left+HUD_IMAGE_WIDTH*3, canvas.height - HUD_HEIGHT);

   
	//Shows general information, or information regarding selected object-type (unit/building/fortress/tower) if one has been selected
	if (selectedHUDElement == null) {
		ctx.fillText("Units: " + player.units.length, left + 4*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT*.4);
		ctx.fillText("Buildings: " + player.buildings.length, left + 5*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT*.4);
		ctx.fillText("Gold: " + Math.floor(player.gold), left + 6*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT*.4);
		ctx.fillText("FPS: " + FPS, left + 7*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT *.4);
	} else {
	switch(selectedHUDElement){
		case UNIT:
			drawUnitInformation();
			nextObject = UNIT;
			break;
		case MINE:
			drawMineInformation();
			nextObject = MINE;
			break;
		case TOWER: 
			drawTowerInformation();
			nextObject = TOWER;
			break;
		case FORTRESS: 
			drawFortressInformation();
			nextObject = null;
			break;
		}
	}

	if (unitUpgradeReady) {
		ctx.lineWidth = 4;
		ctx.strokeStyle = "#6666FF";
		ctx.globalAlpha = .8;
		ctx.strokeRect(0, canvas.height-HUD_HEIGHT, HUD_IMAGE_WIDTH,HUD_HEIGHT);
	}
	if (mineUpgradeReady){
		ctx.lineWidth = 4;
		ctx.strokeStyle = "#6666FF";
		ctx.globalAlpha = .8;
		ctx.strokeRect(HUD_IMAGE_WIDTH, canvas.height-HUD_HEIGHT, HUD_IMAGE_WIDTH,HUD_HEIGHT);
	}
	if (towerUpgradeReady){
		ctx.lineWidth = 4;
		ctx.strokeStyle = "#6666FF";
		ctx.globalAlpha = .8;
		ctx.strokeRect(2 * HUD_IMAGE_WIDTH, canvas.height-HUD_HEIGHT, HUD_IMAGE_WIDTH,HUD_HEIGHT);
	}
	if (fortressUpgradeReady){
		ctx.lineWidth = 4;
		ctx.strokeStyle = "#6666FF";
		ctx.globalAlpha = .8;
		ctx.strokeRect(3 * HUD_IMAGE_WIDTH, canvas.height-HUD_HEIGHT, HUD_IMAGE_WIDTH,HUD_HEIGHT);
	}

	drawHighlightedHUDElement();
	// ctx.fillText("Units: " + player.units.length, right + padding, stats + spacing);
	// ctx.fillText("Building: " + player.buildings.length, right + padding, stats + 2.5 * spacing);
	// ctx.fillText("Gold: " + player.gold.toFixed(2), right + padding, stats + 4 * spacing);
	// ctx.fillText("FPS: " + FPS, right + padding, stats + 5.5 * spacing);
}
var highlighted = null;
function drawHighlightedHUDElement(){
	if (highlighted == null) return;
	ctx.lineWidth = 4;
	ctx.strokeStyle = "#000000";
	ctx.globalAlpha = .4;
	ctx.strokeRect(highlighted * HUD_IMAGE_WIDTH, canvas.height-HUD_HEIGHT, HUD_IMAGE_WIDTH,HUD_HEIGHT);
}
function unhighlightHUDElement(){
	highlighted = null;
}
function highlightHUDElement(index){
	highlighted = index;
	if (highlighted >= 4) highlighted = null;

}

function HUDSelected(n){
	if (n == null) var num = Math.floor(mousePos.x / HUD_IMAGE_WIDTH); 
	else var num = n;
	if (num >= 5) return;
	if (num == 3) {
		centerPanOnFortress();
	} 
	selectedHUDElement = num;
}
function centerPanOnFortress(){
	// //Resets pan to center on tower;
	panX = Math.min(buildings[0].pos.x - canvas.width / 2, MAX_PAN_X);
	panY = Math.min(buildings[0].pos.y - canvas.height / 2, MAX_PAN_Y);
}
var spacing = 20;
var upgradeRectSize = 80;
function drawUnitInformation(){
	ctx.font = "bold 16 px sans-serif";
	ctx.fillStyle = "#000000";
	ctx.lineWidth = 3;

	ctx.fillText("unit stats", left + HUD_IMAGE_WIDTH*4 - 5, canvas.height - bottom)
	ctx.drawImage(unitImage,   left + HUD_IMAGE_WIDTH*4,     canvas.height - HUD_HEIGHT);

	//Do this dynamically at some point
	ctx.fillText(Unit.upgradeStrings[1] + Unit.upgradeVals[1], left + 5*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText(Unit.upgradeStrings[2] + Unit.upgradeVals[2], left + 5*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing*2);
	ctx.fillText(Unit.upgradeStrings[3] + Unit.upgradeVals[3].toFixed(2), left + 5*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing*3);
	ctx.fillText(Unit.upgradeStrings[4] + Unit.upgradeVals[4], left + 7*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText(Unit.upgradeStrings[5] + Unit.upgradeVals[5], left + 7*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing*2);

	var upgradeNum = upgradeHover(5);
	if (upgradeNum){
		changeCursor("pointer");
		ctx.fillStyle = "#aa0000";
		ctx.fillText("Gold: " + Math.floor(player.gold) + "(-" + Unit.upgradeCosts[upgradeNum] + ")", left + 8*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	} else {
		changeCursor("auto");
		ctx.fillStyle = "#00aa00";
		ctx.fillText("Gold: " + Math.floor(player.gold), left + 8*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	}

	ctx.font = "25px sans-serif";
	ctx.fillStyle = "#2a5393";

	ctx.fillText("⊞", left + 5*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("⊞", left + 5*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + 2*spacing);
	ctx.fillText("⊞", left + 5*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + 3*spacing);
	ctx.fillText("⊞", left + 7*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("⊞", left + 7*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + 2*spacing);


}

function drawMineInformation(){
	ctx.font = "bold 16 px sans-serif";
	ctx.fillStyle = "#000000";

	ctx.fillText("mine stats", left+4*HUD_IMAGE_WIDTH, canvas.height - bottom)
	ctx.drawImage(mineImage, left+4*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT);

	ctx.fillText("Max Health: " + mineMaxHealth, left + 5*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("Gold Production/Sec: " + mineYield.toFixed(2), left + 5*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing*2);

	if (upgradeHover(2)){
		ctx.fillStyle = "#aa0000";
		ctx.fillText("Gold: " + Math.floor(player.gold) + "(-" + upgradeCost + ")", left + 8*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	} else {
		ctx.fillStyle = "#00aa00";
		ctx.fillText("Gold: " + Math.floor(player.gold), left + 8*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	}

	ctx.font = "25px sans-serif";
	ctx.fillStyle = "#2a5393";

	ctx.fillText("⊞", left + 5*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("⊞", left + 5*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + 2*spacing);



}

function drawTowerInformation(){
	ctx.font = "bold 16 px sans-serif";
	ctx.fillStyle = "#000000";

	ctx.fillText("tower stats", left+4*HUD_IMAGE_WIDTH - 5, canvas.height - bottom)
	ctx.drawImage(towerImage, left + HUD_IMAGE_WIDTH*4 - 6, canvas.height - HUD_HEIGHT);

	ctx.fillText("Max Health: " + towerMaxHealth, left + 5*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("AttackSpeed: " + towerAttackSpeed.toFixed(2), left + 5*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing*2);
	ctx.fillText("Damage: " + towerDamage, left + 7*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("Range: " + towerRange, left + 7*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + 2*spacing);

	if (upgradeHover(4)){
		ctx.fillStyle = "#aa0000";
		ctx.fillText("Gold: " + Math.floor(player.gold) + "(-" + upgradeCost + ")", left + 8*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	} else {
		ctx.fillStyle = "#00aa00";
		ctx.fillText("Gold: " + Math.floor(player.gold), left + 8*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	}

	ctx.font = "25px sans-serif";
	ctx.fillStyle = "#2a5393";

	ctx.fillText("⊞", left + 5*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("⊞", left + 5*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + 2*spacing);
	ctx.fillText("⊞", left + 7*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("⊞", left + 7*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + 2*spacing);

	

}

function drawFortressInformation(){
	ctx.font = "bold 16 px sans-serif";
	ctx.fillStyle = "#000000";

	ctx.fillText("fortress stats", left+4*HUD_IMAGE_WIDTH - 18, canvas.height - bottom);
	ctx.drawImage(fortressImage, left + HUD_IMAGE_WIDTH*4 - 6, canvas.height - HUD_HEIGHT);

	// ctx.drawImage(fortressImage, 0, 0, HUD_IMAGE_WIDTH, HUD_HEIGHT, 4*HUD_IMAGE_WIDTH + left, canvas.height - HUD_HEIGHT + 5, 3*HUD_IMAGE_WIDTH/4, 3*HUD_HEIGHT/4);

	ctx.fillText("Max Health: " + fortressMaxHealth, left + 5*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("AttackSpeed: " + fortressAttackSpeed.toFixed(2), left + 5*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing*2);
	ctx.fillText("Damage: " + fortressDamage, left + 7*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("Range: " + fortressRange, left + 7*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + 2*spacing);

	if (upgradeHover(4)){
		ctx.fillStyle = "#aa0000";
		ctx.fillText("Gold: " + Math.floor(player.gold) + "(-" + upgradeCost + ")", left + 8*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	} else {
		ctx.fillStyle = "#00aa00";
		ctx.fillText("Gold: " + Math.floor(player.gold), left + 8*HUD_IMAGE_WIDTH, canvas.height - HUD_HEIGHT + spacing);
	}

	ctx.font = "25px sans-serif";
	ctx.fillStyle = "#2a5393";

	ctx.fillText("⊞", left + 5*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("⊞", left + 5*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + 2*spacing);
	ctx.fillText("⊞", left + 7*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + spacing);
	ctx.fillText("⊞", left + 7*HUD_IMAGE_WIDTH - 25, canvas.height - HUD_HEIGHT + 2*spacing);


}

//Returns the index  of the upgrade-button which the mouse is hovering over, if any (up to 6). False otherwise.
function upgradeHover(n){
	if (!n) return false;
	if (mousePos.y < canvas.height - HUD_HEIGHT) return false;
	var leftCutoff = left + 5*HUD_IMAGE_WIDTH - 25;
	if (mousePos.x > leftCutoff && mousePos.x < leftCutoff + 25){
		if (mousePos.y > canvas.height - HUD_HEIGHT && mousePos.y < canvas.height - HUD_HEIGHT+ 25) return 1;
		if (n == 1) return false;
		if (mousePos.y > canvas.height - HUD_HEIGHT + spacing && mousePos.y < canvas.height - HUD_HEIGHT + spacing  + 25) return 2;
		if (n == 2) return false;
		if ((n == 3 || n >= 5) && mousePos.y > canvas.height - HUD_HEIGHT + spacing*2 && mousePos.y < canvas.height - HUD_HEIGHT + spacing*2 + 25) return 3;
	} 
	leftCutoff = left + 7*HUD_IMAGE_WIDTH - 25;
	if (mousePos.x > leftCutoff && mousePos.x < leftCutoff + 25 && n >= 4){
		if (mousePos.y > canvas.height - HUD_HEIGHT && mousePos.y < canvas.height - HUD_HEIGHT+ 25) {
			if (n == 4) return 3;
			return 4; 
		}
		if (n == 3) return false;
		if (mousePos.y > canvas.height - HUD_HEIGHT + spacing && mousePos.y < canvas.height - HUD_HEIGHT + spacing  + 25) {
			if (n == 4) return 4;
			return 5;
		}
		if (n == 4) return false;
		if (n == 5) return false;
		if (mousePos.y > canvas.height - HUD_HEIGHT + spacing*2 && mousePos.y < canvas.height - HUD_HEIGHT + spacing*2 + 25) return 6;
	} 
	return false;
}

function checkForUpgradeRequests(){
	var upgradeNumber = null;
	switch(selectedHUDElement){
		case UNIT:
			upgradeNumber = upgradeHover(5);
			if (upgradeNumber && player.gold >= Unit.upgradeCosts[upgradeNumber]) {
 				player.gold -= Unit.upgradeCosts[upgradeNumber];
 				upgradeUnits(upgradeNumber);
 			}
			break;
		case MINE:
			upgradeNumber = upgradeHover(2);
			if (upgradeNumber && player.gold >= upgradeCost) {
				player.gold -= upgradeCost;
				upgradeMines(upgradeNumber);
 			}
			break;
		case TOWER:
			upgradeNumber = upgradeHover(4);
			if (upgradeNumber && player.gold >= upgradeCost) {
 				player.gold -= upgradeCost;
 				upgradeTowers(upgradeNumber);
 			}
			break;
		case FORTRESS:
			upgradeNumber = upgradeHover(4);
			if (upgradeNumber && player.gold >= upgradeCost) {
 				player.gold -= upgradeCost;
 				upgradeFortress(upgradeNumber);
 			}
			break;
	}
}

function upgradeUnits(n){
	Unit.upgrade(n)
	gameobject.upgradeUnits(player.ID, n, Unit.upgradeVals[n], false)
}

function upgradeMines(n){
	switch(n){
		case 1:
			gameobject.upgradeMines(player.ID, 'maxHealth', mineMaxHealth + 20, false);
			mineMaxHealth += 20;
			mineMaxHealthLevel++;
			break;
		case 2:
			gameobject.upgradeMines(player.ID, 'yield', mineYield + 0.4, false);
			mineYield += 0.4;
			mineYieldLevel++;
			break;
	}
}

function upgradeTowers(n){
	switch(n){
		case 1:
			gameobject.upgradeTowers(player.ID, 'maxHealth', towerMaxHealth + 20, false);
			towerMaxHealth += 20;
			towerMaxHealthLevel++;
			break;
		case 2:
			gameobject.upgradeTowers(player.ID, 'attackSpeed', towerAttackSpeed + 0.4, false);
			towerAttackSpeed += 0.4;
			towerAttackSpeedLevel++;
			break;
		case 3:
			gameobject.upgradeTowers(player.ID, 'damage', towerDamage + 2, false);
			towerDamage += 2;
			towerDamageLevel++;
			break;
		case 4:
			gameobject.upgradeTowers(player.ID, 'range', towerRange + 10, false);
			towerRange += 10;
			towerRangeLevel++;
			break;
	}
}
function upgradeFortress(n){
	switch(n){
		case 1:
			gameobject.upgradeFortress(player.ID, 'maxHealth', fortressMaxHealth + 30, false);
			fortressMaxHealth += 30;
			fortressMaxHealthLevel++;
			break;
		case 2:
			gameobject.upgradeFortress(player.ID, 'attackSpeed', fortressAttackSpeed + 0.4, false);
			fortressAttackSpeed += 0.4;
			fortressAttackSpeedLevel++;
			break;
		case 3:
			gameobject.upgradeFortress(player.ID, 'damage', fortressDamage + 5, false);
			fortressDamage += 5;
			fortressDamageLevel++;
			break;
		case 4:
			gameobject.upgradeFortress(player.ID, 'range', fortressRange + 10, false);
			fortressRange += 10;
			fortressRangeLevel++;
			break;
	}
}

function changeCursor(value){
	$("body, html").css("cursor",value);
}