var dogfightGame;
var dogfightShip;
var dogfightPlayers;

function dogfightInit(data) {
    // Create game
    const config = {
        type: Phaser.AUTO,
        parent: 'gameScreen',
        width: 800,
        height: 600,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false,
                gravity: { y: 0 }
            }
        },
        scene: {
            preload: dogfightPreload,
            create: dogfightCreate,
            update: dogfightUpdate
        }
    };
    dogfightGame = new Phaser.Game(config);

    // Copy initial players
    dogfightPlayers = data.players;
}

function dogfightPreload() {
    this.load.image('playerShip', 'game/dogfight/assets/player_ship.png');
}

function dogfightCreate() {
    const self = this;

    // Init my ship
    for (const [socketId, player] of Object.entries(dogfightPlayers)) {
        if (socketId === App.socketId) {
            dogfightAddPlayer(self, player);
        }
    }

    // TODO: Update
    // IO.socket.on('gameStarted', onGameStarted);
}

function dogfightUpdate() { }

function dogfightAddPlayer(self, player) {
    self.dogfightShip = self.physics.add.image(player.x, player.y, 'playerShip').setOrigin(0.5, 0.5);
    self.dogfightShip.setDrag(100);
    self.dogfightShip.setAngularDrag(100);
    self.dogfightShip.setMaxVelocity(200);
}

App.games['dogfight'] = {};
App.games['dogfight'].init = dogfightInit;
