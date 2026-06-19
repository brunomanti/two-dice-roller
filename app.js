const DICE_GLYPHS = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function randomByte() {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint8Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0];
  }

  // Local file/test fallback. Browsers with HTTPS GitHub Pages use crypto.
  return Math.floor(Math.random() * 256);
}

function fairDieRoll() {
  // 252 is the largest multiple of 6 under 256. Rejecting 252–255 prevents
  // modulo bias so each side has exactly 42 accepted byte values.
  let value;
  do {
    value = randomByte();
  } while (value >= 252);
  return (value % 6) + 1;
}

function rollPair() {
  return [fairDieRoll(), fairDieRoll()];
}

function updateDie(element, value, index) {
  element.textContent = DICE_GLYPHS[value - 1];
  element.dataset.value = String(value);
  element.setAttribute("aria-label", `Die ${index}: ${value}`);
}

function renderRoll(one, two) {
  const dieOne = document.getElementById("die-one");
  const dieTwo = document.getElementById("die-two");
  const total = document.getElementById("total");
  const combo = document.getElementById("combo");

  updateDie(dieOne, one, "one");
  updateDie(dieTwo, two, "two");
  total.textContent = String(one + two);
  combo.textContent = `${one} + ${two}`;
}

function rollWithMotion() {
  const [one, two] = rollPair();
  document.querySelectorAll(".die").forEach((die) => {
    die.classList.remove("rolling");
    // Force reflow so repeated taps retrigger the animation class.
    void die.offsetWidth;
    die.classList.add("rolling");
    window.setTimeout(() => die.classList.remove("rolling"), 180);
  });
  renderRoll(one, two);
}

function init() {
  const rollButton = document.getElementById("roll-button");
  const dieButtons = document.querySelectorAll(".die");
  rollButton.addEventListener("click", rollWithMotion);
  dieButtons.forEach((die) => die.addEventListener("click", rollWithMotion));
}

if (typeof document !== "undefined") {
  init();
}

if (typeof module !== "undefined") {
  module.exports = { DICE_GLYPHS, fairDieRoll, rollPair };
}
