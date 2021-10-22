const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const handler = require('./handler');

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(8080, function () {
    console.log(`Listening on ${server.address().port}`);
});

// Keep track of games (gameId -> {gameId, gameType, status})
const games = [];

// Keep track of players (socketId -> {gameId, socketId, name, role})
const players = [];

io.on('connection', function (socket) {
    handler.init(io, socket, games, players);
});
