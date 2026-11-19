# UART ring buffer — first byte lost

## What is broken

`ring_buffer.c` is a fixed-capacity FIFO used to buffer bytes arriving from a
UART interrupt. It stores each byte at the slot *after* the head and only then
advances the head, so the first byte pushed lands one slot late and every read
returns the wrong value. The buffer still reports the correct count, which is
why the bug survives a naive "is it full?" check.

No hardware is required. The test binary drives the same functions an ISR would.

## How to run

A C99 compiler (`cc`, `gcc`, or `clang`) and `make`. No MCU, board, or simulator
needed.

```bash
cd domains/embedded-hardware/ring-buffer
make test
```

Expected before the fix: the FIFO test fails with `FAIL push/pop FIFO order` and
the program exits non-zero.

## Expected behaviour

- Capacity is `RB_CAPACITY` (8) bytes.
- `rb_push` stores the value and returns `0`; when full it returns `-1` and
  changes nothing.
- `rb_pop` returns the oldest value in `out`, removes it, and returns `0`; when
  empty it returns `-1` and leaves `out` untouched.
- FIFO order holds across wrap-around: push 10 bytes while popping 2, and the
  remaining 8 come out in push order.
- `rb_count` never exceeds `RB_CAPACITY`.

## How to verify a fix

```bash
make test
```

Every `PASS` line prints and the process exits `0`. Then reason about the write
order: the value belongs at `head` **before** `head` advances, because the slot
at `head` is the next free slot.

## Files

| File | Purpose |
| --- | --- |
| `ring_buffer.h` | the public interface and capacity |
| `ring_buffer.c` | the implementation (contains the bug) |
| `main.c` | executable expected behaviour |
| `Makefile` | `make test` builds and runs the checks |

## Hardware assumptions

None. The module is plain C99 with no registers and no interrupts, so it can be
reviewed on any machine. The README labels it as a UART buffer because that is
the real-world context the same code runs in.
