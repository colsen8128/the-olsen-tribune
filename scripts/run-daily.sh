#!/bin/bash
# run-daily.sh
#
# Wrapper called by the macOS launchd scheduler.
# Its job is to make sure the `node` command is findable before running the
# main script — launchd starts with a minimal environment that often doesn't
# include the directories where Homebrew or nvm install Node.
#
# All output (stdout and stderr) is written to a log file you can inspect
# if something goes wrong:  /tmp/olsen-tribune-daily.log

# ── 1. Extend PATH so node can be found ──────────────────────────────────────
# These are the most common locations Node is installed on macOS.
# The script tries all of them; the one that actually has node will win.
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -1)/bin:$PATH"

# ── 2. Move into the scripts/ folder so relative paths resolve correctly ─────
cd "$(dirname "$0")" || exit 1

# ── 3. Run the update script, appending all output to the log file ───────────
node daily-update.js >> /tmp/olsen-tribune-daily.log 2>&1
