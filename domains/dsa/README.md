# DSA

Challenge projects for data structures and algorithms.

## What belongs here

- Algorithmic bugs (wrong comparison, off-by-one, bad base case)
- Complexity traps (a correct answer that is too slow for the stated input size)
- Broken test suites (tests that pass while the implementation is wrong)
- Incorrect edge-case handling (empty input, one element, duplicates, negatives)
- Data-structure bugs (stacks, queues, heaps, trees, graphs, hash maps)

Prefer standard-library-only projects so a contributor can run them offline.

## Layout

```
domains/dsa/
└── <project-name>/
    ├── README.md     # required — what's broken, how to run, expected behaviour
    └── ...
```

## Rules

See [CONTRIBUTING.md](../../CONTRIBUTING.md). Only edit files inside this folder.

Every README must name the exact command that shows the failure and the command
that proves the fix. Keep the first challenge finishable in 1–3 hours.
