package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.docs.ForecastResponse;
import com.xuancong.student_management.dto.docs.MonthlyTotalResponse;
import com.xuancong.student_management.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/contracts/monthly-totals")
    public ResponseEntity<List<MonthlyTotalResponse>> getContractMonthlyTotals(
            @RequestParam(name = "monthsBack", defaultValue = "24") int monthsBack) {
        List<MonthlyTotalResponse> resp = analyticsService.getContractMonthlyTotals(monthsBack);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/contracts/forecast")
    public ResponseEntity<ForecastResponse> forecastContractTotals(
            @RequestParam(name = "monthsBack", defaultValue = "24") int monthsBack,
            @RequestParam(name = "horizon", defaultValue = "6") int horizon) {
        ForecastResponse resp = analyticsService.forecastContractTotals(monthsBack, horizon);
        return ResponseEntity.ok(resp);
    }
}
