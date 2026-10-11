package com.xuancong.student_management.security;

import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /** Spring Security gọi bằng "username" — ở đây "username" là email của entity/User */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        if (identifier == null || identifier.isBlank()) {
            throw new UsernameNotFoundException("Empty identifier");
        }
        String clean = identifier.trim().toLowerCase();

        var userOpt = userRepository.findByEmail(clean);
        if (userOpt.isEmpty()) {
            if (clean.equals("admin") || clean.equals("admin@rikai.com") || clean.equals("admin@example.com")) {
                userOpt = userRepository.findByEmail("admin@rikai.technology")
                        .or(() -> userRepository.findByEmail("admin@example.com"));
            }
        }
        if (userOpt.isEmpty()) {
            // Also match by username if email format not provided
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getEmail().toLowerCase().startsWith(clean + "@"))
                    .findFirst();
        }

        var user = userOpt.orElseThrow(() -> new UsernameNotFoundException("User not found: " + identifier));
        return new CustomUserDetails(user);
    }
}
