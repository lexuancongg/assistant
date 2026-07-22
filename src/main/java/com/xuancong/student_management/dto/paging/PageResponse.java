package com.xuancong.student_management.dto.paging;

import lombok.*;

import java.util.List;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    private List<T> data;
    private long totalElements;
    private int totalPages;
    private boolean isLast;
}