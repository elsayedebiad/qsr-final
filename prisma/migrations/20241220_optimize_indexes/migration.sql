-- Optimize Database Performance for 5000+ Users
-- Adding crucial indexes for better query performance

-- CV Table Indexes
CREATE INDEX IF NOT EXISTS idx_cv_status ON cvs(status);
CREATE INDEX IF NOT EXISTS idx_cv_nationality ON cvs(nationality);
CREATE INDEX IF NOT EXISTS idx_cv_created_at ON cvs("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_cv_updated_at ON cvs("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_cv_age ON cvs(age);
CREATE INDEX IF NOT EXISTS idx_cv_position ON cvs(position);
CREATE INDEX IF NOT EXISTS idx_cv_marital_status ON cvs("maritalStatus");
CREATE INDEX IF NOT EXISTS idx_cv_religion ON cvs(religion);
CREATE INDEX IF NOT EXISTS idx_cv_reference_code ON cvs("referenceCode");
CREATE INDEX IF NOT EXISTS idx_cv_passport_number ON cvs("passportNumber");
CREATE INDEX IF NOT EXISTS idx_cv_created_by ON cvs("createdById");
CREATE INDEX IF NOT EXISTS idx_cv_full_name ON cvs("fullName");
CREATE INDEX IF NOT EXISTS idx_cv_phone ON cvs(phone);
CREATE INDEX IF NOT EXISTS idx_cv_email ON cvs(email);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cv_status_nationality ON cvs(status, nationality);
CREATE INDEX IF NOT EXISTS idx_cv_status_created_at ON cvs(status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_cv_nationality_age ON cvs(nationality, age);
CREATE INDEX IF NOT EXISTS idx_cv_status_position ON cvs(status, position);

-- User Table Indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_active ON users("isActive");
CREATE INDEX IF NOT EXISTS idx_user_created_at ON users("createdAt" DESC);

-- Session Table Indexes
CREATE INDEX IF NOT EXISTS idx_session_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_session_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_session_expires ON sessions("expiresAt");

-- Activity Log Indexes
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_logs("userId");
CREATE INDEX IF NOT EXISTS idx_activity_cv_id ON activity_logs("cvId");
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_logs("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_target ON activity_logs("targetType", "targetId");

-- Contract Table Indexes
CREATE INDEX IF NOT EXISTS idx_contract_cv_id ON contracts("cvId");
CREATE INDEX IF NOT EXISTS idx_contract_dates ON contracts("contractStartDate", "contractEndDate");
CREATE INDEX IF NOT EXISTS idx_contract_identity ON contracts("identityNumber");

-- Booking Table Indexes
CREATE INDEX IF NOT EXISTS idx_booking_cv_id ON bookings("cvId");
CREATE INDEX IF NOT EXISTS idx_booking_booked_by ON bookings("bookedById");
CREATE INDEX IF NOT EXISTS idx_booking_identity ON bookings("identityNumber");
CREATE INDEX IF NOT EXISTS idx_booking_date ON bookings("bookedAt" DESC);

-- Notification Table Indexes
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notification_read ON notifications("isRead");
CREATE INDEX IF NOT EXISTS idx_notification_created ON notifications("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notifications(type);

-- Banner Table Indexes
CREATE INDEX IF NOT EXISTS idx_banner_sales_page ON banners("salesPageId");
CREATE INDEX IF NOT EXISTS idx_banner_active ON banners("isActive");
CREATE INDEX IF NOT EXISTS idx_banner_device ON banners("deviceType");
CREATE INDEX IF NOT EXISTS idx_banner_order ON banners("order");

-- User Session Table Indexes
CREATE INDEX IF NOT EXISTS idx_user_session_user_id ON user_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_user_session_session_id ON user_sessions("sessionId");
CREATE INDEX IF NOT EXISTS idx_user_session_active ON user_sessions("isActive");
CREATE INDEX IF NOT EXISTS idx_user_session_last_activity ON user_sessions("lastActivity" DESC);

-- Login Activation Indexes
CREATE INDEX IF NOT EXISTS idx_login_activation_user ON login_activations("userId");
CREATE INDEX IF NOT EXISTS idx_login_activation_code ON login_activations("activationCode");
CREATE INDEX IF NOT EXISTS idx_login_activation_used ON login_activations("isUsed");
CREATE INDEX IF NOT EXISTS idx_login_activation_expires ON login_activations("expiresAt");

-- System Settings Index
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Full Text Search Indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_cv_fullname_gin ON cvs USING gin(to_tsvector('arabic', "fullName"));
CREATE INDEX IF NOT EXISTS idx_cv_fullname_arabic_gin ON cvs USING gin(to_tsvector('arabic', "fullNameArabic"));

-- Partial Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_cv_available ON cvs(id) WHERE status = 'NEW';
CREATE INDEX IF NOT EXISTS idx_cv_booked ON cvs(id) WHERE status = 'BOOKED';
CREATE INDEX IF NOT EXISTS idx_cv_hired ON cvs(id) WHERE status = 'HIRED';
CREATE INDEX IF NOT EXISTS idx_cv_active_users ON users(id) WHERE "isActive" = true;

-- Statistics for query optimizer
ANALYZE cvs;
ANALYZE users;
ANALYZE activity_logs;
ANALYZE sessions;
ANALYZE contracts;
ANALYZE bookings;
