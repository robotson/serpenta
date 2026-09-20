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
  dataset: {},
  style: { setProperty: noop },
  setAttribute: noop,
  classList: { add: noop, remove: noop },
  appendChild: noop,
  addEventListener: noop,
  setPointerCapture: noop,
  closest: () => null
});

global.document = {
  documentElement: { dataset: {}, style: { setProperty: noop } },
  querySelector: element,
  querySelectorAll: () => [],
  createElement: () => ({ getContext: () => context2d }),
  addEventListener: noop
};
global.window = global;
global.innerWidth = 1000;
global.innerHeight = 700;
global.localStorage = { getItem: () => null, setItem: noop };
global.location = {
  search: "?seed=easy-test&mode=easy",
  href: "https://example.com/?seed=easy-test&mode=easy",
  assign: noop
};
global.Image = class { set src(value) { this.source = value; } };
global.requestAnimationFrame = noop;
global.performance = { now: () => 0 };

const source = path.join(__dirname, "..", "src", "serpenta-v2.js");
vm.runInThisContext(fs.readFileSync(source, "utf8"), { filename: source });

assert.equal(serpentaV2.mode, "easy");
assert.deepEqual(serpentaV2.board, { columns: 20, rows: 13 });
assert.equal(serpentaV2.stepMs, 190);
assert.equal(serpentaV2.edgeSafeApples, true);
assert.equal(serpentaV2.appleCellAllowed({ x: 0, y: 6 }), false);
assert.equal(serpentaV2.appleCellAllowed({ x: 10, y: 0 }), false);
assert.equal(serpentaV2.appleCellAllowed({ x: 19, y: 6 }), false);
assert.equal(serpentaV2.appleCellAllowed({ x: 10, y: 12 }), false);
assert.equal(serpentaV2.appleCellAllowed({ x: 1, y: 1 }), true);
assert.equal(
  serpentaV2.scoreShareUrl(250, 2),
  "https://example.com/?seed=easy-test&mode=easy&score=250&level=2"
);
assert.deepEqual(serpentaV2.inspectLevel(4), serpentaV2.inspectLevel(4));

console.log("Serpenta V2 easy-mode smoke test passed.");
