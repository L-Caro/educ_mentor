import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { createRoot } from 'react-dom/client'

//? Style
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

//? Context
import { ThemeProvider } from "./context/ThemeContext.tsx";

//? Provider
import Router from "./routes/router.tsx";
import store from "./store";
import "./assets/styles/main.scss";

const root = createRoot(
  document.getElementById( "root" ) as HTMLElement
);

root.render(
  <ThemeProvider>
      <Provider store={ store }>
        <RouterProvider router={ Router } />
      </Provider>
  </ThemeProvider>
);
