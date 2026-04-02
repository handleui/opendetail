"use client";

export interface UseOpenDetailState {
  error: string | null;
  implemented: false;
  status: "idle";
}

const PLACEHOLDER_STATE: UseOpenDetailState = {
  error: null,
  implemented: false,
  status: "idle",
};

export const useOpenDetail = (): UseOpenDetailState => PLACEHOLDER_STATE;
