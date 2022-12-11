# Web Games
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
1. Add animations to airfight for bullet collisions with enemies and enemy bullets with self
1. Bullet cone in front of plane based on pointer position
1. Persist scores to database or file
   1. Clean up scores array after persisting
   1. Score immediately following a game would come from memory
   1. Scores in View Scores would populate from DB
   1. Flush game score to DB after game socket room no longer exists (last player leaves)
   1. Players table, Scores table, Games table
1. Separate log in from nickname so scores are tied to your real name but you can still use funny nicknames
1. Start new game with same players functionality
   1. Everyone in the game returns to lobby following a game but it's a new game
   1. Only host would have a button to "New Game with Existing Players" that would appear on the Scores page after a game is over
   1. How to deal with people leaving the Scores page (since it would assign a new socket ID)?
1. Get rid of tooltips when game starts
1. For airfight, hold down does not work on track pad for firing bullets
1. Display player name above/below plane in airfight game
1. Bullets not tied to players except for scoring (so you could theoretically shoot yourself - although maybe not since when you first shoot it's overlapping)
   1. And the game itself could simulate the bullets instead of players doing it for their own bullets
   1. Invert bullet logic so you report if you get hit (not if you hit someone else)
   1. Server sets a velocity for it and updates everyone else’s bullet on their own client. When you fire it sends creation even to server and server tells everyone about new bullet to simulate
   1. Bullet create and bullet delete events instead of update
   1. Should handle case where player fires a bullet and then disconnects (which currently does not work)
1. Add game code to URL so sharing link gets you into game
1. Power ups
   1. Exactly one screen wrap for bullets in airfight game (currently 0)
1. Fix client lag
   1. See https://www.gabrielgambetta.com/client-server-game-architecture.html
1. Make it so the spectator start state is accurate
   1. The data is the host's copy, so data for other players will not be current
1. Add dodge functionality to airfight similar to Super Smash
1. More gameplay modes for airfight
   1. Add barriers into the map that block planes and bullets
   1. Add some CPU planes that shoot at people
   1. Add a PvP mode maybe with teams
1. Tournament mode
1. Investigate bug where if you click enter game twice and there was lag, it gives name already taken error
   1. Similar bug happens where you can end up with multiple games that do not exist but they show up as buttons
1. Look into not using client time for airfight to avoid errors when someone's time is off
1. Replay functionality to rewatch games
1. Put name of color in parens
1. Airfight movement
   1. Add sideways movement with Q and E for airfight
   1. Add ability for plane to move backwards in airfight
1. Make airfight planes forward accelerate faster to make it easier to move
1. Sim bullets on client only send create destroy events for them (since there are a lot bullets) - test this with 2 play and 3 play
1. Airfight battle royale mode
   1. Shrinking arena
   1. Maybe circular?
1. Airfight kill streak similar to LoL "double kill"
1. Make countdown audible (in addition to visual) so you can hear "3, 2, 1" to alert you
1. Make multiple animals for clicker and you have to click the correct one
1. Bug where you refresh while in an airfight game and then you end up in your own game
1. See if moving mouse around a lot before clicking on animal causes delay for click time because it’s processing mouse move events
1. Calculate killed after time in airfight based on server time not client time (in case client time is wrong)
1. If host leaves, make someone else host
