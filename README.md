# Web Game
A collection of web games.

## Run Locally
### Set up
1. Node.js: `v14.0.0`

### Run
```
> npm install
> node server.js

# Open browser at localhost:8080
```

## Notes
1. Code based on [Create a Basic Multiplayer Game in Phaser 3 with Socket.io](https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-1/).
1. Code based on [anagrammatix](https://github.com/ericterpstra/anagrammatix).
1. Assets from [Kenney](https://kenney.nl/).
   1. https://www.kenney.nl/assets/pixel-shmup
   1. https://www.kenney.nl/assets/topdown-tanks
   1. https://www.kenney.nl/assets/animal-pack-redux

## TODO
1. Add more games
1. Cool background images in places
1. Send error and terminate client side game if room no longer exists (host leaves and causes room to drop)
1. What to do if user does not consent to cookies?
1. Add animations to dogfight for bullet collisions with enemies and enemy bullets with self
1. Bullet cone in front of plane based on pointer position
1. Add kill count stat for dogfight
1. Persist scores to database or file
   1. Clean up scores array after persisting
1. Test cases
   1. test disconnect works
   1. test host can win
   1. test player can win
   1. test 3 people where one wins
   1. test 3 people with timeout
   1. check die and then disconnect
   1. check disconnect before die
   1. tie with 2 people alive 1 dead
   1. tie with 3 people alive no dead
   1. test concurrent games
1. Ships immune for the first few seconds of dogfight
1. Multicast pending games on intro page so you can click to enter rather than type game code
1. Add game duration to scores
1. Clicker
   1. Randomly pick an animal to click on server and tell client index
   1. Make sure same animal for all players
   1. Random delay for animal to appear (calculated on server then same for all clients - send time to appear)
   1. Make sure position for clicker buttons is always totally on screen
1. Add Meta title html info
