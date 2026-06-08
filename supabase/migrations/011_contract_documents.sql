ALTER TABLE documents
  ADD COLUMN name TEXT NOT NULL DEFAULT '',
  ADD COLUMN description TEXT,
  ADD COLUMN file_size BIGINT,
  ADD COLUMN mime_type TEXT DEFAULT 'application/pdf';
