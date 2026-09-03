import type {
    ActivityLogItem,
    ChatMessage,
    ChatSession,
    FileItem,
    FolderNode,
    PermissionEntry,
    TrashItem,
    UploadingFile,
    UserItem,
} from './types';

// ── Người dùng hiện tại (fake auth) ──
export const CURRENT_USER = {
    name: 'Nguyễn Văn A',
    email: 'admin@rikai.com',
    role: 'Admin',
    company: 'Rikai Technology',
};

// ── Cây thư mục ──
export const FOLDER_TREE: FolderNode[] = [
    {
        id: 'company-docs',
        name: 'Tài liệu công ty',
        children: [
            { id: 'hr', name: 'Nhân sự', children: [] },
            { id: 'finance', name: 'Tài chính', children: [] },
            {
                id: 'projects',
                name: 'Dự án',
                children: [
                    { id: 'project-a', name: 'Dự án A', children: [] },
                    { id: 'project-b', name: 'Dự án B', children: [] },
                ],
            },
        ],
    },
    {
        id: 'contracts',
        name: 'Hợp đồng',
        children: [
            { id: 'contracts-2024', name: 'Năm 2024', children: [] },
            { id: 'contracts-2025', name: 'Năm 2025', children: [] },
        ],
    },
    { id: 'reports', name: 'Báo cáo', children: [] },
    { id: 'personal', name: 'Tài liệu cá nhân', children: [] },
];

// ── Danh sách file ──
export const FILES: FileItem[] = [
    {
        id: 'file-1',
        name: 'Hợp đồng lao động Trần Văn Nam.pdf',
        type: 'pdf',
        owner: 'Phòng Nhân sự',
        uploadedByName: 'Nguyễn Văn A',
        uploadedByEmail: 'admin@rikai.com',
        updatedAt: '16/05/2024 10:30',
        size: '2.4 MB',
        tags: ['Hợp đồng', 'Nhân sự', 'Quan trọng'],
        path: '/hop-dong/2024/HDLD_TranVanNam.pdf',
    },
    {
        id: 'file-2',
        name: 'Báo cáo tài chính Q1.xlsx',
        type: 'xlsx',
        owner: 'Phòng Tài chính',
        uploadedByName: 'Trần Văn Minh',
        uploadedByEmail: 'minh.tran@rikai.com',
        updatedAt: '15/05/2024 09:15',
        size: '1.8 MB',
        tags: ['Báo cáo', 'Tài chính'],
    },
    {
        id: 'file-3',
        name: 'Hợp đồng khách hàng A.docx',
        type: 'docx',
        owner: 'Phòng Kinh doanh',
        uploadedByName: 'Lê Thị Thu',
        uploadedByEmail: 'thu.le@rikai.com',
        updatedAt: '14/05/2024 16:45',
        size: '880 KB',
        tags: ['Hợp đồng'],
    },
    {
        id: 'file-4',
        name: 'Chính sách bảo mật.pdf',
        type: 'pdf',
        owner: 'Phòng IT',
        uploadedByName: 'Phạm Đức Anh',
        uploadedByEmail: 'anh.pham@rikai.com',
        updatedAt: '14/05/2024 14:20',
        size: '1.2 MB',
        tags: ['Chính sách'],
    },
    {
        id: 'file-5',
        name: 'Kế hoạch dự án B.pptx',
        type: 'pptx',
        owner: 'Phòng Dự án',
        uploadedByName: 'Vũ Thị Lan',
        uploadedByEmail: 'lan.vu@rikai.com',
        updatedAt: '13/05/2024 11:30',
        size: '5.1 MB',
        tags: ['Dự án'],
    },
    {
        id: 'file-6',
        name: 'Hướng dẫn sử dụng.txt',
        type: 'txt',
        owner: 'Nguyễn Văn A',
        uploadedByName: 'Nguyễn Văn A',
        uploadedByEmail: 'admin@rikai.com',
        updatedAt: '12/05/2024 08:20',
        size: '45 KB',
    },
];

