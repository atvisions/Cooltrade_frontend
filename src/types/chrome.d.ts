declare namespace chrome {
  export namespace runtime {
    export function sendMessage(message: any): void;
    export const onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
    };
  }

  export namespace tabs {
    export interface Tab {
      id?: number;
      url?: string;
    }

    export function query(queryInfo: {
      active?: boolean;
      currentWindow?: boolean;
    }): Promise<Tab[]>;

    export const onUpdated: {
      addListener(
        callback: (tabId: number, changeInfo: { url?: string }, tab: Tab) => void
      ): void;
    };
  }
} 