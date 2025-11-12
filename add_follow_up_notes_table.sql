-- إنشاء جدول ملاحظات المتابعة
CREATE TABLE IF NOT EXISTS follow_up_notes (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_by_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_contract
        FOREIGN KEY (contract_id)
        REFERENCES new_contracts(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_created_by
        FOREIGN KEY (created_by_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_follow_up_notes_contract_id ON follow_up_notes(contract_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_notes_created_by_id ON follow_up_notes(created_by_id);

-- عرض النتيجة
SELECT 'جدول follow_up_notes تم إنشاؤه بنجاح!' AS message;
