# Embedded Hardware

Challenge projects for the embedded / hardware domain.

## What belongs here

- C / C++ firmware bugs (buffer overflows, memory leaks, undefined behaviour)
- Arduino / STM32 / ESP32 driver and peripheral issues
- Timing, race, and interrupt-handling mistakes
- Broken protocol implementations (I2C, SPI, UART framing)

## Layout

```
domains/embedded-hardware/
└── <project-name>/
    ├── README.md     # required — what's broken, how to run, expected behaviour, hardware assumptions
    └── ...
```

## Rules

See [CONTRIBUTING.md](../../CONTRIBUTING.md). Only edit files inside this folder.

READMEs must state the target board / simulator so the fix can be verified without physical hardware when possible.
