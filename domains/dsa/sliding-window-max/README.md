# Sliding window maximum — stale index

## What is broken

`maxSlidingWindow(nums, k)` should return the maximum of every contiguous window
of size `k`. It uses a monotonic deque, which is the right approach, but the
step that drops indices that have left the window is wrong.

Run the tests and one case fails: `[9, 8, 4, 2, 1]` with `k = 3` reports `9` for
the second window instead of `4`. The deque keeps an index that is no longer in
the window whenever that index currently holds the maximum.

## How to run

Node.js 18 or newer. No dependencies.

```bash
cd domains/dsa/sliding-window-max
node --test
```

Expected before the fix: 2 failing tests, 4 passing.

## Expected behaviour

- `maxSlidingWindow(nums, k)` returns an array of length `nums.length - k + 1`.
- Each element is the maximum of `nums[i .. i + k - 1]`.
- `k = 1` returns a copy of `nums`.
- `k = nums.length` returns a single-element array containing the maximum.
- `k <= 0`, `k > nums.length`, or an empty input returns `[]`.
- The solution must stay O(n): do not replace it with a nested O(n·k) scan.

## How to verify a fix

```bash
node --test
```

All tests pass. Then reason about the window boundary: an index is out of the
window when it is **at or before** `i - k`, not only when it is strictly before
it. A fix that changes the algorithm instead of that boundary check is fine as
long as the tests and the O(n) requirement still hold.

## Files

| File | Purpose |
| --- | --- |
| `window.mjs` | the implementation |
| `window.test.mjs` | executable expected behaviour |
