package com.hallbooking.service;

import com.hallbooking.dto.BookingDto;
import com.hallbooking.dto.ChatbotResponse;
import com.hallbooking.dto.HallDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final HallService hallService;
    private final BookingService bookingService;

    public ChatbotResponse processQuery(String message) {
        String lowerMessage = message.toLowerCase().trim();

        // 1. "Show me all current bookings"
        if (lowerMessage.contains("all current bookings") || lowerMessage.contains("show me all bookings")) {
            return handleAllCurrentBookings();
        }

        // 2. Parse constraints: capacity
        Integer capacity = null;
        Matcher capacityMatcher = Pattern.compile("(\\d+)\\+?\\s*(seats|capacity)").matcher(lowerMessage);
        if (capacityMatcher.find()) {
            capacity = Integer.parseInt(capacityMatcher.group(1));
        }

        // 3. Parse Date and Time
        LocalDate date = parseDate(lowerMessage);
        LocalTime startTime = parseStartTime(lowerMessage);
        LocalTime endTime = parseEndTime(lowerMessage);

        // If time is just "right now"
        if (lowerMessage.contains("right now") || lowerMessage.contains("currently")) {
            date = LocalDate.now();
            startTime = LocalTime.now();
            endTime = LocalTime.now().plusHours(1); // Check overlapping now
        }

        // 4. Identify specific hall
        List<HallDto> allHalls = hallService.getAllHalls();
        HallDto specificHall = null;
        for (HallDto hall : allHalls) {
            if (lowerMessage.contains(hall.getName().toLowerCase())) {
                specificHall = hall;
                break;
            }
        }

        // 5. Detect intent
        boolean isAvailabilityCheck = lowerMessage.contains("available") || lowerMessage.contains("free");
        boolean isBookingCheck = lowerMessage.contains("who booked") || lowerMessage.contains("is booked") || lowerMessage.contains("booking");

        if (isBookingCheck && specificHall != null) {
            return handleBookingCheck(specificHall, date, startTime);
        } else if (isAvailabilityCheck) {
            if (specificHall != null) {
                return handleSpecificHallAvailability(specificHall, date, startTime, endTime);
            } else {
                return handleGeneralAvailability(capacity, date, startTime, endTime);
            }
        }

        // Ambiguous or not understood
        return ChatbotResponse.builder()
                .response("I'm not sure I understood. Could you clarify? For example, you can ask 'Which halls are available right now?' or 'Who booked Conference Room A?'")
                .build();
    }

    private LocalDate parseDate(String msg) {
        if (msg.contains("tomorrow")) {
            return LocalDate.now().plusDays(1);
        } else if (msg.contains("today")) {
            return LocalDate.now();
        } else if (msg.contains("this friday")) {
            int daysToAdd = (java.time.DayOfWeek.FRIDAY.getValue() - LocalDate.now().getDayOfWeek().getValue() + 7) % 7;
            if (daysToAdd == 0) daysToAdd = 7; // Next Friday if today is Friday
            return LocalDate.now().plusDays(daysToAdd);
        }
        
        // Very basic specific date parsing (e.g. on 2026-10-10)
        Matcher dateMatcher = Pattern.compile("\\b(\\d{4}-\\d{2}-\\d{2})\\b").matcher(msg);
        if (dateMatcher.find()) {
            try {
                return LocalDate.parse(dateMatcher.group(1));
            } catch (DateTimeParseException e) {
                // Ignore
            }
        }
        
        return null;
    }

    private LocalTime parseStartTime(String msg) {
        if (msg.contains("morning")) return LocalTime.of(9, 0);
        if (msg.contains("afternoon")) return LocalTime.of(13, 0);
        
        // 3pm, 3 pm, 15:00
        Matcher timeMatcher = Pattern.compile("\\b(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?\\b").matcher(msg);
        if (timeMatcher.find()) {
            int hour = Integer.parseInt(timeMatcher.group(1));
            int minute = timeMatcher.group(2) != null ? Integer.parseInt(timeMatcher.group(2)) : 0;
            String ampm = timeMatcher.group(3);
            
            if (ampm != null) {
                if (ampm.equals("pm") && hour < 12) hour += 12;
                if (ampm.equals("am") && hour == 12) hour = 0;
            }
            return LocalTime.of(hour, minute);
        }
        return null;
    }

    private LocalTime parseEndTime(String msg) {
        if (msg.contains("morning")) return LocalTime.of(12, 0);
        if (msg.contains("afternoon")) return LocalTime.of(17, 0);
        
        // Try to find a second time if possible, fallback to start + 1h
        return null; // Simplified: we will calculate it based on start time if needed
    }

    private ChatbotResponse handleAllCurrentBookings() {
        List<BookingDto> activeBookings = bookingService.getAllBookings().stream()
                .filter(b -> b.getStatus().equals("ACTIVE") && b.getEventDate().isEqual(LocalDate.now()) && !b.getEndTime().isBefore(LocalTime.now()))
                .collect(Collectors.toList());

        if (activeBookings.isEmpty()) {
            return new ChatbotResponse("There are currently no active bookings.");
        }

        StringBuilder response = new StringBuilder("Here are the current bookings:\n");
        for (BookingDto b : activeBookings) {
            response.append("- **").append(b.getHall().getName()).append("** is booked by ")
                    .append(b.getBookedBy().getName()).append(" for '").append(b.getTitle())
                    .append("' (").append(b.getStartTime()).append(" - ").append(b.getEndTime()).append(")\n");
        }
        return new ChatbotResponse(response.toString());
    }

    private ChatbotResponse handleBookingCheck(HallDto hall, LocalDate date, LocalTime time) {
        LocalDate queryDate = date != null ? date : LocalDate.now();
        LocalTime queryTime = time != null ? time : LocalTime.now();

        List<BookingDto> bookings = bookingService.getBookingsByHallAndDate(hall.getId(), queryDate);
        
        BookingDto overlapping = bookings.stream()
                .filter(b -> !queryTime.isBefore(b.getStartTime()) && queryTime.isBefore(b.getEndTime()))
                .findFirst()
                .orElse(null);

        if (overlapping != null) {
            return new ChatbotResponse(String.format("Yes, **%s** is booked by %s for '%s' from %s to %s.",
                    hall.getName(), overlapping.getBookedBy().getName(), overlapping.getTitle(),
                    overlapping.getStartTime(), overlapping.getEndTime()));
        } else {
            return new ChatbotResponse(String.format("**%s** does not have an active booking at that time.", hall.getName()));
        }
    }

    private ChatbotResponse handleSpecificHallAvailability(HallDto hall, LocalDate date, LocalTime startTime, LocalTime endTime) {
        LocalDate queryDate = date != null ? date : LocalDate.now();
        LocalTime queryStart = startTime != null ? startTime : LocalTime.now();
        LocalTime queryEnd = endTime != null ? endTime : queryStart.plusHours(1);

        List<HallDto> availableHalls = hallService.getAvailableHalls(null, queryDate, queryStart, queryEnd);
        
        boolean isAvailable = availableHalls.stream().anyMatch(h -> h.getId().equals(hall.getId()));

        if (isAvailable) {
            return new ChatbotResponse(String.format("Yes, **%s** is free on %s from %s to %s.",
                    hall.getName(), queryDate, queryStart, queryEnd));
        } else {
            return new ChatbotResponse(String.format("No, **%s** is currently booked during that time.", hall.getName()));
        }
    }

    private ChatbotResponse handleGeneralAvailability(Integer capacity, LocalDate date, LocalTime startTime, LocalTime endTime) {
        LocalDate queryDate = date != null ? date : LocalDate.now();
        LocalTime queryStart = startTime != null ? startTime : LocalTime.now();
        LocalTime queryEnd = endTime != null ? endTime : queryStart.plusHours(1);

        List<HallDto> availableHalls = hallService.getAvailableHalls(capacity, queryDate, queryStart, queryEnd);

        if (availableHalls.isEmpty()) {
            return new ChatbotResponse("There are no halls available matching your criteria.");
        }

        StringBuilder response = new StringBuilder(String.format("The following halls are available on %s from %s to %s:\n", queryDate, queryStart, queryEnd));
        for (HallDto h : availableHalls) {
            response.append("- **").append(h.getName()).append("** (").append(h.getCapacity()).append(" seats)\n");
        }
        return new ChatbotResponse(response.toString());
    }
}
