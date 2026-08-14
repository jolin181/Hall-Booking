package com.hallbooking.repository;

import com.hallbooking.entity.Booking;
import com.hallbooking.entity.Hall;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * Overlap detection query: finds ACTIVE bookings for the same hall/date that overlap with the given time range.
     * Used inside a PESSIMISTIC_WRITE transaction to prevent race conditions.
     */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.hall.id = :hallId
          AND b.eventDate = :date
          AND b.status = :status
          AND b.startTime < :endTime
          AND b.endTime > :startTime
        """)
    List<Booking> findOverlappingBookings(
            @Param("hallId") Long hallId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("status") Booking.BookingStatus status
    );

    @Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.hall
        JOIN FETCH b.bookedBy
        LEFT JOIN FETCH b.cancelledBy
        ORDER BY b.eventDate DESC, b.startTime DESC
        """)
    List<Booking> findAllWithDetails();

    @Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.hall
        JOIN FETCH b.bookedBy
        LEFT JOIN FETCH b.cancelledBy
        WHERE b.bookedBy.id = :userId
        ORDER BY b.eventDate DESC, b.startTime DESC
        """)
    List<Booking> findByBookedByIdWithDetails(@Param("userId") Long userId);

    @Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.hall
        JOIN FETCH b.bookedBy
        LEFT JOIN FETCH b.cancelledBy
        WHERE b.hall.id = :hallId
          AND b.eventDate = :date
          AND b.status = :status
        ORDER BY b.startTime ASC
        """)
    List<Booking> findActiveByHallAndDate(
            @Param("hallId") Long hallId,
            @Param("date") LocalDate date,
            @Param("status") Booking.BookingStatus status
    );

    @Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.hall
        JOIN FETCH b.bookedBy
        LEFT JOIN FETCH b.cancelledBy
        WHERE b.status = :status
          AND b.eventDate = :date
        ORDER BY b.hall.name ASC, b.startTime ASC
        """)
    List<Booking> findActiveOnDate(
            @Param("date") LocalDate date,
            @Param("status") Booking.BookingStatus status
    );

    @Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.hall
        JOIN FETCH b.bookedBy
        LEFT JOIN FETCH b.cancelledBy
        WHERE b.hall.id = :hallId
          AND b.status = :status
          AND b.eventDate >= :fromDate
        ORDER BY b.eventDate ASC, b.startTime ASC
        """)
    List<Booking> findUpcomingByHall(
            @Param("hallId") Long hallId,
            @Param("fromDate") LocalDate fromDate,
            @Param("status") Booking.BookingStatus status
    );

    Optional<Booking> findById(Long id);

    boolean existsByHallIdAndStatus(Long hallId, Booking.BookingStatus status);
}
