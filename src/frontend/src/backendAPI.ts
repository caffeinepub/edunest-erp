/**
 * Backend singleton — creates the actor on first call and caches it.
 * Import this wherever you need direct backend access outside of React.
 */
import type { backendInterface } from "./backend";
import { createActorWithConfig } from "./config";

let _backendInstance: backendInterface | null = null;
let _initPromise: Promise<backendInterface> | null = null;

export async function getBackend(): Promise<backendInterface> {
  if (_backendInstance) return _backendInstance;
  if (_initPromise) return _initPromise;
  _initPromise = createActorWithConfig().then((actor) => {
    _backendInstance = actor;
    return actor;
  });
  return _initPromise;
}

/**
 * Proxy that auto-initialises the backend on first method call.
 * Usage: await backendAPI.login(username, password)
 */
type AsyncReturn<T> = T extends (...args: infer A) => Promise<infer R>
  ? (...args: A) => Promise<R>
  : never;

type BackendProxy = {
  [K in keyof backendInterface]: AsyncReturn<backendInterface[K]>;
};

export const backendAPI = new Proxy({} as BackendProxy, {
  get(_target, prop: string) {
    return async (...args: unknown[]) => {
      const actor = await getBackend();
      // biome-ignore lint/suspicious/noExplicitAny: dynamic method dispatch
      const fn = (actor as any)[prop];
      if (typeof fn !== "function")
        throw new Error(`Backend method ${prop} not found`);
      // biome-ignore lint/suspicious/noExplicitAny: dynamic method dispatch
      return (fn as any).apply(actor, args);
    };
  },
});
