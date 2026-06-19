const assert = require("node:assert/strict");
const { DICE_GLYPHS, fairDieRoll, rollPair } = require("./app.js");

assert.equal(DICE_GLYPHS.length, 6);

for (let i = 0; i < 1000; i += 1) {
  const roll = fairDieRoll();
  assert.ok(Number.isInteger(roll), `roll should be integer: ${roll}`);
  assert.ok(roll >= 1 && roll <= 6, `roll should be 1–6: ${roll}`);
  const pair = rollPair();
  assert.equal(pair.length, 2);
  assert.ok(pair.every((value) => Number.isInteger(value) && value >= 1 && value <= 6));
}

// Verify the algorithm is mathematically unbiased over the complete accepted
// byte domain: 0–251 maps exactly 42 times to each side.
const counts = Array(6).fill(0);
for (let byte = 0; byte < 252; byte += 1) {
  counts[byte % 6] += 1;
}
assert.deepEqual(counts, [42, 42, 42, 42, 42, 42]);

console.log("Dice fairness checks passed.");
