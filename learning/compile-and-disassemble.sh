#!/bin/bash

echo "Compiling C programs..."
cd c-examples

for file in *.c; do
    name="${file%.c}"
    echo "  Compiling $file..."
    gcc -o "$name" "$file"
done

echo ""
echo "Disassembling binaries..."

for binary in 01-* 02-* 03-* 04-* 05-* 06-* 07-*; do
    if [ -f "$binary" ] && [ -x "$binary" ]; then
        echo "  Disassembling $binary..."
        objdump -d "$binary" > "../assembly-output/${binary}.asm"
    fi
done

echo ""
echo "Done! Check assembly-output/ directory for results."
echo ""
echo "Quick stats:"
cd ../assembly-output
for asm in *.asm; do
    lines=$(wc -l < "$asm")
    funcs=$(grep -c "^[0-9a-f]* <.*>:" "$asm")
    printf "  %-20s %5d lines, %3d functions\n" "$asm" "$lines" "$funcs"
done

