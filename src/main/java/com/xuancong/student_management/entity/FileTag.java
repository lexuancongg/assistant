package com.xuancong.student_management.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "file_tags")
@Getter
@Setter
@NoArgsConstructor
@IdClass(FileTag.FileTagId.class)
public class FileTag {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private FileItem file;

    @Id
    @Column(nullable = false, length = 100)
    private String tag;

    /** Khóa chính phức hợp cho FileTag (file_id, tag). */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class FileTagId implements Serializable {
        private UUID file;
        private String tag;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof FileTagId)) return false;
            FileTagId that = (FileTagId) o;
            return Objects.equals(file, that.file) && Objects.equals(tag, that.tag);
        }

        @Override
        public int hashCode() {
            return Objects.hash(file, tag);
        }
    }
}
