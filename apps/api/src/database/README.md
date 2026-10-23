# database
migration-guard.ts decide si un comando de base de datos es seguro. reset/push/dev/create quedan bloqueados en producción o contra una base remota; ahí solo deploy y status. Lo usan scripts/db.ts y el seed.
