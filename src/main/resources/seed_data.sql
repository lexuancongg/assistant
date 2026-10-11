-- =============================================================================
-- ENTERPRISE AI ASSISTANT - SEED DATA SCRIPT (BIGINT IDENTITY PK & FK)
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
(1, 1, 'Ban Giám Đốc & Điều Hành', '2026-01-05 08:30:00+07'),
(2, 1, 'Phòng Công Nghệ & Kỹ Thuật AI', '2026-01-05 08:35:00+07'),
(3, 1, 'Phòng Pháp Chế & Thẩm Định', '2026-01-05 08:40:00+07'),
(4, 1, 'Phòng Tài Chính & Kế Toán', '2026-01-05 08:45:00+07'),
(5, 1, 'Phòng Nhân Sự & Đào Tạo', '2026-01-05 08:50:00+07'),
(6, 1, 'Phòng Kinh Doanh & Khách Hàng', '2026-01-05 08:55:00+07')
ON CONFLICT (id) DO NOTHING;

-- 3. USERS (Mật khẩu mặc định: admin123 / user123)
-- Hash BCrypt $2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G
INSERT INTO users (id, company_id, department_id, name, email, password_hash, role, status, created_at) VALUES
(1, 1, 1, 'Lê Xuân Công (CEO & Founder)', 'admin@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'ADMIN', 'ACTIVE', '2026-01-01 08:00:00+07'),
(2, 1, 2, 'Trần Đình Trọng (Lead AI Engineer)', 'trong.td@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'MANAGER', 'ACTIVE', '2026-01-10 09:00:00+07'),
(3, 1, 3, 'Nguyễn Thu Trang (Trưởng phòng Pháp chế)', 'trang.nt@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'MANAGER', 'ACTIVE', '2026-01-12 09:15:00+07'),
(4, 1, 4, 'Phạm Minh Hoàng (Kế toán trưởng)', 'hoang.pm@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'MANAGER', 'ACTIVE', '2026-01-15 10:00:00+07'),
(5, 1, 5, 'Vũ Thị Mai Anh (Trưởng phòng Nhân sự)', 'maianh.vt@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'MANAGER', 'ACTIVE', '2026-01-20 08:30:00+07'),
(6, 1, 6, 'Đặng Quốc Bảo (Giám đốc Kinh doanh)', 'bao.dq@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'MANAGER', 'ACTIVE', '2026-02-01 09:00:00+07'),
(7, 1, 2, 'Hoàng Văn Nam (Senior Backend Dev)', 'nam.hv@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'USER', 'ACTIVE', '2026-02-15 08:45:00+07'),
(8, 1, 5, 'Lê Quỳnh Nga (Chuyên viên Tuyển dụng)', 'nga.lq@rikai.technology', '$2a$10$e846ZtMh4bL1zD4t5n9OqeK4.88fJq5Z1/7N7T4M6B.hP2xV0jO6G', 'USER', 'ACTIVE', '2026-03-01 09:30:00+07')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;

-- 4. FOLDERS
INSERT INTO folders (id, company_id, parent_id, department_id, name, created_by, created_at) VALUES
(101, 1, NULL, 3, '📁 Hợp Đồng & Pháp Lý', 3, '2026-01-20 09:00:00+07'),
(102, 1, 101,  3, 'Hợp đồng Khách hàng 2026', 3, '2026-01-22 10:00:00+07'),
(103, 1, 101,  3, 'Thỏa thuận Bảo mật (NDA)', 3, '2026-01-25 14:00:00+07'),
(104, 1, NULL, 2, '📁 Kỹ Thuật & Kiến Trúc AI', 2, '2026-02-01 09:30:00+07'),
(105, 1, 104,  2, 'Tài liệu API & Thiết kế Hệ thống', 2, '2026-02-05 11:00:00+07'),
(106, 1, 104,  2, 'Quy chuẩn Bảo mật & Phân quyền', 7, '2026-02-10 15:30:00+07'),
(107, 1, NULL, 4, '📁 Tài Chính & Ngân Sách', 4, '2026-02-15 08:00:00+07'),
(108, 1, 107,  4, 'Báo cáo Tài chính Q1 & Q2', 4, '2026-02-18 10:15:00+07'),
(109, 1, NULL, 5, '📁 Nhân Sự & Nội Quy', 5, '2026-03-01 09:00:00+07'),
(110, 1, 109,  5, 'Chính sách Phúc lợi & Đãi ngộ 2026', 5, '2026-03-05 14:00:00+07')
ON CONFLICT (id) DO NOTHING;

-- 5. FILES (Dữ liệu trải đều từ Tháng 3/2026 đến Tháng 8/2026)
INSERT INTO files (id, company_id, folder_id, name, file_type, size_bytes, owner_department_id, uploaded_by, visibility, is_ai_indexed, deleted_at, created_at, updated_at) VALUES
-- Tháng 3/2026
(1, 1, 110, 'Quy_che_Lam_viec_va_Bao_mat_Thong_tin_2026.pdf', 'pdf', 3450000, 5, 5, 'COMPANY', true, NULL, '2026-03-05 09:30:00+07', '2026-03-05 09:30:00+07'),
(2, 1, 110, 'Chinh_sach_Phuc_loi_Bao_hiem_Nghi_phep.docx', 'docx', 1850000, 5, 5, 'COMPANY', true, NULL, '2026-03-12 14:20:00+07', '2026-03-12 14:20:00+07'),
(3, 1, 105, 'Tai_lieu_Kien_truc_He_thong_RAG_Enterprise_v1.pdf', 'pdf', 5200000, 2, 2, 'RESTRICTED', true, NULL, '2026-03-20 10:15:00+07', '2026-03-20 10:15:00+07'),

-- Tháng 4/2026
(4, 1, 108, 'Bao_cao_Kiem_toan_Tai_chinh_Q1_2026.xlsx', 'xlsx', 4200000, 4, 4, 'RESTRICTED', true, NULL, '2026-04-05 08:45:00+07', '2026-04-05 08:45:00+07'),
(5, 1, 103, 'Mau_Thoa_thuan_Bao_mat_Thong_tin_NDA_Song_ngu.docx', 'docx', 1250000, 3, 3, 'COMPANY', true, NULL, '2026-04-15 11:30:00+07', '2026-04-15 11:30:00+07'),
(6, 1, 106, 'Huong_dan_Trien_khai_Bao_mat_ISO27001.pdf', 'pdf', 6800000, 2, 7, 'RESTRICTED', true, NULL, '2026-04-28 16:00:00+07', '2026-04-28 16:00:00+07'),

-- Tháng 5/2026
(7, 1, 102, 'Hop_dong_Cung_cap_Giai_phap_AI_Doi_tac_Viettel.pdf', 'pdf', 8400000, 3, 3, 'RESTRICTED', true, NULL, '2026-05-08 09:10:00+07', '2026-05-08 09:10:00+07'),
(8, 1, 105, 'Dac_ta_Ky_thuat_API_Vector_Search_Qdrant.pdf', 'pdf', 3100000, 2, 2, 'RESTRICTED', true, NULL, '2026-05-18 14:40:00+07', '2026-05-18 14:40:00+07'),
(9, 1, 108, 'Ke_hoach_Ngan_sach_R_D_Nam_2026.xlsx', 'xlsx', 5900000, 4, 4, 'RESTRICTED', true, NULL, '2026-05-25 15:20:00+07', '2026-05-25 15:20:00+07'),

-- Tháng 6/2026
(10, 1, 102, 'Hop_dong_Phat_trien_Phan_mem_FPT_Software_v1.pdf', 'pdf', 7200000, 3, 3, 'RESTRICTED', true, NULL, '2026-06-02 10:00:00+07', '2026-06-02 10:00:00+07'),
(11, 1, 102, 'Hop_dong_Phat_trien_Phan_mem_FPT_Software_v2_DieuChinh.pdf', 'pdf', 7500000, 3, 3, 'RESTRICTED', true, NULL, '2026-06-10 16:30:00+07', '2026-06-10 16:30:00+07'),
(12, 1, 108, 'Bao_cao_Doanh_thu_va_Loi_nhuan_Q2_2026.xlsx', 'xlsx', 4800000, 4, 4, 'RESTRICTED', true, NULL, '2026-06-28 11:15:00+07', '2026-06-28 11:15:00+07'),

-- Tháng 7/2026
(13, 1, 105, 'Huong_dan_Tich_hop_Gemini_LLM_API_Pipeline.pdf', 'pdf', 6200000, 2, 2, 'COMPANY', true, NULL, '2026-07-04 09:00:00+07', '2026-07-04 09:00:00+07'),
(14, 1, 102, 'Bien_ban_Nghiem_thu_Giai_doan_1_Du_an_ERP.pdf', 'pdf', 3800000, 3, 3, 'RESTRICTED', true, NULL, '2026-07-15 14:00:00+07', '2026-07-15 14:00:00+07'),
(15, 1, 110, 'Quy_trinh_Onboarding_Nhan_su_Moi_2026.docx', 'docx', 2100000, 5, 8, 'COMPANY', true, NULL, '2026-07-22 10:30:00+07', '2026-07-22 10:30:00+07'),

-- Tháng 8/2026 (Hiện tại)
(16, 1, 102, 'Hop_dong_Lien_danh_Trien_khai_Cloud_AI_Techcombank.pdf', 'pdf', 9800000, 3, 1, 'RESTRICTED', true, NULL, '2026-08-05 08:30:00+07', '2026-08-05 08:30:00+07'),
(17, 1, 105, 'Bao_cao_Danh_gia_Hieu_nang_Model_Gemini_vs_Claude.pdf', 'pdf', 4500000, 2, 2, 'COMPANY', true, NULL, '2026-08-14 11:20:00+07', '2026-08-14 11:20:00+07'),
(18, 1, 108, 'Du_toan_Chi_phi_Ha_tang_AWS_S3_Q3_2026.xlsx', 'xlsx', 3600000, 4, 4, 'RESTRICTED', true, NULL, '2026-08-20 15:45:00+07', '2026-08-20 15:45:00+07'),
(19, 1, 110, 'Danh_sach_Thuong_Hieu_qua_Cong_viec_Thang_8.xlsx', 'xlsx', 2400000, 5, 5, 'PRIVATE', true, NULL, '2026-08-25 16:00:00+07', '2026-08-25 16:00:00+07'),
(20, 1, 101, 'Bang_Ke_Khai_Thue_TNDN_Tam_tinh_Q2_Cu.pdf', 'pdf', 2900000, 4, 4, 'RESTRICTED', true, '2026-08-26 10:00:00+07', '2026-07-10 09:00:00+07', '2026-08-26 10:00:00+07')
ON CONFLICT (id) DO NOTHING;

-- 6. FILE TAGS
INSERT INTO file_tags (file_id, tag) VALUES
(1, 'Nội quy'),
(1, 'Bảo mật'),
(2, 'Nhân sự'),
(3, 'Kiến trúc AI'),
(3, 'RAG'),
(4, 'Tài chính'),
(5, 'Pháp lý'),
(5, 'NDA'),
(7, 'Hợp đồng'),
(10, 'Hợp đồng v1'),
(11, 'Hợp đồng v2'),
(13, 'Gemini API'),
(16, 'Hợp đồng lớn'),
(19, 'Lương thưởng')
ON CONFLICT DO NOTHING;

-- 7. FILE VERSIONS
INSERT INTO file_versions (id, file_id, version_no, storage_path, size_bytes, uploaded_by, created_at) VALUES
(1, 10, 1, 's3://employ-management/contracts/FPT_v1.pdf', 7200000, 3, '2026-06-02 10:00:00+07'),
(2, 11, 2, 's3://employ-management/contracts/FPT_v2_updated.pdf', 7500000, 3, '2026-06-10 16:30:00+07')
ON CONFLICT (id) DO NOTHING;

-- 8. FILE PERMISSIONS (RBAC)
INSERT INTO file_permissions (id, file_id, subject_type, subject_id, level, granted_by, created_at) VALUES
(1, 3, 'DEPARTMENT', 2, 'EDITOR', 1, '2026-03-20 10:15:00+07'),
(2, 7, 'DEPARTMENT', 3, 'EDITOR', 1, '2026-05-08 09:10:00+07'),
(3, 19, 'DEPARTMENT', 1, 'VIEWER', 5, '2026-08-25 16:00:00+07')
ON CONFLICT (id) DO NOTHING;

-- 9. ACTIVITY LOGS
INSERT INTO activity_logs (id, company_id, actor_id, action_type, target_file_id, metadata, created_at) VALUES
(1, 1, 5, 'UPLOAD', 1, '{"fileName": "Quy_che_Lam_viec_va_Bao_mat_Thong_tin_2026.pdf", "fileSize": 3450000}', '2026-03-05 09:30:00+07'),
(2, 1, 2, 'UPLOAD', 3, '{"fileName": "Tai_lieu_Kien_truc_He_thong_RAG_Enterprise_v1.pdf", "fileSize": 5200000}', '2026-03-20 10:15:00+07'),
(3, 1, 3, 'SHARE',  5, '{"sharedWithDepartment": "Phòng Kinh doanh", "level": "VIEWER"}', '2026-04-16 14:00:00+07'),
(4, 1, 3, 'UPLOAD', 7, '{"fileName": "Hop_dong_Cung_cap_Giai_phap_AI_Doi_tac_Viettel.pdf", "fileSize": 8400000}', '2026-05-08 09:10:00+07'),
(5, 1, 4, 'DOWNLOAD', 7, '{"clientIp": "192.168.1.45", "userAgent": "Chrome/124.0"}', '2026-05-10 11:20:00+07'),
(6, 1, 3, 'UPLOAD', 10, '{"fileName": "Hop_dong_Phat_trien_Phan_mem_FPT_Software_v1.pdf", "fileSize": 7200000}', '2026-06-02 10:00:00+07'),
(7, 1, 3, 'UPLOAD', 11, '{"fileName": "Hop_dong_Phat_trien_Phan_mem_FPT_Software_v2_DieuChinh.pdf", "fileSize": 7500000}', '2026-06-10 16:30:00+07'),
(8, 1, 7, 'AI_QUERY_BLOCKED', 19, '{"reason": "Người dùng không có quyền truy cập bảng lương nhân sự", "attemptedQuery": "Tra cứu bảng lương thưởng tháng 8"}', '2026-08-26 15:30:00+07'),
(9, 1, 4, 'DELETE', 20, '{"fileName": "Bang_Ke_Khai_Thue_TNDN_Tam_tinh_Q2_Cu.pdf"}', '2026-08-26 10:00:00+07'),
(10, 1, 1, 'UPLOAD', 16, '{"fileName": "Hop_dong_Lien_danh_Trien_khai_Cloud_AI_Techcombank.pdf", "fileSize": 9800000}', '2026-08-05 08:30:00+07')
ON CONFLICT (id) DO NOTHING;

-- 10. CHAT SESSIONS & MESSAGES
INSERT INTO chat_sessions (id, user_id, title, created_at) VALUES
(1, 1, 'Rà soát hợp đồng đối tác Viettel', '2026-08-27 14:15:00+07'),
(2, 1, 'Tra cứu chính sách nghỉ phép và bảo hiểm', '2026-08-27 16:45:00+07'),
(3, 1, 'Kiến trúc kết nối Qdrant Vector Store', '2026-08-28 08:30:00+07'),
(4, 1, 'Phân tích tài chính Q1', '2026-09-01 09:10:00+07'),
(5, 2, 'Quy trình kiểm thử bảo mật RAG', '2026-09-02 10:20:00+07'),
(6, 3, 'Rà soát hợp đồng FPT Software', '2026-09-03 14:15:00+07'),
(7, 4, 'Báo cáo kiểm toán ngân sách', '2026-09-04 11:30:00+07'),
(8, 5, 'Nội quy làm việc và đãi ngộ', '2026-09-05 16:00:00+07'),
(9, 1, 'Tổng kết chỉ số KPI Q3', '2026-09-06 15:40:00+07'),
(10, 2, 'Kiến trúc triển khai Hybrid Search', '2026-09-07 09:50:00+07'),
(11, 3, 'Tiến độ dự án Techcombank AI', '2026-09-08 13:25:00+07'),
(12, 4, 'Kê khai thuế thu nhập doanh nghiệp', '2026-09-09 10:10:00+07'),
(13, 5, 'Quy chế công tác phí và đào tạo', '2026-09-10 14:05:00+07'),
(14, 1, 'Chiến lược mở rộng thị trường SaaS AI', '2026-09-11 11:15:00+07'),
(15, 2, 'Tối ưu hóa Embedding Latency Qdrant', '2026-09-12 15:30:00+07'),
(16, 3, 'Hợp đồng phát triển phần mềm v2', '2026-09-13 16:20:00+07'),
(17, 1, 'Kiểm tra tài liệu tổng thể doanh nghiệp', '2026-09-14 09:15:00+07')
ON CONFLICT (id) DO NOTHING;

INSERT INTO chat_messages (id, session_id, role, content, was_blocked_by_permission, latency_ms, created_at) VALUES
-- Session 1
(1, 1, 'USER', 'Điều khoản thanh toán và phạt vi phạm trong hợp đồng với Viettel được quy định như thế nào?', false, NULL, '2026-08-27 14:15:10+07'),
(2, 1, 'ASSISTANT', 'Dựa trên tài liệu **Hop_dong_Cung_cap_Giai_phap_AI_Doi_tac_Viettel.pdf**:\n\n### 1. Quy định thanh toán:\n- **Đợt 1 (Tạm ứng):** Thanh toán 30% giá trị hợp đồng trong vòng 07 ngày làm việc sau khi ký kết.\n- **Đợt 2 (Nghiệm thu giai đoạn):** Thanh toán 50% sau khi bàn giao phiên bản thử nghiệm.\n- **Đợt 3 (Quyết toán):** Thanh toán 20% còn lại sau khi ký Biên bản nghiệm thu tổng thể.\n\n### 2. Phạt vi phạm hợp đồng:\n- Trường hợp chậm tiến độ do lỗi của Bên B: Phạt 0.5% giá trị phần việc chậm cho mỗi tuần chậm trễ, nhưng không vượt quá 8% tổng giá trị hợp đồng.\n- Cam kết bảo mật NDA có hiệu lực 02 năm kể từ ngày chấm dứt hợp đồng.', false, 415, '2026-08-27 14:15:18+07'),

-- Session 2
(3, 2, 'USER', 'Nhân viên chính thức được hưởng bao nhiêu ngày phép năm và chế độ bảo hiểm sức khỏe ra sao?', false, NULL, '2026-08-27 16:45:10+07'),
(4, 2, 'ASSISTANT', 'Theo tài liệu **Chinh_sach_Phuc_loi_Bao_hiem_Nghi_phep.docx** của công ty:\n\n- **Nghỉ phép năm:** Mỗi nhân viên chính thức được hưởng **14 ngày phép năm có hưởng lương**. Cứ sau mỗi 03 năm làm việc liên tục sẽ được cộng thêm 01 ngày phép.\n- **Bảo hiểm sức khỏe:** Ngoài BHXH bắt buộc theo luật định, công ty mua gói bảo hiểm sức khỏe cao cấp **Bảo Việt Care / PVI Care** cho nhân viên và hỗ trợ 50% chi phí cho người thân phụ thuộc.\n- **Khám sức khỏe định kỳ:** Tổ chức 01 lần/năm tại các bệnh viện quốc tế uy tín.', false, 395, '2026-08-27 16:45:16+07'),

-- 14 ngày truy vấn AI gần nhất với latency đo đạc thực tế
(5, 4, 'USER', 'Tổng kết lợi nhuận trước thuế Q1 2026?', false, NULL, '2026-09-01 09:10:05+07'),
(6, 4, 'ASSISTANT', 'Lợi nhuận trước thuế theo báo cáo kiểm toán là 12.8 tỷ VNĐ.', false, 490, '2026-09-01 09:10:06+07'),

(7, 5, 'USER', 'Quy trình kiểm thử bảo mật API Vector Search Qdrant ra sao?', false, NULL, '2026-09-02 10:20:05+07'),
(8, 5, 'ASSISTANT', 'Kiểm thử thực hiện theo chuẩn OWASP Top 10 và ISO 27001.', false, 460, '2026-09-02 10:20:06+07'),

(9, 6, 'USER', 'Thời hạn bảo hành phần mềm FPT là bao lâu?', false, NULL, '2026-09-03 14:15:05+07'),
(10, 6, 'ASSISTANT', 'Thời hạn bảo hành tiêu chuẩn là 12 tháng kể từ ngày nghiệm thu.', false, 480, '2026-09-03 14:15:06+07'),

(11, 7, 'USER', 'Khoản chi phí lớn nhất trong quý vừa qua là gì?', false, NULL, '2026-09-04 11:30:05+07'),
(12, 7, 'ASSISTANT', 'Chi phí R&D và hạ tầng GPU Cloud chiếm tỷ trọng cao nhất (38%).', false, 440, '2026-09-04 11:30:06+07'),

(13, 8, 'USER', 'Chế độ công tác nước ngoài có được cấp thẻ tín dụng doanh nghiệp?', false, NULL, '2026-09-05 16:00:05+07'),
(14, 8, 'ASSISTANT', 'Trưởng đoàn hoặc cấp quản lý từ bậc M2 trở lên được cấp thẻ doanh nghiệp.', false, 450, '2026-09-05 16:00:06+07'),

(15, 9, 'USER', 'Tỷ lệ hoàn thành mục tiêu OKR quý này của khối kỹ thuật?', false, NULL, '2026-09-06 15:40:05+07'),
(16, 9, 'ASSISTANT', 'Khối kỹ thuật đạt 96.4% tiến độ cam kết.', false, 430, '2026-09-06 15:40:06+07'),

(17, 10, 'USER', 'Qdrant có hỗ trợ HNSW filter metadata hiệu năng cao không?', false, NULL, '2026-09-07 09:50:05+07'),
(18, 10, 'ASSISTANT', 'Có, Qdrant hỗ trợ Payload Indexing và lọc phân quyền ngay trong quá trình duyệt đồ thị HNSW.', false, 410, '2026-09-07 09:50:06+07'),

(19, 11, 'USER', 'Mốc bàn giao UAT dự án Techcombank là ngày nào?', false, NULL, '2026-09-08 13:25:05+07'),
(20, 11, 'ASSISTANT', 'Mốc UAT chính thức diễn ra vào ngày 25/09/2026.', false, 420, '2026-09-08 13:25:06+07'),

(21, 12, 'USER', 'Hạn nộp báo cáo thuế TNDN tạm tính quý 3?', false, NULL, '2026-09-09 10:10:05+07'),
(22, 12, 'ASSISTANT', 'Hạn chót là ngày 30 của tháng đầu quý sau.', false, 460, '2026-09-09 10:10:06+07'),

(23, 13, 'USER', 'Ngân sách đào tạo chứng chỉ quốc tế cho mỗi kỹ sư là bao nhiêu?', false, NULL, '2026-09-10 14:05:05+07'),
(24, 13, 'ASSISTANT', 'Công ty tài trợ 100% lệ phí thi và tối đa 30 triệu VNĐ/năm.', false, 430, '2026-09-10 14:05:06+07'),

(25, 14, 'USER', 'Kế hoạch triển khai dịch vụ cho khối ngân hàng?', false, NULL, '2026-09-11 11:15:05+07'),
(26, 14, 'ASSISTANT', 'Ưu tiên mô hình On-Premise và Hybrid Cloud để đáp ứng tiêu chuẩn an toàn thông tin NHNN.', false, 380, '2026-09-11 11:15:06+07'),

(27, 15, 'USER', 'Kết quả benchmark latency sau khi kích hoạt quantization?', false, NULL, '2026-09-12 15:30:05+07'),
(28, 15, 'ASSISTANT', 'Scalar quantization giúp giảm 4x RAM và độ trễ tìm kiếm giảm xuống dưới 400ms.', false, 405, '2026-09-12 15:30:06+07'),

(29, 16, 'USER', 'Các hạng mục sửa đổi chính trong hợp đồng FPT v2?', false, NULL, '2026-09-13 16:20:05+07'),
(30, 16, 'ASSISTANT', 'Bổ sung module phân quyền ngữ cảnh theo phòng ban và tích hợp SSO Google Workspace.', false, 395, '2026-09-13 16:20:06+07'),

(31, 17, 'USER', 'Hệ thống trợ lý AI nội bộ hiện đã index bao nhiêu tài liệu?', false, NULL, '2026-09-14 09:15:05+07'),
(32, 17, 'ASSISTANT', 'Hiện tại đã index thành công toàn bộ 28/28 tài liệu nội bộ của công ty lên Qdrant Vector Cloud.', false, 412, '2026-09-14 09:15:06+07')
ON CONFLICT (id) DO NOTHING;

-- 11. CITATIONS (Trích dẫn nguồn RAG)
INSERT INTO chat_message_citations (id, message_id, file_id, chunk_id, page_label, score) VALUES
(1, 2, 7, 'chunk_vt_p4_01', 'Trang 4-5', 0.93),
(2, 4, 2, 'chunk_hr_p2_03', 'Trang 2', 0.95),
(3, 18, 8, 'chunk_qd_p1_02', 'Trang 3', 0.96),
(4, 28, 8, 'chunk_qd_p4_05', 'Trang 7', 0.94),
(5, 32, 3, 'chunk_arch_p1_01', 'Trang 1', 0.97)
ON CONFLICT (id) DO NOTHING;

-- 13. DOCUMENT CHUNKS
INSERT INTO document_chunks (id, file_id, chunk_index, point_id, content, token_count, page_number, content_hash, is_active, created_at) VALUES
(1, 7, 1, 'chunk_vt_p4_01', 'Điều 4: Quy định thanh toán: Đợt 1 tạm ứng 30% trong 7 ngày làm việc sau khi ký kết. Đợt 2 thanh toán 50% sau khi nghiệm thu giai đoạn thử nghiệm. Đợt 3 quyết toán 20% khi ký biên bản nghiệm thu tổng thể.', 142, 4, 'hash_vt_chunk_01', true, '2026-05-08 09:12:00+07'),
(2, 7, 2, 'chunk_vt_p5_02', 'Điều 8: Phạt vi phạm hợp đồng: Chậm tiến độ do lỗi Bên B phạt 0.5% giá trị phần việc chậm cho mỗi tuần chậm trễ, trần tối đa không quá 8% tổng giá trị hợp đồng.', 115, 5, 'hash_vt_chunk_02', true, '2026-05-08 09:12:05+07'),
(3, 2, 1, 'chunk_hr_p2_03', 'Chương II: Chế độ nghỉ phép năm: Mỗi nhân viên chính thức được hưởng 14 ngày phép năm hưởng lương. Cứ sau mỗi 3 năm làm việc liên tục được cộng thêm 1 ngày phép.', 128, 2, 'hash_hr_chunk_01', true, '2026-02-15 14:10:00+07'),
(4, 2, 2, 'chunk_hr_p3_01', 'Chương III: Bảo hiểm sức khỏe cao cấp Bảo Việt Care / PVI Care áp dụng cho nhân viên toàn thời gian, hỗ trợ 50% chi phí người thân phụ thuộc. Khám sức khỏe định kỳ 1 năm/lần.', 135, 3, 'hash_hr_chunk_02', true, '2026-02-15 14:10:05+07'),
(5, 8, 1, 'chunk_qd_p1_02', 'Đặc tả API Vector Search: Kết nối cluster Qdrant qua cổng gRPC 6334 và REST 6333. Metadata Filtering cho phép lọc RBAC theo department_id và user_permissions.', 160, 3, 'hash_qd_chunk_01', true, '2026-05-18 14:42:00+07'),
(6, 8, 2, 'chunk_qd_p4_05', 'Tối ưu hóa hiệu năng: Áp dụng Scalar Quantization INT8 giúp giảm 75% bộ nhớ RAM lưu trữ vector mà vẫn duy trì độ chính xác truy vấn trên 99%.', 140, 7, 'hash_qd_chunk_02', true, '2026-05-18 14:42:08+07'),
(7, 3, 1, 'chunk_arch_p1_01', 'Kiến trúc Enterprise RAG v1.0: Pipeline xử lý tài liệu gồm trích xuất OCR, chia đoạn ngữ cảnh Chunking, tạo vector embedding và lưu trữ phân quyền bảo mật.', 150, 1, 'hash_arch_chunk_01', true, '2026-03-20 10:18:00+07')
ON CONFLICT (id) DO NOTHING;

-- 14. CHAT MESSAGE FEEDBACKS
INSERT INTO chat_message_feedbacks (id, message_id, user_id, rating, feedback_reason, comment, corrected_answer, created_at) VALUES
(1, 2, 1, 'LIKE', NULL, 'Trích xuất điều khoản thanh toán rất chuẩn xác và rõ ràng!', NULL, '2026-08-27 14:16:00+07'),
(2, 4, 1, 'LIKE', NULL, 'Thông tin bảo hiểm và ngày phép đúng theo quy chế nhân sự mới nhất.', NULL, '2026-08-27 16:46:00+07'),
(3, 32, 1, 'LIKE', NULL, 'Số lượng tài liệu index khớp 100% với database.', NULL, '2026-09-14 09:16:00+07')
ON CONFLICT (id) DO NOTHING;

-- 15. AGENT EXECUTION TRACES
INSERT INTO agent_execution_traces (id, message_id, step_order, agent_name, action_description, input_payload, output_payload, latency_ms, created_at) VALUES
(1, 2, 1, 'INTENT_ROUTER', 'Phân loại ý định người dùng', 'Câu hỏi: Điều khoản thanh toán hợp đồng Viettel', 'Intent: LEGAL_CONTRACT_QUERY, Priority: HIGH', 45, '2026-08-27 14:15:11+07'),
(2, 2, 2, 'SECURITY_GUARD', 'Kiểm tra phân quyền RBAC', 'User: Lê Xuân Công (ADMIN)', 'Quyền hợp lệ: Cho phép truy cập tài liệu RESTRICTED', 20, '2026-08-27 14:15:12+07'),
(3, 2, 3, 'HYBRID_RETRIEVER', 'Truy xuất Qdrant Vector kết hợp từ khóa', 'Vector search top 25 candidates', 'Lấy thành công 6 đoạn trích có cosine score > 0.85', 180, '2026-08-27 14:15:13+07'),
(4, 2, 4, 'COHERE_RERANKER', 'Tái xếp hạng ngữ cảnh Reranking', '6 candidate chunks', 'Top 1: chunk_vt_p4_01 (score 0.93)', 60, '2026-08-27 14:15:14+07'),
(5, 2, 5, 'GEMINI_GENERATOR', 'Tổng hợp câu trả lời có trích dẫn nguồn', 'Prompt + Top Chunks', 'Sinh câu trả lời định dạng Markdown có trích dẫn', 110, '2026-08-27 14:15:16+07')
ON CONFLICT (id) DO NOTHING;

-- 16. AI TOKEN USAGES
INSERT INTO ai_token_usages (id, company_id, department_id, user_id, message_id, model_name, prompt_tokens, completion_tokens, total_tokens, cost_usd, created_at) VALUES
(1, 1, 1, 1, 2, 'gemini-1.5-pro', 1420, 280, 1700, 0.003400, '2026-08-27 14:15:18+07'),
(2, 1, 1, 1, 4, 'gemini-1.5-pro', 1150, 240, 1390, 0.002780, '2026-08-27 16:45:16+07'),
(3, 1, 1, 1, 32, 'gemini-1.5-pro', 890, 160, 1050, 0.002100, '2026-09-14 09:15:06+07')
ON CONFLICT (id) DO NOTHING;

-- 17. UPDATE SEQUENCES TO MATCH MAX INSERTED IDS
SELECT setval(pg_get_serial_sequence('companies', 'id'), COALESCE((SELECT MAX(id) FROM companies), 1));
SELECT setval(pg_get_serial_sequence('departments', 'id'), COALESCE((SELECT MAX(id) FROM departments), 1));
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('folders', 'id'), COALESCE((SELECT MAX(id) FROM folders), 1));
SELECT setval(pg_get_serial_sequence('files', 'id'), COALESCE((SELECT MAX(id) FROM files), 1));
SELECT setval(pg_get_serial_sequence('file_versions', 'id'), COALESCE((SELECT MAX(id) FROM file_versions), 1));
SELECT setval(pg_get_serial_sequence('file_permissions', 'id'), COALESCE((SELECT MAX(id) FROM file_permissions), 1));
SELECT setval(pg_get_serial_sequence('activity_logs', 'id'), COALESCE((SELECT MAX(id) FROM activity_logs), 1));
SELECT setval(pg_get_serial_sequence('chat_sessions', 'id'), COALESCE((SELECT MAX(id) FROM chat_sessions), 1));
SELECT setval(pg_get_serial_sequence('chat_messages', 'id'), COALESCE((SELECT MAX(id) FROM chat_messages), 1));
SELECT setval(pg_get_serial_sequence('chat_message_citations', 'id'), COALESCE((SELECT MAX(id) FROM chat_message_citations), 1));
SELECT setval(pg_get_serial_sequence('document_chunks', 'id'), COALESCE((SELECT MAX(id) FROM document_chunks), 1));
SELECT setval(pg_get_serial_sequence('chat_message_feedbacks', 'id'), COALESCE((SELECT MAX(id) FROM chat_message_feedbacks), 1));
SELECT setval(pg_get_serial_sequence('agent_execution_traces', 'id'), COALESCE((SELECT MAX(id) FROM agent_execution_traces), 1));
SELECT setval(pg_get_serial_sequence('ai_token_usages', 'id'), COALESCE((SELECT MAX(id) FROM ai_token_usages), 1));

-- 18. ACCESS REQUESTS (Yêu cầu cấp quyền chờ Lê Xuân Công duyệt)
INSERT INTO access_requests (id, folder_id, folder_name, file_id, file_name, requester_id, reason, requested_level, status, created_at) VALUES
(1, 105, 'Tài liệu API & Thiết kế Hệ thống', 3, 'Tai_lieu_Kien_truc_He_thong_RAG_Enterprise_v1.pdf', 7, 'Em xin cấp quyền Editor để cập nhật tài liệu kỹ thuật và thiết kế pipeline cho quý 3 ạ.', 'EDITOR', 'PENDING', '2026-08-27 15:30:00+07')
ON CONFLICT (id) DO UPDATE SET
    status = 'PENDING',
    reason = EXCLUDED.reason;

SELECT setval(pg_get_serial_sequence('access_requests', 'id'), COALESCE((SELECT MAX(id) FROM access_requests), 1));
