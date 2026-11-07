#!/bin/bash
# Reapplies Spicetify after a Spotify update. Run by the LaunchAgent
# ~/Library/LaunchAgents/com.xenshreyas.spicetify-reapply.plist whenever
# Spotify's app files change (and every 30 minutes as a fallback).
#
# A stock Spotify ships its UI as Apps/xpui.spa; Spicetify unpacks it into
# Apps/xpui. So a .spa file (or no xpui folder) means an update wiped it.
#
#   auto-reapply.sh --check-access   only test that this job may write into
#                                    Spotify.app, then exit

SPICETIFY="${SPICETIFY:-$HOME/.spicetify/spicetify}"
APPS="/Applications/Spotify.app/Contents/Resources/Apps"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*"; }

if [ "$1" = "--check-access" ]; then
  probe="$APPS/.spicetify-reapply-probe"
  if touch "$probe" 2>/dev/null && rm -f "$probe"; then
    log "access ok: can write to $APPS"
    exit 0
  fi
  log "access DENIED: cannot write to $APPS"
  exit 1
fi

needs_reapply() { [ -f "$APPS/xpui.spa" ] || [ ! -d "$APPS/xpui" ]; }

needs_reapply || exit 0

# Give Spotify's updater time to finish writing before touching anything.
sleep 30
needs_reapply || exit 0

log "Spotify looks freshly updated; reapplying Spicetify"

# Only restart Spotify if it's already running, so this never opens it.
flags=()
pgrep -x Spotify >/dev/null || flags+=(-n)

if "$SPICETIFY" "${flags[@]}" backup apply; then
  result="reapplied"
elif "$SPICETIFY" "${flags[@]}" restore backup apply; then
  result="reapplied (after restoring an old backup)"
else
  log "reapply FAILED"
  osascript -e 'display notification "Couldn'\''t reapply after the Spotify update. Run: spicetify backup apply" with title "Spicetify"'
  exit 1
fi

log "$result"
osascript -e "display notification \"Theme and Lyrics Plus $result after a Spotify update.\" with title \"Spicetify\""
