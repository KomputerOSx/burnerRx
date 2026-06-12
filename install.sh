#!/usr/bin/env bash
set -e

REPO_URL="https://packages.strixon.co.uk"

echo "Installing BurnerRx..."

curl -fsSL "$REPO_URL/strixon-archive-key.asc" | sudo gpg --dearmor -o /usr/share/keyrings/strixon-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/strixon-archive-keyring.gpg] $REPO_URL stable main" | sudo tee /etc/apt/sources.list.d/strixon.list > /dev/null

sudo apt-get update -qq
sudo apt-get install -y burnerrx

echo "Done. Run 'burnerRx' to launch."
