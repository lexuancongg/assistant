package com.xuancong.student_management.exception;

import com.xuancong.student_management.utils.MessageUtils;

public class DataIntegrityViolationException extends RuntimeException {
    private final String message;
    public DataIntegrityViolationException(String errorKey, Object ...params) {
        this.message = MessageUtils.getMessage(errorKey, params);
    }

    @Override
    public String getMessage() {
        return this.message;
    }
}
