package com.xuancong.student_management.dto.contract;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class AdditionalFeeDTO {

    private String name;

    private BigDecimal amount;

    private String period;
}