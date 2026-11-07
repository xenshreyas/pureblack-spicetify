#!/bin/bash
# Installs PureBlack into Spicetify and applies it. macOS only.
#
#   ./install.sh                  copy the theme + extension, set config, apply
#   ./install.sh --auto-reapply   also install a LaunchAgent that reapplies
#                                 Spicetify after Spotify updates itself
#
# Needs Spotify (opened and signed in at least once) and Spicetify.
# See AGENTS.md for installing those from scratch.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$HOME/.config/spicetify"
APPS="/Applications/Spotify.app/Contents/Resources/Apps"

fail() { echo "error: $*" >&2; exit 1; }

[ "$(uname)" = "Darwin" ] || fail "PureBlack is macOS only."
[ -d /Applications/Spotify.app ] || fail "Spotify isn't in /Applications. Install it from spotify.com/download (or: brew install --cask spotify)."
[ -f "$HOME/Library/Application Support/Spotify/prefs" ] ||
  fail "Spotify hasn't been run yet. Open Spotify, sign in, quit it, then run this again."

# Spicetify: $SPICETIFY, then the official installer's location, then PATH.
if [ -z "${SPICETIFY:-}" ]; then
  if [ -x "$HOME/.spicetify/spicetify" ]; then SPICETIFY="$HOME/.spicetify/spicetify"
  elif command -v spicetify >/dev/null; then SPICETIFY="$(command -v spicetify)"
  else fail "Spicetify not found. Install it first (brew install spicetify-cli), or set SPICETIFY=/path/to/spicetify."
  fi
fi
echo "Using Spicetify at $SPICETIFY"

[ -w "$APPS" ] || fail "Can't write to $APPS. Run: sudo chmod a+wr /Applications/Spotify.app && sudo chmod a+wr -R $APPS"

# First run creates ~/.config/spicetify and config-xpui.ini.
"$SPICETIFY" config >/dev/null

mkdir -p "$CONFIG/Themes/PureBlack" "$CONFIG/Extensions"
cp "$HERE"/theme/PureBlack/* "$CONFIG/Themes/PureBlack/"
cp "$HERE"/extensions/lyrics-plus-button.js "$CONFIG/Extensions/"

"$SPICETIFY" config current_theme PureBlack color_scheme Base \
  inject_css 1 replace_colors 1 inject_theme_js 1 \
  extensions lyrics-plus-button.js custom_apps lyrics-plus

if [ "${1:-}" = "--auto-reapply" ]; then
  LABEL="com.$(whoami).spicetify-reapply"
  PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
  mkdir -p "$HOME/Library/LaunchAgents"
  cp "$HERE/auto-reapply/auto-reapply.sh" "$CONFIG/auto-reapply.sh"
  chmod +x "$CONFIG/auto-reapply.sh"
  sed -e "s|__LABEL__|$LABEL|" -e "s|__HOME__|$HOME|g" -e "s|__SPICETIFY__|$SPICETIFY|" \
    "$HERE/auto-reapply/spicetify-reapply.plist.template" > "$PLIST"
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$PLIST"
  echo "Auto-reapply installed ($PLIST)"
fi

# A stock Spotify ships its UI as xpui.spa; Spicetify needs a backup of it
# the first time. After that, a plain apply is enough.
if [ -f "$APPS/xpui.spa" ] || [ ! -d "$APPS/xpui" ]; then
  "$SPICETIFY" backup apply
else
  "$SPICETIFY" apply
fi
echo "PureBlack is applied. Spotify has restarted with the theme."
