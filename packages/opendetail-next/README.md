# opendetail-next

Next.js route handlers and link helpers for OpenDetail.

This package owns the Next.js backend surface only:

- `createNextRoute`
- `createNextRouteHandler`
- `renderNextSourceLink`

It does not depend on `opendetail-react`.

```ts
import { createNextRouteHandler } from "opendetail-next";
import { renderNextSourceLink } from "opendetail-next/link";
```
