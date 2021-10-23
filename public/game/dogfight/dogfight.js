var dogfightGame;
var dogfightShip;
var dogfightPlayers;
var dogfightEnemies; // TODO: Might be redundant on dogfightPlayers
var dogfightKeyA;
var dogfightKeyS;
var dogfightKeyD;
var dogfightKeyW;

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
    dogfightEnemies = {};

    IO.socket.on('playerMoved', dogfightOnPlayerMoved);
}

function dogfightOnPlayerMoved(data) {
    for (const [socketId, enemy] of Object.entries(dogfightEnemies)) {
        if (socketId === data.socketId) {
            enemy.setRotation(data.rotation);
            enemy.setPosition(data.x, data.y);
        }
    }
}

function dogfightPreload() {
    this.load.image('playerShip', 'game/dogfight/assets/player_ship.png');
    this.load.image('enemyShip', 'game/dogfight/assets/enemy_ship.png');
}

function dogfightCreate() {
    const self = this;

    // Init my ship
    for (const [socketId, player] of Object.entries(dogfightPlayers)) {
        if (socketId === App.socketId) {
            dogfightAddPlayer(self, player);
        }
        else {
            dogfightAddEnemy(self, player);
        }
    }

    // Set up input
    this.dogfightKeyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dogfightKeyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dogfightKeyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.dogfightKeyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
}

function dogfightUpdate() {
    if (!this.dogfightShip) {
        console.log('no ship'); // TODO: Remove
        return;
    }

    if (this.dogfightKeyA.isDown) {
        this.dogfightShip.setAngularVelocity(-150);
    } else if (this.dogfightKeyD.isDown) {
        this.dogfightShip.setAngularVelocity(150);
    } else {
        this.dogfightShip.setAngularVelocity(0);
    }

    if (this.dogfightKeyW.isDown) {
        this.physics.velocityFromRotation(this.dogfightShip.rotation + 1.5, -100, this.dogfightShip.body.acceleration);
    } else {
        this.dogfightShip.setAcceleration(0);
    }

    this.physics.world.wrap(this.dogfightShip, 5); // TODO: What is a good padding amt?

    // Emit player movement
    const curX = this.dogfightShip.x;
    const curY = this.dogfightShip.y;
    const curR = this.dogfightShip.rotation;
    if (this.dogfightShip.oldPosition && (
        curX !== this.dogfightShip.oldPosition.x ||
        curY !== this.dogfightShip.oldPosition.y ||
        curR !== this.dogfightShip.oldPosition.rotation)) {
        IO.socket.emit('playerMovement', {
            x: this.dogfightShip.x,
            y: this.dogfightShip.y,
            rotation: this.dogfightShip.rotation
        });
    }

    // Save old position data
    this.dogfightShip.oldPosition = {
        x: curX,
        y: curY,
        rotation: curR
    };
}

function dogfightAddPlayer(self, player) {
    self.dogfightShip = self.physics.add.image(player.x, player.y, 'playerShip').setOrigin(0.5, 0.5);
    self.dogfightShip.setDrag(100);
    self.dogfightShip.setAngularDrag(100);
    self.dogfightShip.setMaxVelocity(200);
}

function dogfightAddEnemy(self, player) {
    const enemy = self.add.sprite(player.x, player.y, 'enemyShip').setOrigin(0.5, 0.5);
    enemy.socketId = player.socketId;
    dogfightEnemies[enemy.socketId] = enemy;
}

App.games['dogfight'] = {};
App.games['dogfight'].init = dogfightInit;
