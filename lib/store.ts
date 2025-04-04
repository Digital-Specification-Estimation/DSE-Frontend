import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./redux/authSlice";
import { employeeApi } from "./redux/employeeSlice";
import { tradePositionApi } from "./redux/tradePositionSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      [authApi.reducerPath]: authApi.reducer,
      [employeeApi.reducerPath]: employeeApi.reducer,
      [tradePositionApi.reducerPath]: tradePositionApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(authApi.middleware)
        .concat(employeeApi.middleware)
        .concat(tradePositionApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
