module.exports = function (ioIn, socketIn, gamesIn, playersIn, gameIdIn, gameTypeIn, scoresIn) {
    const io = ioIn;
    const socket = socketIn;
    const games = gamesIn;
    const players = Object.fromEntries(
        // Filter to player or host role (exclude spectator)
        Object.entries(playersIn).filter(([socketId, player]) => {
            return gameIdIn === player.gameId &&
                ['host', 'player'].includes(player.role);
        })
    );
    const gameId = gameIdIn;
    const gameType = gameTypeIn;
    const scores = scoresIn;

    return {
        init: function (data) {
            console.log('starting dogfight server side code'); // TODO: Remove

            // Game width and height
            data.gameWidth = 900;
            data.gameHeight = 675;

            // Init player positions
            const playerWidth = 31;
            for (const [socketId, player] of Object.entries(players)) {
                player.rotation = -Math.PI / 2.0;
                player.x = Math.floor(Math.random() * (data.gameWidth - playerWidth + 1)) + playerWidth / 2;
                player.y = Math.floor(Math.random() * (data.gameHeight - playerWidth + 1)) + playerWidth / 2;
            }

            // Init bullets
            const bullets = {};
            for (const [socketId, player] of Object.entries(players)) {
                bullets[socketId] = [];
                for (var i = 0; i < 5; i++) {
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

            // Countdown timer 3 seconds
            games[gameId].clientStartTime = games[gameId].startTime + 3000;
            data.clientStartTime = games[gameId].clientStartTime;

            // Game end timer 1 minute
            data.gameEndTime = data.clientStartTime + 60000;
            setTimeout(this.onGameEnd(this), data.gameEndTime - games[gameId].startTime);

            // Set game players
            data.players = players;

            // Set countdown info
            data.countdownInfo = {}
            for (const [socketId, player] of Object.entries(players)) {
                data.countdownInfo[socketId] = 'plane color'; // TODO: HTML color
            }

            // Save the init data for spectators
            games[gameId].initData = data;

            // Broadcast game started to everyone
            io.sockets.in(gameId).emit('gameStarted', data);

            // Broadcast game can be spectated to everyone
            io.sockets.in(gameId).emit('spectateStarted', data);

            // Handle events
            this.handleEvents();
        },

        handleSpectate: function () {
            console.log(`Handle spectate with data ${JSON.stringify(games[gameId].initData, null, 4)}.`); // TODO: Remove

            // TODO: The data is the host's copy, so data for other players will not be current
            // Tell the requestor to start spectating
            socket.emit('spectateStarted', games[gameId].initData);

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
                    const gameScores = self.addGameScores();
                    io.sockets.in(gameId).emit('gameEnded', { gameId: gameId, scores: [gameScores] });
                }
            }
        },

        onGameEnd: function (self) {
            return function () {
                // Race condition - the game might have already ended
                if (!games[gameId] || 'ended' === games[gameId].status) {
                    return;
                }

                console.log(`Game ${gameType}:${gameId} over from time run out`); // TODO: Remove
                games[gameId].status = 'ended';
                const gameScores = self.addGameScores();
                io.sockets.in(gameId).emit('gameEnded', { gameId: gameId, scores: [gameScores] });
            }
        },

        getNumPlayersAlive: function () {
            const deathTimes = games[gameId].deathTimes;

            // Get total players
            const totalPlayers = Object.keys(players).length;

            // Get dead players
            var deadPlayers = 0;
            for (const [socketId, deathInfo] of Object.entries(deathTimes)) {
                if (deathInfo.deathTime) {
                    deadPlayers++;
                }
            }

            return totalPlayers - deadPlayers;
        },

        addGameScores: function () {
            const gameScores = {
                data: {
                    'GAME CODE': gameId,
                    'GAME TYPE': gameType,
                    'START TIME': games[gameId].clientStartTime
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

            // 2) Sorted reverse death time (can tie)
            const deathTimeList = [];
            for (const [socketId, player] of Object.entries(players)) {
                const deathInfo = deathTimes[socketId];
                if (deathInfo && !deathTimeList.includes(deathInfo.deathTime)) {
                    deathTimeList.push(deathInfo.deathTime);
                }
            }

            // Sort death times in reverse (so killed later is higher rank)
            deathTimeList.sort((a, b) => b - a);

            // Add ranks
            for (const [index, deathTime] of Object.entries(deathTimeList)) {
                const curRank = rankCount;
                for (const [socketId, player] of Object.entries(players)) {
                    const deathInfo = deathTimes[socketId];
                    if (deathInfo && deathTime === deathInfo.deathTime) {
                        gameScores.kids.push(
                            {
                                data: {
                                    'RANK': curRank,
                                    'NAME': player.name,
                                    'KILLED AFTER': Math.floor((deathTime - games[gameId].clientStartTime) / 1000.0) + ' s',
                                    'KILLED BY': deathTimes[socketId].killedBy
                                },
                                kids: []
                            }
                        );
                        rankCount++;
                    }
                }
            }

            // Scores will be displayed with most recent at top
            scores.unshift(gameScores);

            // Return scores for this game
            return gameScores;
        }
    };
};
