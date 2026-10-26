# Contributing (LOOM members)

This guide is for LOOM members who already have (or will be granted) **write access** to `L-OO-M/buggy`. If you are an external contributor, use the fork workflow in the [README](README.md#how-it-works-for-viewers-external-contributors).

## Access model

- Admins add each member as a **Write** collaborator once. After that you never need to ask for permissions per task or per push.
- Write access covers the whole repository. GitHub does **not** support folder-level write locks, so staying inside your domain folder is a team rule, backed by a CI check (see below) — not a hard permission.

## Domain folders

| Your domain | Edit only here |
| --- | --- |
| AI / Machine Learning | `domains/ai-ml/` |
| Web Development | `domains/web-dev/` |
| Cybersecurity | `domains/cybersecurity/` |
| Blockchain | `domains/blockchain/` |
| Embedded Hardware | `domains/embedded-hardware/` |

Pick one domain as yours. Do not modify other domains, root files (`README.md`, `CONTRIBUTING.md`, `LICENSE`), or `.github/` — those are maintained by leads.

## Workflow

1. Clone the repo and make sure `main` is up to date:

   ```bash
   git clone https://github.com/L-OO-M/buggy.git
   cd buggy
   git pull origin main
   ```

2. Create a personal branch:

   ```bash
   git checkout -b fix/<domain>/<short-description>
   # e.g. git checkout -b fix/ai-ml/csv-parser-null-check
   ```

3. Do your work **only** under `domains/<your-domain>/`. Each project lives in its own subfolder with its own README:

   ```
   domains/ai-ml/
   └── csv-parser-null-check/
       ├── README.md      # what is broken, how to run, expected behaviour
       └── ...
   ```

4. Commit with a clear message:

   ```bash
   git add domains/ai-ml/csv-parser-null-check
   git commit -m "fix(ai-ml): handle null rows in csv parser"
   ```

5. Push your branch and open a **pull request** to `main`:

   ```bash
   git push -u origin fix/ai-ml/csv-parser-null-check
   ```

6. Fill in the PR template. The scope check must pass; a lead may review before merge.

## Rules

- One domain per PR. The CI check fails PRs that touch more than one `domains/*` folder or any file outside `domains/`.
- Never force-push to `main`. Never push straight to `main` — always go through a PR.
- Do not add secrets, API keys, or large binaries.
- Keep challenges reproducible: each project folder should include a short README (what's broken, how to run, expected behaviour).

## CI scope check

`.github/workflows/pr-scope.yml` runs on every pull request and fails if:

- any changed file is outside `domains/<name>/`, or
- the PR spans more than one domain.

Leads may add the **`meta`** label to a PR that legitimately needs to touch root or `.github/` files; the check skips labelled PRs.

## GitHub setup status

Already configured on this repository:

- **Branch protection (ruleset) on `main`** — direct pushes and force-pushes are blocked; every change goes through a pull request (0 required approvals, so nobody has to wait for permission to merge).
- **Required status check** — the `Single-domain scope` check must pass before a PR can merge.
- **PR scope workflow** — `.github/workflows/pr-scope.yml` runs on every PR.

Still manual for leads:

1. Repo **Settings → Collaborators → Add people** — add every member with role **Write** (one-time, then members never ask for permissions again).
2. For structural changes (root files, `.github/`), open a PR and apply the **`meta`** label so the scope check is skipped.
3. Optional later: add a `CODEOWNERS` file with real GitHub usernames and raise `required_approving_review_count` if you want mandatory lead review.
