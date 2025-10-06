import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./redux/authSlice";
import authSlice from "./redux/authSlice";
import { employeeApi } from "./redux/employeeSlice";
import { tradePositionApi } from "./redux/tradePositionSlice";
import { locationApi } from "./redux/locationSlice";
import { projectApi } from "./redux/projectSlice";
import { attendanceApi } from "./redux/attendanceSlice";
import { companyApi } from "./redux/companySlice";
import { userApi } from "./redux/userSlice";
import {
  notificationsApi,
  notificationsSlice,
} from "./redux/notificationSlice";
import { userSettingsApi } from "./redux/userSettingsSlice";
import { expenseApi } from "./redux/expenseSlice";
import { boqApi } from "./redux/boqSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      notificationsState: notificationsSlice.reducer,
      [authApi.reducerPath]: authApi.reducer,
      [employeeApi.reducerPath]: employeeApi.reducer,
      [tradePositionApi.reducerPath]: tradePositionApi.reducer,
      [locationApi.reducerPath]: locationApi.reducer,
      [projectApi.reducerPath]: projectApi.reducer,
      [attendanceApi.reducerPath]: attendanceApi.reducer,
      [companyApi.reducerPath]: companyApi.reducer,
      [userApi.reducerPath]: userApi.reducer, // ✅ userApi reducer
      [userSettingsApi.reducerPath]: userSettingsApi.reducer,
      [expenseApi.reducerPath]: expenseApi.reducer,
      [boqApi.reducerPath]: boqApi.reducer,
      [notificationsApi.reducerPath]: notificationsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(authApi.middleware)
        .concat(employeeApi.middleware)
        .concat(tradePositionApi.middleware)
        .concat(userSettingsApi.middleware)
        .concat(locationApi.middleware)
        .concat(projectApi.middleware)
        .concat(attendanceApi.middleware)
        .concat(companyApi.middleware)
        .concat(userApi.middleware) // ✅ userApi middleware
        .concat(expenseApi.middleware)
        .concat(boqApi.middleware)
        .concat(notificationsApi.middleware)
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
