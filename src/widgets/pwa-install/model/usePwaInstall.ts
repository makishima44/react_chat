import { useContext } from "react";
import { PwaInstallContext } from "./PwaInstallContext";

export const usePwaInstall = () => {
  const context = useContext(PwaInstallContext);
  if (!context) throw new Error("PwaInstallProvider is missing");
  return context;
};
