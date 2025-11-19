package com.chat.controller;

import com.chat.domain.model.Room;
import com.chat.domain.repository.RoomRepository;
import com.chat.infrastructure.rest.dto.RoomDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.web.bind.annotation.*;

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
}
