#include <assert.h>
#include <stdio.h>

#include "ring_buffer.h"

static int failures = 0;

static void check(int condition, const char *label)
{
    if (condition) {
        printf("PASS %s\n", label);
    } else {
        printf("FAIL %s\n", label);
        failures += 1;
    }
}

int main(void)
{
    ring_buffer_t rb;
    uint8_t out = 0;

    rb_init(&rb);
    check(rb_count(&rb) == 0, "new buffer is empty");
    check(rb_pop(&rb, &out) == -1, "pop on empty fails");
    check(out == 0, "failed pop leaves out untouched");

    rb_init(&rb);
    check(rb_push(&rb, 10) == 0, "push 10");
    check(rb_push(&rb, 20) == 0, "push 20");
    check(rb_push(&rb, 30) == 0, "push 30");
    check(rb_count(&rb) == 3, "count is 3");
    check(rb_pop(&rb, &out) == 0 && out == 10, "FAIL push/pop FIFO order");
    check(rb_pop(&rb, &out) == 0 && out == 20, "second byte is 20");
    check(rb_pop(&rb, &out) == 0 && out == 30, "third byte is 30");

    rb_init(&rb);
    for (uint8_t i = 0; i < RB_CAPACITY; i += 1) {
        assert(rb_push(&rb, (uint8_t)(i + 1)) == 0);
    }
    check(rb_count(&rb) == RB_CAPACITY, "buffer fills to capacity");
    check(rb_push(&rb, 99) == -1, "push on full fails");
    check(rb_count(&rb) == RB_CAPACITY, "failed push does not change count");

    rb_init(&rb);
    for (uint8_t i = 0; i < RB_CAPACITY; i += 1) {
        assert(rb_push(&rb, (uint8_t)(i + 1)) == 0);
    }
    for (int i = 0; i < 2; i += 1) {
        check(rb_pop(&rb, &out) == 0 && out == (uint8_t)(i + 1), "drain after fill");
    }
    for (uint8_t i = 0; i < 2; i += 1) {
        assert(rb_push(&rb, (uint8_t)(9 + i)) == 0);
    }
    for (int i = 0; i < 6; i += 1) {
        check(rb_pop(&rb, &out) == 0 && out == (uint8_t)(i + 3), "survivor order after wrap");
    }
    for (int i = 0; i < 2; i += 1) {
        check(rb_pop(&rb, &out) == 0 && out == (uint8_t)(9 + i), "wrapped bytes come out last");
    }
    check(rb_pop(&rb, &out) == -1, "buffer is empty again");

    if (failures != 0) {
        printf("\n%d check(s) failed\n", failures);
        return 1;
    }
    printf("\nall checks passed\n");
    return 0;
}
