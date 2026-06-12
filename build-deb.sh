#!/usr/bin/env bash
set -e

VERSION="${VERSION:-1.0.0}"
ARCH="amd64"
PKG="burnerrx_${VERSION}_${ARCH}"

echo "Building binaries..."
if [ "${SKIP_BUILD:-0}" != "1" ]; then
  wails build
fi
cd helper && go build -o burnerrx-helper . && cd ..

echo "Creating package structure..."
mkdir -p "$PKG/DEBIAN"
mkdir -p "$PKG/usr/local/bin"
mkdir -p "$PKG/usr/share/polkit-1/actions"
mkdir -p "$PKG/usr/share/applications"
mkdir -p "$PKG/usr/share/icons/hicolor/256x256/apps"

cat > "$PKG/DEBIAN/control" <<EOF
Package: burnerrx
Version: $VERSION
Architecture: $ARCH
Maintainer: Ramyar <ramyarburhan26@gmail.com>
Description: USB ISO flasher for Linux
 A lightweight desktop app for flashing ISO images to USB drives.
EOF

cp build/bin/burnerRx "$PKG/usr/local/bin/burnerRx"
cp helper/burnerrx-helper "$PKG/usr/local/bin/burnerrx-helper"
cp org.burnerrx.policy "$PKG/usr/share/polkit-1/actions/org.burnerrx.policy"
cp build/appicon.png "$PKG/usr/share/icons/hicolor/256x256/apps/burnerrx.png"

cat > "$PKG/usr/share/applications/burnerrx.desktop" <<EOF
[Desktop Entry]
Name=BurnerRx
Comment=Flash ISO images to USB drives
Exec=/usr/local/bin/burnerRx
Icon=burnerrx
Type=Application
Categories=Utility;
EOF

chmod 755 "$PKG/usr/local/bin/burnerRx"
chmod 755 "$PKG/usr/local/bin/burnerrx-helper"
chmod 644 "$PKG/usr/share/polkit-1/actions/org.burnerrx.policy"
chmod 644 "$PKG/usr/share/icons/hicolor/256x256/apps/burnerrx.png"
chmod 644 "$PKG/usr/share/applications/burnerrx.desktop"

echo "Building .deb..."
dpkg-deb --build "$PKG"

rm -rf "$PKG"

echo "Done: ${PKG}.deb"