// ── 1. Dashboard: thống kê tổng quan ──
export const DASHBOARD_STATS = [
    { label: 'Tổng file', value: '1,248', delta: '+12% so với tuần trước' },
    { label: 'Tổng dung lượng', value: '24.6 GB', delta: '+8% so với tuần trước' },
    { label: 'Tài liệu đã xử lý AI', value: '1,028', delta: '+16% so với tuần trước' },
    { label: 'Người dùng', value: '86', delta: '+5% so với tuần trước' },
];

export const UPLOAD_TREND = [
    { date: '18/05', value: 120 },
    { date: '19/05', value: 190 },
    { date: '20/05', value: 150 },
    { date: '21/05', value: 90 },
    { date: '22/05', value: 160 },
    { date: '23/05', value: 130 },
    { date: '24/05', value: 200 },
];

export const FILE_TYPE_BREAKDOWN = [
    { label: 'Hợp đồng', value: 35, color: '#6366f1' },
    { label: 'Báo cáo', value: 26, color: '#3b82f6' },
    { label: 'Hóa đơn', value: 20, color: '#22c55e' },
    { label: 'Email', value: 10, color: '#f59e0b' },
    { label: 'Khác', value: 9, color: '#d1d5db' },
];

// ── 2. AI Assistant ──
export const CHAT_SESSIONS: ChatSession[] = [
    { id: 'chat-1', title: 'Tóm tắt hợp đồng lao độ...' },
    { id: 'chat-2', title: 'Điều khoản thanh toán trong...' },
    { id: 'chat-3', title: 'Tìm báo cáo doanh thu Q1...' },
    { id: 'chat-4', title: 'So sánh 2 hợp đồng...' },
    { id: 'chat-5', title: 'Những điều khoản cần chú ý...' },
];

export const CHAT_MESSAGES: ChatMessage[] = [
    {
        id: 'm1',
        role: 'user',
        content: 'Tóm tắt nội dung hợp đồng lao động với Trần Văn Nam',
    },
    {
        id: 'm2',
        role: 'assistant',
        content: 'Tóm tắt hợp đồng lao động với Trần Văn Nam:',
        summaryPoints: [
            'Loại hợp đồng: Hợp đồng lao động không xác định thời hạn',
            'Chức danh: Kỹ sư phần mềm',
            'Ngày bắt đầu: 01/06/2024',
            'Mức lương: 25,000,000 VNĐ/tháng',
            'Thời gian thử việc: 02 tháng',
            'Điều khoản chính: Cam kết bảo mật thông tin, Không cạnh tranh trong 2 năm, Chấm dứt hợp đồng: báo trước 30 ngày',
        ],
        sourceFile: 'HDLD_TranVanNam.pdf',
        sourcePages: 'Trang 1-5',
    },
];

// ── 3. Upload & xử lý tài liệu ──
export const UPLOADING_FILES: UploadingFile[] = [
    { id: 'u1', name: 'Báo cáo tài chính Q1.pdf', size: '2.4 MB', progress: 60, status: 'uploading' },
    { id: 'u2', name: 'Hợp đồng hợp tác.docx', size: '1.8 MB', progress: 30, status: 'uploading' },
];

export const UPLOADED_DONE_FILES: UploadingFile[] = [
    { id: 'u3', name: 'Chính sách bảo mật.pdf', size: '1.2 MB', progress: 100, status: 'done' },
];

