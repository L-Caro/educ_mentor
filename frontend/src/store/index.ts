import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slice/authSlice";

//? Reducers
const rootReducers = {
  auth: authReducer,
};


//? Store
const store = configureStore( {
  reducer: rootReducers
} );

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
// Je déduis le type `RootState` et `AppDispatch` depuis le store lui même
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
