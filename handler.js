const { v4: uuidv4 } = require('uuid');

var io;
var socket;
var gameState;

/**
 * This function is called by server.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.init = function (ioIn, socketIn) {
    io = ioIn;
    socket = socketIn;
    socket.emit('connected', { message: 'You are connected!' });

    socket.on('createGame', onCreateGame);
    socket.on('joinGame', onJoinGame);
    socket.on('gameTypeChanged', onGameTypeChanged);

    // TODO: Delete game state for games once they are over
    // Keep track of state per game
    gameState = {};
}

function onCreateGame(data) {
    // Create a unique Socket.IO Room
    const gameId = uuidv4();

    // TODO: Remove
    console.log('New game');

    // Create and join room
    this.join(gameId);

    // Add game state
    gameState[gameId] = {};
    gameState[gameId]['players'] = new Set();
    gameState[gameId]['players'].add(data.name);

    this.emit('gameCreated', { gameId: gameId, socketId: this.id, role: 'host', name: data.name });

    // Emit all players in room
    io.sockets.in(gameId).emit('playersUpdate', { players: Array.from(gameState[gameId]['players']) });
}

// TODO: Some checks on valid gameId and error if not
function onJoinGame(data) {
    const gameId = data.gameId;

    // TODO: Remove
    console.log('Join game');

    // A reference to the player's Socket.IO socket object
    const sock = this;

    // Error if room does not exist
    if (undefined === gameState[gameId]) {
        this.emit('error', { message: 'Game does not exist.' });
        return;
    }

    // Error if name is taken
    if (gameState[gameId]['players'].has(data.name)) {
        this.emit('error', { message: `Name "${data.name}" taken. Please choose another name.` });
        return;
    }

    // Join the room
    sock.join(gameId);

    // Add to list of players
    gameState[gameId]['players'].add(data.name);

    //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

    sock.emit('gameJoined', { gameId: gameId, socketId: sock.id, role: 'player', name: data.name });

    // Emit all players in room
    io.sockets.in(gameId).emit('playersUpdate', { players: Array.from(gameState[gameId]['players']) });
}

function onGameTypeChanged(data) {
    io.sockets.in(data.gameId).emit('gameTypeChanged', { gameType: data.gameType });
}
