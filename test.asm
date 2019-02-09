jp start
a: db 0
b: db 0
c: db "Hello World!"
start: cp [a], 10
cp [a], 0
cp [b], 2
cp [a], [b]
add [a], 10
add [a], [b]
sub [a], 5
sub [a], 100
sub [a], [b]
inc [a]
dec [a]
cp [a], 1
dec [a]
dec [a]
cmp [a], 100
cmp [a], 255
jp addr1
jz addr
jo addr
prints [c]
printd [a]
