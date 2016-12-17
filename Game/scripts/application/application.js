var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
// Caching our hexagon in another canvas for faster rendering
var hexCacheCanvas = document.createElement("canvas");
var hCtx = hexCacheCanvas.getContext("2d");

//Event Listeners
canvas.addEventListener("keydown", keyDown, true);
canvas.addEventListener("keyup", keyUp, true);
canvas.addEventListener("mousedown", mouseDown, true);
canvas.addEventListener("mouseup", mouseUp, true);
canvas.addEventListener("mousemove", mouseMove, true);
canvas.addEventListener("mousewheel", mouseWheel, true);
document.addEventListener("mouseout", mouseOut, true);
var down; 
canvas.focus();

//Thread stuff
var fps = 60;
var bestPause = 1000 / fps;
var t = new Date().getTime();

var game = new Game();

function thread() 
{
	if (player.toDestroy) {
		game.drawGameOver();
        gameOver();
        // addBuilding(hex, 'mine');       
		return;
	}
    var delta = new Date().getTime() - t;
    game.update(delta);
	gameobject.update(delta / 1000.0);
    game.draw();

    var pause = Math.max(0, 2 * bestPause - delta);
    t = new Date().getTime();
    window.setTimeout(thread, pause);
}
function gameOver(){
    console.log("changing href3");
    $.ajax({
        type: "POST",
        url: "/hs", 
        data: { 
            score: Math.floor(player.gold)
        }
    });
    window.location.href = "/GameOver";
}

function keyDown(event) {
	event.preventDefault();
    game.keyDown(event);
}

function keyUp(event) {
	event.preventDefault();
    game.keyUp(event);
}

function mouseDown(event) {
    event.preventDefault();
    canvas.focus();
    game.mouseDown(event);
}

function mouseUp(event) {
    game.mouseUp(event);
}

function mouseMove(event) {
    game.mouseMove(event);
}

function mouseWheel(event) {
    game.mouseWheel(event);
}

function mouseOut(event) {
    game.mouseOut(event);
}
