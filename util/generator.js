const { uniqueNamesGenerator, adjectives, animals } = require('unique-names-generator');

exports.generateUniqueGameCode = function (games) {
    do {
        var gameCode = uniqueNamesGenerator(
            {
                dictionaries: [adjectives, animals],
                separator: '-'
            }
        );
    } while (games[gameCode]);

    return gameCode;
}
