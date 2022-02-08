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
var dogfightKilled;
var dogfightSpectator;
var dogfightStartTime;
var dogfightEndTime;
var dogfightCanFire;
var dogfightTweens;

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
                debug: false
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
    dogfightStartTime = data.clientStartTime;
    dogfightEndTime = data.gameEndTime;
    dogfightCanFire = false;
    dogfightTweens = [];

    // Handle spectators
    if ('spectator' === App.role) {
        dogfightSpectator = true;
    }

    IO.socket.on('playerMoved', dogfightOnPlayerMoved);
    IO.socket.on('bulletMoved', dogfightOnBulletMoved);
    IO.socket.on('killed', dogfightOnKilled);
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
    // Handle enemy bullets
    for (const [socketId, bullets] of Object.entries(dogfightEnemyBullets)) {
        if (socketId === data.socketId) {
            bullets.forEach(bullet => {
                if (bullet.index === data.index) {
                    bullet.setRotation(data.rotation);
                    bullet.setPosition(data.x, data.y);
                }
            });
        }
    }
}

function dogfightOnKilled(data) {
    if (App.socketId === data.socketId) {
        console.log(`My ship ${JSON.stringify(dogfightShip, null, 4)} is killed.`); // TODO: Remove
        disableObject(dogfightShip);
        dogfightKilled = true;
    }
    else {
        for (const [socketId, enemy] of Object.entries(dogfightEnemies)) {
            if (socketId === data.socketId) {
                enemy.destroy();
            }
        }
    }
}

function dogfightPreload() {
    this.load.image('ship', 'game/dogfight/assets/ship.png');
    this.load.image('bullet', 'game/dogfight/assets/bullet.png');
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

    // Stop ship flashing 3.5 seconds after the start of the game
    setTimeout(
        function () {
            dogfightTweens.forEach(tween => {
                tween.stop();
                tween.targets[0].setAlpha(1);
            });
            dogfightCanFire = true;
        },
        dogfightStartTime + 3500 - Date.now()
    );
}

function dogfightUpdate() {
    // Game timer
    if (dogfightEndTime) {
        const minutesRemaining = String(Math.max(0, Math.floor((dogfightEndTime - Date.now()) / (60.0 * 1000.0)) % 60));
        const secondsRemaining = String(Math.max(0, Math.floor((dogfightEndTime - Date.now()) / 1000.0) % 60));
        if (null !== document.getElementById('gameTimer')) {
            document.getElementById('gameTimer').innerHTML = minutesRemaining.padStart(2, '0') +
                ':' +
                secondsRemaining.padStart(2, '0');
        }
    }

    // Skip everything if spectating
    if (dogfightSpectator) {
        return;
    }

    if (!dogfightKilled) {
        // Handle movement
        if (this.dogfightKeyA.isDown) {
            dogfightShip.setAngularVelocity(-300);
        } else if (this.dogfightKeyD.isDown) {
            dogfightShip.setAngularVelocity(300);
        } else {
            dogfightShip.setAngularVelocity(0);
        }
        if (this.dogfightKeyW.isDown) {
            this.physics.velocityFromRotation(dogfightShip.rotation, 250, dogfightShip.body.acceleration);
        } else {
            dogfightShip.setAcceleration(0);
        }
    }

    this.physics.world.wrap(dogfightShip, -10);

    // Handle disabling off-screen bullets
    dogfightPlayerBullets.forEach(bullet => {
        if (!onScreen(this, bullet)) {
            disableObject(bullet);
        }
    });

    if (!dogfightKilled) {
        // Handle firing bullets
        const bullet = getFirstInactiveBullet();
        const dateNow = Date.now();
        if (dogfightCanFire && bullet && this.input.activePointer.isDown && dateNow - dogfightLastFired > 500) {
            bullet.setPosition(dogfightShip.x, dogfightShip.y);
            this.physics.velocityFromRotation(dogfightShip.rotation, 350, bullet.body.velocity);
            bullet.setActive(true);
            bullet.setVisible(true);
            dogfightLastFired = dateNow;
        }
    }

    // Emit player movement
    const curX = dogfightShip.x;
    const curY = dogfightShip.y;
    const curR = dogfightShip.rotation;
    if (dogfightShip.oldPosition && (
        curX !== dogfightShip.oldPosition.x ||
        curY !== dogfightShip.oldPosition.y ||
        curR !== dogfightShip.oldPosition.rotation)) {
        IO.socket.emit('playerMovement', {
            x: dogfightShip.x,
            y: dogfightShip.y,
            rotation: dogfightShip.rotation
        });
    }

    // Save old position data
    dogfightShip.oldPosition = {
        x: curX,
        y: curY,
        rotation: curR
    };

    // Emit bullet movement
    for (const [index, bullet] of Object.entries(dogfightPlayerBullets)) {
        const curX = bullet.x;
        const curY = bullet.y;
        if (bullet.oldPosition && (
            curX !== bullet.oldPosition.x ||
            curY !== bullet.oldPosition.y)) {
            IO.socket.emit('bulletMovement', {
                socketId: App.socketId,
                index: index,
                x: bullet.x,
                y: bullet.y,
                rotation: bullet.rotation
            });
        }

        // Save old position data
        bullet.oldPosition = {
            x: curX,
            y: curY
        };
    }
}

