const { v4: uuidv4 } = require('uuid');

var io;
var socket;
var players;

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

    socket.on('disconnect', onDisconnect);
    socket.on('createGame', onCreateGame);
    socket.on('joinGame', onJoinGame);
    socket.on('gameTypeChanged', onGameTypeChanged);

    // Keep track of players (game, socket, name, role)
    players = [];
}

function onDisconnect(data) {
    console.log(`user disconnected ${this.id}`); // TODO: Remove

    // Game gameId of the player
    const matchingPlayer = players.filter(player => player.socketId === this.id)[0];
    if (undefined === matchingPlayer) {
        // TODO: I do not think this is possible
        return;
    }
    const gameId = matchingPlayer.gameId;

    // Remove the player
    players = players.filter(player => player.socketId !== this.id);

    // Emit all players in room
    io.sockets.in(gameId).emit('playersUpdate', { players: getPlayerNames(gameId) });

    // TODO: Remove
    console.log(`players is ${getPlayerNames(gameId)}`);
}

function onCreateGame(data) {
    // Create a unique Socket.IO Room
    const gameId = uuidv4();

    // TODO: Remove
    console.log('New game');

    // Create and join room
    this.join(gameId);

    // Add player
    const playerEntry = {
        gameId: gameId,
        socketId: this.id,
        name: data.name,
        role: 'host'
    };
    players.push(playerEntry);

    this.emit('gameCreated', playerEntry);

    // Emit all players in room
    io.sockets.in(gameId).emit('playersUpdate', { players: getPlayerNames(gameId) });
}

function onJoinGame(data) {
    const gameId = data.gameId;

    // TODO: Remove
    console.log('Join game');

    // Error if room does not exist
    if (!Array.from(io.sockets.adapter.rooms.keys()).includes(gameId)) {
        this.emit('error', { message: 'Game does not exist.' });
        return;
    }

    // Error if name is taken
    const matchingNames = players.filter(player => player.gameId === gameId && player.name === data.name);
    if (matchingNames.length > 0) {
        this.emit('error', { message: `Name "${data.name}" taken. Please select a different name.` });
        return;
    }

    // Join the room
    this.join(gameId);

    // Add player
    const playerEntry = {
        gameId: gameId,
        socketId: this.id,
        name: data.name,
        role: 'player'
    };
    players.push(playerEntry);

    this.emit('gameJoined', playerEntry);

    // Emit all players in room
    io.sockets.in(gameId).emit('playersUpdate', { players: getPlayerNames(gameId) });
}

function onGameTypeChanged(data) {
    io.sockets.in(data.gameId).emit('gameTypeChanged', { gameType: data.gameType });
}

// Helper function to get a list of player names
function getPlayerNames(gameId) {
    const names = [];
    const playersInGame = players.filter(player => player.gameId === gameId);
    playersInGame.forEach(player => {
        names.push(player.name);
    });
    return names;
}
