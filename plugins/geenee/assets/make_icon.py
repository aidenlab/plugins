#!/usr/bin/env python3
"""JuiceBot icon: a robot head whose face is a Hi-C contact map.

Writes juicebot.svg (vector, 512x512 viewBox). Geometry is tuned so the
silhouette, the diagonal and the eyes survive at 16-32 px: thick outline,
few large map cells, high-contrast diagonal, eyes with a white halo.
"""
import math, random

S = 512
RED = "#e8231b"
RED_DARK = "#c4140e"
INK = "#15161a"
WHITE = "#ffffff"

# --- head geometry -----------------------------------------------------------
HEAD = dict(x=74, y=120, w=364, h=330, r=64)        # outer rounded square
STROKE = 20
FACE = dict(x=104, y=150, w=304, h=270, r=40)       # map area (inside the stroke)
EAR_R = 36
ANT = dict(cx=S / 2, ball_r=36, ball_cy=46, stem_w=22, stem_top=46, base_w=74, base_h=22)
EYE = dict(w=42, h=70, r=21, y=308, dx=80)          # eyes: centred at S/2 ± dx

# --- contact map ---------------------------------------------------------------
N = 11              # cells per side; few enough to read at 32 px
CELL = FACE["w"] / N
rng = random.Random(7)  # fixed seed → identical art on every run

def intensity(i, j):
    """Hi-C-like: strong diagonal, decay with distance, two symmetric 'loop' spots, faint texture."""
    d = abs(i - j)
    v = 1.0 if d == 0 else 0.62 * math.exp(-(d - 1) / 1.5)
    for (a, b) in [(2, 7), (6, 9)]:                 # off-diagonal spots (mirrored)
        for (p, q) in [(a, b), (b, a)]:
            v += 0.9 * math.exp(-((i - p) ** 2 + (j - q) ** 2) / 0.9)
    return v

# symmetric noise so the texture mirrors across the diagonal like a real map
noise = {}
for i in range(N):
    for j in range(i, N):
        noise[(i, j)] = noise[(j, i)] = rng.random()

cells = []
for i in range(N):
    for j in range(N):
        v = intensity(i, j) + 0.18 * noise[(i, j)]
        v = min(v, 1.0)
        if v < 0.14:
            continue                                # leave the palest cells white
        a = round(0.06 + 0.94 * v ** 1.6, 3)        # gamma keeps the mid-tones light
        x = FACE["x"] + j * CELL
        y = FACE["y"] + i * (FACE["h"] / N)
        cells.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{CELL + 0.6:.1f}" height="{FACE["h"] / N + 0.6:.1f}" fill="{RED}" fill-opacity="{a}"/>')

def rr(d, **kw):
    attrs = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in kw.items())
    return f'<rect x="{d["x"]}" y="{d["y"]}" width="{d["w"]}" height="{d["h"]}" rx="{d["r"]}" {attrs}/>'

cx = S / 2
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}">
  <title>JuiceBot</title>
  <defs>
    <clipPath id="face"><rect x="{FACE["x"]}" y="{FACE["y"]}" width="{FACE["w"]}" height="{FACE["h"]}" rx="{FACE["r"]}"/></clipPath>
  </defs>
  <!-- antenna -->
  <rect x="{cx - ANT["stem_w"] / 2}" y="{ANT["stem_top"]}" width="{ANT["stem_w"]}" height="{HEAD["y"] - ANT["stem_top"] + 10}" fill="{INK}"/>
  <rect x="{cx - ANT["base_w"] / 2}" y="{HEAD["y"] - ANT["base_h"] + 6}" width="{ANT["base_w"]}" height="{ANT["base_h"] + 10}" rx="10" fill="{INK}"/>
  <circle cx="{cx}" cy="{ANT["ball_cy"]}" r="{ANT["ball_r"]}" fill="{RED}" stroke="{INK}" stroke-width="{STROKE * 0.6}"/>
  <!-- ears -->
  <circle cx="{HEAD["x"] + 4}" cy="{HEAD["y"] + HEAD["h"] / 2 - 8}" r="{EAR_R + 10}" fill="{RED}" stroke="{INK}" stroke-width="{STROKE * 0.7}"/>
  <circle cx="{HEAD["x"] + HEAD["w"] - 4}" cy="{HEAD["y"] + HEAD["h"] / 2 - 8}" r="{EAR_R + 10}" fill="{RED}" stroke="{INK}" stroke-width="{STROKE * 0.7}"/>
  <!-- head -->
  {rr(HEAD, fill=WHITE, stroke=INK, stroke_width=STROKE)}
  <!-- contact-map face -->
  <g clip-path="url(#face)">
    <rect x="{FACE["x"]}" y="{FACE["y"]}" width="{FACE["w"]}" height="{FACE["h"]}" fill="#fff4f3"/>
    {chr(10).join("    " + c for c in cells)}
  </g>
  <!-- eyes: white halo keeps them legible on red cells at small sizes -->
  <rect x="{cx - EYE["dx"] - EYE["w"] / 2 - 7}" y="{EYE["y"] - 7}" width="{EYE["w"] + 14}" height="{EYE["h"] + 14}" rx="{EYE["r"] + 7}" fill="{WHITE}" fill-opacity="0.92"/>
  <rect x="{cx + EYE["dx"] - EYE["w"] / 2 - 7}" y="{EYE["y"] - 7}" width="{EYE["w"] + 14}" height="{EYE["h"] + 14}" rx="{EYE["r"] + 7}" fill="{WHITE}" fill-opacity="0.92"/>
  <rect x="{cx - EYE["dx"] - EYE["w"] / 2}" y="{EYE["y"]}" width="{EYE["w"]}" height="{EYE["h"]}" rx="{EYE["r"]}" fill="{INK}"/>
  <rect x="{cx + EYE["dx"] - EYE["w"] / 2}" y="{EYE["y"]}" width="{EYE["w"]}" height="{EYE["h"]}" rx="{EYE["r"]}" fill="{INK}"/>
</svg>
'''
open("juicebot.svg", "w").write(svg)
print("juicebot.svg", len(cells), "cells")