// ── 5. Phân quyền ──
export const PERMISSION_ENTRIES: PermissionEntry[] = [
    {
        id: 'p1',
        subjectType: 'group',
        name: 'Nhóm Nhân sự',
        subtitle: 'nhansu@rikai.com',
        level: 'Editor',
        avatarInitial: 'N',
        avatarColor: 'bg-indigo-100 text-indigo-600',
    },
    {
        id: 'p2',
        subjectType: 'user',
        name: 'Nguyễn Thị Hoa',
        subtitle: 'hoa.nguyen@rikai.com',
        level: 'Viewer',
        avatarInitial: 'H',
        avatarColor: 'bg-blue-100 text-blue-600',
    },
    {
        id: 'p3',
        subjectType: 'user',
        name: 'Trần Văn Minh',
        subtitle: 'minh.tran@rikai.com',
        level: 'Viewer',
        avatarInitial: 'M',
        avatarColor: 'bg-purple-100 text-purple-600',
    },
    {
        id: 'p4',
        subjectType: 'user',
        name: 'Phạm Đức Anh',
        subtitle: 'anh.pham@rikai.com',
        level: 'Viewer',
        avatarInitial: 'A',
        avatarColor: 'bg-rose-100 text-rose-600',
    },
];

// ── 6. Quản lý người dùng ──
export const USERS: UserItem[] = [
    { id: 'u1', name: 'Nguyễn Văn A', email: 'admin@rikai.com', role: 'Admin', status: 'active', avatarInitial: 'A', avatarColor: 'bg-indigo-100 text-indigo-600' },
    { id: 'u2', name: 'Nguyễn Thị Hoa', email: 'hoa.nguyen@rikai.com', role: 'Manager', status: 'active', avatarInitial: 'H', avatarColor: 'bg-blue-100 text-blue-600' },
    { id: 'u3', name: 'Trần Văn Minh', email: 'minh.tran@rikai.com', role: 'User', status: 'active', avatarInitial: 'M', avatarColor: 'bg-purple-100 text-purple-600' },
    { id: 'u4', name: 'Phạm Đức Anh', email: 'anh.pham@rikai.com', role: 'User', status: 'active', avatarInitial: 'A', avatarColor: 'bg-rose-100 text-rose-600' },
    { id: 'u5', name: 'Vũ Thị Lan', email: 'lan.vu@rikai.com', role: 'User', status: 'locked', avatarInitial: 'L', avatarColor: 'bg-amber-100 text-amber-600' },
];

// ── 7. Thùng rác ──
export const TRASH_ITEMS: TrashItem[] = [
    { id: 't1', name: 'Báo cáo cũ 2023.pdf', deletedBy: 'Nguyễn Văn A', deletedAt: '15/05/2024 14:20', size: '2.1 MB' },
    { id: 't2', name: 'Hợp đồng cũ.docx', deletedBy: 'Trần Văn Minh', deletedAt: '14/05/2024 09:15', size: '1.8 MB' },
    { id: 't3', name: 'Tài liệu thử nghiệm.pdf', deletedBy: 'Phạm Đức Anh', deletedAt: '13/05/2024 16:45', size: '1.2 MB' },
];

// ── 8. Nhật ký hoạt động ──
export const ACTIVITY_LOG: ActivityLogItem[] = [
    { id: 'a1', actorName: 'Nguyễn Văn A', action: 'đã upload file', targetName: 'Hợp đồng lao động Trần Văn Nam.pdf', timestamp: '16/05/2024 10:30', type: 'upload' },
    { id: 'a2', actorName: 'Nguyễn Thị Hoa', action: 'đã chia sẻ file', targetName: 'Báo cáo tài chính Q1.pdf', timestamp: '16/05/2024 09:15', type: 'share' },
    { id: 'a3', actorName: 'Trần Văn Minh', action: 'đã tải xuống file', targetName: 'Chính sách bảo mật.pdf', timestamp: '15/05/2024 16:20', type: 'download' },
    { id: 'a4', actorName: 'Phạm Đức Anh', action: 'đã xóa file', targetName: 'Tài liệu cũ.pdf', timestamp: '15/05/2024 14:10', type: 'delete' },
    { id: 'a5', actorName: 'Vũ Thị Lan', action: 'đã cập nhật thông tin file', targetName: 'Hợp đồng hợp tác.docx', timestamp: '14/05/2024 11:30', type: 'update' },
];
