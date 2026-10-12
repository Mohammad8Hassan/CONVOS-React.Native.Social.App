import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./features/themeSlice";

// REFACTOR NOTE: this used to also register a `counter` reducer (features/counter/counterSlice.js,
// leftover from the Redux template, never used anywhere). Both were removed.
export default configureStore({
  reducer: {
    theme:  themeReducer,
  },
})
