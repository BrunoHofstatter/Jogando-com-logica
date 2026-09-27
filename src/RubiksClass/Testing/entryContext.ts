import { createContext, useContext } from "react";
export const EntryContext = createContext({ isCheckpoint: false, stepIndex: 0 });
export const useLessonEntry = () => useContext(EntryContext);
