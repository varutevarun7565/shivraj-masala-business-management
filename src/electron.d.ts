export {};
declare global {
  interface Window {
    desktopAPI?: {
      loadState: () => Promise<Record<string, unknown>>;
      saveState: (snapshot: Record<string, unknown>) => Promise<{ ok: boolean }>;
      login: (credentials: { username: string; password: string }) => Promise<{ ok: boolean; message?: string; user?: { id: number; username: string; displayName: string; role: string } }>;
      createBackup: () => Promise<{ ok: boolean; path?: string }>;
      listAuthUsers: () => Promise<Array<{ id:number; username:string; displayName:string; role:string; status:string; createdAt:string; lastLogin:string|null }>>;
      createAuthUser: (data:{username:string;displayName:string;password:string;role:string}) => Promise<{ok:boolean;message?:string}>;
      resetAuthPassword: (data:{id:number;password:string}) => Promise<{ok:boolean;message?:string}>;
      setAuthUserStatus: (data:{id:number;status:string}) => Promise<{ok:boolean;message?:string}>;
      // Invoice PDF & WhatsApp sharing
      saveInvoicePDF: (filename:string, base64:string) => Promise<{ok:boolean;path?:string;error?:string}>;
      openWhatsApp: (phone:string, message:string) => Promise<{ok:boolean;error?:string}>;
      openInvoicePDF: (filePath:string) => Promise<{ok:boolean;error?:string}>;
      showInvoiceInFolder: (filePath:string) => Promise<{ok:boolean;error?:string}>;
    };
  }
}
