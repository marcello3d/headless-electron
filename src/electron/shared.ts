export type RunScriptEvent = {
  type: "run-script";
  id: string;
  pathname: string;
  functionName: string;
  args: any[];
  hasStatusCallback: boolean;
  hasAbortSignal: boolean;
};

export type AbortEvent = {
  type: "abort-script";
  id: string;
};

export type RunResultEvent =
  | RunResolvedEvent
  | RunStatusEvent
  | RunRejectedEvent;

export type RunResolvedEvent = {
  type: "run-resolved";
  id: string;
  value: any;
};
export type RunStatusEvent = {
  type: "run-status";
  id: string;
  status: any;
};

export type RunRejectedEvent = {
  type: "run-rejected";
  id: string;
  error: string;
};

export type ElectronReadyEvent = {
  type: "electron-ready";
};

export type ElectronFatalEvent = {
  type: "fatal";
  error: string;
};

export type ProcessIpcInputMessage = ElectronIpcRendererInputMessage;

export type ProcessIpcOutputMessage =
  | ElectronIpcRendererOutputMessage
  | ElectronFatalEvent;

export type ElectronIpcRendererInputMessage = RunScriptEvent | AbortEvent;

export type ElectronIpcRendererOutputMessage =
  | RunResultEvent
  | ElectronReadyEvent;
