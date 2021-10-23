var io;
var socket;
var games;
var players;
var gameId;

exports.init = function (ioIn, socketIn, gamesIn, playersIn, gameIdIn) {
    io = ioIn;
    socket = socketIn;
    games = gamesIn;
    players = playersIn;
    gameId = gameIdIn;

    console.log('starting dogfight server side code'); // TODO: Remove

    // Broadcast game started to everyone
    io.sockets.in(gameId).emit('gameStarted', games[gameId]);
}
