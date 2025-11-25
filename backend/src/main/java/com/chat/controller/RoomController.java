package com.chat.controller;

import com.chat.domain.model.Room;
import com.chat.domain.model.RoomMember;
import com.chat.domain.model.User;

import com.chat.domain.repository.RoomRepository;
import com.chat.domain.repository.RoomMemberRepository;
import com.chat.domain.repository.UserRepository;

import com.chat.infrastructure.rest.dto.RoomDto;
import com.chat.infrastructure.rest.dto.ErrorResponse;
import com.chat.infrastructure.rest.dto.JoinRoomRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private UserRepository userRepository;

    // GET — todas las salas
    @GetMapping
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    // GET — sala por id
    @GetMapping("/{id}")
    public Room getRoom(@PathVariable Long id) {
        return roomRepository.findById(id).orElse(null);
    }

    // POST — crear sala
    @PostMapping
    public Room createRoom(@RequestBody RoomDto roomDto) {
        Room room = new Room();
        room.setName(roomDto.getName());
        room.setRoomType(roomDto.getRoomType());

        if ("private".equalsIgnoreCase(roomDto.getRoomType()) && roomDto.getPassword() != null) {
            room.setPasswordHash(BCrypt.hashpw(roomDto.getPassword(), BCrypt.gensalt()));
        }

        return roomRepository.save(room);
    }

    // PUT — actualizar sala
    @PutMapping("/{id}")
    public Room updateRoom(@PathVariable Long id, @RequestBody RoomDto roomDto) {
        Optional<Room> roomOpt = roomRepository.findById(id);
        if (roomOpt.isEmpty()) return null;

        Room room = roomOpt.get();
        room.setName(roomDto.getName());
        room.setRoomType(roomDto.getRoomType());

        if ("private".equalsIgnoreCase(roomDto.getRoomType()) && roomDto.getPassword() != null) {
            room.setPasswordHash(BCrypt.hashpw(roomDto.getPassword(), BCrypt.gensalt()));
        }

        return roomRepository.save(room);
    }

    // DELETE — eliminar sala
    @DeleteMapping("/{id}")
    public String deleteRoom(@PathVariable Long id) {
        roomRepository.deleteById(id);
        return "Room deleted";
    }

    // POST — unirse a sala (JSON)
    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinRoom(@PathVariable Long id,
                                      @RequestParam(required = false) Long userId,
                                      @RequestParam(required = false) String password) {

        System.out.println("DEBUG: joinRoom → userId=" + userId + " password=" + password);

        if (userId == null) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Missing userId", 400));
        }

        Room room = roomRepository.findById(id).orElse(null);
        if (room == null) {
            return ResponseEntity.status(404).body(new ErrorResponse("Room not found", 404));
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(new ErrorResponse("User not found", 404));
        }

        if (roomMemberRepository.existsByRoomAndUser(room, user)) {
            return ResponseEntity.ok("User already in room");
        }

        if ("private".equalsIgnoreCase(room.getRoomType())) {
            if (room.getPasswordHash() == null ||
                    password == null ||
                    !BCrypt.checkpw(password, room.getPasswordHash())) {

                return ResponseEntity.status(403)
                        .body(new ErrorResponse("Invalid password for private room", 403));
            }
        }


        RoomMember member = new RoomMember();
        member.setRoom(room);
        member.setUser(user);
        roomMemberRepository.save(member);

        return ResponseEntity.ok("User joined room successfully");
    }
}
