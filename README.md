# Web Game
A collection of multiplayer minigames.

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
1. Send error and terminate client side game if room no longer exists (host leaving should cause room to drop)
   1. Also `onRequestGames({ isUpdate: true })` for this case
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
1. Separate log in from nickname so scores are tied to your real name but you can still use funny nicknames
1. Start new game with same players functionality
   1. Everyone in the game returns to lobby following a game but it's a new game
   1. Only host would have a button to "New Game with Existing Players" that would appear on the Scores page after a game is over
   1. How to deal with people leaving the Scores page (since it would assign a new socket ID)?
1. Add unique colors to dogfight instead of self blue enemy red
1. Get rid of tooltips when game starts
1. For dogfight, hold down does not work on track pad for firing bullets
1. Consider making unique colors and tell the player during countdown (or under game timer) what color you are
1. Display player name above/below plane in dogfight game
1. Bullets not tied to players except for scoring (so you could theoretically shoot yourself - although maybe not since when you first shoot it's overlapping)
   1. And the game itself could simulate the bullets instead of players doing it for their own bullets
   1. Invert bullet logic so you report if you get hit (not if you hit someone else)
   1. Server sets a velocity for it and updates everyone else’s bullet on their own client. When you fire it sends creation even to server and server tells everyone about new bullet to simulate
   1. Bullet create and bullet delete events instead of update
   1. Should handle case where player fires a bullet and then disconnects (which currently does not work)
1. Add game code to URL so sharing link gets you into game
1. Exactly one screen wrap for bullets in dogfight game (currently 0)
1. Spectator mode for dogfight (and maybe clicker and all games?)
   1. Can join as spectator if you do any of
      1. Click on join game button for a game that is already in progress
      1. Type in game code and join game that is already in progress
      1. Check a box in lobby of pending game saying you want to be a spectator
   1. Color of join game buttons is green right now and filtered to pending games
      1. Can modify so filter includes in progress games too
      1. Still remove buttons for games that have ended
      1. In progress games would have yellow button instead of green button
      1. The button could change color using event (similar to remove event) so it happens immediately without need refresh
      1. Test cases like state change and add game works for both existing people looking at home page and new people joining home page
   1. Modify errors
      1. Instead of error message when join in progress game, should let you in as spectator
1. Fix client lag
   1. See https://www.gabrielgambetta.com/client-server-game-architecture.html
1. Refactor dogfight to airfight
