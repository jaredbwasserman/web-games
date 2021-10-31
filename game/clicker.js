module.exports = function (ioIn, socketIn, gamesIn, playersIn, gameIdIn, gameTypeIn, scoresIn) {
    const io = ioIn;
    const socket = socketIn;
    const games = gamesIn;
    const players = Object.fromEntries(
        Object.entries(playersIn).filter(([socketId, player]) => gameIdIn === player.gameId)
    );
    const gameId = gameIdIn;
    const gameType = gameTypeIn;
    const scores = scoresIn;

    return {
        init: function (data) {
            console.log('starting clicker server side code'); // TODO: Remove

            // Countdown timer 3 seconds
            games[gameId].clientStartTime = games[gameId].startTime + 3000;
            data.clientStartTime = games[gameId].clientStartTime;

            // Game end timer 10 seconds
            data.gameEndTime = data.clientStartTime + 10000;
            setTimeout(this.onGameEnd(this), data.gameEndTime - games[gameId].startTime);

            // Broadcast game started to everyone
            data.players = players;
            io.sockets.in(gameId).emit('gameStarted', data);

            // Handle events
            this.handleEvents();
        },

        handleEvents: function () {
            // TODO: Fill in
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

        addGameScores: function () {
            // TODO: Remove
            return {};

            const gameScores = {
                data: {
                    'GAME CODE': gameId,
                    'GAME TYPE': gameType,
                    'START TIME': games[gameId].startTime
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
                            'KILLED AFTER': (deathTime - games[gameId].clientStartTime) / 1000.0 + ' seconds',
                            'KILLED BY': deathTimes[deathMap[deathTime]].killedBy
                        },
                        kids: []
                    }
                );

                rankCount++;
            }

            // Scores will be displayed with most recent at top
            scores.unshift(gameScores);

            // Return scores for this game
            return gameScores;
        }
    };
};
