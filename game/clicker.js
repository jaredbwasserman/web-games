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

            // Init click times
            games[gameId].clickTimes = {};

            // Button position
            data.buttonPosition = {
                x: Math.floor(Math.random() * 601) + 100,
                y: Math.floor(Math.random() * 401) + 100
            };

            // Button animal index (30 animals total)
            data.buttonIndex = Math.floor(Math.random() * 30);

            // Countdown timer 3 seconds
            games[gameId].clientStartTime = games[gameId].startTime + 3000;
            data.clientStartTime = games[gameId].clientStartTime;

            // Game end timer 10 seconds
            data.gameEndTime = data.clientStartTime + 10000;
            setTimeout(this.onGameEnd(this), data.gameEndTime - games[gameId].startTime);

            // Button appear time
            const buttonDelay = Math.floor(Math.random() * 2001) + 1000;
            data.buttonAppearTime = data.clientStartTime + buttonDelay;

            // Broadcast game started to everyone
            data.players = players;
            io.sockets.in(gameId).emit('gameStarted', data);

            // Handle events
            this.handleEvents();
        },

        handleEvents: function () {
            socket.on('buttonClick', this.onButtonClick(this));
        },

        onButtonClick: function (self) {
            return function (data) {
                // Race condition - the game might have already ended
                if ('ended' === games[gameId].status) {
                    console.log(`Late arriving event (game already ended): ${JSON.stringify(data, null, 4)}`); // TODO: Remove
                    return;
                }

                // Update click time
                const clickTimes = games[gameId].clickTimes;
                if (!clickTimes[data.socketId]) {
                    clickTimes[data.socketId] = {
                        clickTime: data.delayMilliseconds
                    };
                }

                // Check for game end
                if (self.getNumPlayersNotClicked() <= 0) {
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

        getNumPlayersNotClicked: function () {
            const clickTimes = games[gameId].clickTimes;

            // Get total players
            const totalPlayers = Object.keys(players).length;

            // Get players who clicked
            var clickedPlayers = 0;
            for (const [socketId, clickInfo] of Object.entries(clickTimes)) {
                if (clickInfo.clickTime) {
                    clickedPlayers++;
                }
            }

            return totalPlayers - clickedPlayers;
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
            const clickTimes = games[gameId].clickTimes;

            // Rank count
            var rankCount = 1;

            // 1) Sorted click time (can tie)
            // Get list of click times
            // Get map from clickTime to socketId
            const clickTimeList = [];
            const clickMap = {};
            for (const [socketId, player] of Object.entries(players)) {
                const clickInfo = clickTimes[socketId];
                if (clickInfo) {
                    clickTimeList.push(clickInfo.clickTime);
                    clickMap[clickInfo.clickTime] = socketId;
                }
            }

            // Sort click times
            clickTimeList.sort();

            // Add ranks
            var prevRank = 0;
            var prevClickTime = 0;
            for (const [index, clickTime] of Object.entries(clickTimeList)) {
                const player = players[clickMap[clickTime]];

                // Check for tie
                var curRank = rankCount;
                if (prevClickTime === clickTime) {
                    curRank = prevRank;
                }
                else {
                    prevRank = curRank;
                    prevClickTime = clickTime;
                }

                gameScores.kids.push(
                    {
                        data: {
                            'RANK': curRank,
                            'NAME': player.name,
                            'CLICKED AFTER': clickTime + ' ms'
                        },
                        kids: []
                    }
                );

                rankCount++;
            }

            // 2) Did not click
            for (const [socketId, player] of Object.entries(players)) {
                const clickInfo = clickTimes[socketId];
                if (!clickInfo) {
                    gameScores.kids.push(
                        {
                            data: {
                                'RANK': rankCount,
                                'NAME': player.name
                            },
                            kids: []
                        }
                    );
                }
            }

            // Scores will be displayed with most recent at top
            scores.unshift(gameScores);

            // Return scores for this game
            return gameScores;
        }
    };
};
