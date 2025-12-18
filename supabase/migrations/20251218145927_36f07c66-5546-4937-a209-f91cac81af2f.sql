-- Add evidence_source and learning_signals columns to activities table
ALTER TABLE public.activities 
ADD COLUMN evidence_source text NOT NULL DEFAULT 'submitted',
ADD COLUMN learning_signals jsonb;

-- Add check constraint for evidence_source values
ALTER TABLE public.activities 
ADD CONSTRAINT activities_evidence_source_check 
CHECK (evidence_source IN ('submitted', 'observed_in_proof'));

-- Add comment explaining the columns
COMMENT ON COLUMN public.activities.evidence_source IS 'Source of evidence: submitted (uploaded/pasted) or observed_in_proof (created in PROOF learning spaces)';
COMMENT ON COLUMN public.activities.learning_signals IS 'Learning-relevant signals captured during observed sessions (edit counts, run counts, error cycles, etc.)';