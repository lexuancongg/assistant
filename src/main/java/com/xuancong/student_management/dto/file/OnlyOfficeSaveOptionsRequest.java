package com.xuancong.student_management.dto.file;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnlyOfficeSaveOptionsRequest {
    private String saveMode; // "OVERWRITE" | "NEW_VERSION" | "DISCARD"
    private String changeDescription;
}
