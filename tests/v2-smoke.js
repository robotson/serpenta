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
  querySelector: element,
  querySelectorAll: () => [],
  createElement: () => ({ getContext: () => context2d }),
  addEventListener: noop
};
global.window = global;
const storedValues = {
  "serpenta.best": "500",
  "serpenta.records.v1": JSON.stringify({
    "test-seed": { score: 320, level: 2, updatedAt: 1 }
  })
};
global.localStorage = {
  getItem: key => storedValues[key] || null,
  setItem: (key, value) => { storedValues[key] = value; }
};
global.location = {
  search: "?seed=test-seed&score=420&level=3",
  href: "https://example.com/?seed=test-seed&score=420&level=3",
  assign: noop
};
global.Image = class { set src(value) { this.source = value; } };
global.requestAnimationFrame = noop;
global.performance = { now: () => 0 };

const source = path.join(__dirname, "..", "src", "serpenta-v2.js");
vm.runInThisContext(fs.readFileSync(source, "utf8"), { filename: source });

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.webmanifest"), "utf8"));
assert.equal(manifest.display, "standalone");
assert.equal(manifest.icons[0].src, "assets/eye-open.png");

assert.deepEqual(serpentaV2.board, { columns: 18, rows: 11 });
assert.equal(serpentaV2.renderer, "sprites");
assert.equal(serpentaV2.startDirection, "LEFT");
assert.deepEqual(serpentaV2.startCells, [
  { x: 11, y: 5 }, { x: 12, y: 5 }, { x: 13, y: 5 }, { x: 14, y: 5 }, { x: 15, y: 5 }
]);
assert.equal(serpentaV2.maximumMinimum, 48);
assert.equal(serpentaV2.challengeSeed, "test-seed");
assert.deepEqual(serpentaV2.challengeTarget, { score: 420, level: 3 });
assert.deepEqual(serpentaV2.personalRecord(), { globalScore: 500, score: 320, level: 2 });
assert.equal(
  serpentaV2.scoreShareUrl(777, 5),
  "https://example.com/?seed=test-seed&score=777&level=5"
);
assert.deepEqual(serpentaV2.inspectLevel(3), serpentaV2.inspectLevel(3), "seeded level must reproduce exactly");
assert.deepEqual(serpentaV2.previewTurns("LEFT", ["UP", "RIGHT"]), ["UP", "RIGHT"]);
assert.deepEqual(serpentaV2.previewTurns("LEFT", ["UP", "DOWN", "RIGHT"]), ["UP", "RIGHT"]);
assert.deepEqual(serpentaV2.previewTurns("LEFT", ["RIGHT", "UP"]), ["UP"]);
assert.deepEqual(serpentaV2.previewTurns("LEFT", ["UP", "RIGHT", "DOWN"]), ["UP", "RIGHT"]);
assert.deepEqual(
  serpentaV2.transposeCell({ x: 2, y: 7, golden: true }),
  { x: 7, y: 2, golden: true }
);

let lastRequested = 0;
let lastAct = 0;
for (let level = 1; level <= 28; level++) {
  const layout = serpentaV2.inspectLevel(level);
  if (layout.act === lastAct) assert(layout.requested >= lastRequested, `level ${level} target regressed`);
  else {
    assert.equal(layout.act, lastAct + 1, `level ${level} skipped an act`);
    assert.equal(layout.requested, 9, `level ${level} did not restart the ratchet`);
  }
  assert(layout.minimum >= layout.requested, `level ${level} missed its target`);
  assert.equal(layout.minimum, layout.witnessLength, `level ${level} certificate length differs`);
  assert(layout.witnessIsSimple, `level ${level} witness crosses itself`);
  assert.equal(layout.islands.length, Math.min(layout.act, 4) * 2, `level ${level} island count differs`);
  const protectedCells = new Set([...layout.eyes, ...layout.witness].map(cell => `${cell.x},${cell.y}`));
  assert(layout.islands.every(cell => !protectedCells.has(`${cell.x},${cell.y}`)), `level ${level} blocks its certificate`);
  assert.equal(new Set(layout.islands.map(cell => `${cell.x},${cell.y}`)).size, layout.islands.length);
  lastRequested = layout.requested;
  lastAct = layout.act;
}

assert.equal(serpentaV2.inspectLevel(14).requested, 48);
assert.equal(serpentaV2.inspectLevel(15).act, 1);

console.log("Serpenta V2 smoke test passed.");
