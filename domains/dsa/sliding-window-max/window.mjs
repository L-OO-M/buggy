// Sliding window maximum using a monotonic deque.
//
// The deque stores indices whose values are decreasing. For each index i:
//   1. drop smaller values from the back (they can never be the maximum again),
//   2. push i,
//   3. drop indices that have left the window,
//   4. once the first full window exists, record the value at the front.

export function maxSlidingWindow(nums, k) {
  if (!Array.isArray(nums) || nums.length === 0 || k <= 0 || k > nums.length) {
    return [];
  }

  const result = [];
  const deque = [];

  for (let i = 0; i < nums.length; i += 1) {
    while (deque.length > 0 && nums[deque[deque.length - 1]] <= nums[i]) {
      deque.pop();
    }
    deque.push(i);

    // BUG: the index at i - k is already outside a window ending at i.
    if (deque[0] < i - k) {
      deque.shift();
    }

    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }

  return result;
}
