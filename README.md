# Serpenta

A gothic pathfinding snake game. Grow the snake, cover all five eyes at once, then reach the golden apple.

Play the current build at [serpenta.demo.codes](https://serpenta.demo.codes/).

## The game

Every level has a certified minimum snake length: the game constructs a simple path that covers all five eyes and proves that its length meets the Manhattan lower bound. The target ratchets upward until it reaches the four-corners-and-center apex. The next act restarts the distance ratchet and adds collision islands that never obstruct the certified route.

Red apples always spawn in space reachable from the snake's current head. Once all five eyes are covered they remain shut, the apple turns gold, and reaching it completes the level.

## Features

- Deterministic daily challenges and shareable seeded boards
- A saved Easy ritual with a larger grid, slower tempo, and edge-safe apples
- Score-to-beat links that work on static GitHub Pages hosting
- Global and per-board local records
- Saved sound and haptics preferences
- Buffered two-turn input with reverse-turn rejection
- Portrait and landscape boards that preserve active runs on rotation
- Phone-safe portrait controls and a side-mounted landscape control pad
- WebGL striped snake with a connected sprite fallback
- Procedural gothic eyes, apples, island acts, and generated social artwork
- Keyboard, touch, swipe, screen-reader, safe-area, and increased-contrast support
- Installable standalone web-app manifest

## Controls

- Arrow keys or `WASD`: turn
- Space: start, pause, or resume
- Touch controls: turn on phones and tablets
- Swipe on the board: turn in the swipe direction
- Top-right controls: sound and pause

Sound and haptics can also be changed from the pause screen.

## Development

Serpenta is a build-free static site. Serve the repository root with any local HTTP server and open `index.html`.

Run the full deterministic test suite with:

```sh
npm test
```

The suite checks Standard and Easy mode rules, desktop and portrait behavior, plus seeded procedural properties across both orientations and multiple acts: exact witness paths, eye reachability, island safety, deterministic reproduction, and control rejection rules.

Deployment is handled by GitHub Pages from `master`.

## History

Serpenta began as a 2018 canvas experiment. The current game keeps the original five-eye idea while replacing the prototype's recursive placement and turn handling with deterministic generation, certified solutions, reachable goals, responsive controls, persistent challenges, and a new visual system.
