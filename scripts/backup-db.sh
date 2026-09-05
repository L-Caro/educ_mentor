#!/usr/bin/env bash
#
# Sauvegarde complète de la base ÉducMentor.
#
# Pourquoi : les scripts backup-invitations.sh / restore-invitations.sh ne couvrent QUE la table
# des invitations. La progression de l'enfant, la seule donnée irremplaçable du projet, n'était
# sauvegardée nulle part.
#
# La copie passe par l'API de sauvegarde SQLite (`.backup`) et non par un `cp` : un `cp` sur une
# base ouverte peut capturer un fichier incohérent si une écriture est en cours, et laisse de côté
# le journal -wal. `.backup` produit un fichier toujours cohérent, même pendant que l'app tourne.
#
# Usage :
#   ./scripts/backup-db.sh                    # → ./data/backups/educmentor-<horodatage>.db.gz
#   BACKUP_DIR=/mnt/nas/educmentor ./scripts/backup-db.sh
#   KEEP=30 ./scripts/backup-db.sh            # conserve les 30 dernières (défaut : 14)
#
# Cron quotidien sur le VPS, à 3 h :
#   0 3 * * * cd /home/lionel/Lionel/development/educ_mentor && ./scripts/backup-db.sh >> /var/log/educmentor-backup.log 2>&1

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_FILE="${DB_FILE:-$REPO_ROOT/data/educmentor.db}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/data/backups}"
KEEP="${KEEP:-14}"

if [ ! -f "$DB_FILE" ]; then
  echo "✗ Base introuvable : $DB_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="$BACKUP_DIR/educmentor-$STAMP.db"

# `sqlite3` n'est pas installé partout (ni dans l'image node du backend) : on s'appuie sur
# better-sqlite3, déjà présent comme dépendance de l'application.
node -e "
const path = require('path');
const Database = require(path.join('$REPO_ROOT', 'backend/node_modules/better-sqlite3'));
const db = new Database('$DB_FILE', { readonly: true });
db.backup('$TARGET').then(() => { db.close(); }).catch((error) => {
  console.error(error);
  process.exit(1);
});
"

gzip -f "$TARGET"
FINAL="$TARGET.gz"

# Vérification : une archive tronquée est pire qu'une archive absente, parce qu'elle rassure.
if ! gzip -t "$FINAL" 2>/dev/null; then
  echo "✗ Archive corrompue, sauvegarde supprimée : $FINAL" >&2
  rm -f "$FINAL"
  exit 1
fi

SIZE="$(du -h "$FINAL" | cut -f1)"
echo "✓ $(date '+%Y-%m-%d %H:%M:%S')  $FINAL  ($SIZE)"

# Rotation : ne garder que les KEEP plus récentes.
# `|| true` sur le pipe : `ls` sort en erreur si le motif ne correspond à rien, et un `set -e`
# ferait échouer une sauvegarde par ailleurs réussie.
OLD="$(ls -1t "$BACKUP_DIR"/educmentor-*.db.gz 2>/dev/null | tail -n "+$((KEEP + 1))" || true)"
if [ -n "$OLD" ]; then
  while IFS= read -r file; do
    rm -f "$file"
    echo "  purge : $(basename "$file")"
  done <<< "$OLD"
fi
