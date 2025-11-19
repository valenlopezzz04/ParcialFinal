package com.chat.controller;

import com.chat.domain.model.Room;
import com.chat.domain.repository.RoomRepository;
import com.chat.infrastructure.rest.dto.RoomDto;
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

    @GetMapping
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    @GetMapping("/{id}")
    public Room getRoom(@PathVariable Long id) {
        return roomRepository.findById(id).orElse(null);
    }

    @PostMapping
    public Room createRoom(@RequestBody RoomDto roomDto) {
        Room room = new Room();
        room.setName(roomDto.getName());
        room.setRoomType(roomDto.getRoomType());
        // Solo en tipo privada seteamos password
        if ("private".equalsIgnoreCase(roomDto.getRoomType()) && roomDto.getPassword() != null) {
            room.setPasswordHash(BCrypt.hashpw(roomDto.getPassword(), BCrypt.gensalt()));
        }
        // Aquí podrías establecer el usuario creador con seguridad.
        return roomRepository.save(room);
    }

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

    @DeleteMapping("/{id}")
    public String deleteRoom(@PathVariable Long id) {
        roomRepository.deleteById(id);
        return "Room deleted";
    }

    // Endpoint para control de acceso a públicas/privadas
    @PostMapping("/{id}/join")
    public ResponseEntity<String> joinRoom(@PathVariable Long id,
                                           @RequestParam(required = false) String password) {
        Room room = roomRepository.findById(id).orElse(null);
        if (room == null) {
            return ResponseEntity.badRequest().body("Room not found");
        }
        if ("private".equalsIgnoreCase(room.getRoomType())) {
            if (room.getPasswordHash() == null || password == null ||
                !BCrypt.checkpw(password, room.getPasswordHash())) {
                return ResponseEntity.status(403).body("Invalid password for private room");
            }
        }
        // Aquí podrías agregar la lógica de membership en room_members
        return ResponseEntity.ok("Joined room successfully");
    }
}
