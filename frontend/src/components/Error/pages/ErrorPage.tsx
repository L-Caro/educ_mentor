import React from 'react';

//? Typage
type NotFoundProps = {
  errorMessage: string;
  errorStatus: string | number;
};

const ErrorPage: React.FC<NotFoundProps> = ({ errorMessage, errorStatus }) => {
  return (
    <div className="error">
      <h1>{errorStatus}</h1>
      <p>Désolé, une erreur inattendue est survenue.</p>
      <p>
        <i>{errorMessage}</i>
      </p>
    </div>
  );
};

export default ErrorPage;
