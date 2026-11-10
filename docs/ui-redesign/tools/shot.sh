#!/bin/sh
# usage: shot.sh <ipad|phone> <name>  -> full png in shots/, small preview in shots/small/
SP=${SHOT_DIR:-$(dirname "$0")}; case $1 in ipad) D=B787E9B9-77D9-40C0-9D71-2DBA83167462;; phone) D=4D324263-3DA6-4788-A7D6-E146E7EF78BA;; esac
mkdir -p $SP/shots/small; xcrun simctl io $D screenshot $SP/shots/$2.png >/dev/null 2>&1 && sips -Z 700 $SP/shots/$2.png --out $SP/shots/small/$2.png >/dev/null && echo $SP/shots/small/$2.png
