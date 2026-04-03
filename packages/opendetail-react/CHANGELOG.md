# opendetail-react

## 0.5.0

### Minor Changes

- b9db517: Split OpenDetail into dedicated core, React, Next, and Fumadocs packages, and move the package family to those new public entrypoints.

  This release also hardens the public boundaries:

  - sanitize public runtime and provider errors
  - tighten citation and source-link safety
  - add dedicated Next and Fumadocs adapter packages
  - update setup/docs flows for the split package model
