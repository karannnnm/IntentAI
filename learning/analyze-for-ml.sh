#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./analyze-for-ml.sh <binary>"
    exit 1
fi

BINARY="$1"

if [ ! -f "$BINARY" ]; then
    echo "Error: File not found: $BINARY"
    exit 1
fi

echo "====================================="
echo "ML-Relevant Analysis: $(basename $BINARY)"
echo "====================================="
echo ""

echo "1. SYSTEM CALLS (Most important for intent detection):"
echo "   These tell us WHAT the program does"
nm -u "$BINARY" 2>/dev/null | sed 's/^/   /'
echo ""

echo "2. STRINGS (Clues about functionality):"
echo "   Look for file paths, error messages, etc."
strings "$BINARY" | head -20 | sed 's/^/   /'
if [ $(strings "$BINARY" | wc -l) -gt 20 ]; then
    echo "   ... ($(strings "$BINARY" | wc -l) total strings)"
fi
echo ""

echo "3. BASIC STATS:"
FUNCS=$(objdump -d "$BINARY" 2>/dev/null | grep -c "^[0-9a-f]* <.*>:")
INSTRS=$(objdump -d "$BINARY" 2>/dev/null | grep -c "^\s*[0-9a-f]*:")
SIZE=$(wc -c < "$BINARY")
echo "   Functions: $FUNCS"
echo "   Instructions: $INSTRS"
echo "   File size: $SIZE bytes"
echo ""

echo "4. FILE TYPE:"
file "$BINARY" | sed 's/^/   /'
echo ""

echo "====================================="
echo "For ML: Focus on #1 (system calls)"
echo "====================================="

