package com.hallbooking.config;

import com.hallbooking.entity.Hall;
import com.hallbooking.entity.User;
import com.hallbooking.repository.HallRepository;
import com.hallbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final HallRepository hallRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedHalls();
        seedSuperAdmin();
    }

    private void seedHalls() {
        if (hallRepository.count() > 0) {
            log.info("Halls already seeded, skipping.");
            return;
        }

        List<Hall> halls = List.of(
            Hall.builder()
                .name("Sapphire Room")
                .capacity(30)
                .location("Ground Floor, Block A")
                .description("Intimate boardroom-style hall ideal for small team meetings and workshops.")
                .build(),
            Hall.builder()
                .name("Emerald Hall")
                .capacity(50)
                .location("1st Floor, Block A")
                .description("Versatile medium-sized hall with projector and whiteboards, perfect for training sessions.")
                .build(),
            Hall.builder()
                .name("Topaz Suite")
                .capacity(80)
                .location("Ground Floor, Block B")
                .description("Multi-purpose suite with flexible seating arrangements and AV equipment.")
                .build(),
            Hall.builder()
                .name("Crystal Auditorium")
                .capacity(100)
                .location("2nd Floor, Block B")
                .description("Auditorium-style hall with tiered seating, ideal for presentations and conferences.")
                .build(),
            Hall.builder()
                .name("Diamond Banquet Hall")
                .capacity(150)
                .location("Ground Floor, Block C")
                .description("Elegant banquet hall with round tables, suitable for formal events and gala dinners.")
                .build(),
            Hall.builder()
                .name("Platinum Convention Centre")
                .capacity(200)
                .location("1st Floor, Block C")
                .description("Large convention centre with state-of-the-art sound system and stage facilities.")
                .build(),
            Hall.builder()
                .name("Grand Arena")
                .capacity(300)
                .location("Main Campus, Block D")
                .description("The flagship venue for large-scale events, ceremonies, and major organizational gatherings.")
                .build()
        );

        hallRepository.saveAll(halls);
        log.info("Seeded {} halls successfully.", halls.size());
    }

    private void seedSuperAdmin() {
        String superAdminEmail = "super@hallbooker.com";
        if (userRepository.existsByEmail(superAdminEmail)) {
            log.info("Super Admin already exists, skipping.");
            return;
        }

        // Generate a secure random password
        byte[] randomBytes = new byte[18];
        new SecureRandom().nextBytes(randomBytes);
        String rawPassword = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        User superAdmin = User.builder()
                .name("Super Admin")
                .email(superAdminEmail)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(User.Role.SUPERADMIN)
                .build();

        userRepository.save(superAdmin);

        // Print once to logs — visible on first deploy; not stored anywhere else
        log.info("=================================================================");
        log.info("  SUPER ADMIN CREATED");
        log.info("  Email   : {}", superAdminEmail);
        log.info("  Password: {}", rawPassword);
        log.info("  PLEASE SAVE THIS PASSWORD — IT WILL NOT BE SHOWN AGAIN.");
        log.info("=================================================================");
    }
}
