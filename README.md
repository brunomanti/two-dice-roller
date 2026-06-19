# Two Dice Roller

A tiny, mobile-first, public GitHub Pages app for rolling two fair six-sided dice.

## Fairness

Each die uses `crypto.getRandomValues()` in browsers and rejection sampling over one random byte. Values 252–255 are discarded, so the accepted 0–251 range contains exactly 42 outcomes for each die face modulo 6. That removes modulo bias.

## Local use

Open `index.html` directly or serve the directory with any static file server.
