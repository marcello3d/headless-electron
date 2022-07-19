export type RunScriptParams = {
  pathname: string;
  functionName?: string;
  args?: any[];
};
export type RunScriptEvent = {
  type: "run-script";
  id: string;
} & RunScriptParams;

export type RunResultEvent = RunResolvedEvent | RunRejectedEvent;

export type RunResolvedEvent = {
  type: "run-resolved";
  id: string;
  value: any;
};

export type RunRejectedEvent = {
  type: "run-rejected";
  id: string;
  error: string;
};

export type ElectronReadyEvent = {
  type: "electron-ready";
};
export type ProcessIpcInputMessage = RunScriptEvent;
export type ProcessIpcOutputMessage = RunResultEvent | ElectronReadyEvent;
export type ElectronIpcRendererEvent = RunResultEvent | ElectronReadyEvent;
