package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.activity.ActivityLogResponse;
import com.xuancong.student_management.service.ActivityLogManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogManagementService activityLogManagementService;

    @GetMapping
    public ResponseEntity<List<ActivityLogResponse>> getAll() {
        return ResponseEntity.ok(activityLogManagementService.getAll());
    }
}
