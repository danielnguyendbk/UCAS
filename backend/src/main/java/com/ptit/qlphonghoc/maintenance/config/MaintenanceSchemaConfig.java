package com.ptit.qlphonghoc.maintenance.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class MaintenanceSchemaConfig {
    // Runtime schema migration is intentionally disabled.
    // The current MySQL schema is managed outside application startup.
}
