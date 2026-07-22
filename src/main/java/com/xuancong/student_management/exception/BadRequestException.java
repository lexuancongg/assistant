package com.xuancong.student_management.exception;

import com.xuancong.student_management.utils.MessageUtils;

public class BadRequestException extends RuntimeException{
    private final String message;
    public BadRequestException(String message, Object ...params) {
        this.message = MessageUtils.getMessage(message, params);

    }
    @Override
    public String getMessage() {
        return message;
    }
}
