package com.hallbooking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BookingDto {
    private Long id;
    private HallDto hall;
    private UserDto bookedBy;
    private String title;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private UserDto cancelledBy;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
}
