# serpenta
### A snake game!
The Main Idea for this game is to basically have a snake type game mechanic with the addition of the need to cover five tiles on the board to complete levels. Scoring higher could be achieved by multiplying your score by covering the tiles with the smallest snake possible. 

observe latest demo code in action here :P
http://serpenta.demo.codes


## TODO:

- Intro Screen

- reimplement "eye" switch pathfinding/graph searching algorithm so it doesn't randomly hang if it walks into a corner

- reimplement the "findFreeCell" recursion method for respawning "apples" so it doesn't blow up if there are no more free cells possible to find

- reorganize code to assist in re-initializing game after beating/losing levels

- some kind of score keeping system

- implement exit goal "apple" (after all "eye" switches are covered)

- touch controls for mobile devices

- tweak control scheme with debouncing so users can turn faster (instead of just queuing up turn requests before next tick updates)

- SWEAT SPRITE GRAPHICS

- sound FX

- eventually port the whole thing to native iOS + native android code :P



## marked done:

- Smooth animation on canvas snake drawing
- some kind of path finding algo to generate "eye" switches (right now just purple squares)
- basic input scheme implemented
- naive controlls updated so you can't turn backwards on yourself
- started encapsulating code to head off spaghetti before things get too big
- set up subdomain


## ongoing:

- constantly update readme
- start using branches for updates :P
- actually push code