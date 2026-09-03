package com.xuancong.student_management.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final DataSource dataSource;

    @Override
    public void run(String... args) {
        try {
            ClassPathResource resource = new ClassPathResource("seed_data.sql");
            if (resource.exists()) {
                log.info("Populating database with rich seed data from seed_data.sql...");
                ResourceDatabasePopulator populator = new ResourceDatabasePopulator(resource);
                populator.setContinueOnError(true);
                populator.setIgnoreFailedDrops(true);
                populator.execute(dataSource);
                log.info("Database seed data populated successfully!");
            }
        } catch (Exception e) {
            log.warn("Database seeder skipped or error: {}", e.getMessage());
        }
    }
}