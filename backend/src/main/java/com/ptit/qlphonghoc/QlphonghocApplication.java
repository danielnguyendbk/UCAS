package com.ptit.qlphonghoc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class QlphonghocApplication {

    public static void main(String[] args) {
        SpringApplication.run(QlphonghocApplication.class, args);
    }
}

