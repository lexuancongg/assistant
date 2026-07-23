    package com.xuancong.student_management.model;
    
    
    import jakarta.persistence.*;
    import lombok.*;
    
    import java.time.LocalDateTime;
    @Entity
    @Table(name = "chat_sessions")
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public class ChatSession extends BaseAuditEntity {
    
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;
    
        /**
         * Người chat
         */
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private User user;
    
        /**
         * Null nếu chat AI chung
         * Có giá trị nếu chat với document
         */
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "document_id")
        private Document document;

        @Column(name = "assistant_persona", length = 100)
        private String assistantPersona;

        @Builder.Default
        @Column(name = "favorite")
        private Boolean favorite = false;

        /**
         * Tiêu đề cuộc hội thoại
         */
        @Column(nullable = false, length = 255)
        private String title;
    }