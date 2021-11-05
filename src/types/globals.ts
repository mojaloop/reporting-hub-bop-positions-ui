export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Window {
    positionsEnv: {
      CENTRAL_LEDGER_ENDPOINT: string;
    };
  }
}
