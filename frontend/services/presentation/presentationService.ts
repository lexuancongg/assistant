import { PresentationData } from '@/utils/pptxExport';

export interface GenerateSlidesParams {
    topic: string;
    context?: string;
    slideCount?: number;
    targetAudience?: string;
}

class PresentationService {
    private aiUrl = 'http://localhost:8000/api/v1/presentation/generate-slides';

    /**
     * Gọi endpoint Gemini TypeSafe để sinh dữ liệu slide có cấu trúc
     */
    public async generateSlides(params: GenerateSlidesParams): Promise<PresentationData> {
        try {
            const resp = await fetch(this.aiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: params.topic,
                    context: params.context || '',
                    slideCount: params.slideCount || 5,
                    targetAudience: params.targetAudience || 'Hội Đồng Giám Khảo & Ban Giám Đốc Doanh Nghiệp',
                }),
            });

            if (resp.ok) {
                const data: PresentationData = await resp.json();
                return data;
            }
        } catch (err) {
            console.warn('Không thể kết nối Python AI trực tiếp, sử dụng bộ khởi tạo Slide cao cấp dự phòng:', err);
        }

        // Fallback Client-side nếu Python AI chưa bật
        return this.generateFallbackPresentation(params);
    }

    private generateFallbackPresentation(params: GenerateSlidesParams): PresentationData {
        const topic = params.topic || 'Hồ Sơ Đề Xuất Giải Pháp Phần Mềm & Chuyển Đổi Số';
        return {
            presentationTitle: topic,
            subtitle: 'Báo cáo phân tích bài toán, kiến trúc kỹ thuật 4 tầng, lộ trình 12 tuần & dự toán ngân sách',
            author: 'Ban Dự Án Công Nghệ & Giải Pháp AI Doanh Nghiệp',
            targetAudience: params.targetAudience || 'Hội Đồng Giám Khảo & Ban Giám Đốc',
            theme: 'tech_navy',
            slides: [
                {
                    slideNumber: 1,
                    layoutType: 'compare',
                    category: 'BÀI TOÁN & ĐỐI CHIẾU THỰC TRẠNG',
                    title: 'Chuyển Hóa Từ Điểm Nghẽn Thủ Công Sang Tự Động Hóa Thông Minh',
                    subtitle: 'Đối chiếu trực diện giữa tổn thất vận hành hiện hữu và giá trị giải pháp công nghệ mang lại',
                    compareData: [
                        {
                            tag: '🚨 HIỆN TRẠNG (AS-IS)',
                            title: 'Điểm Nghẽn & Thất Thoát Hiện Hữu',
                            points: [
                                '**Thất thoát chi phí:** Chi phí nhiên liệu và hao mòn lãng phí ước tính 12-15% mỗi năm do điều phối lộ trình thủ công.',
                                '**Thời gian chờ tắc nghẽn:** Trung bình 4.5 giờ/chuyến xe tại các điểm trung chuyển do thủ tục đối soát chậm trễ.',
                                '**Rủi ro vi phạm hợp đồng:** Tỷ lệ giao hàng trễ hẹn (SLA Violation) lên tới 18%, gây giảm uy tín doanh nghiệp.',
                                '**Dữ liệu rời rạc:** Thông tin lưu trữ trên các file Excel phân tán, hoàn toàn không có báo cáo thời gian thực cho Ban giám đốc.'
                            ]
                        },
                        {
                            tag: '✨ GIẢI PHÁP ĐỘT PHÁ (TO-BE)',
                            title: 'Mục Tiêu & Nền Tảng Chuyển Đổi Số',
                            points: [
                                '**Tối ưu lộ trình AI:** Thuật toán tự động định tuyến giảm ít nhất 18% quãng đường rỗng và tiết kiệm nhiên liệu.',
                                '**Quy trình số hóa e-POD:** Cắt giảm thời gian chờ từ 4.5 giờ xuống dưới 1.8 giờ nhờ đối soát chứng từ điện tử tức thì.',
                                '**Cam kết SLA vượt bậc:** Nâng tỷ lệ giao nhận hàng chuẩn xác đúng hẹn (OTIF) đạt từ 97.5% trở lên.',
                                '**Báo cáo Dashboard thời gian thực:** Giám sát trực quan 100% đội ngũ, cảnh báo sớm rủi ro qua trợ lý AI Assistant.'
                            ]
                        }
                    ],
                    keyTakeaway: 'Chuyển đổi số từ vận hành thủ công sang nền tảng tập trung là điều kiện tiên quyết để tối ưu chi phí và bứt phá tăng trưởng.'
                },
                {
                    slideNumber: 2,
                    layoutType: 'pillars',
                    category: 'KIẾN TRÚC KỸ THUẬT',
                    title: 'Mô Hình Kiến Trúc Microservices 4 Tầng Chuẩn Enterprise',
                    subtitle: 'Thiết kế module hóa đảm bảo tính mở rộng cao, an ninh bảo mật và khả năng chịu tải cao',
                    pillars: [
                        {
                            badge: 'TẦNG 01: TRẢI NGHIỆM',
                            title: 'Web Portal & Mobile App',
                            techStack: 'Next.js 14, Tailwind CSS, Flutter',
                            highlights: [
                                'Giao diện quản trị Dashboard tương tác cao',
                                'Ứng dụng di động chuyên dụng cho nhân sự hiện trường',
                                'Phân quyền hiển thị theo vai trò (RBAC đa cấp)'
                            ]
                        },
                        {
                            badge: 'TẦNG 02: DỊCH VỤ LÕI',
                            title: 'Core Microservices API',
                            techStack: 'Spring Boot 3, PostgreSQL 16, Redis 7',
                            highlights: [
                                'Xử lý giao dịch phân tán và logic nghiệp vụ lõi',
                                'Bộ nhớ đệm Redis tăng tốc độ truy xuất < 50ms',
                                'Kiểm toán thao tác Audit Logging toàn vẹn'
                            ]
                        },
                        {
                            badge: 'TẦNG 03: TRÍ TUỆ AI',
                            title: 'AI RAG & Analytics Engine',
                            techStack: 'FastAPI, pgvector, Gemini TypeSafe',
                            highlights: [
                                'Hybrid Search (Vector + Keyword) độ chính xác > 92%',
                                'Trợ lý hỏi đáp tài liệu và trích xuất hợp đồng tự động',
                                'Bộ sinh Slide trình chiếu tự động chuẩn PowerPoint'
                            ]
                        },
                        {
                            badge: 'TẦNG 04: HẠ TẦNG & AN NINH',
                            title: 'Cloud DevOps & Security',
                            techStack: 'Docker, Kubernetes, OAuth2, AES-256',
                            highlights: [
                                'Triển khai Container hóa tự động co giãn Auto-scaling',
                                'Mã hóa dữ liệu lưu trữ và truyền tải chuẩn TLS 1.3',
                                'Cam kết độ sẵn sàng dịch vụ đạt 99.95% SLA'
                            ]
                        }
                    ],
                    keyTakeaway: 'Kiến trúc 4 tầng phân tách rành mạch giúp hệ thống sẵn sàng mở rộng quy mô phục vụ hàng nghìn người dùng đồng thời.'
                },
                {
                    slideNumber: 3,
                    layoutType: 'timeline',
                    category: 'LỘ TRÌNH THỰC HIỆN',
                    title: 'Chiến Lược Triển Khai 4 Giai Đoạn Đảm Bảo Go-Live Trong 12 Tuần',
                    subtitle: 'Kiểm soát chặt chẽ tiến độ với các mốc nghiệm thu (Milestones) và sản phẩm bàn giao cụ thể',
                    timelineSteps: [
                        {
                            phaseNumber: '01',
                            phaseName: 'Khảo Sát & Thiết Kế',
                            duration: 'Tuần 1 - 3',
                            keyTasks: [
                                'Khảo sát thực địa và đặc tả chi tiết yêu cầu phần mềm (SRS)',
                                'Thiết kế kiến trúc cơ sở dữ liệu và mô hình phân quyền ACL',
                                'Khởi tạo hạ tầng Kubernetes Cloud và quy trình CI/CD'
                            ],
                            deliverable: 'Tài liệu SRS, Kiến trúc Kỹ thuật & Hạ tầng Staging'
                        },
                        {
                            phaseNumber: '02',
                            phaseName: 'Phát Triển Hệ Thống Lõi',
                            duration: 'Tuần 4 - 8',
                            keyTasks: [
                                'Xây dựng các module nghiệp vụ Backend Spring Boot',
                                'Lập trình Web Portal Next.js và Mobile Application',
                                'Tích hợp hệ thống phân quyền dữ liệu và ghi nhật ký hoạt động'
                            ],
                            deliverable: 'Phiên bản phần mềm Alpha & Bộ tài liệu API Swagger'
                        },
                        {
                            phaseNumber: '03',
                            phaseName: 'Tích Hợp AI & Kiểm Thử',
                            duration: 'Tuần 9 - 11',
                            keyTasks: [
                                'Huấn luyện và tích hợp AI RAG Vector Search & Slide Generator',
                                'Kiểm thử bảo mật, rà soát lỗ hổng an ninh mạng (Penetration Test)',
                                'Tổ chức kiểm thử chấp nhận người dùng (UAT) với 50 người dùng thử'
                            ],
                            deliverable: 'Báo cáo kiểm thử UAT & Biên bản khắc phục lỗi'
                        },
                        {
                            phaseNumber: '04',
                            phaseName: 'Bàn Giao & Go-Live',
                            duration: 'Tuần 12',
                            keyTasks: [
                                'Triển khai hạ tầng Production chịu tải cao đa vùng',
                                'Đào tạo nghiệp vụ cho đội ngũ vận hành và quản trị viên',
                                'Ký biên bản bàn giao chính thức và kích hoạt bảo hành 24/7'
                            ],
                            deliverable: 'Hệ thống Production Go-Live & Bộ tài liệu hướng dẫn'
                        }
                    ],
                    keyTakeaway: 'Mô hình triển khai Agile linh hoạt với nghiệm thu từng chặng giúp kiểm soát tối đa rủi ro trễ tiến độ.'
                },
                {
                    slideNumber: 4,
                    layoutType: 'table',
                    category: 'DỰ TOÁN NGÂN SÁCH',
                    title: 'Bảng Dự Toán Chi Phí & Kế Hoạch Đầu Tư Nguồn Lực',
                    subtitle: 'Ngân sách đầu tư trọn gói được phân bổ minh bạch theo từng cấu phần kỹ thuật và giá trị bàn giao',
                    tableData: {
                        headers: ['Hạng mục đầu tư', 'Phạm vi công việc & Công nghệ', 'Thời gian', 'Dự toán (VNĐ)', 'Tỷ trọng'],
                        rows: [
                            ['1. Phát triển Cốt lõi & Web Portal', 'Xây dựng Microservices Spring Boot & Web Next.js', '8 Tuần', '950.000.000', '51.4%'],
                            ['2. Phân hệ AI RAG & Slide Engine', 'Tích hợp FastAPI, pgvector, Gemini AI Structured Output', '3 Tuần', '380.000.000', '20.5%'],
                            ['3. Ứng dụng Di động Hiện trường', 'Phát triển Mobile App Flutter (iOS & Android)', '4 Tuần', '240.000.000', '13.0%'],
                            ['4. Hạ tầng Cloud, DevOps & Bảo mật', 'Cụm Kubernetes Multi-AZ, Thiết lập CI/CD & SSL/AES', '2 Tuần', '160.000.000', '8.6%'],
                            ['5. Đào tạo, Chuyển giao & Bảo hành', 'Đào tạo người dùng, bàn giao Source Code & Bảo hành 12 tháng', 'Suốt dự án', '120.000.000', '6.5%'],
                            ['TỔNG CỘNG ĐẦU TƯ TRỌN GÓI', 'Toàn bộ giải pháp trọn gói (Đã bao gồm thuế GTGT)', '12 Tuần', '1.850.000.000', '100%']
                        ]
                    },
                    stats: [
                        { label: 'ROI KỲ VỌNG', value: '+42%', subtext: 'Tỷ suất sinh lời sau 12 tháng' },
                        { label: 'THU HỒI VỐN', value: '9 Tháng', subtext: 'Thời gian hoàn vốn đầu tư' },
                        { label: 'TIẾT KIỆM HÀNG NĂM', value: '750 Triệu', subtext: 'Cắt giảm chi phí thủ công' }
                    ],
                    keyTakeaway: 'Phương án đầu tư mang tính tối ưu hóa chi phí với thời gian thu hồi vốn dưới 1 năm nhờ cắt giảm lãng phí vận hành.'
                },
                {
                    slideNumber: 5,
                    layoutType: 'metrics',
                    category: 'HIỆU QUẢ KINH TẾ (ROI)',
                    title: 'Chỉ Số Tác Động Thực Tế & Cam Kết Dịch Vụ Cấp Doanh Nghiệp',
                    subtitle: 'Các chỉ số đo lường hiệu quả định lượng sau khi hệ thống chính thức đi vào vận hành',
                    stats: [
                        { label: 'TIẾT KIỆM NHIÊN LIỆU', value: '-18%', subtext: 'Tối ưu lộ trình AI điều phối' },
                        { label: 'GIAO HÀNG ĐÚNG HẸN', value: '97.5%', subtext: 'Nâng cao uy tín thương hiệu' },
                        { label: 'CẮT GIẢM THỦ TỤC', value: '-60%', subtext: 'Số hóa quy trình e-POD' },
                        { label: 'ĐỘ SẴN SÀNG UPTIME', value: '99.95%', subtext: 'Cam kết vận hành SLA 24/7' }
                    ],
                    bulletPoints: [
                        '**Cam kết bảo hành chất lượng:** Miễn phí bảo hành và vá lỗi toàn diện trong vòng 12 tháng sau khi Go-Live.',
                        '**Đội ngũ ứng trực 24/7:** Phản hồi sự cố nghiêm trọng trong vòng 30 phút, đảm bảo hệ thống vận hành liên tục không gián đoạn.',
                        '**Chuyển giao 100% tài sản:** Bàn giao toàn bộ Source Code, tài liệu thiết kế và quy trình DevOps cho doanh nghiệp tự chủ công nghệ.'
                    ],
                    keyTakeaway: 'Hệ thống không chỉ giải quyết bài toán hiện tại mà còn là nền tảng chiến lược giúp doanh nghiệp dẫn đầu trong kỷ nguyên số.'
                }
            ],
        };
    }
}

export default new PresentationService();
