package com.xuancong.student_management.utils;

import org.slf4j.helpers.FormattingTuple;
import org.slf4j.helpers.MessageFormatter;

import java.util.Locale;
import java.util.MissingResourceException;
import java.util.ResourceBundle;

public class MessageUtils {
    private static final ResourceBundle messageBundle =
            ResourceBundle.getBundle("messages.messages", Locale.getDefault());

    public static String getMessage(String errorKey, Object ... params) {
        String message ;
        try {
            message = messageBundle.getString(errorKey);
        }catch (MissingResourceException e) {
            message = errorKey;
        }
        FormattingTuple formattingTuple = MessageFormatter.arrayFormat(message, params);
        return formattingTuple.getMessage();

    }
}
