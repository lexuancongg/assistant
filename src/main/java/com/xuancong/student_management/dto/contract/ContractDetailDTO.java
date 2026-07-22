package com.xuancong.student_management.dto.contract;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ContractDetailDTO {
    private String contractNumber;
    private String partyA;
    private String partyB;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer durationMonths;
    private BigDecimal recurringAmount;
    private String recurringPeriod;
    private BigDecimal deposit;
    private BigDecimal totalContractValue;
    private String currency;
    private String contractType;
    private String paymentTerms;
    private String status;
    private Boolean needsReview;
    private List<AdditionalFeeDTO> additionalFees;
}