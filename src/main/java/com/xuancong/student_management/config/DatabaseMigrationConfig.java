package com.xuancong.student_management.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationConfig implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE folder_permissions DROP CONSTRAINT IF EXISTS folder_permissions_level_check; " +
                    "ALTER TABLE folder_permissions ADD CONSTRAINT folder_permissions_level_check CHECK (level::text = ANY (ARRAY['VIEWER'::character varying::text, 'EDITOR'::character varying::text, 'DENY'::character varying::text]));");
            jdbcTemplate.execute("ALTER TABLE file_permissions DROP CONSTRAINT IF EXISTS file_permissions_level_check; " +
                    "ALTER TABLE file_permissions ADD CONSTRAINT file_permissions_level_check CHECK (level::text = ANY (ARRAY['VIEWER'::character varying::text, 'EDITOR'::character varying::text, 'DENY'::character varying::text]));");
            jdbcTemplate.execute("DROP TABLE IF EXISTS ai_personas CASCADE;");
            log.info("Successfully ensured folder_permissions and file_permissions level CHECK constraints allow DENY, and cleaned ai_personas table.");
        } catch (Exception e) {
            log.warn("Database constraint check adjustment skipped: {}", e.getMessage());
        }
    }
}
