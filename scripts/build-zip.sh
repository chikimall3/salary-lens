#!/bin/bash
# Build extension ZIP for Chrome Web Store submission
# Usage: bash scripts/build-zip.sh

set -e

VERSION=$(node -e "console.log(require('./manifest.json').version)")
OUTFILE="salarylens-v${VERSION}.zip"

echo "Building SalaryLens v${VERSION}..."

# Clean previous build
rm -f "$OUTFILE"

# Create ZIP with only extension files (exclude dev files, landing, tests, etc.)
zip -r "$OUTFILE" \
  manifest.json \
  src/ \
  assets/ \
  -x "src/shared/ExtPay.module.js" \
  -x "*.test.js" \
  -x "**/__tests__/**"

echo "Created: $OUTFILE ($(du -h "$OUTFILE" | cut -f1))"
echo "Ready to upload to Chrome Web Store."
