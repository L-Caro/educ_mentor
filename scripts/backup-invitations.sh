#!/bin/bash
# Sauvegarde la table invitations dans data/invitations-backup.sql
# Usage : ./scripts/backup-invitations.sh
# Ce fichier peut être commité — c'est du texte SQL, pas une DB binaire.

DB_PATH="./data/educmentor.db"
BACKUP_PATH="./data/invitations-backup.sql"

if [ ! -f "$DB_PATH" ]; then
  echo "Erreur : DB introuvable à $DB_PATH"
  exit 1
fi

sqlite3 "$DB_PATH" ".dump invitations" > "$BACKUP_PATH"
echo "Backup OK → $BACKUP_PATH ($(wc -l < "$BACKUP_PATH") lignes)"
