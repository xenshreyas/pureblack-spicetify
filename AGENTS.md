# Installing PureBlack: instructions for coding agents

These are instructions for an AI coding agent (Claude Code, Codex, Cursor, and the like) installing this theme on a person's Mac. If you're a person, you can hand this file to your agent: "Install the theme in this repo by following its AGENTS.md."

**Goal:** Spotify desktop on this Mac runs the PureBlack theme through Spicetify, with Lyrics Plus enabled, and optionally reapplies itself after Spotify updates.

**Supported:** macOS only (Apple Silicon or Intel). Spotify's desktop app from spotify.com or Homebrew. If the machine runs Windows or Linux, stop and tell the person this theme doesn't support it.

Work through the steps in order. Each one has a check; skip a step when its check already passes.

## 1. Get this repo

**Check:** you are already inside a clone of `pureblack-spicetify` (it has `install.sh` and `theme/PureBlack/`).

Otherwise:

```bash
git clone https://github.com/xenshreyas/pureblack-spicetify.git ~/pureblack-spicetify
cd ~/pureblack-spicetify
```

## 2. Spotify is installed and has been opened once

**Check:**

```bash
ls -d /Applications/Spotify.app && ls ~/Library/Application\ Support/Spotify/prefs
```

- **No `Spotify.app`:** if Homebrew is available, run `brew install --cask spotify`. If it isn't, ask the person to download Spotify from https://www.spotify.com/download and drag it into Applications.
- **No `prefs` file:** Spotify has never been run. Ask the person to open Spotify, sign in, then quit it. You can't do this step for them: it needs their Spotify account. Wait until they confirm, then check again.

If Spotify lives anywhere other than `/Applications/Spotify.app` (for example `~/Applications`), ask the person to move it there.

## 3. Spicetify is installed

**Check:** `spicetify --version` or `~/.spicetify/spicetify --version` prints a version (2.46.4 or later is known to work).

Otherwise install it. Prefer Homebrew because it runs without prompts:

```bash
brew install spicetify-cli
```

Without Homebrew, use the official installer, which puts the binary in `~/.spicetify/`:

```bash
curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh
```

That installer may ask whether to also install the Spicetify Marketplace. It's optional and PureBlack doesn't need it. If you can't answer prompts, use Homebrew instead.

## 4. Spicetify can write into Spotify

**Check:**

```bash
touch /Applications/Spotify.app/Contents/Resources/Apps/.probe && rm /Applications/Spotify.app/Contents/Resources/Apps/.probe
```

If that fails with "Permission denied", Spotify was installed by another user or by an installer that left it read-only. Fixing that needs `sudo`, so ask the person to run these two commands themselves (they will be asked for their Mac password):

```bash
sudo chmod a+wr /Applications/Spotify.app
```

```bash
sudo chmod a+wr -R /Applications/Spotify.app/Contents/Resources/Apps
```

Don't ask for the password and don't run `sudo` on their behalf.

## 5. Install the theme

From the repo folder:

```bash
./install.sh
```

The script:
- finds Spicetify (`$SPICETIFY`, then `~/.spicetify/spicetify`, then `PATH`)
- copies `theme/PureBlack/` to `~/.config/spicetify/Themes/PureBlack/`
- copies `extensions/lyrics-plus-button.js` to `~/.config/spicetify/Extensions/`
- sets the Spicetify config: theme PureBlack, color scheme Base, theme JS on, the extension, and the Lyrics Plus custom app
- runs `spicetify backup apply` on a stock Spotify, or `spicetify apply` if it's already been patched

Spotify restarts with the theme when it finishes.

**Optional:** to make the theme survive Spotify's automatic updates, run `./install.sh --auto-reapply` instead. It adds a LaunchAgent that watches Spotify's app folder and reapplies Spicetify after an update. Ask the person before adding it, because it's a background job that keeps running.

## 6. Verify

```bash
grep -c "pureBlackSky" /Applications/Spotify.app/Contents/Resources/Apps/xpui/extensions/theme.js
```

This should print 1 or more, and `~/.config/spicetify/config-xpui.ini` should show `current_theme = PureBlack`.

Then ask the person to look at Spotify. A working install shows:
- an animated sky in the top bar, matching the time of day and local weather
- black panels with a faint sky-coloured wash at the top
- the weather moving on the panels (rain drops, snow, a sun glint, and so on)

If the person has screen sharing or screenshots set up for you, a screenshot of Spotify is the best check.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `spicetify apply` says to run `backup` first | `spicetify backup apply` |
| "There is no backup" or the backup is from an older Spotify version | `spicetify restore backup apply` |
| Spotify updated and the theme vanished | `spicetify backup apply`, or rerun `./install.sh` |
| Theme is applied but the top bar or panels look plain | A Spotify update renamed the hashed class names the theme targets. Find the new names by grepping `/Applications/Spotify.app/Contents/Resources/Apps/xpui/*.css`, and update `theme/PureBlack/user.css` and `theme.js` |
| Weather never changes | The theme fetches from `api.open-meteo.com`. Check the network allows it. It uses the timezone's location, not GPS |

## Uninstalling

```bash
spicetify restore
```

That puts Spotify back to stock. If `--auto-reapply` was used, also remove the LaunchAgent:

```bash
launchctl bootout gui/$(id -u)/com.$(whoami).spicetify-reapply; rm ~/Library/LaunchAgents/com.$(whoami).spicetify-reapply.plist ~/.config/spicetify/auto-reapply.sh
```

## Rules for agents

- Don't use `sudo` yourself. Ask the person to run anything that needs it.
- Don't sign in to Spotify or handle the person's Spotify credentials.
- Don't edit files inside `Spotify.app` by hand. Spicetify does that.
- Don't change Spicetify settings beyond what `install.sh` sets. The person may have other extensions or custom apps; `install.sh` adds to them and doesn't remove any.
