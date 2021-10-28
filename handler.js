const { v4: uuidv4 } = require('uuid');
const game = require('./game');

var io;
var socket;
var games;
var players;
var scores;

/**
 * This function is called by server.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.init = function (ioIn, socketIn, gamesIn, playersIn, scoresIn) {
    io = ioIn;
    socket = socketIn;
    games = gamesIn;
    players = playersIn;
    scores = scoresIn;

    console.log(`new connection`); // TODO: Remove

    socket.emit('connected', { message: 'You are connected!' });

    socket.on('disconnect', onDisconnect);
    socket.on('requestScores', onRequestScores);
    socket.on('createGame', onCreateGame);
    socket.on('joinGame', onJoinGame);
    socket.on('gameTypeChanged', onGameTypeChanged);
    socket.on('startGame', onStartGame);
    socket.on('gameStarted', onGameStarted);
}

function onDisconnect(data) {
    console.log(`user disconnected ${this.id}`); // TODO: Remove

    // Game gameId of the player
    if (undefined === players[this.id]) {
        return;
    }
    const gameId = players[this.id].gameId;

    // Remove the player
    delete players[this.id];

    // Emit all players in room if the game is still in lobby
    if ('pending' === games[gameId].status) {
        io.sockets.in(gameId).emit('playersUpdate', { players: getPlayerNames(gameId) });
    }

    // TODO: Remove
    // console.log(`players is ${getPlayerNames(gameId)}`);

    // Check if the game has any players
    var playerCount = 0;
    for (const [socketId, player] of Object.entries(players)) {
        if (gameId === player.gameId) {
            playerCount++;
        }
    }
    if (0 === playerCount) {
        delete games[gameId];
    }

    // TODO: Remove
    console.log(`games is ${JSON.stringify(games, null, 4)}`);
}

function onRequestScores(data) {
    console.log('giving scores'); // TODO: Remove
    this.emit('scoresReceived', { scores: scores });
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
    players[this.id] = playerEntry;

    // Add game
    const gameEntry = {
        gameId: gameId,
        status: 'pending'
    };
    games[gameId] = gameEntry;

    this.emit('gameCreated', playerEntry);

    // Emit all players in room
    io.sockets.in(gameId).emit('playersUpdate', { players: getPlayerNames(gameId) });
}

function onJoinGame(data) {
    const gameId = data.gameId;

    // TODO: Remove
    console.log('Join game');

    // Error if room does not exist
    if (!gameExists(gameId)) {
        this.emit('error', { message: 'Game does not exist.' });
        return;
    }

    // Error if game is in progress
    if (games[gameId] && games[gameId].status !== 'pending') {
        this.emit('error', { message: `Unable to join ${games[gameId].status} game.` });
        return;
    }

    // Error if name is taken
    var foundMatch = false;
    for (const [socketId, player] of Object.entries(players)) {
        if (player.gameId === gameId && player.name === data.name) {
            foundMatch = true;
        }
    }
    if (foundMatch) {
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
    players[this.id] = playerEntry;

    this.emit('gameJoined', playerEntry);

    // Emit all players in room
    io.sockets.in(gameId).emit('playersUpdate', { players: getPlayerNames(gameId) });
}

function onGameTypeChanged(data) {
    io.sockets.in(data.gameId).emit('gameTypeChanged', { gameType: data.gameType });
}

function onStartGame(data) {
    const gameId = data.gameId;
    const gameType = data.gameType;

    console.log(`Start game ${gameId} with gameType ${gameType}`); // TODO: Remove

    // Error if room does not exist
    if (!gameExists(gameId)) {
        this.emit('error', { message: 'Game does not exist.' });
        return;
    }

    // Error if game entry does not exist
    if (!games[gameId]) {
        this.emit('error', { message: 'Game does not exist.' });
        return;
    }

    // Error if server code does not exist
    if (!game[gameType]) {
        this.emit('error', { message: 'Game type does not exist.' });
        return;
    }

    // Update game
    games[gameId].status = 'in progress';
    games[gameId].gameType = gameType;
    games[gameId].startTime = Date.now();

    // Init game
    game[data.gameType](io, this, games, players, gameId, gameType, scores).init(data);
}

function onGameStarted(data) {
    // Only players (not host) will end up here
    game[data.gameType](io, this, games, data.players, data.gameId, data.gameType, scores).handleEvents();
}

// Helper function to return whether a game exists
function gameExists(gameId) {
    return Array.from(io.sockets.adapter.rooms.keys()).includes(gameId);
}

// Helper function to get a list of player names
function getPlayerNames(gameId) {
    const names = [];
    for (const [socketId, player] of Object.entries(players)) {
        if (player.gameId === gameId) {
            names.push(player.name);
        }
    }
    return names;
}
