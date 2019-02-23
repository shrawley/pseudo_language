jp start
a1: db 0
b1: db 0
c1: db "Hello World!"
db 0
start: cp [a1], 10
cp [a1], 0
cp [b1], 2
cp [a1], [b1]
add [a1], 10
add [a1], [b1]
sub [a1], 5
sub [a1], 100
sub [a1], [b1]
inc [a1]
dec [a1]
cp [a1], 1
dec [a1]
dec [a1]
inc [a1]
dec [a1]
cmp [a1], 100
jz start
cmp [a1], 255
jz equal
inc [a1]
equal: prns [c1]
prnd [a1]
cp [a1], 2
cmp [a1], 3
jo bigger
inc [a1]
bigger: jp addr1
addr1:
addr:
