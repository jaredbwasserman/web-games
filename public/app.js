// Cookieconsent
window.cookieconsent.initialise({
    'palette': {
        'popup': {
            'background': '#237afc'
        },
        'button': {
            'background': '#fff',
            'text': '#237afc'
        }
    },
    'content': {
        'message': 'This website uses cookies.'
    },
    'theme': 'edgeless',
    'position': 'top'
});

// In case there was a reset
window.onload = function () {
    const resetting = sessionStorage.getItem('reset');
    if (resetting) {
        Swal.fire({
            position: 'top',
            icon: 'error',
            title: resetting,
            showConfirmButton: false,
            timer: 2000
        });
        sessionStorage.removeItem('reset');
    }
}

// Socket IO
const IO = {
    socket: undefined,

    init: function () {
        IO.socket = io();

        // Bind events
        IO.bindEvents();
    },

    bindEvents: function () {
        IO.socket.on('connected', IO.onConnected);
        IO.socket.on('gameJoined', IO.onGameJoined);
        IO.socket.on('gameCreated', IO.onGameCreated);
        IO.socket.on('playersUpdate', IO.onPlayersUpdated);
        IO.socket.on('gameTypeChanged', IO.onGameTypeChanged);
        IO.socket.on('gameStarted', IO.onGameStarted);
        IO.socket.on('spectateStarted', IO.onSpectateStarted);
        IO.socket.on('gameEnded', IO.onGameEnded);
        IO.socket.on('scoresReceived', IO.onScoresReceived);
        IO.socket.on('gamesReceived', IO.onGamesReceived);
        IO.socket.on('error', IO.onError);
        IO.socket.on('reset', IO.onReset);
    },

    onConnected: function () {
        console.log('connected!'); // TODO: Remove
    },

    onGameJoined: function (data) {
        console.log(`${data.name} joined game!`); // TODO: Remove
        App.toLobby(data);
        if ('spectator' === data.role) {
            IO.socket.emit('requestSpectate', data);
        }
    },

    onGameCreated: function (data) {
        console.log(`${data.name} new game with gameId ${data.gameId}`); // TODO: Remove
        App.toLobby(data);
    },

    onPlayersUpdated: function (data) {
        // TODO: Remove
        console.log(`New list of players!`);
        for (let i = 0; i < data.players.length; i++) {
            console.log(data.players[i]);
        }

        if (0 === document.getElementsByClassName('lobbyScreen').length) {
            return;
        }

        const playersList = document.getElementById('playersList');
        if (undefined !== playersList) {
            // Remove previous list
            while (playersList.firstChild) {
                playersList.removeChild(playersList.firstChild);
            }

            // Add new list
            playersList.appendChild(Util.makeUL(data.players));
        }
    },

    onGameTypeChanged: function (data) {
        console.log(`game type is now ${data.gameType}`); // TODO: Remove

        if ('host' !== App.role) {
            // Remove curGame from all the game buttons
            App.gameButtons.forEach(gameButton => {
                gameButton.removeAttribute('curGame');
            });

            // Set curGame for clicked game button
            document.getElementById(data.gameType).setAttribute('curGame', true);
        }
    },

    onGameStarted: function (data) {
        console.log(`started game ${JSON.stringify(data, null, 4)}`); // TODO: Remove

        // Tell server to handle events
        if ('player' === App.role) {
            IO.socket.emit('gameStarted', data);
        }

        if ('spectator' === App.role) {
            IO.socket.emit('requestSpectate', data);
        }
        else {
            // Update client
            App.toGame(data);
        }
    },

    onSpectateStarted: function (data) {
        if ('spectator' !== App.role) {
            return;
        }

        console.log(`started spectating game ${JSON.stringify(data, null, 4)}`); // TODO: Remove

        // Update client
        App.toGame(data);
    },

    onGameEnded: function (data) {
        console.log(`Game ended ${JSON.stringify(data, null, 4)}`); // TODO: Remove
        App.toScores(data);
    },

    onScoresReceived: function (data) {
        App.toScores(data);
    },

    onGamesReceived: function (data) {
        console.log(`games: ${JSON.stringify(data.games, null, 4)}`); // TODO: Remove

        if (0 === document.getElementsByClassName('introScreen').length) {
            return;
        }

        const gamesList = document.getElementById('gamesList');
        if (undefined !== gamesList) {
            // Remove previous buttons
            while (gamesList.firstChild) {
                gamesList.removeChild(gamesList.firstChild);
            }

            // Add new buttons
            Util.makeGameButtons(gamesList, data.games);
        }
    },

    onError: function (data) {
        Swal.fire({
            position: 'top',
            icon: 'error',
            title: data.message,
            showConfirmButton: false,
            timer: 2000
        });
    },

    onReset: function (data) {
        sessionStorage.setItem('reset', data.message);
        window.location.reload();
    }
};

