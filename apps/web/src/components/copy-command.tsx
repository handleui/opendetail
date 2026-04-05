"use client";

import { useCallback, useId, useMemo, useState } from "react";

import { CheckIcon, CopyIcon } from "@/components/copy-button-icons";

/** `filled` matches assistant input surface fill in imported `opendetail-base.css` (no stroke). */
export type CopyCommandVariant = "default" | "filled";

export interface CopyCommandProps {
  /** Kept for MDX compatibility; the UI derives commands from {@link CopyCommandProps.npm}. */
  bun: string;
  /** Canonical npm-ecosystem command (`npx …` or `npm i …`). */
  npm: string;
  /**
   * `default` — bordered card (`bg-white` + sidebar stroke).
   * `filled` — same surface treatment as assistant input (`--opendetail-color-surface`, no border).
   */
  variant?: CopyCommandVariant;
}

type ParsedCommand =
  | {
      kind: "exec";
      suffix: string;
    }
  | {
      kind: "install";
      npmRunner: "npm i" | "npm install";
      suffix: string;
    };

/** Exec runners for real local CLI use — order keeps `npm` prop (`npx …`) as default mode 0. */
const EXEC_RUNNERS = ["npx", "yarn dlx", "pnpm dlx", "bunx"] as const;

const RUNNER_COUNT = EXEC_RUNNERS.length;

const NPX_COMMAND_RE = /^npx\s+(.+)$/;
const NPM_INSTALL_COMMAND_RE = /^npm\s+(i|install)\s+(.+)$/;

function parseNpmCommand(npm: string): ParsedCommand | null {
  const trimmed = npm.trim();
  const exec = NPX_COMMAND_RE.exec(trimmed);
  if (exec) {
    return { kind: "exec", suffix: exec[1] ?? "" };
  }
  const install = NPM_INSTALL_COMMAND_RE.exec(trimmed);
  if (install) {
    const sub = install[1];
    const suffix = install[2] ?? "";
    return {
      kind: "install",
      npmRunner: sub === "install" ? "npm install" : "npm i",
      suffix,
    };
  }
  return null;
}

function commandForMode(parsed: ParsedCommand, mode: number): string {
  const m = mode % RUNNER_COUNT;
  if (parsed.kind === "exec") {
    return `${EXEC_RUNNERS[m]} ${parsed.suffix}`.trimEnd();
  }
  const installRunners =
    parsed.npmRunner === "npm install"
      ? (["npm install", "yarn add", "pnpm add", "bun add"] as const)
      : (["npm i", "yarn add", "pnpm add", "bun add"] as const);
  return `${installRunners[m]} ${parsed.suffix}`.trimEnd();
}

function runnerLabel(parsed: ParsedCommand, mode: number): string {
  const m = mode % RUNNER_COUNT;
  if (parsed.kind === "exec") {
    return EXEC_RUNNERS[m];
  }
  const installRunners =
    parsed.npmRunner === "npm install"
      ? (["npm install", "yarn add", "pnpm add", "bun add"] as const)
      : (["npm i", "yarn add", "pnpm add", "bun add"] as const);
  return installRunners[m];
}

function CommandBody({
  command,
  nextRunnerLabel,
  onCycleRunner,
  runnerLabel: runner,
}: {
  command: string;
  nextRunnerLabel: string;
  onCycleRunner: () => void;
  runnerLabel: string;
}) {
  const trimmed = command.trimStart();
  const runnerLen = runner.length;
  const afterRunner =
    trimmed.length > runnerLen ? trimmed.slice(runnerLen) : "";
  /** Leading space between runner and rest is not a separate DOM text node (grid/flex can drop it). */
  const restBody = afterRunner.trimStart();
  return (
    <code className="block min-w-0 max-w-full text-left font-mono text-[13px] leading-relaxed">
      <span className="inline-flex min-w-0 max-w-full flex-wrap items-baseline justify-start gap-0">
        <span className="inline-flex shrink-0">
          <button
            aria-label={`Runner: ${runner}. Click to switch to ${nextRunnerLabel}.`}
            className="cursor-pointer select-none border-0 bg-transparent p-0 font-mono text-[#a4a4a4] text-[13px] leading-relaxed transition-colors hover:text-neutral-500 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-400 focus-visible:outline-offset-2"
            onClick={onCycleRunner}
            type="button"
          >
            {runner}
          </button>
        </span>
        {restBody ? (
          <span className="min-w-0 whitespace-pre text-neutral-800">
            {` ${restBody}`}
          </span>
        ) : null}
      </span>
    </code>
  );
}

/**
 * Copyable install/runner command with a clickable runner segment (cycles npx / yarn dlx / pnpm dlx / bunx, or npm i · yarn · pnpm · bun add) — for docs pages.
 */
export function CopyCommand({
  bun: _bun,
  npm,
  variant = "default",
}: CopyCommandProps) {
  const parsed = useMemo(() => parseNpmCommand(npm), [npm]);
  const [mode, setMode] = useState(0);
  const [copied, setCopied] = useState(false);
  const baseId = useId();

  const activeCommand = useMemo(() => {
    if (parsed) {
      return commandForMode(parsed, mode);
    }
    return npm.trim();
  }, [parsed, mode, npm]);

  const cycle = useCallback(() => {
    setMode((m) => (m + 1) % RUNNER_COUNT);
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeCommand);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [activeCommand]);

  const nextRunnerHint = useMemo(() => {
    if (!parsed) {
      return "";
    }
    return runnerLabel(parsed, mode + 1);
  }, [parsed, mode]);

  const rootClassName =
    variant === "filled"
      ? "my-4 overflow-hidden rounded-[var(--opendetail-radius-panel)] bg-[var(--opendetail-color-surface)]"
      : "my-4 overflow-hidden rounded-lg border border-solid bg-white";

  const rootStyle =
    variant === "filled"
      ? undefined
      : { borderColor: "var(--opendetail-color-sidebar-stroke)" };

  const innerClassName =
    variant === "filled"
      ? "flex items-center justify-between gap-3 p-[var(--opendetail-input-surface-padding-current)]"
      : "flex items-center justify-between gap-3 px-4 py-3";

  return (
    <div className={rootClassName} style={rootStyle}>
      <div className={innerClassName} id={`${baseId}-panel`}>
        <div className="min-w-0 flex-1 overflow-x-auto text-left">
          {parsed ? (
            <CommandBody
              command={activeCommand}
              nextRunnerLabel={runnerLabel(parsed, mode + 1)}
              onCycleRunner={cycle}
              runnerLabel={runnerLabel(parsed, mode)}
            />
          ) : (
            <code className="font-mono text-[13px] text-neutral-800 leading-relaxed">
              {npm.trim()}
            </code>
          )}
        </div>
        <button
          aria-label={copied ? "Copied" : "Copy command"}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-black transition-[color,transform] duration-150 ease-out hover:bg-neutral-100 active:scale-[0.97]"
          onClick={copy}
          title={parsed ? `Runner cycles to ${nextRunnerHint}` : undefined}
          type="button"
        >
          <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
          <span
            aria-hidden
            className="relative inline-flex size-[14px] items-center justify-center"
          >
            <CopyIcon
              className={`absolute size-[14px] text-black transition-opacity duration-150 ease-out ${
                copied ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            />
            <CheckIcon
              className={`absolute size-[14px] text-black transition-opacity duration-150 ease-out ${
                copied ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
