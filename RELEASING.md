# Releasing

OpenDetail uses Changesets for independent package versioning.

Current published package line:

- `opendetail` starts at `0.5.0`
- `opendetail-react` starts at `0.5.0`
- `opendetail-next` starts at `0.5.0`
- `opendetail-fumadocs` starts at `0.5.0`

## Local release flow

Yes, you can still run the standard Changesets flow locally:

```bash
npx changeset version
npx changeset publish
```

That will version and publish every package with pending changesets.

## CI release flow

This repo also includes GitHub Actions release automation in
[`release.yml`](./.github/workflows/release.yml).

It uses:

- Changesets for version PRs and multi-package publishing
- npm trusted publishing through GitHub Actions OIDC
- no npm token
- no provenance flag

On `main`:

1. If unreleased changesets exist, Changesets opens or updates a release PR.
2. After that PR is merged, the same workflow publishes only the packages that changed.

## One-time npm trusted publishing setup

Run these once after the workflow exists and before the first CI publish:

```bash
npm trust github opendetail --repo handleui/opendetail --file .github/workflows/release.yml -y
npm trust github opendetail-react --repo handleui/opendetail --file .github/workflows/release.yml -y
npm trust github opendetail-next --repo handleui/opendetail --file .github/workflows/release.yml -y
npm trust github opendetail-fumadocs --repo handleui/opendetail --file .github/workflows/release.yml -y
```

Each package needs its own trust relationship because npm tracks trusted publishers per package.
