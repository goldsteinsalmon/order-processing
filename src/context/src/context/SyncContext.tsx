import { createContext, useContext } from "react";

const SyncContext = createContext(null);

export const useSyncContext = () => {
  return useContext(SyncContext);
};

export default SyncContext;

