var clickerGame;
var clickerAnimals;
var clickerButtonPosition;
var clickerButtonDelay;
var clickerButtonIndex;
var clickerButton;

function clickerInit(data) {
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
    clickerButtonDelay = data.buttonDelay;
    clickerButtonIndex = data.buttonIndex;

    // TODO: Remove debug info
    console.log(`position is ${JSON.stringify(clickerButtonPosition, null, 4)}`);
    console.log(`delay is ${clickerButtonDelay}`);
    console.log(`index is ${clickerButtonIndex}`);
}

function clickerPreload() {
    clickerAnimals.forEach(animal => {
        this.load.image(animal, `game/clicker/assets/${animal}.png`);
    });
}

function clickerCreate() {
    setTimeout(
        () => this.physics.add
            .image(clickerButtonPosition.x, clickerButtonPosition.y, clickerAnimals[clickerButtonIndex])
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', clickerOnButtonClick),
        clickerButtonDelay
    );
}

function clickerUpdate() {
    // TODO: Implement
}

function clickerOnButtonClick() {
    console.log('clicked!'); // TODO: Remove

    // TODO: Implement
}

App.games['clicker'] = {};
App.games['clicker'].init = clickerInit;
