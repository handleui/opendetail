// biome-ignore-all lint/performance/noBarrelFile: package entrypoint defines the public API surface.
export {
  createFumadocsSourceTargetResolver,
  type FumadocsPageUrlSource,
  getFumadocsPageUrls,
  type OpenDetailSourceLike,
  type OpenDetailSourceTarget,
  resolveFumadocsSourceTarget,
} from "./source-targets";
