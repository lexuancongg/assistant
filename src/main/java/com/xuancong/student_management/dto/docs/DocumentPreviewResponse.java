package com.xuancong.student_management.dto.docs;

import com.xuancong.student_management.enums.DocumentStatus;
import com.xuancong.student_management.enums.DocumentType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentPreviewResponse {

    private Long id;

    private String fileName;

    private DocumentType documentType;

    private DocumentStatus status;

    private String summary;

    private LocalDateTime uploadedAt;
}