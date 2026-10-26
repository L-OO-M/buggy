# Blockchain

Challenge projects for the blockchain domain.

## What belongs here

- Smart-contract bugs (reentrancy, integer overflow, missing access control, wrong event emission)
- Broken dApp scripts (wrong ABI wiring, incorrect provider usage)
- Hardhat / Foundry / Truffle test or config issues

## Layout

```
domains/blockchain/
└── <project-name>/
    ├── README.md     # required — what's broken, how to run, expected behaviour
    └── ...
```

## Rules

See [CONTRIBUTING.md](../../CONTRIBUTING.md). Only edit files inside this folder.

Challenges must target local test networks (Hardhat / Anvil / Ganache) only — no mainnet keys or funds.
