/// <reference types="vite/client" />

declare global {
  interface Window {
    impactflow?: {
      license: {
        getStatus: () => Promise<{ activated: boolean; activatedAt?: string; devBypass?: boolean }>;
        activate: (key: string) => Promise<{ ok: boolean; activated?: boolean; devBypass?: boolean; message?: string }>;
      };
    };
  }
}

export {};
