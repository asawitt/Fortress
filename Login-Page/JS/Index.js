var app = require('express')();
var http = require("http").Server(app);
var io = require('socket.io')(http);


app.get('/', function(req, res){
	res.sendFile(__dirname + "/html/clickme_test.html");
});

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('point', function(msg){
		console.log("message: " + msg);
    	io.emit("point", msg);
  	});
});

http.listen(3000, function(){
	console.log('listening on port 3000');
});
	