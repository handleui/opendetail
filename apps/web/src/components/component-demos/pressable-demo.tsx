"use client";

export const PressableDemo = () => (
  <div className="flex flex-wrap items-center gap-3">
    <button
      className="opendetail-pressable rounded-lg border border-solid bg-white px-4 py-2 text-[14px] text-neutral-950"
      style={{ borderColor: "var(--opendetail-color-sidebar-stroke)" }}
      type="button"
    >
      Pressable button
    </button>
    <span className="text-[13px] text-neutral-500">
      Subtle scale on active (see base stylesheet).
    </span>
  </div>
);
