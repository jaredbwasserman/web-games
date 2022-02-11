const generator = require('./util/generator');
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
    socket.on('roleChanged', onRoleChanged);
    socket.on('gameTypeChanged', onGameTypeChanged);
    socket.on('startGame', onStartGame);
    socket.on('gameStarted', onGameStarted);
    socket.on('requestSpectate', onRequestSpectate);
    socket.on('requestGames', onRequestGames);
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

    // Check if the game has any players
    var playerCount = 0;
    for (const [socketId, player] of Object.entries(players)) {
        if (gameId === player.gameId) {
            playerCount++;
        }
    }
    if (0 === playerCount) {
        delete games[gameId];

        // Emit updated game list
        onRequestGames({ isUpdate: true });
    }

    // TODO: Remove
    // console.log(`games is ${JSON.stringify(games, null, 4)}`);
}

function onRequestScores(data) {
    console.log('giving scores'); // TODO: Remove
    this.emit('scoresReceived', { scores: scores });
}

function onCreateGame(data) {
    // Create a unique room code
    const gameId = generator.generateUniqueGameCode(games);

    // TODO: Remove
    console.log(`New game ${gameId}`);

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

    // Emit updated game list
    onRequestGames({ isUpdate: true });

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

    // Error if game is over
    if (!['pending', 'in progress'].includes(games[gameId].status)) {
        this.emit('error', { message: `Unable to join ${games[gameId].status} game.` });
        return;
    }

    // Cannot spectate games that do not allow spectating
    if ('in progress' === games[gameId].status && !games[gameId].canSpectate) {
        this.emit('error', { message: `Unable to spectate games of type "${games[gameId].gameType}".` });
        return;
    }

    // Error if name is taken
    var foundMatch = false;
    for (const [socketId, player] of Object.entries(players)) {
        if (player.gameId === gameId && player.name === data.name) {
            foundMatch = true;
        }
    }
    if ('pending' === games[gameId].status && foundMatch) {
        this.emit('error', { message: `Name "${data.name}" taken. Please select a different name.` });
        return;
    }

    // Join the room
    this.join(gameId);

    // Add player
    const playerEntry = {
        gameId: gameId,
        gameType: games[gameId].gameType,
        socketId: this.id,
        name: data.name,
        role: ('pending' === games[gameId].status ? 'player' : 'spectator')
    };
    players[this.id] = playerEntry;

    this.emit('gameJoined', playerEntry);

    // Emit all players in room
    io.sockets.in(gameId).emit('playersUpdate', { players: getPlayerNames(gameId) });
}

function onRoleChanged(data) {
    players[this.id].role = data.role;

    // Emit all players in room
    io.sockets.in(data.gameId).emit('playersUpdate', { players: getPlayerNames(data.gameId) });
}

function onGameTypeChanged(data) {
    games[data.gameId].gameType = data.gameType;
    io.sockets.in(data.gameId).emit('gameTypeChanged', { gameType: data.gameType });
}

function onStartGame(data) {
    const gameId = data.gameId;
    const gameType = data.gameType;

    console.log(`Start game ${gameId} with gameType ${gameType}`); // TODO: Remove

    // Error if game does not exist
    if (!gameExists(gameId)) {
        this.emit('error', { message: 'Game does not exist.' });
        return;
    }

    // Error if server code does not exist
    if (!game[gameType]) {
        this.emit('error', { message: 'Game type does not exist.' });
        return;
    }

    // Get players for this game
    const playersForGame = Object.fromEntries(
        // Filter to player or host role (exclude spectator)
        Object.entries(players).filter(([socketId, player]) => {
            return gameId === player.gameId &&
                ['host', 'player'].includes(player.role);
        })
    );

    // Error if there are no players
    if (Object.keys(playersForGame).length <= 0) {
        this.emit('error', { message: 'Cannot start a game with no players.' });
        return;
    }

    // Error if there are too many players
    const maxPlayers = game[data.gameType].maxPlayers;
    if (Object.keys(playersForGame).length > maxPlayers) {
        this.emit('error', { message: `Cannot start ${gameType} game with more than ${maxPlayers} players.` });
        return;
    }

    // Update game
    games[gameId].status = 'in progress';
    games[gameId].gameType = gameType;
    games[gameId].canSpectate = game[data.gameType].canSpectate;
    games[gameId].startTime = Date.now();

    // Init game
    game[data.gameType](io, this, games, players, gameId, gameType, scores).init(data);

    // Emit updated game list
    onRequestGames({ isUpdate: true });
}

function onGameStarted(data) {
    // Only players will end up here
    game[data.gameType](io, this, games, data.players, data.gameId, data.gameType, scores).handleEvents();
}

function onRequestSpectate(data) {
    // Cannot spectate games that do not allow spectating
    if (!games[data.gameId].canSpectate) {
        this.emit('reset', { message: `Unable to spectate games of type "${games[data.gameId].gameType}".` });
        return;
    }

    // Only spectators will end up here
    game[data.gameType](io, this, games, players, data.gameId, data.gameType, scores).handleSpectate();
}

function onRequestGames(data) {
    console.log(`request games with ${JSON.stringify(data, null, 4)}`); // TODO: Remove

    const gamesToReturn = [];
    for (const [gameId, gameObj] of Object.entries(games)) {
        if ('pending' === gameObj.status ||
            ('in progress' === gameObj.status && gameObj.canSpectate)) {
            gamesToReturn.push({ id: gameId, status: gameObj.status });
        }
    }

    if (data.isUpdate) {
        // If a game was added or started, tell everyone
        io.sockets.emit('gamesReceived', { games: gamesToReturn });
    }
    else {
        // Return list to requestor
        this.emit('gamesReceived', { games: gamesToReturn });
    }
}

// Helper function to return whether a game exists
function gameExists(gameId) {
    return Array.from(io.sockets.adapter.rooms.keys()).includes(gameId) && games[gameId];
}

// Helper function to get a list of player names
function getPlayerNames(gameId) {
    const names = [];
    for (const [socketId, player] of Object.entries(players)) {
        if (player.gameId === gameId) {
            names.push({
                name: player.name,
                role: player.role
            });
        }
    }
    return names;
}
