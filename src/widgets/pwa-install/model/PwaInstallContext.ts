import { createContext } from "react";

export type PwaInstallState = {
  canInstall: boolean;
  isInstalling: boolean;
  isInstalled: boolean;
  isPromptVisible: boolean;
  install: () => Promise<boolean>;
  dismissPrompt: () => void;
  showPrompt: () => void;
};

export const PwaInstallContext = createContext<PwaInstallState | null>(null);
