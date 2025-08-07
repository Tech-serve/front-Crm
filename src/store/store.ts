import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";

import authReducer from "../features/auth/authSlice";
import { baseApi }  from "../api/baseApi";          

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,        
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  devTools:   import.meta.env.MODE !== "production",
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch              = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;