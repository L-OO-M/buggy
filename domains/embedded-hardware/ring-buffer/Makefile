CC ?= cc
CFLAGS ?= -std=c99 -Wall -Wextra -Werror -O2 -g

.PHONY: all test clean

all: ring_buffer_test

ring_buffer_test: main.c ring_buffer.c ring_buffer.h
	$(CC) $(CFLAGS) -o $@ main.c ring_buffer.c

test: ring_buffer_test
	./ring_buffer_test

clean:
	rm -f ring_buffer_test
