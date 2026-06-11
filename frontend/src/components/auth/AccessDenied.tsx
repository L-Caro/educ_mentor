const AccessDenied = () => (
  <div className="AccessState">
    <p className="AccessState__emoji">🔒</p>
    <h1 className="AccessState__title">Accès non autorisé</h1>
    <p className="AccessState__text">
      Cet appareil n'a pas encore été invité à accéder à ÉducMentor.
    </p>
    <p className="AccessState__text">
      Demande un lien d'invitation à l'administrateur du site.
    </p>
  </div>
);

export default AccessDenied;
