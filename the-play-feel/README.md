# THE PLAY — FEEL MVP (prototype, not production)

Self-contained folder. Serve this repo root: `python3 -m http.server 8124` then open /the-play-feel/

Test params: `?speed=3` (faster timing) `?fate=A|B|C` (force outcome) `?choice=out|keep` (auto-answer the decision).
Reuses F01 procedural Oga faces (`assets/f01/play/faces.mjs`) and BTF sprites. Everything else is scripted. Does not touch the engine or main.
