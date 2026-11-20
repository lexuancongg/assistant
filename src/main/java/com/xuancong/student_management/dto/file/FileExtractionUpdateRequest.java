package com.xuancong.student_management.dto.file;

import lombok.Data;
import java.util.Map;

@Data
public class FileExtractionUpdateRequest {
    private String documentType;
    private String summary;
    private Map<String, Object> metadata;
}
