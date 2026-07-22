package com.xuancong.student_management.model;

import com.xuancong.student_management.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
        name = "invoice",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_invoice_number_supplier",
                columnNames = {"invoice_number", "supplier"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "invoice_number", nullable = false, length = 100)
    private String invoiceNumber;

    @Column(length = 255)
    private String supplier;

    @Column(name = "tax_code", length = 20)
    private String taxCode;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(precision = 18, scale = 2)
    private BigDecimal vat;

    @Column(name = "total_amount", precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(length = 10)
    private String currency;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private InvoiceStatus status = InvoiceStatus.PENDING;
}