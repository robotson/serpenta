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

console.log("Serpenta V2 portrait smoke test passed.");
