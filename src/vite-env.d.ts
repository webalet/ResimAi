/// <reference types="vite/client" />

declare global {
  interface Window {
    imageUrlDebugLogged?: boolean;
    imageErrorLogged?: boolean;
    imageErrorAfterLogged?: boolean;
    imageErrorViewBeforeLogged?: boolean;
    imageErrorViewAfterLogged?: boolean;
    imageUploadDebugLogged?: boolean;
    categoriesDebugLogged?: boolean;
  }
}

export {};