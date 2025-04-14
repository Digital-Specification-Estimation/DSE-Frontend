import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./redux/authSlice";
import { employeeApi } from "./redux/employeeSlice";
import { tradePositionApi } from "./redux/tradePositionSlice";
import { locationApi } from "./redux/locationSlice";
import { projectApi } from "./redux/projectSlice";
import { attendanceApi } from "./redux/attendanceSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      [authApi.reducerPath]: authApi.reducer,
      [employeeApi.reducerPath]: employeeApi.reducer,
      [tradePositionApi.reducerPath]: tradePositionApi.reducer,
      [locationApi.reducerPath]: locationApi.reducer,
      [projectApi.reducerPath]: projectApi.reducer,
      [attendanceApi.reducerPath]: attendanceApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(authApi.middleware)
        .concat(employeeApi.middleware)
        .concat(tradePositionApi.middleware)
        .concat(locationApi.middleware)
        .concat(projectApi.middleware)
        .concat(attendanceApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
