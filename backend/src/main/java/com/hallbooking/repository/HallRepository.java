package com.hallbooking.repository;

import com.hallbooking.entity.Hall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hallbooking.entity.Booking;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface HallRepository extends JpaRepository<Hall, Long> {

    List<Hall> findByIsDeletedFalse();

    List<Hall> findByCapacityGreaterThanEqualOrderByCapacityAsc(Integer capacity);

    /**
     * Returns halls that meet the capacity requirement AND have no overlapping ACTIVE booking.
     */
    @Query("""
        SELECT h FROM Hall h
        WHERE h.capacity >= :capacity
          AND h.isDeleted = false
          AND h.id NOT IN (
              SELECT b.hall.id FROM Booking b
              WHERE b.eventDate = :date
                AND b.status = :status
                AND b.startTime < :endTime
                AND b.endTime > :startTime
          )
        ORDER BY h.capacity ASC
        """)
    List<Hall> findAvailableHalls(
            @Param("capacity") Integer capacity,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("status") Booking.BookingStatus status
    );
}
