package com.hallbooking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class HallDto {
    private Long id;
    private String name;
    private Integer capacity;
    private String location;
    private String description;
    private String imageUrl;
    private BookingDto activeBooking;
}
