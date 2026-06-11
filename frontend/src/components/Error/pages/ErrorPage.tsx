//? Typage
type NotFoundProps = {
  errorMessage: string;
  errorStatus: string | number;
};

/** Présentationnel : reçoit message/status (calculés par <ErrorRouter>). */
export default function ErrorPage({ errorMessage, errorStatus }: NotFoundProps) {
  return (
    <div className="error">
      <h1>{errorStatus}</h1>
      <p>Désolé, une erreur inattendue est survenue.</p>
      <p>
        <i>{errorMessage}</i>
      </p>
    </div>
  );
}
