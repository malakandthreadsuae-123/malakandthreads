# GitHub Setup

> Nothing has been pushed. Creating the repository and pushing requires your GitHub account — run these commands yourself (or approve them).

## 1. Create a private repository

github.com → **New repository** → name `malakand-threads` → **Private** → do *not* add a README/.gitignore (the project has them).

## 2. First commit & push

```bash
cd "Malakand Threads E-commerce Store"
git init -b main
git status --ignored     # confirm .env, node_modules, .next, src/generated, storage/uploads are IGNORED
git add .
git status              # double-check: .env must NOT be listed
git commit -m "Initial release of MALAKAND THREADS store"
git remote add origin https://github.com/<your-username>/malakand-threads.git
git push -u origin main
```

## 3. What must never be committed

`.env` / `.env.*` (except `.env.example`), database dumps (`*.sql`, `*.sql.gz`), `storage/uploads/*` (customer/admin uploads), Stripe/SMTP keys, admin passwords. All are covered by `.gitignore`. If a secret is ever committed: rotate it immediately (new Stripe key, new SMTP password, new `AUTH_SECRET`), then remove it from history.

Recommended: enable **Secret scanning** and **Push protection** (Settings → Code security), and **Dependabot alerts**.

## 4. Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Production — deployed to Hostinger. Protected: require pull request + passing checks, no force-push. |
| `develop` (optional) | Integration/staging. |
| `feature/<name>`, `fix/<name>` | Short-lived work branches → PR into `main` (or `develop`). |

Commit messages: imperative and specific (`Add Stripe refund on admin cancel`, `Fix shipping fee for Fujairah`). One logical change per commit.

## 5. Suggested CI (GitHub Actions)

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.4
        env: { MYSQL_ROOT_PASSWORD: root, MYSQL_DATABASE: malakand_threads_test }
        ports: ["3306:3306"]
        options: --health-cmd="mysqladmin ping -proot" --health-interval=5s --health-retries=20
    env:
      DATABASE_URL: mysql://root:root@127.0.0.1:3306/malakand_threads_test
      TEST_DATABASE_URL: mysql://root:root@127.0.0.1:3306/malakand_threads_test
      AUTH_SECRET: ci-only-secret-ci-only-secret-ci-only-secret
      ADMIN_INITIAL_PASSWORD: Ci-Admin-Password-123
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

## 6. Deploying from GitHub

Connect the repository in Hostinger (see [HOSTINGER_DEPLOYMENT.md](HOSTINGER_DEPLOYMENT.md) §4) and deploy the `main` branch. Keep secrets only in Hostinger's environment variables — never in GitHub (or, if you add CI deployment, in GitHub **Actions secrets**).
