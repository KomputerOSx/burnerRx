#!/usr/bin/env bash
set -e

REPO_URL="https://packages.strixon.co.uk"

echo "Installing BurnerRx..."

# Acquire sudo upfront so password can be read from the terminal.
# This is needed because curl | bash replaces stdin with the pipe.
sudo -v

curl -fsSL "$REPO_URL/strixon-archive-key.asc" | sudo gpg --dearmor | sudo tee /usr/share/keyrings/strixon-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/strixon-archive-keyring.gpg] $REPO_URL stable main" | sudo tee /etc/apt/sources.list.d/strixon.list > /dev/null

sudo apt-get update -qq || true
sudo apt-get install -y burnerrx

echo "Done. Run 'burnerRx' to launch."
