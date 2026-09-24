const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const noop = () => {};
const source = fs.readFileSync(path.join(__dirname, "..", "src", "serpenta-v2.js"), "utf8");

function makeElement() {
  return {
    textContent: "",
    title: "",
    hidden: false,
    dataset: {},
    style: { setProperty: noop },
    classList: { add: noop, remove: noop },
    appendChild: noop,
    addEventListener: noop,
    setPointerCapture: noop,
    setAttribute: noop,
    closest: () => null
  };
}

function createGame(seed, width, height) {
  const context2d = new Proxy({}, {
    get(target, property) {
      if (!(property in target)) target[property] = noop;
      return target[property];
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    }
  });
  const sandbox = {
    console,
    Date,
    Image: class { set src(value) { this.source = value; } },
    URL,
    URLSearchParams,
    clearTimeout,
    setTimeout,
    document: {
      hidden: false,
      querySelector: makeElement,
      querySelectorAll: () => [],
      createElement: () => ({ getContext: () => context2d }),
      addEventListener: noop
    },
    innerWidth: width,
    innerHeight: height,
    localStorage: { getItem: () => null, setItem: noop },
    location: { search: `?seed=${seed}`, href: `https://example.com/?seed=${seed}`, assign: noop, reload: noop },
    navigator: {},
    performance: { now: () => 0 },
    requestAnimationFrame: noop,
    addEventListener: noop
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "serpenta-v2.js" });
  return sandbox.serpentaV2;
}

function cellKey(cell) {
  return `${cell.x},${cell.y}`;
}

function reachableFromStart(game, layout) {
  const start = game.startCells[0];
  const blocked = new Set(game.startCells.slice(1).map(cellKey));
  for (const island of layout.islands) blocked.add(cellKey(island));
  const visited = new Set([cellKey(start)]);
  const queue = [start];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    for (const delta of [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }]) {
      const next = { x: current.x + delta.x, y: current.y + delta.y };
      const key = cellKey(next);
      if (next.x < 0 || next.x >= game.board.columns || next.y < 0 || next.y >= game.board.rows) continue;
      if (blocked.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return visited;
}

const seeds = ["belladonna", "black-lodge", "sandworm", "winter-raven"];
const viewports = [[1280, 800], [390, 844]];
const sampledLevels = [1, 4, 8, 13, 14, 15, 18, 27, 28];

for (const [width, height] of viewports) {
  for (const seed of seeds) {
    const game = createGame(seed, width, height);
    assert.equal(game.maximumMinimum, 48);

    for (const level of sampledLevels) {
      const layout = game.inspectLevel(level);
      if ([1, 15, 28].includes(level)) {
        assert.deepEqual(layout, game.inspectLevel(level), `${seed} level ${level} was not deterministic`);
      }
      const phase = (level - 1) % 14;
      const expectedAct = Math.floor((level - 1) / 14);
      assert.equal(layout.act, expectedAct);
      assert.equal(layout.requested, Math.min(9 + phase * 3, 48));
      assert(layout.minimum >= layout.requested);
      assert.equal(layout.minimum, layout.witness.length);
      assert(layout.witnessIsSimple);

      const eyeKeys = new Set(layout.eyes.map(cellKey));
      assert.equal(eyeKeys.size, 5);
      assert(layout.eyes.every(cell => cell.x >= 0 && cell.x < game.board.columns && cell.y >= 0 && cell.y < game.board.rows));
      assert(layout.eyes.every(eye => layout.witness.some(cell => cellKey(cell) === cellKey(eye))));
      for (let index = 1; index < layout.witness.length; index++) {
        const previous = layout.witness[index - 1];
        const current = layout.witness[index];
        assert.equal(Math.abs(previous.x - current.x) + Math.abs(previous.y - current.y), 1);
      }

      const islandKeys = new Set(layout.islands.map(cellKey));
      assert.equal(islandKeys.size, layout.islands.length);
      assert.equal(layout.islands.length, Math.min(expectedAct, 4) * 2);
      assert(layout.islands.every(cell => !eyeKeys.has(cellKey(cell))));
      assert(layout.islands.every(cell => !layout.witness.some(step => cellKey(step) === cellKey(cell))));
      for (let index = 0; index < layout.islands.length; index += 2) {
        const left = layout.islands[index];
        const right = layout.islands[index + 1];
        assert.equal(Math.abs(left.x - right.x) + Math.abs(left.y - right.y), 1);
      }

      const reachable = reachableFromStart(game, layout);
      assert(layout.eyes.every(eye => reachable.has(cellKey(eye))), `${seed} level ${level} has an unreachable eye`);
    }

    const opposites = { LEFT: "RIGHT", RIGHT: "LEFT", UP: "DOWN", DOWN: "UP" };
    for (const [start, opposite] of Object.entries(opposites)) {
      assert.equal(game.previewTurns(start, [opposite]).length, 0);
    }
  }
}

console.log("Serpenta property smoke test passed across 8 seeded board runs.");
