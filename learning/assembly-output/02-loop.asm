
02-loop:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000100000460 <_main>:
100000460: d10083ff    	sub	sp, sp, #0x20
100000464: a9017bfd    	stp	x29, x30, [sp, #0x10]
100000468: 910043fd    	add	x29, sp, #0x10
10000046c: b81fc3bf    	stur	wzr, [x29, #-0x4]
100000470: b9000bff    	str	wzr, [sp, #0x8]
100000474: 14000001    	b	0x100000478 <_main+0x18>
100000478: b9400be8    	ldr	w8, [sp, #0x8]
10000047c: 71001508    	subs	w8, w8, #0x5
100000480: 540001aa    	b.ge	0x1000004b4 <_main+0x54>
100000484: 14000001    	b	0x100000488 <_main+0x28>
100000488: b9400be8    	ldr	w8, [sp, #0x8]
10000048c: 910003e9    	mov	x9, sp
100000490: f9000128    	str	x8, [x9]
100000494: 90000000    	adrp	x0, 0x100000000 <_printf+0x100000000>
100000498: 91134000    	add	x0, x0, #0x4d0
10000049c: 9400000a    	bl	0x1000004c4 <_printf+0x1000004c4>
1000004a0: 14000001    	b	0x1000004a4 <_main+0x44>
1000004a4: b9400be8    	ldr	w8, [sp, #0x8]
1000004a8: 11000508    	add	w8, w8, #0x1
1000004ac: b9000be8    	str	w8, [sp, #0x8]
1000004b0: 17fffff2    	b	0x100000478 <_main+0x18>
1000004b4: 52800000    	mov	w0, #0x0                ; =0
1000004b8: a9417bfd    	ldp	x29, x30, [sp, #0x10]
1000004bc: 910083ff    	add	sp, sp, #0x20
1000004c0: d65f03c0    	ret

Disassembly of section __TEXT,__stubs:

00000001000004c4 <__stubs>:
1000004c4: 90000030    	adrp	x16, 0x100004000 <_printf+0x100004000>
1000004c8: f9400210    	ldr	x16, [x16]
1000004cc: d61f0200    	br	x16
