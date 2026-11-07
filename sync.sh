#!/bin/bash
# Copies the live theme files from ~/.config/spicetify back into this repo,
# so edits made in place can be committed.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$HOME/.config/spicetify"
cp "$CONFIG"/Themes/PureBlack/{color.ini,theme.js,user.css} "$HERE/theme/PureBlack/"
cp "$CONFIG/Extensions/lyrics-plus-button.js" "$HERE/extensions/"
[ -f "$CONFIG/auto-reapply.sh" ] && cp "$CONFIG/auto-reapply.sh" "$HERE/auto-reapply/"
git -C "$HERE" status --short
