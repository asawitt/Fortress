var express = require('express');
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var exec = require("child_process").exec;
var session = require('client-sessions'); //Stores username for scores and whatnot
var bodyParser = require('body-parser'); //Parses post requests made to this server

//Middleware
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  cookieName: 'session',
  secret: 'correcthorsebatterystaple', //Only the username is stored in session, so this is fine
  duration: 60 * 60 * 1000,
  activeDuration: 60 * 60 * 1000,
}));

// Run scripts associated to the game state, to be able to interact with the master gameobject
eval(fs.readFileSync('./Game/scripts/application/utility.js')+'');
eval(fs.readFileSync('./Game/scripts/gamestate/building.js')+'');
eval(fs.readFileSync('./Game/scripts/gamestate/unit.js')+'');
eval(fs.readFileSync('./Game/scripts/gamestate/ray.js')+'');
eval(fs.readFileSync('./Game/scripts/gamestate/player.js')+'');
eval(fs.readFileSync('./Game/scripts/gamestate/gameobject.js')+'');

//Need to able to use exec to exec php scripts on login (+ jquery)
var $ = require("jquery");
// eval(fs.readFileSync('./Login-Page/JS/Login.js')+'');

var usernameByPlayerID = [];

app.use(express.static(__dirname));

app.get('/', function(req, res){
	res.sendFile(__dirname + "/Login-Page/HTML/Login.html");
});
app.get('/Login', function(req, res){
	res.sendFile(__dirname + "/Login-Page/HTML/Login.html");
});
app.get('/CreateAccount', function(req, res){
	res.sendFile(__dirname + "/Login-Page/HTML/CreateAccount.html");
});
app.get('/Game', function(req, res){
	res.sendFile(__dirname + "/Game/first.html");
});
app.get('/GameOver', function(req, res){
	res.sendFile(__dirname + "/Game/gameover.html");
});
//Sets high scores
app.post('/hs', function(req, res){
	var username = req.session.username; 
	var score = req.body.score;
	console.log("Settinging high score to: " + score + " for " + username);

	exec("php " + __dirname + "/Game/PHP/SaveHighScore.php " + username + " " + score, 
		function (error, stdout, stderr){
			if (error || stderr) console.log("error: " + error + " stdout: " + stdout + " stderr: " + stderr);
		}
	);
	res.send("1");

});

app.post('/CreateAccount', function(req, res){
	var username = req.body.username;
	var password = req.body.password;
	var email = req.body.email; 
	exec("php " + __dirname + "/Login-Page/PHP/CreateAccount.php " + username + " " + password + " " + email, function (error, stdout, stderr){
		if (error | stderr) console.log("error: " + error + " stderr: " + stderr);
		res.send(stdout);
	});
});
app.post('/CheckAccount', function(req, res){
	var username = req.body.username;
	var password = req.body.password;
	exec("php " + __dirname + "/Login-Page/PHP/CheckAccount.php " + username + " " + password, function (error, stdout, stderr){
		if (error || stderr) console.log("error: " + error + " stdout: " + stdout + " stderr: " + stderr);
		var json = JSON.parse(stdout);
		//if successful
		if (!json.id){
			req.session.username = username; //Save username as session info
		}
		res.send(stdout);
	});
});
app.post('/GetHighScores', function(req, res){
	exec("php " + __dirname + "/Game/PHP/GetHighScores.php", function (error, stdout, stderr){
		if (error | stderr) console.log("error: " + error + " stderr: " + stderr);
		var json = JSON.parse(stdout);
		json[11] = req.session.username;
		stdout = JSON.stringify(json);
		res.send(stdout);
	});
});
app.get('/game');


var gameobject = new Gameobject(); // The master gameobject. Clients get a copy of this
gameobject.isServer = true;

var nextSocketID = 0;
var sockets = {};

io.on('connection', function(socket){
	console.log("new connection");
	// Associate to a socket id
	socket.ID = nextSocketID;
	nextSocketID++;
	sockets[socket.ID] = socket;

	// Create the new player
	var p = gameobject.createPlayer();
	socket.playerID = p.ID;
	p.socketID = socket.ID;

	for (var i in sockets) {
		if (i != socket.ID)
			sockets[i].emit('newPlayer', p);
	}
	
	// React to changes to the game, from the clients
	socket.on('gameUpdate', function(msg){
		for (var i = 0; i < msg.length; i++) {
			gameobject.changes.push(msg[i]);
			switch(msg[i].type) {
			case 'newDestination':
				var u = gameobject.getUnit(msg[i].from, msg[i].unit);
				if (u != null)
					u.destination = msg[i].destination;
				break;
			case 'newUnit':
				var u = copyUnit(msg[i].unit);
				gameobject.getPlayer(msg[i].from).units.push(u);
				break;
			case 'newBuilding':
				var b = copyBuilding(msg[i].building);
				gameobject.getPlayer(msg[i].from).buildings.push(b);
				break;
			case 'upgradeUnits':
				gameobject.upgradeUnits(msg[i].to, msg[i].upgrade, msg[i].value, false);
				break;
			case 'upgradeMines':
				gameobject.upgradeMines(msg[i].to, msg[i].upgrade, msg[i].value, false);
				break;
			case 'upgradeTowers':
				gameobject.upgradeTowers(msg[i].to, msg[i].upgrade, msg[i].value, false);
				break;
			case 'upgradeFortress':
				gameobject.upgradeFortress(msg[i].to, msg[i].upgrade, msg[i].value, false);
				break;
			}
		}
  	});
	
	// Delete a player when his client disconnects
	socket.on('disconnect', function() {
		gameobject.deletePlayer(socket.playerID);
		delete sockets[socket.ID];
	});
	
	socket.on('forceDisconnect', function() {
		socket.disconnect();
	});
	
	socket.on('serverNewConnection', function() {
		socket.emit('newConnection', {player: p, gameobject: gameobject});
	});
});

http.listen(3000, function(){
	console.log('listening on port 3000!');
});

// Create the update thread for the game object
var fps = 60;
var bestPause = 1000 / fps;
var t = new Date().getTime();

function thread() 
{
    var delta = new Date().getTime() - t;
    gameobject.update(delta / 1000.0);

    var pause = Math.max(0, 2 * bestPause - delta);
    t = new Date().getTime();
    setTimeout(thread, pause);
}

thread();