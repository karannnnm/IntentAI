# Learning Assembly with objdump

This directory contains simple C programs to understand how objdump works and what assembly code looks like.

## Programs

1. **01-hello.c** - Basic printf
2. **02-loop.c** - For loop
3. **03-function.c** - Function calls
4. **04-pointer.c** - Pointer usage
5. **05-struct.c** - Struct definition and usage
6. **06-file-read.c** - File reading (relevant for intent detection)
7. **07-file-write.c** - File writing (relevant for intent detection)

## Compile and Disassemble

```bash
# Compile all programs
cd learning/c-examples
gcc -o 01-hello 01-hello.c
gcc -o 02-loop 02-loop.c
gcc -o 03-function 03-function.c
gcc -o 04-pointer 04-pointer.c
gcc -o 05-struct 05-struct.c
gcc -o 06-file-read 06-file-read.c
gcc -o 07-file-write 07-file-write.c

# Disassemble with objdump
objdump -d 01-hello > ../assembly-output/01-hello.asm
objdump -d 02-loop > ../assembly-output/02-loop.asm
objdump -d 03-function > ../assembly-output/03-function.asm
objdump -d 04-pointer > ../assembly-output/04-pointer.asm
objdump -d 05-struct > ../assembly-output/05-struct.asm
objdump -d 06-file-read > ../assembly-output/06-file-read.asm
objdump -d 07-file-write > ../assembly-output/07-file-write.asm

# Or disassemble with more detail (includes symbol table)
objdump -d -S 01-hello > ../assembly-output/01-hello-detailed.asm
```

## What to Look For

When examining the assembly output:

1. **Function boundaries** - Look for `<main>:` or `<add>:` labels
2. **System calls** - Look for `call` instructions, especially to functions like:
   - `_printf` - output
   - `_fopen`, `_fclose` - file operations
   - `_fgets`, `_fprintf` - I/O operations
3. **Stack management** - `push`, `pop` instructions
4. **Registers** - arm64 uses: `x0-x30`, `sp`, `lr`, `pc`
5. **Control flow** - `b` (branch), `bl` (branch with link), `ret` (return)

## Next Steps

After understanding the assembly output format:
1. Build a parser to extract key features (functions, system calls, instructions)
2. Apply to the collected Mac binaries
3. Store extracted features for ML training

