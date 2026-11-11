#!/bin/zsh
# Re-renders docs/renders/*.png from the theme files in theme/PureBlack,
# using headless Chrome and a mock Spotify layout (mock.html).
# Needs Google Chrome and Python 3 with Pillow.
set -e
HERE=${0:A:h}; REPO=${HERE:h:h:h}; OUT=${HERE:h}
WORK=$(mktemp -d); trap 'rm -rf $WORK' EXIT
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

python3 - "$HERE/mock.html" "$REPO/theme/PureBlack" "$WORK/page.html" <<'PY'
import sys
mock, theme, out = sys.argv[1:]
s = open(mock).read()
s = s.replace("/*USER_CSS*/", open(theme + "/user.css").read(), 1)
s = s.replace("/*THEME_JS*/", open(theme + "/theme.js").read(), 1)
open(out, "w").write(s)
PY

shot() { # name query
  "$CH" --headless=new --hide-scrollbars --use-angle=metal --ignore-gpu-blocklist \
    --force-device-scale-factor=2 --window-size=1440,900 --user-data-dir=$WORK/p-$1 \
    --virtual-time-budget=4000 --screenshot=$WORK/$1.png "file://$WORK/page.html?$2" >/dev/null 2>&1
}

# Full window: weather:hour:seconds of rain simulated before the shot
for s in rain:14.2:90 storm:15:90 drizzle:13.5:90 snow:10:0 clear:13:0 partly:17.3:0 fog:12:0 clear:21:0; do
  a=(${(s.:.)s}); shot g-$a[1]-$a[2] "w=$a[1]&h=$a[2]&t=$a[3]" &
done
# Top bar only (water layer removed)
for s in clear:8.58 partly:9.5 partly:13 cloudy:13 rain:12.5 storm:15 partly:16.42 clear:17.08 clear:22 cloudy:23 snow:11 fog:9; do
  a=(${(s.:.)s}); shot b-$a[1]-$a[2] "w=$a[1]&h=$a[2]&bar" &
done
wait

python3 - "$WORK" "$OUT" <<'PY'
import sys
from PIL import Image, ImageDraw, ImageFont
W, O = sys.argv[1:]
font = lambda n: ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", n)

grid = [("rain-14.2", "Rain, 2pm"), ("storm-15", "Thunderstorm"), ("drizzle-13.5", "Drizzle, 1:30pm"), ("snow-10", "Snow, morning"),
        ("clear-13", "Clear, 1pm"), ("partly-17.3", "Partly cloudy, sunset"), ("fog-12", "Fog"), ("clear-21", "Clear night")]
tw, th = 960, 600
out = Image.new("RGB", (2 * tw + 10, 4 * (th + 40)), "#0b0b0d"); d = ImageDraw.Draw(out)
for i, (k, t) in enumerate(grid):
    x, y = (i % 2) * (tw + 10), (i // 2) * (th + 40)
    d.text((x + 6, y + 6), t, fill="white", font=font(24))
    out.paste(Image.open(f"{W}/g-{k}.png").convert("RGB").resize((tw, th), Image.LANCZOS), (x, y + 40))
out.save(f"{O}/sky-lit-glass.png")

Image.open(f"{W}/g-rain-14.2.png").convert("RGB").resize((2160, 1350), Image.LANCZOS).save(f"{O}/rain.png", optimize=True)

bars = [("clear-8.58", "8:35am, clear"), ("partly-9.5", "9:30am, partly cloudy"), ("partly-13", "1pm, partly cloudy"), ("cloudy-13", "1pm, overcast"),
        ("rain-12.5", "12:30pm, rain"), ("storm-15", "3pm, thunderstorm"), ("partly-16.42", "4:25pm, partly cloudy"), ("clear-17.08", "5:05pm, clear"),
        ("clear-22", "10pm, clear"), ("cloudy-23", "11pm, overcast"), ("snow-11", "11am, snow"), ("fog-9", "9am, fog")]
bw, bh, lab = 2880, 150, 36
out = Image.new("RGB", (bw, len(bars) * (bh + lab)), "#000"); d = ImageDraw.Draw(out)
for i, (k, t) in enumerate(bars):
    y = i * (bh + lab)
    d.text((14, y + 7), t, fill=(200, 200, 205), font=font(22))
    out.paste(Image.open(f"{W}/b-{k}.png").convert("RGB").crop((0, 0, bw, bh)), (0, y + lab))
out.resize((bw * 2 // 3, out.height * 2 // 3), Image.LANCZOS).save(f"{O}/top-bar-sky.png")
PY
ls -la $OUT/*.png
