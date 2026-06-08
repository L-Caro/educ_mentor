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
import AccessGate from "./components/auth/AccessGate.tsx";
import "./assets/styles/main.scss";

/** Enregistrer le Service Worker uniquement en production.
 * En dev, le SW causerait des conflits avec le HMR de Vite. */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  });
}

const root = createRoot(
  document.getElementById( "root" ) as HTMLElement
);

root.render(
  <ThemeProvider>
    <Provider store={store}>
      <AccessGate>
        <RouterProvider router={Router} />
      </AccessGate>
    </Provider>
  </ThemeProvider>
);
