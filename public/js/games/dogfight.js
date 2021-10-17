const config = {
    type: Phaser.AUTO,
    parent: 'lobbyGame',
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
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() { }

function create() {
    this.socket = io();
}

function update() { }