function dogfightAddPlayer(self, player) {
    dogfightShip = self.physics.add.image(player.x, player.y, 'ship');
    dogfightShip.setRotation(player.rotation);
    dogfightShip.setTint(0x2cc5f6);
    dogfightShip.setOrigin(0.5, 0.5);
    dogfightShip.setCircle(15, 0, 0);
    dogfightShip.setGravity(0, 0);
    dogfightShip.setDamping(true);
    dogfightShip.setDrag(0.65);
    dogfightShip.setMaxVelocity(250);
    dogfightShip.setDepth(100);

    // Flash to indicate bullets cannot be shot yet
    dogfightTweens.push(
        self.tweens.add({
            targets: dogfightShip,
            alpha: 0.1,
            duration: 400,
            ease: 'Power0',
            yoyo: true,
            repeat: -1
        })
    );
}

function dogfightAddEnemy(self, player) {
    const enemy = self.physics.add.image(player.x, player.y, 'ship');
    enemy.setRotation(player.rotation);
    enemy.setTint(0xf51414);
    enemy.setOrigin(0.5, 0.5);
    enemy.setCircle(15, 0, 0);
    enemy.setGravity(0, 0);
    enemy.setDepth(50);
    enemy.socketId = player.socketId;
    dogfightEnemies[enemy.socketId] = enemy;

    // Flash to indicate bullets cannot be shot yet
    dogfightTweens.push(
        self.tweens.add({
            targets: enemy,
            alpha: 0.1,
            duration: 400,
            ease: 'Power0',
            yoyo: true,
            repeat: -1
        })
    );
}

function dogfightAddPlayerBullet(self, bulletIn) {
    const bullet = self.physics.add.image(bulletIn.x, bulletIn.y, 'bullet');
    bullet.setTint(0x2cc5f6);
    bullet.setOrigin(0.5, 0.5);
    bullet.setCircle(7, 0, 0);
    bullet.setGravity(0, 0);
    bullet.setDepth(75);
    bullet.setActive(false);
    bullet.setVisible(false);

    // Collision handler
    for (const [socketId, enemy] of Object.entries(dogfightEnemies)) {
        self.physics.add.overlap(enemy, bullet, function () {
            console.log(`bullet collide with enemy!`); // TODO: Remove
            disableObject(bullet);
            enemy.destroy();
            IO.socket.emit('enemyHit', { killerSocketId: App.socketId, socketId: socketId, killTime: Date.now() });
        }, null, self);
    }

    dogfightPlayerBullets.push(bullet);
}

function dogfightAddEnemyBullet(self, bulletIn) {
    const bullet = self.physics.add.image(bulletIn.x, bulletIn.y, 'bullet');
    bullet.setTint(0xf51414);
    bullet.setOrigin(0.5, 0.5);
    bullet.setCircle(7, 0, 0);
    bullet.setGravity(0, 0);
    bullet.setDepth(25);
    bullet.socketId = bulletIn.socketId;
    bullet.index = bulletIn.index;

    if (!dogfightEnemyBullets[bullet.socketId]) {
        dogfightEnemyBullets[bullet.socketId] = [];
    }
    dogfightEnemyBullets[bullet.socketId].push(bullet);
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

function disableObject(obj) {
    if (!obj) {
        return;
    }

    obj.setPosition(-100, -100);
    obj.setVelocity(0, 0);
    obj.setActive(false);
    obj.setVisible(false);
}

function onScreen(self, object) {
    return self.cameras.main.worldView.contains(object.x, object.y);
}

App.games['airfight'] = {};
App.games['airfight'].init = dogfightInit;
