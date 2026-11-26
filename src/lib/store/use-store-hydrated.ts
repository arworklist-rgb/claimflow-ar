import { useSyncExternalStore } from "react";
import { useDemoStore } from "./demo-store";

/**
 * True once the persisted demo state has been loaded from localStorage.
 * The server snapshot is always `false`, so SSR and the first client render agree.
 */
export function useStoreHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useDemoStore.persist.onFinishHydration(onChange),
    () => useDemoStore.persist.hasHydrated(),
    () => false,
  );
}
