#include "ring_buffer.h"

void rb_init(ring_buffer_t *rb)
{
    rb->head = 0;
    rb->tail = 0;
    rb->count = 0;
}

int rb_push(ring_buffer_t *rb, uint8_t value)
{
    if (rb->count == RB_CAPACITY) {
        return -1;
    }

    /* BUG: head is advanced before the value is stored, so every byte lands
     * one slot late and FIFO order is rotated by one on the first pass. */
    rb->head = (rb->head + 1) % RB_CAPACITY;
    rb->data[rb->head] = value;
    rb->count += 1;
    return 0;
}

int rb_pop(ring_buffer_t *rb, uint8_t *out)
{
    if (rb->count == 0) {
        return -1;
    }

    *out = rb->data[rb->tail];
    rb->tail = (rb->tail + 1) % RB_CAPACITY;
    rb->count -= 1;
    return 0;
}

size_t rb_count(const ring_buffer_t *rb)
{
    return rb->count;
}
