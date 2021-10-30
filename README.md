# Web Game
A collection of web games.

## Notes
1. Code based on [Create a Basic Multiplayer Game in Phaser 3 with Socket.io](https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-1/).
1. Code based on [anagrammatix](https://github.com/ericterpstra/anagrammatix).
1. Assets from [Kenney](https://kenney.nl/).

## TODO
1. Add more games
1. Add instructions for how to add games
1. Add instructions for local setup and running
1. Update URLs so browser back button works?
1. Game type stored in client/server
1. Make the buttons un-highlight when hover exit (copy game code works but not the other ones)
1. Make the game grid centered better
1. Cool background images in places
1. Test what happens if host or player disconnects during game
1. Add game status so you cannot join a game that is in progress or one that has ended
1. Add player number lower and upper bounds when starting game and error if not met
1. Send error and terminate client side game if room no longer exists (host leaves and causes room to drop)
   1. Clean up games entry for this case
1. Add logic to remove players from game when they disconnect (see tutorial)
1. What to do if user does not consent to cookies?
1. Add animations to dogfight for bullet collisions with enemies and enemy bullets with self
1. Bullet cone in front of plane based on pointer position
1. Server timer for 30 seconds and send game end event and have 3 second countdown client side (3 + 30 seconds)
   1. Need to set game ended true for this case
1. Add kill count stat for dogfight
1. If player disconnects, need to handle in both game (remove ship) and final score
1. There are race conditions in dogfight game end logic
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
   1. Test concurrent games
1. Harder to hide with screen wrap in dogfight
1. Make sure only one bullet collision event with enemy
1. Why are there late arriving events?
1. Ships immune for the first few seconds of dogfight
