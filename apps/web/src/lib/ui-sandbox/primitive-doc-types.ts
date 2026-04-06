import type { ReactNode } from "react";

export interface PropRow {
  default?: string;
  description: string;
  name: string;
  type: string;
}

export interface PrimitiveDocEntry {
  description: string;
  intro?: ReactNode;
  seeAlso?: { label: string; href: string }[];
  tables: { title: string; rows: PropRow[] }[];
  title: string;
}
