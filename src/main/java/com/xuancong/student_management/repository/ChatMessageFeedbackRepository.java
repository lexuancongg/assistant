package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.ChatMessageFeedback;
import com.xuancong.student_management.entity.enums.FeedbackRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatMessageFeedbackRepository extends JpaRepository<ChatMessageFeedback, Long> {
    Optional<ChatMessageFeedback> findByMessage_Id(Long messageId);
    List<ChatMessageFeedback> findByMessage_IdIn(Collection<Long> messageIds);
    List<ChatMessageFeedback> findByUser_IdOrderByCreatedAtDesc(Long userId);
    long countByRating(FeedbackRating rating);
    void deleteByMessage_IdIn(Collection<Long> messageIds);

    @Query("SELECT COUNT(f) FROM ChatMessageFeedback f WHERE f.rating = com.xuancong.student_management.entity.enums.FeedbackRating.LIKE")
    long countLikes();

    @Query("SELECT COUNT(f) FROM ChatMessageFeedback f WHERE f.rating = com.xuancong.student_management.entity.enums.FeedbackRating.DISLIKE")
    long countDislikes();
}
