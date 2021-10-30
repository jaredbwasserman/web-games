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
        IO.socket.on('gameEnded', IO.onGameEnded);
        IO.socket.on('scoresReceived', IO.onScoresReceived);
        IO.socket.on('error', IO.onError);
    },

    onConnected: function () {
        console.log('connected!'); // TODO: Remove
    },

    onGameJoined: function (data) {
        console.log(`${data.name} joined game!`); // TODO: Remove
        App.toLobby(data);
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

        const playersList = document.getElementById('playersList');
        if (undefined !== playersList) {
            // Remove previous list
            while (playersList.firstChild) {
                playersList.removeChild(playersList.firstChild);
            }

            // Add new list
            playersList.appendChild(Util.makeUL(data.players));
        }

        // Tell server game type so new player can see game type
        if ('host' === App.role) {
            IO.socket.emit('gameTypeChanged', { gameId: App.gameId, gameType: App.gameType });
        }
    },

    onGameTypeChanged: function (data) {
        console.log(`game type is now ${data.gameType}`); // TODO: Remove

        if ('player' === App.role) {
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

    onError: function (data) {
        Swal.fire({
            position: 'top',
            icon: 'error',
            title: data.message,
            showConfirmButton: false,
            timer: 1500
        });
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

        if ('' === document.getElementById('joinGameCode').value) {
            Swal.fire({
                position: 'top',
                icon: 'error',
                title: 'Please enter a game code.',
                showConfirmButton: false,
                timer: 1500
            });
            return;
        }

        // Get the game code
        const gameId = document.getElementById('joinGameCode').value

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
        document.getElementById('joinGameCode').addEventListener('keypress', function (e) {
            if (13 === e.which && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('btnJoinGame').click();
            }
        });
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

        // Only host can start game
        if ('host' === App.role) {
            // Game button clicks change gameType
            App.gameButtons.forEach(gameButton => {
                gameButton.addEventListener('click', App.onGameButtonClick);
            });

            // Default game is random
            const defaultGameIndex = Util.getRandomInt(App.gameButtons.length);
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
    },

    toGame: async function (data) {
        // Error if no game
        if (!App.games[data.gameType]) {
            Swal.fire({
                position: 'top',
                icon: 'error',
                title: 'Game type does not exist.',
                showConfirmButton: false,
                timer: 1500
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
        if (data.scores.length <= 0) {
            return;
        }

        // Convert to local timezone
        data.scores.forEach(score => {
            if (score.data['START TIME']) {
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
                timer: 1500
            });

            document.getElementById('scorestab_0_row_0').click();
        }
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
                timer: 1500
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
