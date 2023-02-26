var airfightGame;
var airfightShip;
var airfightBullets;
var airfightPlayerBullets;
var airfightEnemyBullets;
var airfightLastFired;
var airfightPlayers;
var airfightEnemies;
var airfightKeyA;
var airfightKeyD;
var airfightKeyW;
var airfightKeySpace;
var airfightKilled;
var airfightSpectator;
var airfightStartTime;
var airfightEndTime;
var airfightCanFire;
var airfightTweens;
var airfightEnableDebug;
var airfightToggleDebug;

function airfightInit(data) {
    // Init vars
    airfightBullets = data.bullets;
    airfightPlayerBullets = [];
    airfightEnemyBullets = {};
    airfightLastFired = 0;
    airfightPlayers = data.players;
    airfightEnemies = {};
    airfightStartTime = data.clientStartTime;
    airfightEndTime = data.gameEndTime;
    airfightCanFire = false;
    airfightTweens = [];
    airfightEnableDebug = App.name.toLowerCase().startsWith('debug');

    // Handle spectators
    if ('spectator' === App.role) {
        airfightSpectator = true;
    }

    // Create game
    const config = {
        type: Phaser.AUTO,
        parent: 'gameScreen',
        width: data.gameWidth,
        height: data.gameHeight,
        physics: {
            default: 'arcade',
            arcade: {
                debug: airfightEnableDebug
            }
        },
        scene: {
            preload: airfightPreload,
            create: airfightCreate,
            update: airfightUpdate
        }
    };
    airfightGame = new Phaser.Game(config);

    IO.socket.on('playerMoved', airfightOnPlayerMoved);
    IO.socket.on('bulletMoved', airfightOnBulletMoved);
    IO.socket.on('killed', airfightOnKilled);
}

function airfightOnPlayerMoved(data) {
    for (const [socketId, enemy] of Object.entries(airfightEnemies)) {
        if (socketId === data.socketId) {
            enemy.setRotation(data.rotation);
            enemy.setPosition(data.x, data.y);
        }
    }
}

