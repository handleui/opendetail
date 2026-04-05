# opendetail-fumadocs

Fumadocs source validation and wrappers for OpenDetail.

```ts
import { createFumadocsSourceTargetResolver } from "opendetail-fumadocs";
import { FumadocsAssistant } from "opendetail-fumadocs/assistant";
```

`FumadocsAssistant` wraps the page assistant shell and plugs in Fumadocs-aware source link resolution — it is not your site’s primary nav (that lives in the app, e.g. `apps/web` `Sidebar`). See the OpenDetail docs: **Packages & composition** (`/docs/packages`).
