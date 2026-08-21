# Backup strategy

Supabase PostgreSQL is the source of truth. Enable plan-appropriate managed backups/PITR and validate restore in an isolated project. Retain Git migrations and provider-managed encrypted secret backups. Export critical records only through approved encrypted channels.

Google Sheets is reconstructable reporting output, not a backup. A lost workbook is rebuilt through the application recovery queue from Supabase.
