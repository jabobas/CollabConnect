-- Author: Aubin Mugisha
-- Description: Performance indexes for BelongsTo table queries

CREATE INDEX idx_belongsto_institution ON BelongsTo (institution_id, effective_start DESC);
CREATE INDEX idx_belongsto_department ON BelongsTo (department_id, effective_start DESC);
CREATE INDEX idx_belongsto_active ON BelongsTo (effective_end);

