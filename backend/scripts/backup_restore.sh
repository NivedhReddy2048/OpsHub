#!/bin/bash
# backup_restore.sh
# Production-grade PostgreSQL database backup, validation, and restoration automation script.
# OS Context: Linux Bash / Docker CLI environments

ACTION=${1:-"backup"}
BACKUP_FILE=${2:-""}
CONTAINER_NAME="opshub_postgres"
DB_USER="opshub_admin"
DB_NAME="opshub_prod"
BACKUP_DIR="$(dirname "$0")/../backups"

mkdir -p "$BACKUP_DIR"

if [ "$ACTION" == "backup" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    DEST_FILE="$BACKUP_DIR/opshub_dump_$TIMESTAMP.sql"
    
    echo "=========================================="
    echo "STARTING BASH OPSHUB ENTERPRISE BACKUP SEQUENCE"
    echo "=========================================="
    
    docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$DEST_FILE"
    
    if [ $? -eq 0 ]; then
        echo "  [SUCCESS] Backup compiled and stored successfully!"
        echo "  File Path: $DEST_FILE"
        echo "  File Size: $(wc -c < "$DEST_FILE") bytes"
    else
        echo "  [FAILURE] Database dump execution failed."
        exit 1
    fi

elif [ "$ACTION" == "restore" ]; then
    if [ -z "$BACKUP_FILE" ]; then
        echo "Error: Please specify the backup file path to restore."
        exit 1
    fi
    
    echo "=========================================="
    echo "WARNING: STARTING BASH DATABASE DESTRUCTIVE RESTORE"
    echo "=========================================="
    
    cat "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
    
    if [ $? -eq 0 ]; then
        echo "  [SUCCESS] Database restored successfully!"
    else
        echo "  [FAILURE] Database restore execution failed."
        exit 1
    fi
fi
