package com.xuancong.student_management.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.xuancong.student_management.enums.FeePeriod;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "contract_fees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractFee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    @JsonIgnore
    private Contract contract;

    @Column(length = 255, nullable = false)
    private String name; // vd: "Phí dịch vụ quản lý", "Phí lắp đặt"

    @Column(precision = 18, scale = 2, nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private FeePeriod period; // MONTHLY, QUARTERLY, YEARLY, ONE_TIME
}