// App
const App = {
    gameId: '',
    socketId: '',
    name: '',
    role: '',
    gameType: '',
    gameButtons: [],
    games: [],

    init: function () {
        // Entry page
        this.toHome();

        // Bind events
        App.bindEvents();
    },

    bindEvents: function () {
        document.getElementById('btnViewScores').addEventListener('click', App.onViewScoresClick);
        document.getElementById('btnJoinGame').addEventListener('click', App.onJoinClick);
        document.getElementById('btnCreateGame').addEventListener('click', App.onCreateClick);
    },

    onViewScoresClick: function () {
        IO.socket.emit('requestScores');
    },

    onJoinClick: function () {
        console.log('Clicked "Join A Game"'); // TODO: Remove

        const name = Util.getName();
        if (!name) {
            return;
        }

        if ('' === document.getElementById('joinGameCode').value.trim()) {
            Swal.fire({
                position: 'top',
                icon: 'error',
                title: 'Please enter a game code.',
                showConfirmButton: false,
                timer: 2000
            });
            return;
        }

        // Get the game code
        const gameId = document.getElementById('joinGameCode').value.trim()

        IO.socket.emit('joinGame', { gameId: gameId, name: name });
    },

    onCreateClick: function () {
        console.log('Clicked "Create A Game"'); // TODO: Remove

        const name = Util.getName();
        if (!name) {
            return;
        }

        IO.socket.emit('createGame', { name: name });
    },

    onGameButtonClick: function () {
        console.log(`Clicked ${this.id}`); // TODO: Remove

        // Remove curGame from all the game buttons
        App.gameButtons.forEach(gameButton => {
            gameButton.removeAttribute('curGame');
        });

        // Set curGame for clicked game button
        this.setAttribute('curGame', true);

        // Set App gameType
        App.gameType = this.id;

        // Tell server different game type
        IO.socket.emit('gameTypeChanged', { gameId: App.gameId, gameType: App.gameType });
    },

    onStartClick: function () {
        // Tell server to start the game
        IO.socket.emit('startGame', { gameId: App.gameId, gameType: App.gameType, socketId: App.socketId });
    },

    toHome: function () {
        // Intro template
        document.getElementById('currentScreen').innerHTML = document.getElementById('introTemplate').innerHTML;

        // Name from cookie
        document.getElementById('name').value = Util.getCookie('name');

        // Enter to join game
        document.getElementById('joinGameCode').addEventListener('keydown', function (e) {
            if ('Enter' === e.key && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('btnJoinGame').click();
            }
        });

        // Get games list
        IO.socket.emit('requestGames', {});
    },

    toLobby: function (data) {
        App.gameId = data.gameId;
        App.socketId = data.socketId;
        App.name = data.name;
        App.role = data.role;

        // Update current html
        document.getElementById('currentScreen').innerHTML = document.getElementById('lobbyTemplate').innerHTML;

        // Return home button
        document.getElementById('btnReturnHomeLobby').addEventListener('click', () => window.location.reload());

        // Share game code
        document.getElementById('gameCode').value = App.gameId;
        new ClipboardJS('#copyGameCode');

        // Init game buttons
        App.gameButtons = Array.from(document.getElementsByClassName('gameBtn'));

        // Set game type
        IO.onGameTypeChanged({ gameType: data.gameType });

        // Only host can start game
        if ('host' === App.role) {
            // Game button clicks change gameType
            App.gameButtons.forEach(gameButton => {
                gameButton.addEventListener('click', App.onGameButtonClick);
            });

            // Default game is the first game
            const defaultGameIndex = 0;
            App.gameButtons[defaultGameIndex].click();

            // Start game button
            document.getElementById('btnStartGame').addEventListener('click', App.onStartClick);
        }
        else {
            // Game buttons disabled
            App.gameButtons.forEach(gameButton => {
                gameButton.disabled = true;
            });

            // Start game disabled
            document.getElementById('btnStartGame').disabled = true;
        }

        // Tooltips
        Array.from(document.querySelectorAll('[tippy-content]')).forEach(item => {
            tippy(`#${item.id}`, {
                allowHTML: true,
                content: `${item.getAttribute('tippy-content')}`,
                placement: `${item.getAttribute('tippy-placement')}`,
                trigger: 'mouseenter'
            });
        });

        // Spectator
        document.getElementById('spectateCheckbox').addEventListener('change', () => {
            if (document.getElementById('spectateCheckbox').checked) {
                App.prevRole = App.role;
                App.role = 'spectator';
            }
            else {
                App.role = App.prevRole;
            }
            IO.socket.emit('roleChanged', { role: App.role });
        });
    },

    toGame: async function (data) {
        // Error if no game
        if (!App.games[data.gameType]) {
            Swal.fire({
                position: 'top',
                icon: 'error',
                title: 'Game type does not exist.',
                showConfirmButton: false,
                timer: 2000
            });
            return;
        }

        // Switch to game template
        document.getElementById('currentScreen').innerHTML = document.getElementById('gameTemplate').innerHTML;

        // Update title
        document.getElementById('gameTitle').innerHTML = data.gameType.toUpperCase();

        // Return home button
        document.getElementById('btnReturnHomeGame').addEventListener('click', () => window.location.reload());

        // Countdown timer
        if (data.clientStartTime) {
            const interval = setInterval(function () {
                const secondsRemaining = Math.ceil((data.clientStartTime - Date.now()) / 1000.0) % 60;
                document.getElementById('countdownTimer').innerHTML = secondsRemaining;
            }, 100);

            await Util.sleep(data.clientStartTime - Date.now());
            clearInterval(interval);
        }
        document.getElementById('countdownTimer').remove();

        // Load game
        App.games[data.gameType].init(data);
    },

    toScores: function (data) {
        // Switch to scores template
        document.getElementById('currentScreen').innerHTML = document.getElementById('scoresTemplate').innerHTML;

        // Return home button
        document.getElementById('btnReturnHomeScores').addEventListener('click', () => window.location.reload());

        // Exit if there are no scores
        if (!data.scores || data.scores.length <= 0) {
            return;
        }

        // Convert to local timezone
        data.scores.forEach(score => {
            if (score.data && score.data['START TIME']) {
                score.data['START TIME'] = new Date(score.data['START TIME']).toLocaleString();
            }
        });

        // Load scores
        const settings = {
            iDisplayLength: 100,
            bLengthChange: false,
            bFilter: false,
            bSort: false,
            bInfo: false
        };
        const table = new nestedTables.TableHierarchy(
            'scores',
            data.scores,
            settings
        );
        table.initializeTableHierarchy();

        // Swal if just came from a game
        if (data.gameId) {
            Swal.fire({
                position: 'top',
                icon: 'info',
                title: 'Game over!',
                showConfirmButton: false,
                timer: 2000
            });

            document.getElementById('scorestab_0_row_0').click();
        }

        // Emit updated game list (to remove this game that just ended)
        IO.socket.emit('requestGames', { isUpdate: true });
    }
};

