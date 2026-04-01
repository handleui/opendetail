import { cp, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { OpenDetailStreamEvent } from "../src/types";

export const createFixtureWorkspace = async (
  fixtureName: string
): Promise<string> => {
  const fixtureRoot = path.resolve(
    import.meta.dirname,
    "fixtures",
    fixtureName
  );
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "opendetail-")
  );

  await cp(fixtureRoot, temporaryDirectory, { recursive: true });
  return temporaryDirectory;
};

export const removeWorkspace = async (workspacePath: string): Promise<void> => {
  await rm(workspacePath, { force: true, recursive: true });
};

export const readNdjsonEvents = async (
  stream: ReadableStream<Uint8Array>
): Promise<OpenDetailStreamEvent[]> => {
  const body = await new Response(stream).text();

  return body
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as OpenDetailStreamEvent);
};
