CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy (if RLS enabled, but usually handled by backend service role)
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read materials" ON materials FOR SELECT USING (true);
CREATE POLICY "Admin insert materials" ON materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin delete materials" ON materials FOR DELETE USING (true);
