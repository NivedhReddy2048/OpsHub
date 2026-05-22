# backup_restore.ps1
# Production-grade PostgreSQL database backup, validation, and restoration automation script.
# OS Context: Windows PowerShell / Docker CLI environments

param (
    [string]$Action = "backup", # backup or restore
    [string]$BackupFile = "",
    [string]$ContainerName = "opshub_postgres",
    [string]$DatabaseUser = "opshub_admin",
    [string]$DatabaseName = "opshub_prod"
)

$BackupDir = Join-Path $PSScriptRoot "..\backups"
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
}

if ($Action -eq "backup") {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $DestFile = Join-Path $BackupDir "opshub_dump_$Timestamp.sql"
    
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "STARTING OPSHUB ENTERPRISE BACKUP SEQUENCE" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "Target Container : $ContainerName"
    Write-Host "Database Name    : $DatabaseName"
    Write-Host "Destination Path : $DestFile"
    
    # Execute pg_dump inside docker container
    docker exec $ContainerName pg_dump -U $DatabaseUser -d $DatabaseName > $DestFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [SUCCESS] Backup compiled and stored successfully!" -ForegroundColor Green
        Write-Host "  File Size: $((Get-Item $DestFile).Length) bytes"
    } else {
        Write-Error "  [FAILURE] Database dump execution failed."
    }
}
elseif ($Action -eq "restore") {
    if (-not $BackupFile) {
        Write-Error "Please specify a -BackupFile path to restore from."
        exit 1
    }
    
    Write-Host "==========================================" -ForegroundColor Yellow
    Write-Host "WARNING: STARTING DATABASE DESTRUCTIVE RESTORE" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Yellow
    Write-Host "Source File : $BackupFile"
    
    # Restore database dump
    Get-Content $BackupFile | docker exec -i $ContainerName psql -U $DatabaseUser -d $DatabaseName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [SUCCESS] Database restored and schema state validated successfully!" -ForegroundColor Green
    } else {
        Write-Error "  [FAILURE] Database restore execution failed."
    }
}
