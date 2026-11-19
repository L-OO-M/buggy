import { test } from "node:test";
import assert from "node:assert/strict";

import { maxSlidingWindow } from "./window.mjs";

test("classic window sequence", () => {
  assert.deepEqual(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3), [3, 3, 5, 5, 6, 7]);
});

test("a maximum that leaves the window must not be reused", () => {
  assert.deepEqual(maxSlidingWindow([9, 8, 4, 2, 1], 3), [9, 4, 2]);
});

test("k = 1 returns the input values", () => {
  assert.deepEqual(maxSlidingWindow([4, -2, 7], 1), [4, -2, 7]);
});

test("k = length returns exactly one maximum", () => {
  assert.deepEqual(maxSlidingWindow([5, 1, 9, 3], 4), [9]);
});

test("invalid k and empty input return an empty array", () => {
  assert.deepEqual(maxSlidingWindow([1, 2, 3], 0), []);
  assert.deepEqual(maxSlidingWindow([1, 2, 3], 4), []);
  assert.deepEqual(maxSlidingWindow([], 1), []);
});

test("duplicates do not disturb the window", () => {
  assert.deepEqual(maxSlidingWindow([2, 2, 2, 1, 2], 2), [2, 2, 2, 2]);
});
