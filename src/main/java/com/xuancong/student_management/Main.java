package com.xuancong.student_management;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class Main {
    public static void main(String[] args) {
        var a = new BCryptPasswordEncoder();
        String b = a.encode("lexuancong");
        System.out.println(b);
    }
}
