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
  classList: { add: noop, remove: noop },
  appendChild: noop,
  addEventListener: noop,
  setPointerCapture: noop,
  closest: () => null
});

global.document = {
  querySelector: element,
  querySelectorAll: () => [],
  createElement: () => ({ getContext: () => context2d }),
  addEventListener: noop
};
global.window = global;
global.Image = class { set src(value) { this.source = value; } };
global.requestAnimationFrame = noop;
global.performance = { now: () => 0 };

const source = path.join(__dirname, "..", "src", "serpenta-v2.js");
vm.runInThisContext(fs.readFileSync(source, "utf8"), { filename: source });

assert.deepEqual(serpentaV2.board, { columns: 18, rows: 11 });
assert.equal(serpentaV2.maximumMinimum, 48);

let lastRequested = 0;
for (let level = 1; level <= 15; level++) {
  const layout = serpentaV2.inspectLevel(level);
  assert(layout.requested >= lastRequested, `level ${level} target regressed`);
  assert(layout.minimum >= layout.requested, `level ${level} missed its target`);
  assert.equal(layout.minimum, layout.witnessLength, `level ${level} certificate length differs`);
  assert(layout.witnessIsSimple, `level ${level} witness crosses itself`);
  lastRequested = layout.requested;
}

console.log("Serpenta V2 smoke test passed.");