// Util
const Util = {
    makeUL: function (array) {
        // Create the list element:
        const list = document.createElement('ul');

        for (var i = 0; i < array.length; i++) {
            // Create the list item:
            var item = document.createElement('li');

            // Set its contents:
            item.appendChild(document.createTextNode(array[i]));

            // Add it to the list:
            list.appendChild(item);
        }

        // Finally, return the constructed list:
        return list;
    },

    makeGameButtons: function (buttonGroup, gameButtonInfo) {
        for (var i = 0; i < gameButtonInfo.length; i++) {
            // Create the button
            const gameId = gameButtonInfo[i].id;
            const status = gameButtonInfo[i].status;
            const gameButton = document.createElement("button");
            gameButton.innerHTML = gameId;

            // Colors
            gameButton.classList.add('gameListBtn');
            if ('in progress' === status) {
                gameButton.classList.add('gameListBtnYellow');
            }

            // Add callback
            gameButton.addEventListener('click', () => {
                const name = Util.getName();
                if (!name) {
                    return;
                }

                IO.socket.emit('joinGame', { gameId: gameId, name: name });
            });

            // Add the button to the group
            buttonGroup.appendChild(gameButton);
        }
    },

    // Max is exclusive so it's [0, max)
    // And since it's integer, it's [0, max-1]
    getRandomInt: function (maxExclusive) {
        return Math.floor(Math.random() * maxExclusive);
    },

    setCookie: function (cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        let expires = 'expires=' + d.toUTCString();
        document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
    },

    getCookie: function (cname) {
        let name = cname + '=';
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    },

    getName: function () {
        const name = document.getElementById('name').value;
        if ('' === name) {
            Swal.fire({
                position: 'top',
                icon: 'error',
                title: 'Please enter a name.',
                showConfirmButton: false,
                timer: 2000
            });
            return '';
        }
        Util.setCookie('name', name, 365);
        return name;
    },

    sleep: async function (milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
};

IO.init();
App.init();
