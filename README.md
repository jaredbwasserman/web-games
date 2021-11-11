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
   1. Score immediately following a game would come from memory
   1. Scores in View Scores would populate from DB
   1. Flush game score to DB after game socket room no longer exists (last player leaves)
   1. Players table, Scores table, Games table
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
1. Separate log in from nickname so scores are tied to your real name but you can still use funny nicknames
1. Start new game with same players functionality
   1. Everyone in the game returns to lobby following a game but it's a new game
   1. Only host would have a button to "New Game with Existing Players" that would appear on the Scores page after a game is over
   1. How to deal with people leaving the Scores page (since it would assign a new socket ID)? 
1. Sanitize the game code so if you include an invisible carriage return at the end it still works
   1. Test this with copy/paste from Zoom
1. Add unique colors to dogfight instead of self blue enemy red
1. Make sure bullets cannot float (seems to have happened)
   1. Maybe someone got disconnected?
1. Get rid of tooltips when game starts
1. For dogfight, hold down does not work on track pad for firing bullets
1. Left-over bullets hang around
1. Consider making unique colors and tell the player during countdown what color you are
1. Display player name above/below plane in dogfight game
