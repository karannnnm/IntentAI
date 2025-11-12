
03-function:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000100000460 <_add>:
100000460: d10043ff    	sub	sp, sp, #0x10
100000464: b9000fe0    	str	w0, [sp, #0xc]
100000468: b9000be1    	str	w1, [sp, #0x8]
10000046c: b9400fe8    	ldr	w8, [sp, #0xc]
100000470: b9400be9    	ldr	w9, [sp, #0x8]
100000474: 0b090100    	add	w0, w8, w9
100000478: 910043ff    	add	sp, sp, #0x10
10000047c: d65f03c0    	ret

0000000100000480 <_main>:
100000480: d100c3ff    	sub	sp, sp, #0x30
100000484: a9027bfd    	stp	x29, x30, [sp, #0x20]
100000488: 910083fd    	add	x29, sp, #0x20
10000048c: 52800008    	mov	w8, #0x0                ; =0
100000490: b81f43a8    	stur	w8, [x29, #-0xc]
100000494: b81fc3bf    	stur	wzr, [x29, #-0x4]
100000498: 528000a0    	mov	w0, #0x5                ; =5
10000049c: 52800061    	mov	w1, #0x3                ; =3
1000004a0: 97fffff0    	bl	0x100000460 <_add>
1000004a4: b81f83a0    	stur	w0, [x29, #-0x8]
1000004a8: b85f83a8    	ldur	w8, [x29, #-0x8]
1000004ac: 910003e9    	mov	x9, sp
1000004b0: f9000128    	str	x8, [x9]
1000004b4: 90000000    	adrp	x0, 0x100000000 <_printf+0x100000000>
1000004b8: 91137000    	add	x0, x0, #0x4dc
1000004bc: 94000005    	bl	0x1000004d0 <_printf+0x1000004d0>
1000004c0: b85f43a0    	ldur	w0, [x29, #-0xc]
1000004c4: a9427bfd    	ldp	x29, x30, [sp, #0x20]
1000004c8: 9100c3ff    	add	sp, sp, #0x30
1000004cc: d65f03c0    	ret

Disassembly of section __TEXT,__stubs:

00000001000004d0 <__stubs>:
1000004d0: 90000030    	adrp	x16, 0x100004000 <_printf+0x100004000>
1000004d4: f9400210    	ldr	x16, [x16]
1000004d8: d61f0200    	br	x16
