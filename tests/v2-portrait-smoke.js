const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const noop = () => {};
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
const element = () => ({
  textContent: "",
  title: "",
  dataset: {},
  style: { setProperty: noop },
  classList: { add: noop, remove: noop },
  appendChild: noop,
  addEventListener: noop,
  setPointerCapture: noop,
  setAttribute: noop,
  closest: () => null
});

const sandbox = {
  console,
  Date,
  Image: class { set src(value) { this.source = value; } },
  URL,
  URLSearchParams,
  document: {
    hidden: false,
    querySelector: element,
    querySelectorAll: () => [],
    createElement: () => ({ getContext: () => context2d }),
    addEventListener: noop
  },
  innerWidth: 390,
  innerHeight: 844,
  localStorage: { getItem: () => null, setItem: noop },
  sessionStorage: {
    getItem: key => key === "serpenta.orientation" ? JSON.stringify({
      version: 1,
      challengeSeed: "portrait-test",
      columns: 18,
      rows: 11,
      level: 2,
      score: 42,
      layout: {
        eyes: [{ x: 1, y: 1 }, { x: 16, y: 1 }, { x: 1, y: 9 }, { x: 16, y: 9 }, { x: 8, y: 5 }],
        path: [{ x: 1, y: 1 }],
        order: [{ x: 1, y: 1 }],
        minimum: 29,
        requested: 27
      },
      snake: [{ x: 10, y: 5 }, { x: 11, y: 5 }, { x: 12, y: 5 }, { x: 13, y: 5 }, { x: 14, y: 5 }],
      direction: { x: -1, y: 0 },
      directionQueue: [],
      apple: { x: 2, y: 7, golden: false },
      golden: false,
      coveredEyes: 0,
      randomState: 123456
    }) : null,
    removeItem: noop,
    setItem: noop
  },
  location: { search: "?seed=portrait-test", href: "https://example.com/?seed=portrait-test", assign: noop },
  navigator: {},
  performance: { now: () => 0 },
  requestAnimationFrame: noop
};
sandbox.window = sandbox;

vm.createContext(sandbox);
const source = path.join(__dirname, "..", "src", "serpenta-v2.js");
vm.runInContext(fs.readFileSync(source, "utf8"), sandbox, { filename: source });

assert.deepEqual(
  JSON.parse(JSON.stringify(sandbox.serpentaV2.board)),
  { columns: 11, rows: 18 }
);
assert.equal(sandbox.serpentaV2.startDirection, "UP");
assert.equal(sandbox.serpentaV2.renderer, "sprites");
assert.deepEqual(
  JSON.parse(JSON.stringify(sandbox.serpentaV2.startCells)),
  [{ x: 5, y: 11 }, { x: 5, y: 12 }, { x: 5, y: 13 }, { x: 5, y: 14 }, { x: 5, y: 15 }]
);
assert.equal(sandbox.serpentaV2.maximumMinimum, 48);
assert.equal(sandbox.serpentaV2.challengeSeed, "portrait-test");
assert.deepEqual(
  JSON.parse(JSON.stringify(sandbox.serpentaV2.transposeCell({ x: 3, y: 8, golden: false }))),
  { x: 8, y: 3, golden: false }
);
assert.deepEqual(
  JSON.parse(JSON.stringify(sandbox.serpentaV2.inspectState())),
  {
    state: "paused",
    level: 2,
    score: 42,
    snake: [{ x: 5, y: 10 }, { x: 5, y: 11 }, { x: 5, y: 12 }, { x: 5, y: 13 }, { x: 5, y: 14 }],
    direction: { x: 0, y: -1 },
    apple: { x: 7, y: 2, golden: false }
  }
);
const secondAct = JSON.parse(JSON.stringify(sandbox.serpentaV2.inspectLevel(15)));
assert.equal(secondAct.act, 1);
assert.equal(secondAct.requested, 9);
assert.equal(secondAct.islands.length, 2);
assert(secondAct.islands.every(island => !secondAct.witness.some(cell => cell.x === island.x && cell.y === island.y)));

console.log("Serpenta portrait smoke test passed.");
