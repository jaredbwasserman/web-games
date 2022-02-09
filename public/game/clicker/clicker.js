var clickerGame;
var clickerAnimals;
var clickerButtonPosition;
var clickerButtonAppearTime;
var clickerButtonIndex;
var clickerButton;
var clickerEndTime;

function clickerInit(data) {
    // Create game
    const config = {
        type: Phaser.AUTO,
        parent: 'gameScreen',
        width: data.gameWidth,
        height: data.gameHeight,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false,
                gravity: { y: 0 }
            }
        },
        scene: {
            preload: clickerPreload,
            create: clickerCreate,
            update: clickerUpdate
        }
    };
    clickerGame = new Phaser.Game(config);

    // Init vars
    clickerAnimals = [
        'bear',
        'buffalo',
        'chick',
        'chicken',
        'cow',
        'crocodile',
        'dog',
        'duck',
        'elephant',
        'frog',
        'giraffe',
        'goat',
        'gorilla',
        'hippo',
        'horse',
        'monkey',
        'moose',
        'narwhal',
        'owl',
        'panda',
        'parrot',
        'penguin',
        'pig',
        'rabbit',
        'rhino',
        'sloth',
        'snake',
        'walrus',
        'whale',
        'zebra'
    ];
    clickerButtonPosition = data.buttonPosition;
    clickerButtonAppearTime = data.buttonAppearTime;
    clickerButtonIndex = data.buttonIndex;
    clickerEndTime = data.gameEndTime;

    // TODO: Remove debug info
    console.log(`position is ${JSON.stringify(clickerButtonPosition, null, 4)}`);
    console.log(`appear time is ${clickerButtonAppearTime}`);
    console.log(`index is ${clickerButtonIndex}`);
}

function clickerPreload() {
    clickerAnimals.forEach(animal => {
        this.load.image(animal, `game/clicker/assets/${animal}.png`);
    });
}

function clickerCreate() {
    setTimeout(
        () => clickerButton = this.physics.add
            .image(clickerButtonPosition.x, clickerButtonPosition.y, clickerAnimals[clickerButtonIndex])
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', clickerOnButtonClick),
        clickerButtonAppearTime - Date.now()
    );
}

function clickerUpdate() {
    // Game timer
    if (clickerEndTime) {
        const minutesRemaining = String(Math.max(0, Math.floor((clickerEndTime - Date.now()) / (60.0 * 1000.0)) % 60));
        const secondsRemaining = String(Math.max(0, Math.floor((clickerEndTime - Date.now()) / 1000.0) % 60));
        document.getElementById('gameTimer').innerHTML = minutesRemaining.padStart(2, '0') +
            ':' +
            secondsRemaining.padStart(2, '0');
    }
}

function clickerOnButtonClick() {
    const delayMilliseconds = Date.now() - clickerButtonAppearTime;
    clickerButton.destroy();
    IO.socket.emit('buttonClick', { socketId: App.socketId, delayMilliseconds: delayMilliseconds });
}

App.games['clicker'] = {};
App.games['clicker'].init = clickerInit;
