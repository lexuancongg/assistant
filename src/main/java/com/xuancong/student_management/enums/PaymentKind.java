package com.xuancong.student_management.enums;

public enum PaymentKind {
    RECURRING,  // khoản định kỳ: giá thuê/tháng, lương/tháng, phí dịch vụ/tháng
    MILESTONE,  // khoản theo mốc: đặt cọc 30%, giao hàng 40%, nghiệm thu 30%
    ONE_TIME,   // khoản 1 lần: phí lắp đặt, phí setup
    DEPOSIT     // tiền cọc — không tính vào totalContractValue vì được hoàn trả
}