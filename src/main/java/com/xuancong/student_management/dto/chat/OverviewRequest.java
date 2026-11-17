package com.xuancong.student_management.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverviewRequest {
    private String fileId;
    private String folderId;
    private Long documentId;
    private List<String> allowedDocumentIds;
    private String sourceName;
    private Long departmentId;
    private Long companyId;
    private String contextText;
}
