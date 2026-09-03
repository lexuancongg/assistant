package com.xuancong.student_management.dto.docs;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MonthlyTotalResponse {

    @JsonAlias({"ds", "period"})
    private String period; // e.g., 2026-08

    @JsonAlias({"y", "totalValue", "total"})
    private BigDecimal totalValue;

    private Long count;

    private Double lower;

    private Double upper;

    public MonthlyTotalResponse(String period, BigDecimal totalValue, Long count) {
        this.period = period;
        this.totalValue = totalValue;
        this.count = count;
    }
}
