package com.chat.controller;

import com.chat.domain.model.Message;
import com.chat.domain.model.Room;
import com.chat.domain.model.User;
import com.chat.domain.repository.MessageRepository;
import com.chat.infrastructure.rest.dto.ErrorResponse;
import com.chat.infrastructure.rest.dto.MessageDto;
import com.chat.domain.service.RoomMembershipService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms/{roomId}/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private RoomMembershipService membershipService;

    // GET — listar mensajes
    @GetMapping
    public ResponseEntity<?> getMessages(@PathVariable Long roomId,
                                         @RequestParam Long userId,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {

        // Validar usuario
        User user = membershipService.validateUserExists(userId);
        if (user == null) {
            return ResponseEntity.status(404).body(new ErrorResponse("User not found", 404));
        }

        // Validar sala
        Room room = membershipService.validateRoomExists(roomId);
        if (room == null) {
            return ResponseEntity.status(404).body(new ErrorResponse("Room not found", 404));
        }

        // Validar membresía
        if (!membershipService.isUserInRoom(room, user)) {
            return ResponseEntity.status(403)
                    .body(new ErrorResponse("You are not a member of this room", 403));
        }

        // Obtener mensajes paginados
        Page<Message> messages = messageRepository.findByRoom(room, PageRequest.of(page, size));

        Page<MessageDto> result = messages.map(msg -> {
            MessageDto dto = new MessageDto();
            dto.setId(msg.getId());
            dto.setUserId(msg.getUser().getId());
            dto.setContent(msg.getContent());
            dto.setSentAt(msg.getSentAt().toString());
            return dto;
        });

        return ResponseEntity.ok(result);
    }

    // POST — guardar mensaje
    @PostMapping
    public ResponseEntity<?> saveMessage(@PathVariable Long roomId,
                                         @RequestBody MessageDto messageDto) {

        // Validar sala
        Room room = membershipService.validateRoomExists(roomId);
        if (room == null) {
            return ResponseEntity.status(404)
                    .body(new ErrorResponse("Room not found", 404));
        }

        // Validar usuario
        User user = membershipService.validateUserExists(messageDto.getUserId());
        if (user == null) {
            return ResponseEntity.status(404)
                    .body(new ErrorResponse("User not found", 404));
        }

        // Validar si puede enviar mensajes (debe ser miembro)
        if (!membershipService.canSendMessage(room, user)) {
            return ResponseEntity.status(403)
                    .body(new ErrorResponse("You are not a member of this room", 403));
        }

        // Crear el mensaje
        Message message = new Message();
        message.setRoom(room);
        message.setUser(user);
        message.setContent(messageDto.getContent());

        Message saved = messageRepository.save(message);

        // Convertir a DTO
        MessageDto dto = new MessageDto();
        dto.setId(saved.getId());
        dto.setUserId(saved.getUser().getId());
        dto.setContent(saved.getContent());
        dto.setSentAt(saved.getSentAt().toString());

        return ResponseEntity.ok(dto);
    }
}
