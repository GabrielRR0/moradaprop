# storage
Contrato StorageProvider con dos implementaciones: local (disco; solo public/ se sirve en /uploads) y supabase (REST). Se elige con STORAGE_PROVIDER. Dos buckets: público (variantes) y privado (originales, importaciones). Protegido contra path traversal.
