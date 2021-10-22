const dogfight = {
    game: undefined,

    init: function () {
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
                preload: this.preload,
                create: this.create,
                update: this.update
            }
        };

        game = new Phaser.Game(config);
    },

    preload: function () { },

    create: function () { },

    update: function () { }
}
