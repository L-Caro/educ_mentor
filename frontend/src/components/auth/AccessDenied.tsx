const AccessDenied = () => (
  <div className="d-flex flex-column align-items-center justify-content-center vh-100 text-center px-4">
    <p className="display-3">🔒</p>
    <h1 className="h3 mb-3">Accès non autorisé</h1>
    <p className="text-muted">
      Cet appareil n'a pas encore été invité à accéder à ÉducMentor.
    </p>
    <p className="text-muted">
      Demande un lien d'invitation à Lionel.
    </p>
  </div>
);

export default AccessDenied;
