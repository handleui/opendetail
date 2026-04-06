"use client";

import { Select } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

import { SandboxSelect } from "@/components/ui-sandbox/sandbox-select";
import {
  isSandboxPrimitiveId,
  PRIMITIVE_LABELS,
  SANDBOX_PRIMITIVE_IDS,
  SANDBOX_SYSTEM_IDS,
  SANDBOX_THEME_IDS,
  type SandboxPrimitiveId,
  type SandboxThemeId,
  SYSTEM_LABELS,
  THEME_LABELS,
} from "@/lib/ui-sandbox/primitives";

const TRIGGER_CLASS =
  "inline-flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-full border border-neutral-200 border-solid bg-white px-3 text-left text-[14px] text-neutral-900 shadow-sm outline-none hover:border-neutral-300 data-[popup-open]:border-neutral-400";

const POPUP_CLASS =
  "max-h-[min(60vh,360px)] min-w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-neutral-200 border-solid bg-white p-1 shadow-lg outline-none";

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-neutral-900 outline-none data-[highlighted]:bg-neutral-100";

export function SandboxToolbar({
  onPrimitiveChange,
  onThemeChange,
  primitive,
  theme,
}: {
  onPrimitiveChange: (next: SandboxPrimitiveId) => void;
  onThemeChange: (next: SandboxThemeId) => void;
  primitive: SandboxPrimitiveId;
  theme: SandboxThemeId;
}) {
  const themeItems = useMemo(
    () =>
      SANDBOX_THEME_IDS.map((id) => ({
        value: id,
        label: THEME_LABELS[id],
      })),
    []
  );

  const primitiveItems = useMemo(
    () =>
      SANDBOX_PRIMITIVE_IDS.map((id) => ({
        value: id,
        label: PRIMITIVE_LABELS[id],
      })),
    []
  );

  const primitiveRecord = useMemo(
    () => Object.fromEntries(primitiveItems.map((i) => [i.value, i.label])),
    [primitiveItems]
  );

  const systemId = SANDBOX_SYSTEM_IDS[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium text-[13px] text-neutral-500">System</span>
        <span className="inline-flex h-9 items-center rounded-full border border-neutral-200 border-solid bg-neutral-50 px-3 font-medium text-[14px] text-neutral-800">
          {SYSTEM_LABELS[systemId]}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
        <SandboxSelect
          items={themeItems}
          label="Theme"
          onChange={onThemeChange}
          value={theme}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2 md:hidden">
          <span className="font-medium text-[13px] text-neutral-500">
            Component
          </span>
          <Select.Root
            items={primitiveRecord}
            modal={false}
            onValueChange={(v) => {
              if (v && isSandboxPrimitiveId(v)) {
                onPrimitiveChange(v);
              }
            }}
            value={primitive}
          >
            <Select.Trigger className={TRIGGER_CLASS}>
              <Select.Value />
              <Select.Icon className="text-neutral-500">
                <ChevronDown aria-hidden className="size-4" strokeWidth={2} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner
                align="start"
                alignItemWithTrigger={false}
                sideOffset={8}
              >
                <Select.Popup className={POPUP_CLASS}>
                  <Select.List>
                    {primitiveItems.map((item) => (
                      <Select.Item
                        className={ITEM_CLASS}
                        key={item.value}
                        value={item.value}
                      >
                        <Select.ItemText>{item.label}</Select.ItemText>
                        <Select.ItemIndicator className="ml-auto text-neutral-500">
                          ✓
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>

      <div className="hidden flex-col gap-2 md:flex">
        <span className="font-medium text-[13px] text-neutral-500">
          Components
        </span>
        <div className="flex max-w-full flex-wrap gap-2">
          {SANDBOX_PRIMITIVE_IDS.map((id) => {
            const active = id === primitive;
            return (
              <button
                className={
                  active
                    ? "rounded-full bg-neutral-900 px-3 py-1.5 font-medium text-[13px] text-white"
                    : "rounded-full border border-neutral-200 border-solid bg-white px-3 py-1.5 font-medium text-[13px] text-neutral-700 shadow-sm hover:border-neutral-300"
                }
                key={id}
                onClick={() => {
                  onPrimitiveChange(id);
                }}
                type="button"
              >
                {PRIMITIVE_LABELS[id]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
