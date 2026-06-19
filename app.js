const DICE_GLYPHS = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const MIN_DICE = 1;
const MAX_DICE = 10;
const DEFAULT_DICE = 2;

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

function rollDice(count = DEFAULT_DICE, roller = fairDieRoll) {
  const normalizedCount = clampDiceCount(count);
  return Array.from({ length: normalizedCount }, () => roller());
}

function rollPair() {
  return rollDice(2);
}

function clampDiceCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_DICE;
  return Math.min(MAX_DICE, Math.max(MIN_DICE, Math.trunc(numeric)));
}

function totalDice(values) {
  return values.reduce((sum, value) => sum + value, 0);
}

const MODES = {
  classic: {
    id: "classic",
    label: "Classic dice",
    roll(count) {
      return rollDice(count);
    },
    summarize(values) {
      return values.join(" + ");
    },
  },
};

class DiceApp {
  constructor({ mode = MODES.classic } = {}) {
    this.mode = mode;
    this.count = DEFAULT_DICE;
    this.values = Array(this.count).fill(1);
  }

  mount() {
    this.stage = document.getElementById("dice-stage");
    this.totalEl = document.getElementById("total");
    this.comboEl = document.getElementById("combo");
    this.countEl = document.getElementById("dice-count");
    this.modeLabel = document.getElementById("mode-label");
    this.rollButton = document.getElementById("roll-button");
    this.decreaseButton = document.getElementById("decrease-dice");
    this.increaseButton = document.getElementById("increase-dice");

    this.rollButton.addEventListener("click", () => this.roll());
    this.decreaseButton.addEventListener("click", () => this.setCount(this.count - 1));
    this.increaseButton.addEventListener("click", () => this.setCount(this.count + 1));
    this.stage.addEventListener("click", (event) => {
      if (event.target.closest(".die3d")) this.roll();
    });

    this.modeLabel.textContent = this.mode.label;
    this.render();
    initWebGLBackdrop();
  }

  setCount(nextCount) {
    this.count = clampDiceCount(nextCount);
    this.values = Array(this.count).fill(1);
    this.render();
  }

  roll() {
    this.values = this.mode.roll(this.count);
    this.render(true);
  }

  render(animate = false) {
    this.countEl.textContent = String(this.count);
    this.decreaseButton.disabled = this.count <= MIN_DICE;
    this.increaseButton.disabled = this.count >= MAX_DICE;
    this.totalEl.textContent = String(totalDice(this.values));
    this.comboEl.textContent = this.mode.summarize(this.values);
    this.stage.style.setProperty("--dice-count", String(this.count));
    this.stage.replaceChildren(...this.values.map((value, index) => createDie(value, index, animate)));
  }
}

function createDie(value, index, animate = false) {
  const die = document.createElement("button");
  die.type = "button";
  die.className = `die3d ${animate ? "rolling" : ""}`;
  die.style.setProperty("--spin-x", `${720 + value * 33 + index * 19}deg`);
  die.style.setProperty("--spin-y", `${900 + value * 41 + index * 29}deg`);
  die.style.setProperty("--delay", `${Math.min(index, 7) * 38}ms`);
  die.dataset.value = String(value);
  die.setAttribute("aria-label", `Die ${index + 1}: ${value}`);

  const cube = document.createElement("span");
  cube.className = "cube";
  [1, 2, 3, 4, 5, 6].forEach((faceValue) => {
    const face = document.createElement("span");
    face.className = `face face-${faceValue} ${faceValue === value ? "active" : ""}`;
    face.textContent = DICE_GLYPHS[faceValue - 1];
    cube.append(face);
  });
  const badge = document.createElement("span");
  badge.className = "die-badge";
  badge.textContent = String(value);
  die.append(cube, badge);
  return die;
}

function initWebGLBackdrop() {
  const canvas = document.getElementById("gl-stage");
  if (!canvas || canvas.dataset.ready) return;
  canvas.dataset.ready = "true";

  const gl = canvas.getContext("webgl", { antialias: true, alpha: true });
  if (!gl) {
    document.body.classList.add("no-webgl");
    return;
  }

  const vertexSource = `
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      uv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    varying vec2 uv;
    uniform float time;
    uniform vec2 resolution;

    float grid(vec2 p, float scale) {
      vec2 cell = abs(fract(p * scale - 0.5) - 0.5);
      float line = min(cell.x, cell.y);
      return 1.0 - smoothstep(0.0, 0.035, line);
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;
      float horizon = smoothstep(-0.4, 0.65, p.y);
      vec2 tunnel = vec2(p.x / max(0.18, p.y + 0.72), p.y + time * 0.08);
      float g1 = grid(tunnel, 9.0) * (1.0 - horizon);
      float g2 = grid(uv + vec2(sin(time * 0.13) * 0.02, time * -0.035), 18.0) * 0.16;
      float sun = smoothstep(0.35, 0.0, length(p - vec2(0.0, 0.18)));
      float scan = 0.72 + 0.28 * sin((uv.y + time * 0.55) * 180.0);
      vec3 neonPink = vec3(1.0, 0.05, 0.62);
      vec3 neonCyan = vec3(0.0, 0.88, 1.0);
      vec3 amber = vec3(1.0, 0.72, 0.12);
      vec3 color = vec3(0.02, 0.01, 0.08);
      color += sun * amber * 0.5;
      color += g1 * mix(neonPink, neonCyan, uv.x) * 0.9;
      color += g2 * neonCyan;
      color *= scan;
      gl_FragColor = vec4(color, 0.82);
    }
  `;

  const program = makeProgram(gl, vertexSource, fragmentSource);
  if (!program) return;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, "position");
  const timeUniform = gl.getUniformLocation(program, "time");
  const resolutionUniform = gl.getUniformLocation(program, "resolution");
  gl.useProgram(program);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function draw(now) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(canvas.clientWidth * dpr);
    const height = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    gl.uniform1f(timeUniform, now * 0.001);
    gl.uniform2f(resolutionUniform, width, height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

function makeProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("WebGL program failed", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("WebGL shader failed", gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function init() {
  const app = new DiceApp();
  app.mount();
  return app;
}

if (typeof document !== "undefined") {
  init();
}

if (typeof module !== "undefined") {
  module.exports = { DICE_GLYPHS, MIN_DICE, MAX_DICE, DEFAULT_DICE, MODES, clampDiceCount, fairDieRoll, rollDice, rollPair, totalDice };
}
