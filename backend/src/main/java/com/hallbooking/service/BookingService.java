package com.hallbooking.service;

import com.hallbooking.dto.BookingDto;
import com.hallbooking.dto.BookingRequest;
import com.hallbooking.dto.HallDto;
import com.hallbooking.dto.UserDto;
import com.hallbooking.entity.Booking;
import com.hallbooking.entity.Hall;
import com.hallbooking.entity.Notification;
import com.hallbooking.entity.User;
import com.hallbooking.exception.SlotConflictException;
import com.hallbooking.repository.BookingRepository;
import com.hallbooking.repository.HallRepository;
import com.hallbooking.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final HallRepository hallRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EntityManager entityManager;

    @Transactional
    public BookingDto createBooking(BookingRequest request, User currentUser) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        // Validate booking is not in the past
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        if (request.getEventDate().isBefore(today)) {
            throw new IllegalArgumentException("Cannot book a hall for a past date");
        }
        if (request.getEventDate().isEqual(today) && !request.getStartTime().isAfter(now)) {
            throw new IllegalArgumentException("Cannot book a hall for past time. Please select a future time.");
        }

        LocalDate maxDate = LocalDate.now().plusYears(1);
        if (request.getEventDate().isAfter(maxDate)) {
            throw new IllegalArgumentException("Cannot book a hall more than 1 year in advance");
        }

        // Pessimistic lock on the Hall row to prevent concurrent double-booking
        Hall hall = entityManager.find(Hall.class, request.getHallId(), LockModeType.PESSIMISTIC_WRITE);
        if (hall == null) {
            throw new RuntimeException("Hall not found: " + request.getHallId());
        }

        // Double-check overlap within the locked transaction
        List<Booking> conflicts = bookingRepository.findOverlappingBookings(
                request.getHallId(),
                request.getEventDate(),
                request.getStartTime(),
                request.getEndTime(),
                Booking.BookingStatus.ACTIVE
        );
        if (!conflicts.isEmpty()) {
            throw new SlotConflictException("This slot was just booked by another admin. Please choose a different time.");
        }

        Booking booking = Booking.builder()
                .hall(hall)
                .bookedBy(currentUser)
                .title(request.getTitle())
                .eventDate(request.getEventDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(Booking.BookingStatus.ACTIVE)
                .build();

        Booking saved = bookingRepository.save(booking);
        BookingDto dto = toDto(saved);

        // Broadcast to all connected clients
        messagingTemplate.convertAndSend("/topic/bookings", dto);

        return dto;
    }

    @Transactional
    public BookingDto cancelBooking(Long bookingId, User cancelledByUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new IllegalStateException("Booking is already cancelled");
        }

        // Note: BookingController restricts this endpoint to SUPERADMIN only
        // so we don't need to check if they own the booking. They can cancel any booking.

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelledBy(cancelledByUser);
        booking.setCancelledAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);

        BookingDto dto = toDto(saved);
        // Broadcast cancellation to all clients
        messagingTemplate.convertAndSend("/topic/bookings", dto);

        return dto;
    }

    public List<BookingDto> getAllBookings() {
        return bookingRepository.findAllWithDetails().stream()
                .map(this::toDto)
                .toList();
    }

    public List<BookingDto> getMyBookings(Long userId) {
        return bookingRepository.findByBookedByIdWithDetails(userId).stream()
                .map(this::toDto)
                .toList();
    }

    public List<BookingDto> getUpcomingBookingsByHall(Long hallId) {
        LocalDate today = LocalDate.now();
        return bookingRepository.findUpcomingByHall(hallId, today, Booking.BookingStatus.ACTIVE).stream()
                .map(this::toDto)
                .toList();
    }

    public List<BookingDto> getBookingsByHallAndDate(Long hallId, LocalDate date) {
        return bookingRepository.findActiveByHallAndDate(hallId, date, Booking.BookingStatus.ACTIVE).stream()
                .map(this::toDto)
                .toList();
    }

    public BookingDto toDto(Booking b) {
        return BookingDto.builder()
                .id(b.getId())
                .hall(HallDto.builder()
                        .id(b.getHall().getId())
                        .name(b.getHall().getName())
                        .capacity(b.getHall().getCapacity())
                        .location(b.getHall().getLocation())
                        .description(b.getHall().getDescription())
                        .imageUrl(b.getHall().getImageUrl())
                        .build())
                .bookedBy(AuthService.toDto(b.getBookedBy()))
                .title(b.getTitle())
                .eventDate(b.getEventDate())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .status(b.getStatus().name())
                .cancelledBy(b.getCancelledBy() != null ? AuthService.toDto(b.getCancelledBy()) : null)
                .cancelledAt(b.getCancelledAt())
                .createdAt(b.getCreatedAt())
                .build();
    }

    private com.hallbooking.dto.NotificationDto toNotifDto(Notification n) {
        return com.hallbooking.dto.NotificationDto.builder()
                .id(n.getId())
                .message(n.getMessage())
                .relatedBookingId(n.getRelatedBooking() != null ? n.getRelatedBooking().getId() : null)
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
