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
public class OverviewResponse {
    private String summary;
    private List<String> suggestedQuestions;
}
