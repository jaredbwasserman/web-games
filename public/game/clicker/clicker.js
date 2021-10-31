var clickerGame;

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
}

function clickerPreload() {
    // TODO: Implement
}

function clickerCreate() {
    // TODO: Implement
}

function clickerUpdate() {
    // TODO: Implement
}

App.games['clicker'] = {};
App.games['clicker'].init = clickerInit;
