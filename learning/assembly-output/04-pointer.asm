
04-pointer:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000100000460 <_main>:
100000460: d100c3ff    	sub	sp, sp, #0x30
100000464: a9027bfd    	stp	x29, x30, [sp, #0x20]
100000468: 910083fd    	add	x29, sp, #0x20
10000046c: 52800008    	mov	w8, #0x0                ; =0
100000470: b9000fe8    	str	w8, [sp, #0xc]
100000474: b81fc3bf    	stur	wzr, [x29, #-0x4]
100000478: d10023a8    	sub	x8, x29, #0x8
10000047c: 52800549    	mov	w9, #0x2a               ; =42
100000480: b81f83a9    	stur	w9, [x29, #-0x8]
100000484: f9000be8    	str	x8, [sp, #0x10]
100000488: f9400be8    	ldr	x8, [sp, #0x10]
10000048c: b9400108    	ldr	w8, [x8]
100000490: 910003e9    	mov	x9, sp
100000494: f9000128    	str	x8, [x9]
100000498: 90000000    	adrp	x0, 0x100000000 <_printf+0x100000000>
10000049c: 91130000    	add	x0, x0, #0x4c0
1000004a0: 94000005    	bl	0x1000004b4 <_printf+0x1000004b4>
1000004a4: b9400fe0    	ldr	w0, [sp, #0xc]
1000004a8: a9427bfd    	ldp	x29, x30, [sp, #0x20]
1000004ac: 9100c3ff    	add	sp, sp, #0x30
1000004b0: d65f03c0    	ret

Disassembly of section __TEXT,__stubs:

00000001000004b4 <__stubs>:
1000004b4: 90000030    	adrp	x16, 0x100004000 <_printf+0x100004000>
1000004b8: f9400210    	ldr	x16, [x16]
1000004bc: d61f0200    	br	x16
