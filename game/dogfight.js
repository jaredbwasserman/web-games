module.exports = function (ioIn, socketIn, gamesIn, playersIn, gameIdIn, gameTypeIn) {
    const io = ioIn;
    const socket = socketIn;
    const games = gamesIn;
    const players = playersIn;
    const gameId = gameIdIn;
    const gameType = gameTypeIn;

    return {
        init: function (data) {
            console.log('starting dogfight server side code'); // TODO: Remove

            // Init player positions
            for (const [socketId, player] of Object.entries(players)) {
                if (player.gameId === gameId) {
                    player.rotation = 0;
                    player.x = Math.floor(Math.random() * 700) + 50;
                    player.y = Math.floor(Math.random() * 500) + 50;
                }
            }

            // Init bullets
            data.bullets = {};
            for (const [socketId, player] of Object.entries(players)) {
                data.bullets[socketId] = [];
                for (var i = 0; i < 3; i++) {
                    data.bullets[socketId].push({
                        socketId: socketId,
                        rotation: 0,
                        x: -100,
                        y: -100
                    });
                }
            }

            // Broadcast game started to everyone
            io.sockets.in(gameId).emit('gameStarted', data);
        },

        handleEvents: function () {
            socket.on('playerMovement', this.onPlayerMovement);
        },

        onPlayerMovement: function (data) {
            // Update player info
            players[this.id].x = data.x;
            players[this.id].y = data.y;
            players[this.id].rotation = data.rotation;

            // Emit movement to all players about the player that moved
            socket.broadcast.emit('playerMoved', players[this.id]);
        }
    };
};
