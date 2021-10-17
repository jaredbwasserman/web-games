;
jQuery(function ($) {
    'use strict';

    // Socket IO
    const IO = {
        init: function () {
            IO.socket = io();

            // Bind events
            IO.bindEvents();
        },

        bindEvents: function () {
            IO.socket.on('gameJoined', IO.onGameJoined);
            IO.socket.on('gameCreated', IO.onGameCreated);
        },

        onGameJoined: function (data) {
            // TODO: Handle error cases
            console.log("Join game!"); // TODO: Remove
            App.toLobby(data);
        },

        onGameCreated: function (data) {
            console.log("New game! " + data.gameId + " " + data.socketId); // TODO: Remove
            App.toLobby(data);
        }
    };

    // App
    const App = {
        init: function () {
            // Entry page
            this.toHome();

            // Bind events
            App.bindEvents();

            // Initialize the fastclick library
            FastClick.attach(document.body);
        },

        bindEvents: function () {
            document.getElementById('btnJoinGame').addEventListener('click', App.onJoinClick);
            document.getElementById('btnCreateGame').addEventListener('click', App.onCreateClick);
        },

        onJoinClick: function () {
            console.log('Clicked "Join A Game"'); // TODO: Remove

            // Get the game code
            const gameId = document.getElementById('joinGameCode').value

            IO.socket.emit('joinGame', { gameId: gameId });
        },

        onCreateClick: function () {
            console.log('Clicked "Create A Game"'); // TODO: Remove
            IO.socket.emit('createGame');
        },

        toHome: function () {
            document.getElementById('currentScreen').innerHTML = document.getElementById('introTemplate').innerHTML
        },

        toLobby: function (data) {
            App.gameId = data.gameId;
            App.socketId = data.socketId;
            App.role = data.role;

            // Update current html
            document.getElementById('currentScreen').innerHTML = document.getElementById('lobbyTemplate').innerHTML

            // Return home button
            document.getElementById('btnReturnHome').addEventListener('click', () => window.location.reload());

            // Share game code
            document.getElementById('gameCode').value = App.gameId;
            new ClipboardJS('#copyGameCode');

            // Only host can start game
            if (App.role !== 'host') {
                document.getElementById('btnStartGame').remove();
            }
        },

        toGame: function (data) {
            // TODO: Finish implementing
            // Load game
            $.getScript("js/games/{GAME}.js", function (data, textStatus, jqxhr) { });
        }
    }

    IO.init();
    App.init();
}($));
