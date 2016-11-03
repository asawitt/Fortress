
var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");

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

//States
var game;

init();

function init() 
{
    game = new Game();
    addState(game);
}

function thread() 
{
    var delta = new Date().getTime() - t;
    update(delta);
    draw();

    var pause = Math.max(0, 2 * bestPause - delta);
    t = new Date().getTime();
    window.setTimeout(thread, pause);
}

function update(delta) 
{
    for (var i = 0; i < states.length; i++)
        states[i].update(delta);
    removeStates();
}

function draw() 
{
   for (var i = 0; i < states.length; i++)
        states[i].draw();
}

function keyDown(event) 
{
	event.preventDefault();
    for (var i = 0; i < states.length; i++)
        states[i].keyDown(event);
}

function keyUp(event) 
{
	event.preventDefault();
    for (var i = 0; i < states.length; i++)
        states[i].keyUp(event);
}

function mouseDown(event) 
{
    event.preventDefault();
    canvas.focus();
    for (var i = 0; i < states.length; i++)
        states[i].mouseDown(event);
}

function mouseUp(event) 
{
    for (var i = 0; i < states.length; i++)
        states[i].mouseUp(event);
}

function mouseMove(event) 
{
    for (var i = 0; i < states.length; i++)
        states[i].mouseMove(event);
}

function mouseWheel(event) 
{
    for (var i = 0; i < states.length; i++)
        states[i].mouseWheel(event);
}

function mouseOut(event) 
{
    for (var i = 0; i < states.length; i++)
        states[i].mouseOut(event);
}














