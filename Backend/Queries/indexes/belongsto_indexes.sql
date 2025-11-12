-- File: Backend/sql_queries/aubin/indexes/belongsto_indexes.sql
-- Purpose: secondary indexes for BelongsTo relationship (MySQL).

CREATE INDEX idx_belongsto_institution ON BelongsTo (institution_id, effective_start DESC);
CREATE INDEX idx_belongsto_department ON BelongsTo (department_id, effective_start DESC);
CREATE INDEX idx_belongsto_active ON BelongsTo (effective_end);

