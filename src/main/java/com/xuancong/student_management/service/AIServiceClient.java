package com.xuancong.student_management.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xuancong.student_management.dto.chat.RagRequest;
import com.xuancong.student_management.dto.chat.RagResponse;
import com.xuancong.student_management.dto.chat.SearchRequest;
import com.xuancong.student_management.dto.chat.SearchResponse;
import com.xuancong.student_management.dto.client.ExtractRequest;
import com.xuancong.student_management.dto.client.ExtractResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIServiceClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    @Value("${ai.service.url:http://127.0.0.1:8000}")
    private String aiServiceUrl;

    public ExtractResponse extract(ExtractRequest request) {
        try {
            log.info("AI request = {}", objectMapper.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            log.error("Cannot convert request to JSON", e.getMessage());
        }
        try {
            return restClient.post()
                    .uri(aiServiceUrl + "/api/v1/extract")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(ExtractResponse.class);

        } catch (RestClientException e) {
            throw new RuntimeException("Call AI extract service failed: " + e.getMessage(), e);
        }
    }

    public RagResponse ask(RagRequest request) {
        try {
            log.info("AI ask request = {}", objectMapper.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            log.error("Cannot convert request to JSON", e.getMessage());
        }
        try {
            return restClient.post()
                    .uri(aiServiceUrl + "/api/v1/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(RagResponse.class);
        } catch (RestClientException e) {
            throw new RuntimeException("Call AI chat service failed: " + e.getMessage(), e);
        }
    }

    public SearchResponse search(SearchRequest request) {
        try {
            log.info("AI semantic search request = {}", objectMapper.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            log.error("Cannot convert request to JSON", e.getMessage());
        }
        try {
            return restClient.post()
                    .uri(aiServiceUrl + "/api/v1/search")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(SearchResponse.class);
        } catch (RestClientException e) {
            throw new RuntimeException("Call AI search service failed: " + e.getMessage(), e);
        }
    }

    public com.xuancong.student_management.dto.docs.ForecastResponse forecastSeries(java.util.List<com.xuancong.student_management.dto.docs.MonthlyTotalResponse> history, int horizonMonths) {
        try {
            // build request payload
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            java.util.List<java.util.Map<String, Object>> series = new java.util.ArrayList<>();
            for (com.xuancong.student_management.dto.docs.MonthlyTotalResponse m : history) {
                java.util.Map<String, Object> row = new java.util.HashMap<>();
                // convert period YYYY-MM to ds YYYY-MM-01
                String ds = m.getPeriod() + "-01";
                row.put("ds", ds);
                row.put("y", m.getTotalValue() != null ? m.getTotalValue().doubleValue() : 0.0);
                series.add(row);
            }
            payload.put("series", series);
            payload.put("horizon_months", horizonMonths);

            return restClient.post()
                    .uri(aiServiceUrl + "/api/v1/ml/forecast")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(com.xuancong.student_management.dto.docs.ForecastResponse.class);
        } catch (RestClientException e) {
            throw new RuntimeException("Call AI ML forecast service failed: " + e.getMessage(), e);
        }
    }
}
