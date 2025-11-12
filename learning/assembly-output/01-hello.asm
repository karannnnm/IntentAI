
01-hello:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000100000460 <_main>:
100000460: d10083ff    	sub	sp, sp, #0x20
100000464: a9017bfd    	stp	x29, x30, [sp, #0x10]
100000468: 910043fd    	add	x29, sp, #0x10
10000046c: 52800008    	mov	w8, #0x0                ; =0
100000470: b9000be8    	str	w8, [sp, #0x8]
100000474: b81fc3bf    	stur	wzr, [x29, #-0x4]
100000478: 90000000    	adrp	x0, 0x100000000 <_printf+0x100000000>
10000047c: 91128000    	add	x0, x0, #0x4a0
100000480: 94000005    	bl	0x100000494 <_printf+0x100000494>
100000484: b9400be0    	ldr	w0, [sp, #0x8]
100000488: a9417bfd    	ldp	x29, x30, [sp, #0x10]
10000048c: 910083ff    	add	sp, sp, #0x20
100000490: d65f03c0    	ret

Disassembly of section __TEXT,__stubs:

0000000100000494 <__stubs>:
100000494: 90000030    	adrp	x16, 0x100004000 <_printf+0x100004000>
100000498: f9400210    	ldr	x16, [x16]
10000049c: d61f0200    	br	x16
