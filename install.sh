#!/usr/bin/env bash
set -e

REPO="KomputerOSx/burnerRx"

echo "Installing BurnerRx..."

sudo apt-get update -qq || true
TMP=$(mktemp /tmp/burnerrx-XXXXXX.deb)
curl -fsSL "https://github.com/$REPO/releases/latest/download/burnerrx_1.0.0_amd64.deb" -o "$TMP"
sudo apt-get install -y "$TMP"
rm -f "$TMP"

echo "Done. Run 'burnerRx' to launch."
