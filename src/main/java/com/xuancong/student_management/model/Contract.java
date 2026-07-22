package com.xuancong.student_management.model;

import com.xuancong.student_management.enums.ContractStatus;
import com.xuancong.student_management.enums.ContractType;
import com.xuancong.student_management.enums.FeePeriod;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
@Entity
@Table(name = "contracts", indexes = {
        @Index(name = "idx_contract_number", columnList = "contract_number"),
        @Index(name = "idx_contract_status", columnList = "status"),
        @Index(name = "idx_contract_type", columnList = "contract_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    // ==========================================================
    // Contract Information
    // ==========================================================

    // Nullable vì AI có thể không trích xuất được (OCR mờ, viết tay...)
    @Column(name = "contract_number", length = 100)
    private String contractNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", length = 30)
    private ContractType contractType;

    // Dùng chung cho nhiều loại hợp đồng
    @Column(name = "party_a", length = 255)
    private String partyA;

    @Column(name = "party_b", length = 255)
    private String partyB;

    @Column(name = "party_a_representative")
    private String partyARepresentative;

    @Column(name = "party_b_representative")
    private String partyBRepresentative;

    // ==========================================================
    // Contract Timeline
    // ==========================================================

    @Column(name = "signed_date")
    private LocalDate signedDate;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "duration_months")
    private Integer durationMonths;

    @Column(name = "auto_renew")
    private Boolean autoRenew;

    @Column(name = "notice_days")
    private Integer noticeDays;

    // ==========================================================
    // Financial Information
    // ==========================================================

    // Khoản tiền định kỳ chính (ví dụ: tiền thuê, lương...)
    @Column(name = "recurring_amount", precision = 18, scale = 2)
    private BigDecimal recurringAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurring_period", length = 20)
    private FeePeriod recurringPeriod;

    // Tiền đặt cọc
    @Column(name = "deposit", precision = 18, scale = 2)
    private BigDecimal deposit;

    // Tổng giá trị hợp đồng
    @Column(name = "total_contract_value", precision = 18, scale = 2)
    private BigDecimal totalContractValue;

    @Column(length = 10)
    private String currency;

    @Lob
    @Column(name = "payment_terms")
    private String paymentTerms;

    @Builder.Default
    @OneToMany(mappedBy = "contract",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY)
    private List<ContractFee> additionalFees = new ArrayList<>();

    // ==========================================================
    // Workflow & AI
    // ==========================================================

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private ContractStatus status = ContractStatus.PENDING_REVIEW;

    // Độ tin cậy AI khi trích xuất (0.0 - 1.0)
    @Column(name = "extraction_confidence")
    private Double extractionConfidence;

    // AI đánh giá mức độ rủi ro (0 - 100)
    @Column(name = "risk_score")
    private Integer riskScore;

    // Cần người dùng kiểm tra lại
    @Builder.Default
    @Column(name = "needs_review", nullable = false)
    private Boolean needsReview = true;

    // ==========================================================
    // Helper Methods
    // ==========================================================

    public void addFee(ContractFee fee) {
        fee.setContract(this);
        this.additionalFees.add(fee);
    }
}