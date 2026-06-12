#!/usr/bin/env bash
set -e

REPO_URL="https://packages.strixon.co.uk"

echo "Installing BurnerRx..."

TMP=$(mktemp /tmp/burnerrx-XXXXXX.deb)
curl -fsSL "$REPO_URL/burnerrx-latest.deb" -o "$TMP"
sudo dpkg -i "$TMP"
rm -f "$TMP"

echo "Done. Run 'burnerRx' to launch."
