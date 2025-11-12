#!/bin/bash

echo "Analyzing symbols in binaries..."
echo ""

cd c-examples

for binary in 01-* 02-* 03-* 04-* 05-* 06-* 07-*; do
    if [ -f "$binary" ] && [ -x "$binary" ]; then
        echo "=== $binary ==="
        echo "External symbols (library calls):"
        nm -u "$binary" | sed 's/^/  /'
        echo ""
    fi
done

