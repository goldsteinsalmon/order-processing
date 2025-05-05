import { createContext, useContext } from "react";

// Create a dummy context — doesn't do anything
const SyncContext = createContext(null);

// Dummy hook that satisfies the imports but returns nothing
export const useSyncContext = () => {
  return useContext(SyncContext);
};

export default SyncContext;
