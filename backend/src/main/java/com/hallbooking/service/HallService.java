package com.hallbooking.service;

import com.hallbooking.dto.HallDto;
import com.hallbooking.dto.HallRequest;
import com.hallbooking.entity.Booking;
import com.hallbooking.entity.Hall;
import com.hallbooking.repository.BookingRepository;
import com.hallbooking.repository.HallRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HallService {

    private final HallRepository hallRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<HallDto> getAllHalls() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        List<Booking> activeBookings = bookingRepository.findActiveOnDate(today, Booking.BookingStatus.ACTIVE);

        return hallRepository.findByIsDeletedFalse().stream()
                .map(hall -> attachActiveBooking(toDto(hall), activeBookings, now))
                .toList();
    }

    public List<HallDto> getAvailableHalls(Integer capacity, LocalDate date,
                                            LocalTime startTime, LocalTime endTime) {
        Integer searchCapacity = capacity != null ? capacity : 1;
        return hallRepository.findAvailableHalls(searchCapacity, date, startTime, endTime,
                        Booking.BookingStatus.ACTIVE)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public HallDto getHallById(Long id) {
        HallDto hallDto = hallRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Hall not found: " + id));

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        List<Booking> activeBookings = bookingRepository.findActiveOnDate(today, Booking.BookingStatus.ACTIVE);
        
        return attachActiveBooking(hallDto, activeBookings, now);
    }

    @Transactional
    public HallDto createHall(HallRequest request) {
        Hall hall = Hall.builder()
                .name(request.getName())
                .capacity(request.getCapacity())
                .location(request.getLocation())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .isDeleted(false)
                .build();
        
        Hall saved = hallRepository.save(hall);
        HallDto dto = toDto(saved);
        messagingTemplate.convertAndSend("/topic/halls", dto);
        return dto;
    }

    @Transactional
    public HallDto updateHall(Long id, HallRequest request) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hall not found: " + id));
        
        hall.setName(request.getName());
        hall.setCapacity(request.getCapacity());
        hall.setLocation(request.getLocation());
        hall.setDescription(request.getDescription());
        hall.setImageUrl(request.getImageUrl());
        
        Hall saved = hallRepository.save(hall);
        HallDto dto = toDto(saved);
        messagingTemplate.convertAndSend("/topic/halls", dto);
        return dto;
    }

    @Transactional
    public void deleteHall(Long id) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hall not found: " + id));
        
        if (bookingRepository.existsByHallIdAndStatus(id, Booking.BookingStatus.ACTIVE)) {
            throw new IllegalStateException("Cannot delete a hall with active bookings — cancel them first");
        }
        
        hall.setDeleted(true);
        hallRepository.save(hall);
        
        // Broadcast the deletion so clients can remove it from view
        HallDto deletedDto = toDto(hall);
        // Maybe we just send the deleted DTO and frontend can handle it
        messagingTemplate.convertAndSend("/topic/halls", deletedDto);
    }

    private HallDto attachActiveBooking(HallDto hallDto, List<Booking> activeBookings, LocalTime now) {
        Booking currentBooking = activeBookings.stream()
                .filter(b -> b.getHall().getId().equals(hallDto.getId()) &&
                        !b.getStartTime().isAfter(now) &&
                        b.getEndTime().isAfter(now))
                .findFirst()
                .orElse(null);

        if (currentBooking == null) {
            currentBooking = activeBookings.stream()
                    .filter(b -> b.getHall().getId().equals(hallDto.getId()) &&
                            b.getStartTime().isAfter(now))
                    .findFirst()
                    .orElse(null);
        }

        if (currentBooking != null) {
            hallDto.setActiveBooking(bookingService.toDto(currentBooking));
        }
        return hallDto;
    }

    public HallDto toDto(Hall hall) {
        return HallDto.builder()
                .id(hall.getId())
                .name(hall.getName())
                .capacity(hall.getCapacity())
                .location(hall.getLocation())
                .description(hall.getDescription())
                .imageUrl(hall.getImageUrl())
                .build();
    }
}
