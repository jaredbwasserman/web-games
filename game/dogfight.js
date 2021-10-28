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

            // Broadcast game started to everyone
            io.sockets.in(gameId).emit('gameStarted', data);

            // Handle events
            this.handleEvents();
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
            io.sockets.in(gameId).emit('playerMoved', players[this.id]);
        },

        onBulletMovement: function (data) {
            const bullets = games[gameId].bullets;

            // Update bullet info
            bullets[this.id][data.index].x = data.x;
            bullets[this.id][data.index].y = data.y;
            bullets[this.id][data.index].rotation = data.rotation;

            // Emit bullet movement to all players about the bullet that moved
            io.sockets.in(gameId).emit('bulletMoved', bullets[this.id][data.index]);
        },

        onEnemyHit: function (self) {
            return function (data) {
                // Race condition - the game might have already ended
                if ('ended' === games[gameId].status) {
                    console.log(`Late arriving event (game already ended): ${JSON.stringify(data, null, 4)}`); // TODO: Remove
                    return;
                }

                // Update death time
                const deathTimes = games[gameId].deathTimes;
                if (!deathTimes[data.socketId]) {
                    deathTimes[data.socketId] = {
                        deathTime: data.killTime,
                        killedBy: players[data.killerSocketId].name
                    };
                }

                // Tell everone the enemy that was hit to destroy
                io.sockets.in(gameId).emit('killed', data);

                // TODO: Is it possible for 0 players to be alive?
                // Check for game end
                if (self.getNumPlayersAlive() <= 1) {
                    console.log(`Game ${gameType}:${gameId} over`); // TODO: Remove
                    games[gameId].status = 'ended';
                    self.addGameScores();
                    io.sockets.in(gameId).emit('gameEnded', { gameId: gameId, scores: scores });
                }
            }
        },

        getNumPlayersAlive: function () {
            const deathTimes = games[gameId].deathTimes;

            // Get total players
            var totalPlayers = 0;
            for (const [socketId, player] of Object.entries(players)) {
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
        addGameScores: function () {
            const gameScores = {
                data: {
                    'GAME CODE': gameId,
                    'GAME TYPE': gameType,
                    'START TIME': new Date(games[gameId].startTime)
                },
                kids: []
            };
            const deathTimes = games[gameId].deathTimes;

            // Rank count
            var rankCount = 1;

            // 1) Anyone still alive (can tie)
            for (const [socketId, player] of Object.entries(players)) {
                const deathInfo = deathTimes[socketId];
                if (!deathInfo) {
                    gameScores.kids.push(
                        {
                            data: {
                                'RANK': 1,
                                'NAME': player.name
                            },
                            kids: []
                        }
                    );

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

                gameScores.kids.push(
                    {
                        data: {
                            'RANK': curRank,
                            'NAME': player.name,
                            'KILLED AFTER': (deathTime - games[gameId].startTime) / 1000.0 + ' seconds',
                            'KILLED BY': deathTimes[deathMap[deathTime]].killedBy
                        },
                        kids: []
                    }
                );

                rankCount++;
            }

            // Scores will be displayed with most recent at top
            scores.unshift(gameScores);
        }
    };
};
