# AI / Machine Learning

Progressive, production-minded challenge projects for the AI/ML domain.

## Learning path

| Phase | Project | Focus |
| --- | --- | --- |
| Beginner | [`beginner-feature-cleaning/`](beginner-feature-cleaning/) | Missing values, stable schemas, categorical encoding |
| Moderate | [`moderate-model-evaluation/`](moderate-model-evaluation/) | Leakage-safe preprocessing and honest evaluation |
| Hard | [`hard-production-pipeline/`](hard-production-pipeline/) | Robust inference, imbalanced classification, contracts |

Start with the beginner project and move forward only after its tests pass.
Every project is isolated, reproducible, and includes its own dependencies,
README, starter implementation, and tests.

## What belongs here

- Data-preprocessing bugs (pandas / numpy edge cases, silent dtype issues)
- Model-training script problems (data leakage, wrong metric, broken train/test split)
- Notebook logic errors
- Small ML pipeline issues (scikit-learn, PyTorch, TensorFlow)

## Layout

```
domains/ai-ml/
└── <project-name>/
    ├── README.md     # required — what's broken, how to run, expected behaviour
    └── ...
```

## Rules

See [CONTRIBUTING.md](../../CONTRIBUTING.md). Only edit files inside this folder.
