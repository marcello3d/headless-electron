import { PlainError } from "../utils/plain-error";

export type RunScriptEvent = {
  type: "run-script";
  id: string;
  pathname: string;
  functionName: string;
  args: unknown[];
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
  value: unknown;
};
export type RunStatusEvent = {
  type: "run-status";
  id: string;
  status: unknown;
};

export type RunRejectedEvent = {
  type: "run-rejected";
  id: string;
  error: PlainError;
};

export type ElectronReadyEvent = {
  type: "electron-ready";
};

export type ElectronFatalEvent = {
  type: "fatal";
  error: PlainError;
};

export type ProcessIpcInputMessage = ElectronIpcRendererInputMessage;

export type ProcessIpcOutputMessage =
  | ElectronIpcRendererOutputMessage
  | ElectronFatalEvent;

export type ElectronIpcRendererInputMessage = RunScriptEvent | AbortEvent;

export type ElectronIpcRendererOutputMessage =
  | RunResultEvent
  | ElectronReadyEvent;

export type HeadlessElectronOptions = {
  debugMode: boolean;
  preloadRequire?: string;
  minConcurrency: number;
  maxConcurrency: number;
};
