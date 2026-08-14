package com.hallbooking.repository;

import com.hallbooking.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("""
        SELECT n FROM Notification n
        JOIN FETCH n.relatedBooking rb
        JOIN FETCH rb.hall
        WHERE n.user.id = :userId
        ORDER BY n.createdAt DESC
        """)
    List<Notification> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    long countByUserIdAndIsReadFalse(Long userId);
}
