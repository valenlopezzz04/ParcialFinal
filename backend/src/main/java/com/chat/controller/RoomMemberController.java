package com.chat.controller;

import com.chat.domain.model.Room;
import com.chat.domain.model.RoomMember;
import com.chat.domain.model.User;
import com.chat.domain.repository.RoomMemberRepository;
import com.chat.domain.repository.RoomRepository;
import com.chat.domain.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms/{roomId}/members")
public class RoomMemberController {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<?> isMember(@PathVariable Long roomId, @PathVariable Long userId) {

        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) {
            return ResponseEntity.status(404).body("{\"member\": false, \"reason\": \"Room not found\"}");
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("{\"member\": false, \"reason\": \"User not found\"}");
        }

        boolean member = roomMemberRepository.existsByRoomAndUser(room, user);

        return ResponseEntity.ok("{\"member\": " + member + "}");
    }
}
