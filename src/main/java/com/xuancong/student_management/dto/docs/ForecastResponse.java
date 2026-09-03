package com.xuancong.student_management.dto.docs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForecastResponse {
    private List<MonthlyTotalResponse> history;
    private List<MonthlyTotalResponse> forecast;
}
