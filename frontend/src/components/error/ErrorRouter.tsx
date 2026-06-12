import {isRouteErrorResponse, useRouteError} from "react-router-dom";

import ErrorPage from "src/components/error/pages/ErrorPage.tsx";


function ErrorRouter() {
  const error = useRouteError();
  console.log(error);

  function getErrorMessage(e: unknown): string {
    if (isRouteErrorResponse(e)) {
      return e.statusText;
    }

    if (e instanceof Error) {
      return e.message;
    }

    if (typeof e === "string") {
      return e;
    }

    return "Unknown error";
  }

  function getStatus(e: unknown): number | string {
    if (isRouteErrorResponse(e)) {
      return e.status;
    }
    if (e instanceof Error) {
      return e.name;
    }
    if (typeof e === "string") {
      return e;
    }
    return "Unknown error";
  }

  return (
    <ErrorPage
      errorMessage={getErrorMessage(error)}
      errorStatus={getStatus(error)}
    />
  );
}

export default ErrorRouter;
