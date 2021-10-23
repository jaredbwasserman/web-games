var io;
var socket;
var games;
var players;
var gameId;
var gameType;

exports.init = function (ioIn, socketIn, gamesIn, playersIn, gameIdIn, gameTypeIn) {
    io = ioIn;
    socket = socketIn;
    games = gamesIn;
    players = playersIn;
    gameId = gameIdIn;
    gameType = gameTypeIn;

    console.log('starting dogfight server side code'); // TODO: Remove

    // Init player positions
    for (const [socketId, player] of Object.entries(players)) {
        if (player.gameId === gameId) {
            player.rotation = 0;
            player.x = Math.floor(Math.random() * 784) + 16;
            player.y = Math.floor(Math.random() * 584) + 16;
        }
    }

    // Broadcast game started to everyone
    io.sockets.in(gameId).emit('gameStarted', { gameId: gameId, gameType: gameType, players: players });
}
