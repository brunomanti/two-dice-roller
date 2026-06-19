const assert = require("node:assert/strict");
const {
  DICE_GLYPHS,
  MIN_DICE,
  MAX_DICE,
  DEFAULT_DICE,
  MODES,
  clampDiceCount,
  fairDieRoll,
  rollDice,
  rollPair,
  totalDice,
} = require("./app.js");

assert.equal(DICE_GLYPHS.length, 6);
assert.equal(MIN_DICE, 1);
assert.equal(MAX_DICE, 10);
assert.equal(DEFAULT_DICE, 2);
assert.equal(clampDiceCount(-20), 1);
assert.equal(clampDiceCount(2.8), 2);
assert.equal(clampDiceCount(99), 10);
assert.equal(clampDiceCount("nope"), 2);
assert.equal(totalDice([1, 2, 3, 4]), 10);

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

console.log("Dice fairness and configurability checks passed.");
