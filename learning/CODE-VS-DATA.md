# Understanding Code vs Data in Binaries

## What You See in a Hex Editor

When you open a binary in a hex editor, you see BOTH code and data mixed together. The trick is knowing which is which!

## Example from Your 06-file-read Binary

### CODE Section (Executable Instructions)

```
Address    Bytes         Disassembly              Meaning
---------- ------------- ----------------------  -----------------
0x460      d1 02 83 ff   sub   sp, sp, #0xa0    Allocate stack
0x464      a9 09 7b fd   stp   x29, x30, [sp]  Save registers
0x468      91 02 43 fd   add   x29, sp, #0x90  Set frame pointer
0x46c      90 00 00 28   adrp  x8, 0x100004000 Load address
0x470      f9 40 05 08   ldr   x8, [x8, #0x8]  Load from memory
```

These bytes ARE INSTRUCTIONS - the CPU executes them!

### DATA Section (Strings, Constants)

```
Address    Bytes         Disassembly        Actual Data
---------- ------------- ------------------ ----------------
0x56c      74 65 73 74   .byte 0x74, ...   "test.txt"
0x570      2e 74 78 74
0x574      00

0x575      72 00         .byte 0x72, 0x00  "r" (read mode)

0x577      43 6f 75 6c   .byte 0x43, ...   "Could not open file"
0x57b      64 20 6e 6f
...
```

These bytes are DATA - if the CPU tried to execute them, it would crash!

## How to Read This

### When you see ACTUAL INSTRUCTIONS (ldr, adrp, sub, etc.):

**Address 0x470:**
```
Bytes:        f9 40 05 08
Instruction:  ldr   x8, [x8, #0x8]
Meaning:      Load value from memory at (x8 + 8) into register x8
```

This is:
- **Opcode**: `f9` tells CPU "this is a load instruction"
- **Registers**: `40` and `05` encode which registers (x8)
- **Offset**: `08` is the offset (#0x8)

### When you see .byte (DATA):

**Address 0x56c:**
```
Bytes:     74 65 73 74 2e 74 78 74 00
.byte:     .byte 0x74, 0x65, 0x73, 0x74, ...
ASCII:     t    e    s    t    .    t    x    t    \0
String:    "test.txt"
```

The disassembler shows `.byte` because:
- These bytes don't decode to valid ARM64 instructions
- They're meant to be DATA, not CODE

## Binary Sections

A Mach-O binary (Mac) has different sections:

```
__TEXT segment:
  __text       ← Executable code (instructions)
  __stubs      ← Jump table for library functions
  __cstring    ← C strings (null-terminated)
  
__DATA segment:
  __data       ← Initialized data
  __bss        ← Uninitialized data
```

## How the CPU Knows the Difference

**The Program Counter (PC)** only executes code in the `__text` section!

When your program runs:
1. PC starts at `_main` (in `__text`)
2. Executes instructions sequentially
3. When it sees `adrp x0, 0x100000000; add x0, x0, #0x56c`
   - This LOADS THE ADDRESS of the string
   - It doesn't EXECUTE the string!
4. When it calls `printf`, it PASSES the address of the string

## Practical Example: The fopen Call

**Line 15-19 in your assembly:**

```assembly
100000480: 90000000    adrp  x0, 0x100000000    ← Get address of data page
100000484: 9115b000    add   x0, x0, #0x56c     ← Add offset to get "test.txt" address
100000488: 90000001    adrp  x1, 0x100000000    ← Get address of data page
10000048c: 9115d421    add   x1, x1, #0x575     ← Add offset to get "r" address
100000490: 94000031    bl    0x100000554        ← Call fopen(x0, x1)
```

**What's happening:**
- x0 gets ADDRESS `0x56c` (points to "test.txt" string in data section)
- x1 gets ADDRESS `0x575` (points to "r" string in data section)
- `bl` calls `fopen` with these addresses

**The strings themselves (at 0x56c and 0x575) are never executed!**

## In Your Hex Editor

**When you see an instruction like `ldr x0, [x1, #8]`:**
- Bytes: `f9 40 04 20` (or similar)
- This IS code
- CPU will execute it
- Disassembler decodes it properly

**When you see `.byte` with a readable string:**
- Bytes: `74 65 73 74` = "test"
- This is DATA
- CPU never executes it
- Code REFERENCES it (loads its address)

## For Intent Detection

**Good news:** You don't need to understand every instruction!

**What matters:**
1. **System call patterns** - what library functions are called
2. **Strings** - error messages, file paths give clues
3. **Statistical features** - how many instructions, loops, branches

The hex editor exploration is awesome for learning, but for ML:
- Focus on the high-level patterns
- Let the AI learn the low-level byte patterns

## Quick Test

Want to prove code vs data? Try this:

```bash
# Show ONLY the code section
objdump -d 06-file-read | grep -A 5 "_main"

# Show ONLY strings (data)
strings 06-file-read
```

One shows instructions, the other shows readable text!

