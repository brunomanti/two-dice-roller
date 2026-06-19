const assert = require("node:assert/strict");
const {
  DICE_GLYPHS,
  DICE_PIP_LAYOUTS,
  MIN_DICE,
  MAX_DICE,
  DEFAULT_DICE,
  MODES,
  clampDiceCount,
  fairDieRoll,
  rollDice,
  rollPair,
  totalDice,
  normalizeDieValue,
  pipsForValue,
  dieGlyph,
  createDie,
} = require("./app.js");

assert.equal(DICE_GLYPHS.length, 6);
assert.deepEqual(Object.keys(DICE_PIP_LAYOUTS), ["1", "2", "3", "4", "5", "6"]);
assert.equal(MIN_DICE, 1);
assert.equal(MAX_DICE, 10);
assert.equal(DEFAULT_DICE, 2);
assert.equal(clampDiceCount(-20), 1);
assert.equal(clampDiceCount(2.8), 2);
assert.equal(clampDiceCount(99), 10);
assert.equal(clampDiceCount("nope"), 2);
assert.equal(totalDice([1, 2, 3, 4]), 10);
assert.equal(normalizeDieValue("6"), 6);
assert.throws(() => normalizeDieValue(0), /1 to 6/);
assert.throws(() => normalizeDieValue(7), /1 to 6/);

const expectedPips = {
  1: ["center"],
  2: ["top-left", "bottom-right"],
  3: ["top-left", "center", "bottom-right"],
  4: ["top-left", "top-right", "bottom-left", "bottom-right"],
  5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
  6: ["top-left", "middle-left", "bottom-left", "top-right", "middle-right", "bottom-right"],
};

for (let value = 1; value <= 6; value += 1) {
  assert.deepEqual(pipsForValue(value), expectedPips[value], `pip layout for ${value}`);
  assert.equal(pipsForValue(value).length, value, `pip count for ${value}`);
  assert.equal(dieGlyph(value), DICE_GLYPHS[value - 1], `glyph lookup for ${value}`);
}

for (let count = MIN_DICE; count <= MAX_DICE; count += 1) {
  const deterministic = rollDice(count, () => 3);
  assert.equal(deterministic.length, count);
  assert.ok(deterministic.every((value) => value === 3));
}

for (let i = 0; i < 1000; i += 1) {
  const roll = fairDieRoll();
  assert.ok(Number.isInteger(roll), `roll should be integer: ${roll}`);
  assert.ok(roll >= 1 && roll <= 6, `roll should be 1–6: ${roll}`);
  const pair = rollPair();
  assert.equal(pair.length, 2);
  assert.ok(pair.every((value) => Number.isInteger(value) && value >= 1 && value <= 6));
}

assert.equal(MODES.classic.label, "Classic dice");
assert.deepEqual(MODES.classic.roll(3, () => 2).length, 3);
assert.equal(MODES.classic.summarize([6, 1, 4]), "6 + 1 + 4");

// Verify the algorithm is mathematically unbiased over the complete accepted
// byte domain: 0–251 maps exactly 42 times to each side.
const counts = Array(6).fill(0);
for (let byte = 0; byte < 252; byte += 1) {
  counts[byte % 6] += 1;
}
assert.deepEqual(counts, [42, 42, 42, 42, 42, 42]);

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.style = { props: {}, setProperty: (key, val) => { this.style.props[key] = val; } };
    this.className = "";
    this.textContent = "";
  }

  append(...children) {
    this.children.push(...children);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  querySelectorAll(selector) {
    const className = selector.startsWith(".") ? selector.slice(1) : selector;
    const matches = [];
    const visit = (node) => {
      if (node.className.split(/\s+/).includes(className)) matches.push(node);
      node.children.forEach(visit);
    };
    visit(this);
    return matches;
  }
}

const previousDocument = global.document;
global.document = { createElement: (tagName) => new FakeElement(tagName) };
try {
  for (let value = 1; value <= 6; value += 1) {
    const die = createDie(value, value - 1);
    assert.equal(die.dataset.value, String(value));
    assert.equal(die.getAttribute("aria-label"), `Die ${value}: ${value}`);
    assert.equal(die.querySelectorAll(".result-face").length, 1, `single result face for ${value}`);
    assert.equal(die.querySelectorAll(".result-face")[0].dataset.visualValue, String(value));
    assert.deepEqual(
      die.querySelectorAll(".pip").map((pip) => pip.dataset.pip),
      expectedPips[value],
      `visual pip positions match internal die value ${value}`,
    );
    assert.equal(die.querySelectorAll(".pip").length, value, `visual pip count matches ${value}`);
    assert.equal(die.querySelectorAll(".face").every((face) => face.textContent === ""), true, "decorative 3D faces must not show conflicting glyph values");
  }
} finally {
  global.document = previousDocument;
}

console.log("Dice fairness, configurability, and visual mapping checks passed.");
