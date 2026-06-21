#!/usr/bin/env bash
#
# Build and deploy the JetHop SPA to S3 + CloudFront.
# See DEPLOY.md for the one-time infrastructure setup.
#
# Usage:
#   BUCKET=jethop-ca-site DIST_ID=dXXXXXXXX ./scripts/deploy.sh
#
set -euo pipefail

BUCKET="${BUCKET:?set BUCKET to your S3 bucket name}"
DIST_ID="${DIST_ID:?set DIST_ID to your CloudFront distribution id}"
BUILD_DIR="dist/jethop/browser"

echo "==> Building production bundle"
npm run build

if [ ! -f "$BUILD_DIR/index.html" ]; then
  echo "Build output not found at $BUILD_DIR" >&2
  exit 1
fi

echo "==> Syncing hashed assets (immutable, 1-year cache)"
aws s3 sync "$BUILD_DIR" "s3://$BUCKET" \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

echo "==> Uploading index.html (no-cache so deploys are picked up immediately)"
aws s3 cp "$BUILD_DIR/index.html" "s3://$BUCKET/index.html" \
  --cache-control "no-cache"

echo "==> Invalidating CloudFront cache"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" >/dev/null

echo "==> Done. Live shortly at your CloudFront domain / custom domain."
