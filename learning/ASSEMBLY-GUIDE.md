# Understanding ARM64 Assembly - Quick Guide

## Reading the Assembly Output

Each line in the .asm file has this format:
```
ADDRESS: MACHINE_CODE    INSTRUCTION    OPERANDS
100000460: d10283ff      sub           sp, sp, #0xa0
```

- **ADDRESS**: Where this instruction lives in memory
- **MACHINE_CODE**: The actual bytes (what CPU executes) - `d10283ff` is 4 bytes
- **INSTRUCTION**: Human-readable operation - `sub` means subtract
- **OPERANDS**: What the instruction operates on - `sp, sp, #0xa0`

## ARM64 Registers You'll See

**General Purpose:**
- `x0-x30` - 64-bit registers
- `w0-w30` - Same registers, but 32-bit (lower half)

**Special Purpose:**
- `sp` - Stack Pointer (points to top of stack)
- `x29` (fp) - Frame Pointer (points to current function's stack frame)
- `x30` (lr) - Link Register (stores return address)
- `pc` - Program Counter (current instruction address)

**Calling Convention (important!):**
- `x0-x7` - Function arguments (x0=1st arg, x1=2nd arg, etc.)
- `x0` - Also holds return value
- `x8-x18` - Temporary registers
- `x19-x28` - Saved registers (callee must preserve)

## Key Instructions in 06-file-read.asm

### 1. Function Setup (Prologue)
```assembly
sub   sp, sp, #0xa0          // Make space on stack (160 bytes)
stp   x29, x30, [sp, #0x90]  // Save old frame pointer & return address
add   x29, sp, #0x90         // Set new frame pointer
```

### 2. Loading String Addresses (for fopen call)
```assembly
adrp  x0, 0x100000000        // Load page address
add   x0, x0, #0x56c         // Add offset to get "test.txt"
adrp  x1, 0x100000000        
add   x1, x1, #0x575         // Get "r" (read mode)
```
Why two instructions? ARM64 uses PC-relative addressing in two steps.

### 3. Function Call
```assembly
bl    0x100000554            // Branch with Link (call function)
```
This:
1. Saves return address in x30 (link register)
2. Jumps to the function (fopen)
3. fopen puts its return value in x0

### 4. Checking Result
```assembly
ldr   x8, [sp, #0x18]        // Load fopen's return (FILE pointer)
cbnz  x8, 0x1000004bc        // Compare and Branch if Not Zero
                             // If file opened (not NULL), jump to read code
```

### 5. The Stubs Section (Dynamic Linking)
```assembly
adrp  x16, 0x100004000
ldr   x16, [x16]
br    x16                     // Branch (jump) to x16
```
This is **lazy binding** - the first time you call `fopen`, the dynamic linker:
1. Loads the real address of `fopen` from the library
2. Updates the stub
3. Jumps to the actual `fopen` code in libc

## Common Instruction Patterns

**Memory Operations:**
- `ldr` - Load Register (read from memory)
- `str` - Store Register (write to memory)
- `ldp` - Load Pair (load two registers at once)
- `stp` - Store Pair

**Arithmetic:**
- `add` - Addition
- `sub` - Subtraction
- `mov` - Move (copy) value

**Control Flow:**
- `b` - Branch (unconditional jump)
- `bl` - Branch and Link (function call)
- `br` - Branch to Register
- `ret` - Return from function
- `cbnz` - Compare and Branch if Not Zero
- `cbz` - Compare and Branch if Zero

**Stack Operations:**
- Growing down: `sub sp, sp, #size` allocates space
- Shrinking: `add sp, sp, #size` deallocates

## For Intent Detection, Focus On:

You don't need to understand every instruction! Just look for:

1. **Function calls (bl instructions)** - especially the stubs section
2. **What functions are called** - use `nm -u` to see them directly
3. **Strings in the binary** - use `strings` command

The pattern of function calls tells you the intent:
- File I/O: `fopen`, `fread`, `fwrite`, `fclose`
- Network: `socket`, `connect`, `send`, `recv`
- Memory: `malloc`, `free`, `mmap`

## Next Step: Try This

Run this on your simple programs to see patterns:
```bash
# See all the function calls
nm -u 06-file-read

# Compare with file-write
nm -u 07-file-write
```

The difference in function calls is what your ML model will learn!

