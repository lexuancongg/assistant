-- =============================================================================
-- ENTERPRISE AI ASSISTANT - SEED DATA SCRIPT
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. COMPANY
INSERT INTO companies (id, name, email, phone, address, storage_quota_gb, created_at)
VALUES (
    1,
    'Rikai Technology Corporation',
    'contact@rikai.technology',
    '024.3795.8888',
    'Tầng 12, Tòa nhà Rikai Tower, Phố Duy Tân, Cầu Giấy, Hà Nội',
    100,
    '2026-01-01 08:00:00+07'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    storage_quota_gb = EXCLUDED.storage_quota_gb;

-- 2. DEPARTMENTS
INSERT INTO departments (id, company_id, name, created_at) VALUES
('d1111111-1111-1111-1111-111111111111', 1, 'Ban Giám Đốc & Điều Hành', '2026-01-05 08:30:00+07'),
('d2222222-2222-2222-2222-222222222222', 1, 'Phòng Công Nghệ & Kỹ Thuật AI', '2026-01-05 08:35:00+07'),
('d3333333-3333-3333-3333-333333333333', 1, 'Phòng Pháp Chế & Thẩm Định', '2026-01-05 08:40:00+07'),
('d4444444-4444-4444-4444-444444444444', 1, 'Phòng Tài Chính & Kế Toán', '2026-01-05 08:45:00+07'),
('d5555555-5555-5555-5555-555555555555', 1, 'Phòng Nhân Sự & Đào Tạo', '2026-01-05 08:50:00+07'),
('d6666666-6666-6666-6666-666666666666', 1, 'Phòng Kinh Doanh & Khách Hàng', '2026-01-05 08:55:00+07')
ON CONFLICT (id) DO NOTHING;

-- 3. USERS (Mật khẩu mặc định: admin123 / user123)
-- Hash BCrypt $2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G
INSERT INTO users (id, company_id, department_id, name, email, password_hash, role, status, created_at) VALUES
('u1111111-1111-1111-1111-111111111111', 1, 'd1111111-1111-1111-1111-111111111111', 'Lê Xuân Công (CEO & Founder)', 'admin@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'ADMIN', 'ACTIVE', '2026-01-01 08:00:00+07'),
('u2222222-2222-2222-2222-222222222222', 1, 'd2222222-2222-2222-2222-222222222222', 'Trần Đình Trọng (Lead AI Engineer)', 'trong.td@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'MANAGER', 'ACTIVE', '2026-01-10 09:00:00+07'),
('u3333333-3333-3333-3333-333333333333', 1, 'd3333333-3333-3333-3333-333333333333', 'Nguyễn Thu Trang (Trưởng phòng Pháp chế)', 'trang.nt@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'MANAGER', 'ACTIVE', '2026-01-12 09:15:00+07'),
('u4444444-4444-4444-4444-444444444444', 1, 'd4444444-4444-4444-4444-444444444444', 'Phạm Minh Hoàng (Kế toán trưởng)', 'hoang.pm@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'MANAGER', 'ACTIVE', '2026-01-15 10:00:00+07'),
('u5555555-5555-5555-5555-555555555555', 1, 'd5555555-5555-5555-5555-555555555555', 'Vũ Thị Mai Anh (Trưởng phòng Nhân sự)', 'maianh.vt@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'MANAGER', 'ACTIVE', '2026-01-20 08:30:00+07'),
('u6666666-6666-6666-6666-666666666666', 1, 'd6666666-6666-6666-6666-666666666666', 'Đặng Quốc Bảo (Giám đốc Kinh doanh)', 'bao.dq@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'MANAGER', 'ACTIVE', '2026-02-01 09:00:00+07'),
('u7777777-7777-7777-7777-777777777777', 1, 'd2222222-2222-2222-2222-222222222222', 'Hoàng Văn Nam (Senior Backend Dev)', 'nam.hv@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'USER', 'ACTIVE', '2026-02-15 08:45:00+07'),
('u8888888-8888-8888-8888-888888888888', 1, 'd5555555-5555-5555-5555-555555555555', 'Lê Quỳnh Nga (Chuyên viên Tuyển dụng)', 'nga.lq@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'USER', 'ACTIVE', '2026-03-01 09:30:00+07')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;

-- 4. FOLDERS
INSERT INTO folders (id, company_id, parent_id, department_id, name, created_by, created_at) VALUES
(101, 1, NULL, 'd3333333-3333-3333-3333-333333333333', '📁 Hợp Đồng & Pháp Lý', 'u3333333-3333-3333-3333-333333333333', '2026-01-20 09:00:00+07'),
(102, 1, 101,  'd3333333-3333-3333-3333-333333333333', 'Hợp đồng Khách hàng 2026', 'u3333333-3333-3333-3333-333333333333', '2026-01-22 10:00:00+07'),
(103, 1, 101,  'd3333333-3333-3333-3333-333333333333', 'Thỏa thuận Bảo mật (NDA)', 'u3333333-3333-3333-3333-333333333333', '2026-01-25 14:00:00+07'),
(104, 1, NULL, 'd2222222-2222-2222-2222-222222222222', '📁 Kỹ Thuật & Kiến Trúc AI', 'u2222222-2222-2222-2222-222222222222', '2026-02-01 09:30:00+07'),
(105, 1, 104,  'd2222222-2222-2222-2222-222222222222', 'Tài liệu API & Thiết kế Hệ thống', 'u2222222-2222-2222-2222-222222222222', '2026-02-05 11:00:00+07'),
(106, 1, 104,  'd2222222-2222-2222-2222-222222222222', 'Quy chuẩn Bảo mật & Phân quyền', 'u7777777-7777-7777-7777-777777777777', '2026-02-10 15:30:00+07'),
(107, 1, NULL, 'd4444444-4444-4444-4444-444444444444', '📁 Tài Chính & Ngân Sách', 'u4444444-4444-4444-4444-444444444444', '2026-02-15 08:00:00+07'),
(108, 1, 107,  'd4444444-4444-4444-4444-444444444444', 'Báo cáo Tài chính Q1 & Q2', 'u4444444-4444-4444-4444-444444444444', '2026-02-18 10:15:00+07'),
(109, 1, NULL, 'd5555555-5555-5555-5555-555555555555', '📁 Nhân Sự & Nội Quy', 'u5555555-5555-5555-5555-555555555555', '2026-03-01 09:00:00+07'),
(110, 1, 109,  'd5555555-5555-5555-5555-555555555555', 'Chính sách Phúc lợi & Đãi ngộ 2026', 'u5555555-5555-5555-5555-555555555555', '2026-03-05 14:00:00+07')
ON CONFLICT (id) DO NOTHING;

-- 5. FILES (Dữ liệu trải đều từ Tháng 3/2026 đến Tháng 8/2026)
INSERT INTO files (id, company_id, folder_id, name, file_type, size_bytes, owner_department_id, uploaded_by, visibility, is_ai_indexed, deleted_at, created_at, updated_at) VALUES
-- Tháng 3/2026
('f1000000-0000-0000-0000-000000000001', 1, 110, 'Quy_che_Lam_viec_va_Bao_mat_Thong_tin_2026.pdf', 'pdf', 3450000, 'd5555555-5555-5555-5555-555555555555', 'u5555555-5555-5555-5555-555555555555', 'COMPANY', true, NULL, '2026-03-05 09:30:00+07', '2026-03-05 09:30:00+07'),
('f1000000-0000-0000-0000-000000000002', 1, 110, 'Chinh_sach_Phuc_loi_Bao_hiem_Nghi_phep.docx', 'docx', 1850000, 'd5555555-5555-5555-5555-555555555555', 'u5555555-5555-5555-5555-555555555555', 'COMPANY', true, NULL, '2026-03-12 14:20:00+07', '2026-03-12 14:20:00+07'),
('f1000000-0000-0000-0000-000000000003', 1, 105, 'Tai_lieu_Kien_truc_He_thong_RAG_Enterprise_v1.pdf', 'pdf', 5200000, 'd2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'RESTRICTED', true, NULL, '2026-03-20 10:15:00+07', '2026-03-20 10:15:00+07'),

-- Tháng 4/2026
('f1000000-0000-0000-0000-000000000004', 1, 108, 'Bao_cao_Kiem_toan_Tai_chinh_Q1_2026.xlsx', 'xlsx', 4200000, 'd4444444-4444-4444-4444-444444444444', 'u4444444-4444-4444-4444-444444444444', 'RESTRICTED', true, NULL, '2026-04-05 08:45:00+07', '2026-04-05 08:45:00+07'),
('f1000000-0000-0000-0000-000000000005', 1, 103, 'Mau_Thoa_thuan_Bao_mat_Thong_tin_NDA_Song_ngu.docx', 'docx', 1250000, 'd3333333-3333-3333-3333-333333333333', 'u3333333-3333-3333-3333-333333333333', 'COMPANY', true, NULL, '2026-04-15 11:30:00+07', '2026-04-15 11:30:00+07'),
('f1000000-0000-0000-0000-000000000006', 1, 106, 'Huong_dan_Trien_khai_Bao_mat_ISO27001.pdf', 'pdf', 6800000, 'd2222222-2222-2222-2222-222222222222', 'u7777777-7777-7777-7777-777777777777', 'RESTRICTED', true, NULL, '2026-04-28 16:00:00+07', '2026-04-28 16:00:00+07'),

-- Tháng 5/2026
('f1000000-0000-0000-0000-000000000007', 1, 102, 'Hop_dong_Cung_cap_Giai_phap_AI_Doi_tac_Viettel.pdf', 'pdf', 8400000, 'd3333333-3333-3333-3333-333333333333', 'u3333333-3333-3333-3333-333333333333', 'RESTRICTED', true, NULL, '2026-05-08 09:10:00+07', '2026-05-08 09:10:00+07'),
('f1000000-0000-0000-0000-000000000008', 1, 105, 'Dac_ta_Ky_thuat_API_Vector_Search_Qdrant.pdf', 'pdf', 3100000, 'd2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'RESTRICTED', true, NULL, '2026-05-18 14:40:00+07', '2026-05-18 14:40:00+07'),
('f1000000-0000-0000-0000-000000000009', 1, 108, 'Ke_hoach_Ngan_sach_R_D_Nam_2026.xlsx', 'xlsx', 5900000, 'd4444444-4444-4444-4444-444444444444', 'u4444444-4444-4444-4444-444444444444', 'RESTRICTED', true, NULL, '2026-05-25 15:20:00+07', '2026-05-25 15:20:00+07'),

-- Tháng 6/2026
('f1000000-0000-0000-0000-000000000010', 1, 102, 'Hop_dong_Phat_trien_Phan_mem_FPT_Software_v1.pdf', 'pdf', 7200000, 'd3333333-3333-3333-3333-333333333333', 'u3333333-3333-3333-3333-333333333333', 'RESTRICTED', true, NULL, '2026-06-02 10:00:00+07', '2026-06-02 10:00:00+07'),
('f1000000-0000-0000-0000-000000000011', 1, 102, 'Hop_dong_Phat_trien_Phan_mem_FPT_Software_v2_DieuChinh.pdf', 'pdf', 7500000, 'd3333333-3333-3333-3333-333333333333', 'u3333333-3333-3333-3333-333333333333', 'RESTRICTED', true, NULL, '2026-06-10 16:30:00+07', '2026-06-10 16:30:00+07'),
('f1000000-0000-0000-0000-000000000012', 1, 108, 'Bao_cao_Doanh_thu_va_Loi_nhuan_Q2_2026.xlsx', 'xlsx', 4800000, 'd4444444-4444-4444-4444-444444444444', 'u4444444-4444-4444-4444-444444444444', 'RESTRICTED', true, NULL, '2026-06-28 11:15:00+07', '2026-06-28 11:15:00+07'),

-- Tháng 7/2026
('f1000000-0000-0000-0000-000000000013', 1, 105, 'Huong_dan_Tich_hop_Gemini_LLM_API_Pipeline.pdf', 'pdf', 6200000, 'd2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'COMPANY', true, NULL, '2026-07-04 09:00:00+07', '2026-07-04 09:00:00+07'),
('f1000000-0000-0000-0000-000000000014', 1, 102, 'Bien_ban_Nghiem_thu_Giai_doan_1_Du_an_ERP.pdf', 'pdf', 3800000, 'd3333333-3333-3333-3333-333333333333', 'u3333333-3333-3333-3333-333333333333', 'RESTRICTED', true, NULL, '2026-07-15 14:00:00+07', '2026-07-15 14:00:00+07'),
('f1000000-0000-0000-0000-000000000015', 1, 110, 'Quy_trinh_Onboarding_Nhan_su_Moi_2026.docx', 'docx', 2100000, 'd5555555-5555-5555-5555-555555555555', 'u8888888-8888-8888-8888-888888888888', 'COMPANY', true, NULL, '2026-07-22 10:30:00+07', '2026-07-22 10:30:00+07'),

-- Tháng 8/2026 (Hiện tại)
('f1000000-0000-0000-0000-000000000016', 1, 102, 'Hop_dong_Lien_danh_Trien_khai_Cloud_AI_Techcombank.pdf', 'pdf', 9800000, 'd3333333-3333-3333-3333-333333333333', 'u1111111-1111-1111-1111-111111111111', 'RESTRICTED', true, NULL, '2026-08-05 08:30:00+07', '2026-08-05 08:30:00+07'),
('f1000000-0000-0000-0000-000000000017', 1, 105, 'Bao_cao_Danh_gia_Hieu_nang_Model_Gemini_vs_Claude.pdf', 'pdf', 4500000, 'd2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'COMPANY', true, NULL, '2026-08-14 11:20:00+07', '2026-08-14 11:20:00+07'),
('f1000000-0000-0000-0000-000000000018', 1, 108, 'Du_toan_Chi_phi_Ha_tang_AWS_S3_Q3_2026.xlsx', 'xlsx', 3600000, 'd4444444-4444-4444-4444-444444444444', 'u4444444-4444-4444-4444-444444444444', 'RESTRICTED', true, NULL, '2026-08-20 15:45:00+07', '2026-08-20 15:45:00+07'),
('f1000000-0000-0000-0000-000000000019', 1, 110, 'Danh_sach_Thuong_Hieu_qua_Cong_viec_Thang_8.xlsx', 'xlsx', 2400000, 'd5555555-5555-5555-5555-555555555555', 'u5555555-5555-5555-5555-555555555555', 'PRIVATE', true, NULL, '2026-08-25 16:00:00+07', '2026-08-25 16:00:00+07'),
('f1000000-0000-0000-0000-000000000020', 1, 101, 'Bang_Ke_Khai_Thue_TNDN_Tam_tinh_Q2_Cu.pdf', 'pdf', 2900000, 'd4444444-4444-4444-4444-444444444444', 'u4444444-4444-4444-4444-444444444444', 'RESTRICTED', true, '2026-08-26 10:00:00+07', '2026-07-10 09:00:00+07', '2026-08-26 10:00:00+07')
ON CONFLICT (id) DO NOTHING;

-- 6. FILE TAGS
INSERT INTO file_tags (file_id, tag) VALUES
('f1000000-0000-0000-0000-000000000001', 'Nội quy'),
('f1000000-0000-0000-0000-000000000001', 'Bảo mật'),
('f1000000-0000-0000-0000-000000000002', 'Nhân sự'),
('f1000000-0000-0000-0000-000000000003', 'Kiến trúc AI'),
('f1000000-0000-0000-0000-000000000003', 'RAG'),
('f1000000-0000-0000-0000-000000000004', 'Tài chính'),
('f1000000-0000-0000-0000-000000000005', 'Pháp lý'),
('f1000000-0000-0000-0000-000000000005', 'NDA'),
('f1000000-0000-0000-0000-000000000007', 'Hợp đồng'),
('f1000000-0000-0000-0000-000000000010', 'Hợp đồng v1'),
('f1000000-0000-0000-0000-000000000011', 'Hợp đồng v2'),
('f1000000-0000-0000-0000-000000000013', 'Gemini API'),
('f1000000-0000-0000-0000-000000000016', 'Hợp đồng lớn'),
('f1000000-0000-0000-0000-000000000019', 'Lương thưởng')
ON CONFLICT DO NOTHING;

-- 7. FILE VERSIONS
INSERT INTO file_versions (id, file_id, version_no, storage_path, size_bytes, uploaded_by, created_at) VALUES
('v1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000010', 1, 's3://employ-management/contracts/FPT_v1.pdf', 7200000, 'u3333333-3333-3333-3333-333333333333', '2026-06-02 10:00:00+07'),
('v1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000011', 2, 's3://employ-management/contracts/FPT_v2_updated.pdf', 7500000, 'u3333333-3333-3333-3333-333333333333', '2026-06-10 16:30:00+07')
ON CONFLICT (id) DO NOTHING;

-- 8. FILE PERMISSIONS (RBAC)
INSERT INTO file_permissions (id, file_id, subject_type, subject_id, level, granted_by, created_at) VALUES
('p1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000003', 'DEPARTMENT', 'd2222222-2222-2222-2222-222222222222', 'EDITOR', 'u1111111-1111-1111-1111-111111111111', '2026-03-20 10:15:00+07'),
('p1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000007', 'DEPARTMENT', 'd3333333-3333-3333-3333-333333333333', 'EDITOR', 'u1111111-1111-1111-1111-111111111111', '2026-05-08 09:10:00+07'),
('p1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000019', 'DEPARTMENT', 'd1111111-1111-1111-1111-111111111111', 'VIEWER', 'u5555555-5555-5555-5555-555555555555', '2026-08-25 16:00:00+07')
ON CONFLICT (id) DO NOTHING;

-- 9. ACTIVITY LOGS (Nhật ký hoạt động phong phú)
INSERT INTO activity_logs (id, company_id, actor_id, action_type, target_file_id, metadata, created_at) VALUES
('a1000000-0000-0000-0000-000000000001', 1, 'u5555555-5555-5555-5555-555555555555', 'UPLOAD', 'f1000000-0000-0000-0000-000000000001', '{"fileName": "Quy_che_Lam_viec_va_Bao_mat_Thong_tin_2026.pdf", "fileSize": 3450000}', '2026-03-05 09:30:00+07'),
('a1000000-0000-0000-0000-000000000002', 1, 'u2222222-2222-2222-2222-222222222222', 'UPLOAD', 'f1000000-0000-0000-0000-000000000003', '{"fileName": "Tai_lieu_Kien_truc_He_thong_RAG_Enterprise_v1.pdf", "fileSize": 5200000}', '2026-03-20 10:15:00+07'),
('a1000000-0000-0000-0000-000000000003', 1, 'u3333333-3333-3333-3333-333333333333', 'SHARE',  'f1000000-0000-0000-0000-000000000005', '{"sharedWithDepartment": "Phòng Kinh doanh", "level": "VIEWER"}', '2026-04-16 14:00:00+07'),
('a1000000-0000-0000-0000-000000000004', 1, 'u3333333-3333-3333-3333-333333333333', 'UPLOAD', 'f1000000-0000-0000-0000-000000000007', '{"fileName": "Hop_dong_Cung_cap_Giai_phap_AI_Doi_tac_Viettel.pdf", "fileSize": 8400000}', '2026-05-08 09:10:00+07'),
('a1000000-0000-0000-0000-000000000005', 1, 'u4444444-4444-4444-4444-444444444444', 'DOWNLOAD', 'f1000000-0000-0000-0000-000000000007', '{"clientIp": "192.168.1.45", "userAgent": "Chrome/124.0"}', '2026-05-10 11:20:00+07'),
('a1000000-0000-0000-0000-000000000006', 1, 'u3333333-3333-3333-3333-333333333333', 'UPLOAD', 'f1000000-0000-0000-0000-000000000010', '{"fileName": "Hop_dong_Phat_trien_Phan_mem_FPT_Software_v1.pdf", "fileSize": 7200000}', '2026-06-02 10:00:00+07'),
('a1000000-0000-0000-0000-000000000007', 1, 'u3333333-3333-3333-3333-333333333333', 'UPLOAD', 'f1000000-0000-0000-0000-000000000011', '{"fileName": "Hop_dong_Phat_trien_Phan_mem_FPT_Software_v2_DieuChinh.pdf", "fileSize": 7500000}', '2026-06-10 16:30:00+07'),
('a1000000-0000-0000-0000-000000000008', 1, 'u7777777-7777-7777-7777-777777777777', 'AI_QUERY_BLOCKED', 'f1000000-0000-0000-0000-000000000019', '{"reason": "Người dùng không có quyền truy cập bảng lương nhân sự", "attemptedQuery": "Tra cứu bảng lương thưởng tháng 8"}', '2026-08-26 15:30:00+07'),
('a1000000-0000-0000-0000-000000000009', 1, 'u4444444-4444-4444-4444-444444444444', 'DELETE', 'f1000000-0000-0000-0000-000000000020', '{"fileName": "Bang_Ke_Khai_Thue_TNDN_Tam_tinh_Q2_Cu.pdf"}', '2026-08-26 10:00:00+07'),
('a1000000-0000-0000-0000-000000000010', 1, 'u1111111-1111-1111-1111-111111111111', 'UPLOAD', 'f1000000-0000-0000-0000-000000000016', '{"fileName": "Hop_dong_Lien_danh_Trien_khai_Cloud_AI_Techcombank.pdf", "fileSize": 9800000}', '2026-08-05 08:30:00+07')
ON CONFLICT (id) DO NOTHING;

-- 10. CHAT SESSIONS & MESSAGES (Lịch sử hội thoại hỏi đáp với AI)
INSERT INTO chat_sessions (id, user_id, title, created_at) VALUES
('s1000000-0000-0000-0000-000000000001', 'u1111111-1111-1111-1111-111111111111', 'Rà soát hợp đồng đối tác Viettel', '2026-08-27 14:15:00+07'),
('s2000000-0000-0000-0000-000000000002', 'u1111111-1111-1111-1111-111111111111', 'Tra cứu chính sách nghỉ phép và bảo hiểm', '2026-08-27 16:45:00+07'),
('s3000000-0000-0000-0000-000000000003', 'u1111111-1111-1111-1111-111111111111', 'Kiến trúc kết nối Qdrant Vector Store', '2026-08-28 08:30:00+07')
ON CONFLICT (id) DO NOTHING;

INSERT INTO chat_messages (id, session_id, role, content, was_blocked_by_permission, created_at) VALUES
-- Session 1
('m1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 'USER', 'Điều khoản thanh toán và phạt vi phạm trong hợp đồng với Viettel được quy định như thế nào?', false, '2026-08-27 14:15:10+07'),
('m1000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000001', 'ASSISTANT', 'Dựa trên tài liệu **Hop_dong_Cung_cap_Giai_phap_AI_Doi_tac_Viettel.pdf**:\n\n### 1. Quy định thanh toán:\n- **Đợt 1 (Tạm ứng):** Thanh toán 30% giá trị hợp đồng trong vòng 07 ngày làm việc sau khi ký kết.\n- **Đợt 2 (Nghiệm thu giai đoạn):** Thanh toán 50% sau khi bàn giao phiên bản thử nghiệm.\n- **Đợt 3 (Quyết toán):** Thanh toán 20% còn lại sau khi ký Biên bản nghiệm thu tổng thể.\n\n### 2. Phạt vi phạm hợp đồng:\n- Trường hợp chậm tiến độ do lỗi của Bên B: Phạt 0.5% giá trị phần việc chậm cho mỗi tuần chậm trễ, nhưng không vượt quá 8% tổng giá trị hợp đồng.\n- Cam kết bảo mật NDA có hiệu lực 02 năm kể từ ngày chấm dứt hợp đồng.', false, '2026-08-27 14:15:18+07'),

-- Session 2
('m2000000-0000-0000-0000-000000000001', 's2000000-0000-0000-0000-000000000002', 'USER', 'Nhân viên chính thức được hưởng bao nhiêu ngày phép năm và chế độ bảo hiểm sức khỏe ra sao?', false, '2026-08-27 16:45:10+07'),
('m2000000-0000-0000-0000-000000000002', 's2000000-0000-0000-0000-000000000002', 'ASSISTANT', 'Theo tài liệu **Chinh_sach_Phuc_loi_Bao_hiem_Nghi_phep.docx** của công ty:\n\n- **Nghỉ phép năm:** Mỗi nhân viên chính thức được hưởng **14 ngày phép năm có hưởng lương**. Cứ sau mỗi 03 năm làm việc liên tục sẽ được cộng thêm 01 ngày phép.\n- **Bảo hiểm sức khỏe:** Ngoài BHXH bắt buộc theo luật định, công ty mua gói bảo hiểm sức khỏe cao cấp **Bảo Việt Care / PVI Care** cho nhân viên và hỗ trợ 50% chi phí cho người thân phụ thuộc.\n- **Khám sức khỏe định kỳ:** Tổ chức 01 lần/năm tại các bệnh viện quốc tế uy tín.', false, '2026-08-27 16:45:16+07')
ON CONFLICT (id) DO NOTHING;

-- 11. CITATIONS (Trích dẫn nguồn RAG)
INSERT INTO chat_message_citations (id, message_id, file_id, chunk_id, page_label, score) VALUES
('c1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000007', 'chunk_vt_p4_01', 'Trang 4-5', 0.93),
('c2000000-0000-0000-0000-000000000001', 'm2000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000002', 'chunk_hr_p2_03', 'Trang 2', 0.95)
ON CONFLICT (id) DO NOTHING;
