import { configureStore } from "@reduxjs/toolkit";

const noopReducer = (state = {}) => state;

export const store = configureStore({
  reducer: noopReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
