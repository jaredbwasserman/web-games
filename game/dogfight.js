module.exports = function (ioIn, socketIn, gamesIn, playersIn, gameIdIn, gameTypeIn, scoresIn) {
    const io = ioIn;
    const socket = socketIn;
    const games = gamesIn;
    const players = playersIn;
    const gameId = gameIdIn;
    const gameType = gameTypeIn;
    const scores = scoresIn;

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
            const bullets = {};
            for (const [socketId, player] of Object.entries(players)) {
                bullets[socketId] = [];
                for (var i = 0; i < 3; i++) {
                    bullets[socketId].push({
                        socketId: socketId,
                        index: i,
                        rotation: 0,
                        x: -100,
                        y: -100
                    });
                }
            }
            games[gameId].bullets = bullets;
            data.bullets = bullets;

            // Init death times
            games[gameId].deathTimes = {};

            // Keep track of whether the game ended
            games[gameId].ended = false;

            // Init scores
            scores[gameId] = {};
            scores[gameId].gameId = gameId;
            scores[gameId].gameType = gameType;
            scores[gameId].startTime = Date.now();
            scores[gameId].scores = [];

            // Broadcast game started to everyone
            io.sockets.in(gameId).emit('gameStarted', data);
        },

        handleEvents: function () {
            socket.on('playerMovement', this.onPlayerMovement);
            socket.on('bulletMovement', this.onBulletMovement);
            socket.on('enemyHit', this.onEnemyHit(this));
        },

        onPlayerMovement: function (data) {
            // Update player info
            players[this.id].x = data.x;
            players[this.id].y = data.y;
            players[this.id].rotation = data.rotation;

            // Emit movement to all players about the player that moved
            socket.broadcast.emit('playerMoved', players[this.id]);
        },

        onBulletMovement: function (data) {
            const bullets = games[gameId].bullets;

            // Update bullet info
            bullets[this.id][data.index].x = data.x;
            bullets[this.id][data.index].y = data.y;
            bullets[this.id][data.index].rotation = data.rotation;

            // Emit bullet movement to all players about the bullet that moved
            socket.broadcast.emit('bulletMoved', bullets[this.id][data.index]);
        },

        onEnemyHit: function (self) {
            return function (data) {
                // Race condition - the game might have already ended
                if (games[gameId].ended) {
                    console.log(`Late arriving event (game already ended): ${JSON.stringify(data, null, 4)}`); // TODO: Remove
                    return;
                }

                // Update death time
                const deathTimes = games[gameId].deathTimes;
                if (!deathTimes[data.socketId]) {
                    deathTimes[data.socketId] = {
                        deathTime: data.killTime
                        // TODO: Killed by
                        // TODO: List of other players someone killed (stored in players makes sense)
                    };
                }

                // Tell the enemy that was hit to destroy
                socket.broadcast.emit('killed', data);

                // TODO: Is it possible for 0 players to be alive?
                // Check for game end
                if (self.getNumPlayersAlive() <= 1) {
                    console.log(`Game ${gameType}:${gameId} over`); // TODO: Remove
                    games[gameId].ended = true;
                    io.sockets.in(gameId).emit('gameEnded', self.getFinalScore());
                }
            }
        },

        getNumPlayersAlive: function () {
            const deathTimes = games[gameId].deathTimes;

            // Get total players
            const totalPlayers = 0;
            for (const [socketId, player] of Object.entries(deathTimes)) {
                if (player.gameId === gameId) {
                    totalPlayers++;
                }
            }

            // Get dead players
            var deadPlayers = 0;
            for (const [socketId, deathInfo] of Object.entries(deathTimes)) {
                if (deathInfo.deathTime) {
                    deadPlayers++;
                }
            }

            return totalPlayers - deadPlayers;
        },

        // TODO: Call at 30 seconds over
        getFinalScore: function () {
            const gameScores = scores[gameId].scores;
            const deathTimes = games[gameId].deathTimes;

            // Rank count
            var rankCount = 1;

            // 1) Anyone still alive (can tie)
            for (const [socketId, player] of Object.entries(players)) {
                const deathInfo = deathTimes[socketId];
                if (!deathInfo) {
                    gameScores.push({
                        rank: 1,
                        name: player.name,
                        data: {}
                    });

                    rankCount++;
                }
            }

            // 2) Sorted reverse kill time (can tie)
            // Get list of death times
            // Get map from deathTime to socketId
            const deathTimeList = [];
            const deathMap = {};
            for (const [socketId, player] of Object.entries(players)) {
                const deathInfo = deathTimes[socketId];
                if (deathInfo) {
                    deathTimeList.push(deathInfo.deathTime);
                    deathMap[deathInfo.deathTime] = socketId;
                }
            }

            // Sort death times and reverse (so killed later is higher rank)
            deathTimeList.sort();
            deathTimeList.reverse();

            // Add ranks
            var prevRank = 0;
            var prevDeathTime = 0;
            for (const [index, deathTime] of Object.entries(deathTimeList)) {
                const player = players[deathMap[deathTime]];

                // Check for tie
                var curRank = rankCount;
                if (prevDeathTime === deathTime) {
                    curRank = prevRank;
                }
                else {
                    prevRank = curRank;
                    prevDeathTime = deathTime;
                }

                gameScores.push({
                    rank: curRank,
                    name: player.name,
                    data: {
                        deathTime: deathTime
                    }
                });

                rankCount++;
            }

            return scores[gameId];
        }
    };
};
