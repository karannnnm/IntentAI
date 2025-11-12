
05-struct:	file format mach-o arm64

Disassembly of section __TEXT,__text:

00000001000004b0 <_main>:
1000004b0: d10103ff    	sub	sp, sp, #0x40
1000004b4: a9037bfd    	stp	x29, x30, [sp, #0x30]
1000004b8: 9100c3fd    	add	x29, sp, #0x30
1000004bc: 52800008    	mov	w8, #0x0                ; =0
1000004c0: b81ec3a8    	stur	w8, [x29, #-0x14]
1000004c4: b81fc3bf    	stur	wzr, [x29, #-0x4]
1000004c8: 90000008    	adrp	x8, 0x100000000 <_printf+0x100000000>
1000004cc: 91146108    	add	x8, x8, #0x518
1000004d0: f9400108    	ldr	x8, [x8]
1000004d4: f81f03a8    	stur	x8, [x29, #-0x10]
1000004d8: b85f03a8    	ldur	w8, [x29, #-0x10]
1000004dc: aa0803ea    	mov	x10, x8
1000004e0: b85f43a8    	ldur	w8, [x29, #-0xc]
1000004e4: 910003e9    	mov	x9, sp
1000004e8: f900012a    	str	x10, [x9]
1000004ec: f9000528    	str	x8, [x9, #0x8]
1000004f0: 90000000    	adrp	x0, 0x100000000 <_printf+0x100000000>
1000004f4: 91148000    	add	x0, x0, #0x520
1000004f8: 94000005    	bl	0x10000050c <_printf+0x10000050c>
1000004fc: b85ec3a0    	ldur	w0, [x29, #-0x14]
100000500: a9437bfd    	ldp	x29, x30, [sp, #0x30]
100000504: 910103ff    	add	sp, sp, #0x40
100000508: d65f03c0    	ret

Disassembly of section __TEXT,__stubs:

000000010000050c <__stubs>:
10000050c: 90000030    	adrp	x16, 0x100004000 <_printf+0x100004000>
100000510: f9400210    	ldr	x16, [x16]
100000514: d61f0200    	br	x16
