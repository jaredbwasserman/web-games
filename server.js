const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidv4 } = require('uuid');

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(8080, function () {
    console.log(`Listening on ${server.address().port}`);
});

io.on('connection', function (socket) {
    socket.on('joinGame', joinGame)
    socket.on('createGame', createGame);
});

// TODO: Some checks on valid gameId and error if not
function joinGame(data) {
    const gameId = data.gameId;

    // TODO: Remove
    console.log('Join game');

    // TODO: Look up the game type that is stored and return it
    this.emit('gameJoined', { gameId: gameId, socketId: this.id, role: 'player' });
}

function createGame(data) {
    // Create a unique Socket.IO Room
    const gameId = uuidv4();

    // TODO: Remove
    console.log('New game');

    this.emit('gameCreated', { gameId: gameId, socketId: this.id, role: 'host' });
};
