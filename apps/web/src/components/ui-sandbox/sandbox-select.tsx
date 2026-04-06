"use client";

import { Select } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

const TRIGGER_CLASS =
  "inline-flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-full border border-neutral-200 border-solid bg-white px-3 text-left text-[14px] text-neutral-900 shadow-sm outline-none hover:border-neutral-300 data-[popup-open]:border-neutral-400";

const POPUP_CLASS =
  "max-h-[min(60vh,360px)] min-w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-neutral-200 border-solid bg-white p-1 shadow-lg outline-none";

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-neutral-900 outline-none data-[highlighted]:bg-neutral-100";

export function SandboxSelect<Value extends string>({
  items,
  label,
  onChange,
  value,
}: {
  items: readonly { label: string; value: Value }[];
  label: ReactNode;
  onChange: (next: Value) => void;
  value: Value;
}) {
  const record = Object.fromEntries(items.map((i) => [i.value, i.label]));

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-xs">
      <span className="font-medium text-[13px] text-neutral-500">{label}</span>
      <Select.Root
        items={record}
        modal={false}
        onValueChange={(v) => {
          if (v) {
            onChange(v as Value);
          }
        }}
        value={value}
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
                {items.map((item) => (
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
  );
}
