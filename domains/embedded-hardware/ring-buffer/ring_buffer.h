#ifndef RING_BUFFER_H
#define RING_BUFFER_H

#include <stddef.h>
#include <stdint.h>

#define RB_CAPACITY 8

typedef struct {
    uint8_t data[RB_CAPACITY];
    size_t head;  /* next free slot */
    size_t tail;  /* oldest stored byte */
    size_t count; /* bytes currently stored */
} ring_buffer_t;

void rb_init(ring_buffer_t *rb);
int rb_push(ring_buffer_t *rb, uint8_t value);
int rb_pop(ring_buffer_t *rb, uint8_t *out);
size_t rb_count(const ring_buffer_t *rb);

#endif /* RING_BUFFER_H */
