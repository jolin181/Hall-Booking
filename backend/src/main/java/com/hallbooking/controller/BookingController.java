package com.hallbooking.controller;

import com.hallbooking.dto.BookingDto;
import com.hallbooking.dto.BookingRequest;
import com.hallbooking.entity.User;
import com.hallbooking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingDto> createBooking(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal User currentUser) {
        BookingDto dto = bookingService.createBooking(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping
    public ResponseEntity<List<BookingDto>> getAllBookings(
            @AuthenticationPrincipal User currentUser) {
        // Super admins see all, regular admins see all too (visibility requirement)
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingDto>> getMyBookings(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(bookingService.getMyBookings(currentUser.getId()));
    }

    @GetMapping("/hall/{hallId}")
    public ResponseEntity<List<BookingDto>> getBookingsByHall(
            @PathVariable Long hallId,
            @RequestParam(required = false) String date) {
        if (date != null && !date.isEmpty()) {
            return ResponseEntity.ok(bookingService.getBookingsByHallAndDate(hallId, java.time.LocalDate.parse(date)));
        }
        return ResponseEntity.ok(bookingService.getUpcomingBookingsByHall(hallId));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<BookingDto> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, currentUser));
    }
}