function airfightOnBulletMoved(data) {
    // Handle enemy bullets
    for (const [socketId, bullets] of Object.entries(airfightEnemyBullets)) {
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

function airfightOnKilled(data) {
    if (App.socketId === data.socketId) {
        console.log(`My ship ${JSON.stringify(airfightShip, null, 4)} is killed.`); // TODO: Remove
        airfightDisableObject(airfightShip);
        airfightKilled = true;
    }
    else {
        for (const [socketId, enemy] of Object.entries(airfightEnemies)) {
            if (socketId === data.socketId) {
                enemy.destroy();
            }
        }
    }
}

function airfightPreload() {
    this.load.image('ship', 'game/airfight/assets/ship.png');
    this.load.image('bullet', 'game/airfight/assets/bullet.png');
}

function airfightCreate() {
    const self = this;

    // Init ships
    for (const [socketId, player] of Object.entries(airfightPlayers)) {
        if (socketId === App.socketId) {
            airfightAddPlayer(self, player);

            // Indicate my own plane color
            const gameInfo = document.getElementById('gameInfo');
            gameInfo.innerText = 'This is your plane color.'
            gameInfo.style.color = player.color.replace('0x', '#');
        }
        else {
            airfightAddEnemy(self, player);
        }
    }

    // Init bullets
    for (const [socketId, bullets] of Object.entries(airfightBullets)) {
        if (socketId === App.socketId) {
            bullets.forEach(bullet => {
                console.log('add bullet'); // TODO: Remove
                airfightAddPlayerBullet(self, bullet);
            });
        }
        else {
            bullets.forEach(bullet => {
                airfightAddEnemyBullet(self, bullet);
            });
        }
    }

    // Set up input
    this.airfightKeyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.airfightKeyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.airfightKeyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.airfightKeySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Start next game phase after 3.5 seconds
    setTimeout(
        function () {
            // Set player plane alpha to 1
            airfightTweens.forEach(tween => {
                tween.stop();
                tween.targets[0].setAlpha(1);
            });

            // Set enemy plane alphas to 1
            for (const [socketId, enemy] of Object.entries(airfightEnemies)) {
                enemy.setAlpha(1);
            }

            // Able to fire bullets
            airfightCanFire = true;
        },
        airfightStartTime + 3500 - Date.now()
    );

    // Dynamic debug
    // See https://phaser.discourse.group/t/turn-on-off-debug-at-runtime/3681/2
    this.physics.world.drawDebug = false;
    this.airfightToggleDebug = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);
}

function airfightUpdate() {
    // Game timer
    if (airfightEndTime) {
        const minutesRemaining = String(Math.max(0, Math.floor((airfightEndTime - Date.now()) / (60.0 * 1000.0)) % 60));
        const secondsRemaining = String(Math.max(0, Math.floor((airfightEndTime - Date.now()) / 1000.0) % 60));
        if (null !== document.getElementById('gameTimer')) {
            document.getElementById('gameTimer').innerHTML = minutesRemaining.padStart(2, '0') +
                ':' +
                secondsRemaining.padStart(2, '0');
        }
    }

    // Dynamic debug
    if (airfightEnableDebug && Phaser.Input.Keyboard.JustDown(this.airfightToggleDebug)) {
        if (this.physics.world.drawDebug) {
            this.physics.world.drawDebug = false;
            this.physics.world.debugGraphic.clear();
        }
        else {
            this.physics.world.drawDebug = true;
        }
    }

    // Skip everything if spectating
    if (airfightSpectator) {
        return;
    }

    if (!airfightKilled) {
        // Handle movement
        if (airfightHasLeftInput(this) && !airfightHasRightInput(this)) {
            airfightShip.setAngularVelocity(-300);
        } else if (airfightHasRightInput(this) && !airfightHasLeftInput(this)) {
            airfightShip.setAngularVelocity(300);
        } else {
            airfightShip.setAngularVelocity(0);
        }
        if (airfightHasUpInput(this)) {
            this.physics.velocityFromRotation(airfightShip.rotation, 250, airfightShip.body.acceleration);
        } else {
            airfightShip.setAcceleration(0);
        }
    }

    this.physics.world.wrap(airfightShip, -10);

    // Handle disabling off-screen bullets
    airfightPlayerBullets.forEach(bullet => {
        if (!airfightOnScreen(this, bullet)) {
            airfightDisableObject(bullet);
        }
    });

    if (!airfightKilled) {
        // Handle firing bullets
        const bullet = airfightGetFirstInactiveBullet();
        const dateNow = Date.now();
        if (airfightCanFire && bullet && airfightHasFireInput(this) && dateNow - airfightLastFired > 500) {
            bullet.setPosition(airfightShip.x, airfightShip.y);
            this.physics.velocityFromRotation(airfightShip.rotation, 350, bullet.body.velocity);
            bullet.setActive(true);
            bullet.setVisible(true);
            airfightLastFired = dateNow;
        }
    }

    // Emit player movement
    const curX = airfightShip.x;
    const curY = airfightShip.y;
    const curR = airfightShip.rotation;
    if (airfightShip.oldPosition && (
        curX !== airfightShip.oldPosition.x ||
        curY !== airfightShip.oldPosition.y ||
        curR !== airfightShip.oldPosition.rotation)) {
        IO.socket.emit('playerMovement', {
            x: airfightShip.x,
            y: airfightShip.y,
            rotation: airfightShip.rotation
        });
    }

    // Save old position data
    airfightShip.oldPosition = {
        x: curX,
        y: curY,
        rotation: curR
    };

    // Emit bullet movement
    for (const [index, bullet] of Object.entries(airfightPlayerBullets)) {
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

function airfightAddPlayer(self, player) {
    airfightShip = self.physics.add.image(player.x, player.y, 'ship');
    airfightShip.setRotation(player.rotation);
    airfightShip.setTint(player.color);
    airfightShip.setOrigin(0.5, 0.5);
    airfightShip.setCircle(15, 0, 0);
    airfightShip.setGravity(0, 0);
    airfightShip.setDamping(true);
    airfightShip.setDrag(0.65);
    airfightShip.setMaxVelocity(250);
    airfightShip.setDepth(100);

    // Flash to indicate bullets cannot be shot yet
    airfightTweens.push(
        self.tweens.add({
            targets: airfightShip,
            alpha: 0.1,
            duration: 250,
            ease: 'Power0',
            yoyo: true,
            repeat: -1
        })
    );
}

function airfightAddEnemy(self, player) {
    const enemy = self.physics.add.image(player.x, player.y, 'ship');
    enemy.setRotation(player.rotation);
    enemy.setTint(player.color);
    enemy.setOrigin(0.5, 0.5);
    enemy.setCircle(15, 0, 0);
    enemy.setGravity(0, 0);
    enemy.setDepth(50);
    enemy.setAlpha(0.5); // Enemies slightly transparent at the beginning of the game
    enemy.socketId = player.socketId;
    airfightEnemies[enemy.socketId] = enemy;
}

function airfightAddPlayerBullet(self, bulletIn) {
    const bullet = self.physics.add.image(bulletIn.x, bulletIn.y, 'bullet');
    bullet.setTint(bulletIn.color);
    bullet.setOrigin(0.5, 0.5);
    bullet.setCircle(7, 0, 0);
    bullet.setGravity(0, 0);
    bullet.setDepth(75);
    bullet.setActive(false);
    bullet.setVisible(false);

    // Collision handler
    for (const [socketId, enemy] of Object.entries(airfightEnemies)) {
        self.physics.add.overlap(enemy, bullet, function () {
            console.log(`bullet collide with enemy!`); // TODO: Remove
            airfightDisableObject(bullet);
            enemy.destroy();
            IO.socket.emit('enemyHit', { killerSocketId: App.socketId, socketId: socketId, killTime: Date.now() });
        }, null, self);
    }

    airfightPlayerBullets.push(bullet);
}

function airfightAddEnemyBullet(self, bulletIn) {
    const bullet = self.physics.add.image(bulletIn.x, bulletIn.y, 'bullet');
    bullet.setTint(bulletIn.color);
    bullet.setOrigin(0.5, 0.5);
    bullet.setCircle(7, 0, 0);
    bullet.setGravity(0, 0);
    bullet.setDepth(25);
    bullet.socketId = bulletIn.socketId;
    bullet.index = bulletIn.index;

    if (!airfightEnemyBullets[bullet.socketId]) {
        airfightEnemyBullets[bullet.socketId] = [];
    }
    airfightEnemyBullets[bullet.socketId].push(bullet);
}

function airfightGetFirstInactiveBullet() {
    var bulletToReturn = null;
    airfightPlayerBullets.forEach(bullet => {
        if (!bulletToReturn && !bullet.active) {
            bulletToReturn = bullet;
        }
    });
    return bulletToReturn;
}

function airfightDisableObject(obj) {
    if (!obj) {
        return;
    }

    obj.setPosition(-100, -100);
    obj.setVelocity(0, 0);
    obj.setActive(false);
    obj.setVisible(false);
}

function airfightOnScreen(self, object) {
    return self.cameras.main.worldView.contains(object.x, object.y);
}

function airfightHasLeftInput(self) {
    return self.airfightKeyA.isDown;
}

function airfightHasRightInput(self) {
    return self.airfightKeyD.isDown;
}

function airfightHasUpInput(self) {
    return self.airfightKeyW.isDown;
}

function airfightHasFireInput(self) {
    return self.input.activePointer.isDown || self.airfightKeySpace.isDown;
}

App.games['airfight'] = {};
App.games['airfight'].init = airfightInit;
