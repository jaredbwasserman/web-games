const { v4: uuidv4 } = require('uuid');

var io;
var socket;

/**
 * This function is called by server.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.init = function (ioIn, socketIn) {
    io = ioIn;
    socket = socketIn;
    socket.emit('connected', { message: "You are connected!" });

    socket.on('joinGame', joinGame);
    socket.on('createGame', createGame);
}

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
}
