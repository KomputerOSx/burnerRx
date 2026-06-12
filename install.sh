#!/usr/bin/env bash
set -e

BASE_URL="https://your-website.com/downloads/burnerrx"

echo "Installing BurnerRx..."

curl -fsSL "$BASE_URL/burnerRx" -o /tmp/burnerRx
curl -fsSL "$BASE_URL/burnerrx-helper" -o /tmp/burnerrx-helper
curl -fsSL "$BASE_URL/org.burnerrx.policy" -o /tmp/org.burnerrx.policy

sudo install -m 755 /tmp/burnerRx /usr/local/bin/burnerRx
sudo install -m 755 /tmp/burnerrx-helper /usr/local/bin/burnerrx-helper
sudo install -m 644 /tmp/org.burnerrx.policy /usr/share/polkit-1/actions/org.burnerrx.policy

rm /tmp/burnerRx /tmp/burnerrx-helper /tmp/org.burnerrx.policy

echo "Done. Run 'burnerRx' to launch."
