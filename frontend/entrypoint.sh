#!/bin/sh
set -e

npm install --no-audit --no-fund
exec npm run dev
