package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.company.CompanyInfoResponse;
import com.xuancong.student_management.dto.company.CompanyUpdateRequest;
import com.xuancong.student_management.entity.Company;
import com.xuancong.student_management.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private static final Long DEFAULT_COMPANY_ID = 1L;
    private final CompanyRepository companyRepository;

    public CompanyInfoResponse get() {
        Company c = getOrThrow();
        return toResponse(c);
    }

    public CompanyInfoResponse update(CompanyUpdateRequest request) {
        Company c = getOrThrow();
        if (request.name() != null) c.setName(request.name());
        if (request.email() != null) c.setEmail(request.email());
        if (request.phone() != null) c.setPhone(request.phone());
        if (request.address() != null) c.setAddress(request.address());
        return toResponse(companyRepository.save(c));
    }

    private Company getOrThrow() {
        return companyRepository.findById(DEFAULT_COMPANY_ID)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));
    }

    private CompanyInfoResponse toResponse(Company c) {
        return new CompanyInfoResponse(
                c.getId(), c.getName(), c.getEmail(),
                c.getPhone(), c.getAddress(), c.getStorageQuotaGb());
    }
}
