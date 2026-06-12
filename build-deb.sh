#!/usr/bin/env bash
set -e

VERSION="1.0.0"
ARCH="amd64"
PKG="burnerrx_${VERSION}_${ARCH}"

echo "Building binaries..."
wails build
cd helper && go build -o burnerrx-helper . && cd ..

echo "Creating package structure..."
mkdir -p "$PKG/DEBIAN"
mkdir -p "$PKG/usr/local/bin"
mkdir -p "$PKG/usr/share/polkit-1/actions"

cat > "$PKG/DEBIAN/control" <<EOF
Package: burnerrx
Version: $VERSION
Architecture: $ARCH
Maintainer: Ramyar <ramyarburhan26@gmail.com>
Description: USB ISO flasher for Linux
 A lightweight desktop app for flashing ISO images to USB drives.
Depends: polkit | policykit-1
EOF

cp build/bin/burnerRx "$PKG/usr/local/bin/burnerRx"
cp helper/burnerrx-helper "$PKG/usr/local/bin/burnerrx-helper"
cp org.burnerrx.policy "$PKG/usr/share/polkit-1/actions/org.burnerrx.policy"

chmod 755 "$PKG/usr/local/bin/burnerRx"
chmod 755 "$PKG/usr/local/bin/burnerrx-helper"
chmod 644 "$PKG/usr/share/polkit-1/actions/org.burnerrx.policy"

echo "Building .deb..."
dpkg-deb --build "$PKG"

rm -rf "$PKG"

echo "Done: ${PKG}.deb"
