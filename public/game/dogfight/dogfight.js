var dogfightGame;
var dogfightShip;
var dogfightBullets;
var dogfightPlayerBullets;
var dogfightEnemyBullets;
var dogfightLastFired;
var dogfightPlayers;
var dogfightEnemies;
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

    // Init vars
    dogfightBullets = data.bullets;
    dogfightPlayerBullets = [];
    dogfightEnemyBullets = {};
    dogfightLastFired = 0;
    dogfightPlayers = data.players;
    dogfightEnemies = {};

    IO.socket.on('playerMoved', dogfightOnPlayerMoved);
    IO.socket.on('bulletMoved', dogfightOnBulletMoved);
}

function dogfightOnPlayerMoved(data) {
    for (const [socketId, enemy] of Object.entries(dogfightEnemies)) {
        if (socketId === data.socketId) {
            enemy.setRotation(data.rotation);
            enemy.setPosition(data.x, data.y);
        }
    }
}

function dogfightOnBulletMoved(data) {
    // TODO

    // Handle enemy bullets
    for (const [socketId, bullets] of Object.entries(dogfightEnemyBullets)) {
        bullets.forEach(bullet => {

        });
    }
}

function dogfightPreload() {
    this.load.image('playerShip', 'game/dogfight/assets/player_ship.png');
    this.load.image('enemyShip', 'game/dogfight/assets/enemy_ship.png');
    this.load.image('playerBullet', 'game/dogfight/assets/player_bullet.png');
    this.load.image('enemyBullet', 'game/dogfight/assets/enemy_bullet.png');
}

function dogfightCreate() {
    const self = this;

    // Init ships
    for (const [socketId, player] of Object.entries(dogfightPlayers)) {
        if (socketId === App.socketId) {
            dogfightAddPlayer(self, player);
        }
        else {
            dogfightAddEnemy(self, player);
        }
    }

    // Init bullets
    for (const [socketId, bullets] of Object.entries(dogfightBullets)) {
        if (socketId === App.socketId) {
            bullets.forEach(bullet => {
                console.log('add bullet'); // TODO: Remove
                dogfightAddPlayerBullet(self, bullet);
            });
        }
        else {
            bullets.forEach(bullet => {
                dogfightAddEnemyBullet(self, bullet);
            });
        }
    }

    // Set up input
    this.dogfightKeyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dogfightKeyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dogfightKeyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.dogfightKeyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.input.mouse.disableContextMenu();
}

function dogfightUpdate() {
    if (!this.dogfightShip) {
        console.log('no ship'); // TODO: Remove
        return;
    }

    // Handle movement
    if (this.dogfightKeyA.isDown) {
        this.dogfightShip.setAngularVelocity(-150);
    } else if (this.dogfightKeyD.isDown) {
        this.dogfightShip.setAngularVelocity(150);
    } else {
        this.dogfightShip.setAngularVelocity(0);
    }
    if (this.dogfightKeyW.isDown) {
        this.physics.velocityFromRotation(this.dogfightShip.rotation + Math.PI / 2.0, -100, this.dogfightShip.body.acceleration);
    } else {
        this.dogfightShip.setAcceleration(0);
    }

    this.physics.world.wrap(this.dogfightShip, 5); // TODO: What is a good padding amt?

    // Handle disabling off-screen bullets
    dogfightPlayerBullets.forEach(bullet => {
        if (!onScreen(this, bullet)) {
            bullet.setPosition(-100, -100);
            bullet.setRotation(0);
            bullet.setVelocity(0, 0);
            bullet.setActive(false);
            bullet.setVisible(false);
        }
    });

    // Handle firing bullets
    const bullet = getFirstInactiveBullet();
    const dateNow = Date.now();
    if (bullet && this.input.activePointer.isDown && dateNow - dogfightLastFired > 1000) {
        bullet.setPosition(this.dogfightShip.x, this.dogfightShip.y);
        bullet.setRotation(this.dogfightShip.rotation);
        bullet.setMaxVelocity(1000);
        this.physics.velocityFromRotation(bullet.rotation + Math.PI / 2.0, -1000, bullet.body.acceleration);
        bullet.setActive(true);
        bullet.setVisible(true);
        dogfightLastFired = dateNow;
    }

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
    self.dogfightShip.setDepth(1);
}

function dogfightAddEnemy(self, player) {
    const enemy = self.add.sprite(player.x, player.y, 'enemyShip').setOrigin(0.5, 0.5);
    enemy.socketId = player.socketId;
    dogfightEnemies[enemy.socketId] = enemy;
}

function dogfightAddPlayerBullet(self, bulletIn) {
    const bullet = self.physics.add.image(bulletIn.x, bulletIn.y, 'playerBullet').setOrigin(0.5, 0.5).setDisplaySize(10, 17);
    bullet.setRotation(bulletIn.rotation);
    bullet.setActive(false);
    bullet.setVisible(false);
    dogfightPlayerBullets.push(bullet);
}

function dogfightAddEnemyBullet(self, bullet) {
    // TODO
    // dogfightEnemyBullets[bullet.socketId].push({

    // });
    // TODO: Set up collisions with enemy bullets
}

function getFirstInactiveBullet() {
    var bulletToReturn = null;
    dogfightPlayerBullets.forEach(bullet => {
        if (!bulletToReturn && !bullet.active) {
            bulletToReturn = bullet;
        }
    });
    return bulletToReturn;
}

function onScreen(self, object) {
    return self.cameras.main.worldView.contains(object.x, object.y);
}

App.games['dogfight'] = {};
App.games['dogfight'].init = dogfightInit;
