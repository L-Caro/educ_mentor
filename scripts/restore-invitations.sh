#!/bin/bash
# Restaure la table invitations depuis data/invitations-backup.sql
# Usage : ./scripts/restore-invitations.sh
# Attention : écrase les invitations existantes.

DB_PATH="./data/educmentor.db"
BACKUP_PATH="./data/invitations-backup.sql"

if [ ! -f "$DB_PATH" ]; then
  echo "Erreur : DB introuvable à $DB_PATH"
  exit 1
fi

if [ ! -f "$BACKUP_PATH" ]; then
  echo "Erreur : backup introuvable à $BACKUP_PATH"
  exit 1
fi

sqlite3 "$DB_PATH" "DELETE FROM invitations;"
sqlite3 "$DB_PATH" < "$BACKUP_PATH"
echo "Restore OK — invitations restaurées depuis $BACKUP_PATH"
