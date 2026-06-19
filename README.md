# Neon Dice Roller

A mobile-first, public GitHub Pages dice app with configurable 1–10 dice, a WebGL neon-arcade backdrop, CSS 3D dice, and fair six-sided randomness.

## Fairness

Each die uses `crypto.getRandomValues()` in browsers and rejection sampling over one random byte. Values 252–255 are discarded, so the accepted 0–251 range contains exactly 42 outcomes for each die face modulo 6. That removes modulo bias.

## Architecture

`app.js` separates the mode engine from rendering:

- `MODES.classic.roll(count)` returns the current roll result.
- `MODES.classic.summarize(values)` formats the result.
- Future modes can add alternate roll/summarize behavior without changing the fairness primitive or UI shell.

## Local use

```bash
node test.js
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173/>.
