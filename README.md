# serpenta
### A snake game!
The Main Idea for this game is to basically have a snake type game mechanic with the addition of the need to cover five tiles on the board to complete levels. Scoring higher could be achieved by having a multiplier that increases when the player covers the tiles with the smallest snake possible. 

observe latest demo code in action here :P
http://serpenta.demo.codes

## History

- (0.0.5) - 12/22/18: Added basic introduction screen with instructions for play

- (0.0.4) - 12/21/18: Added "Golden Apple" that appears after you have covered all five 'eye' tile-switches. Once you unlock the golden apple, eating it completes the level. There's also a simple level complete screen that shows you the score you earned for that level.

- (0.0.3) - 12/21/18: Added a GAME OVER screen (and code to reinitialize the game after you exit the game over screen of course!)

- (0.0.2) - 12/21/18: Hacked in a pause button (pressing space will freeze and unfreeze game during play but this is only a basic change and needs further refining) 

- (0.0.1) - 12/21/18: Got a basic game state working with smooth animation, keyboard controls, and a prototype of the Five switch tiles mechanic. 

- (0.0.0) - 12/11/18 to 12/20/18.. wrote a bunch of code :P


## TODO:

- Add a screen for pausing

- fix pausing so in-between update states are preserved after unpausing!

- sound FX

- touch controls for mobile devices

- Need to track score between levels

    - Number of lives and scoring for extra lives system

    - once out of lives, game over screen goes back to intro screen

- tweak control scheme with debouncing so users can turn faster (instead of just queuing up turn requests before next tick updates)

- reimplement "eye" switch pathfinding/graph searching algorithm so it doesn't randomly hang if it walks into a corner

- reimplement the "findFreeCell" recursion method for respawning "apples" so it doesn't blow up if there are no more free cells possible to find

- SWEAT SPRITE GRAPHICS

- test on other browsers and stuff (right now i know it works on macOS mojave in latest chrome and safari)

- eventually port the whole thing to native iOS + native android code :P


## marked done:

- basic input scheme implemented
- naive controlls updated so you can't turn backwards on yourself
- Smooth animation on canvas snake drawing
- started encapsulating code to head off spaghetti before things get too big
- some kind of path finding algo to generate "eye" switches (right now just purple squares)
- set up subdomain
- naive pausing implemented
- reinitialization of game board after dying (for gameover screen, and future level complete screens as well)
- implemented exit goal: "golden apple" (after all "eye" switches are covered)
- Introduction screen with instructions


## ongoing:

- constantly update readme
- start using branches for updates :P
    - (subnote: start using master/develop // feature branches)
- actually push code