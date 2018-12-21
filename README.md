# serpenta
### A snake game!
The Main Idea for this game is to basically have a snake type game mechanic with the addition of the need to cover five tiles on the board to complete levels. Scoring higher could be achieved by having a multiplier that increases when the player covers the tiles with the smallest snake possible. 

observe latest demo code in action here :P
http://serpenta.demo.codes

## History

- (0.0.2) - 12/20/18: Hacked in a pause button (pressing space will freeze and unfreeze game during play)

- (0.0.1) - 12/20/18: Got a basic game state working with smooth animation, keyboard controls, and a prototype of the Five switch tiles mechanic. 


## TODO:

- reorganize code to assist in re-initializing game after beating/losing levels

- Intro Screen

- tweak control scheme with debouncing so users can turn faster (instead of just queuing up turn requests before next tick updates)

- reimplement "eye" switch pathfinding/graph searching algorithm so it doesn't randomly hang if it walks into a corner

- reimplement the "findFreeCell" recursion method for respawning "apples" so it doesn't blow up if there are no more free cells possible to find

- some kind of score keeping system

- implement exit goal "apple" (after all "eye" switches are covered)

- touch controls for mobile devices

- SWEAT SPRITE GRAPHICS

- sound FX

- eventually port the whole thing to native iOS + native android code :P


## marked done:

- basic input scheme implemented
- naive controlls updated so you can't turn backwards on yourself
- Smooth animation on canvas snake drawing
- started encapsulating code to head off spaghetti before things get too big
- some kind of path finding algo to generate "eye" switches (right now just purple squares)
- set up subdomain
- can pause and unpause the game


## ongoing:

- constantly update readme
- start using branches for updates :P
- - (subnote: start using master/develop // feature branches)
- actually push code