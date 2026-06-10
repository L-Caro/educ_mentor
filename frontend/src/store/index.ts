import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slice/authSlice";
import gameSetupReducer from "./slice/gameSetupSlice";
import { api } from "./api/api";

//? Reducers
const rootReducers = {
  auth: authReducer,
  gameSetup: gameSetupReducer,
  [api.reducerPath]: api.reducer,
};


//? Store
const store = configureStore( {
  reducer: rootReducers,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
} );

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
// Je déduis le type `RootState` et `AppDispatch` depuis le store lui même
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
