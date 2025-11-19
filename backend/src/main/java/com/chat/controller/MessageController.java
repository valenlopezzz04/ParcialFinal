package com.chat.controller;

import com.chat.domain.model.Message;
import com.chat.domain.model.Room;
import com.chat.domain.repository.MessageRepository;
import com.chat.domain.repository.RoomRepository;
import com.chat.infrastructure.rest.dto.MessageDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms/{roomId}/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private RoomRepository roomRepository;

    @GetMapping
    public Page<MessageDto> getMessages(@PathVariable Long roomId,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return Page.empty();
        Page<Message> messages = messageRepository.findByRoom(room, PageRequest.of(page, size));
        return messages.map(msg -> {
            MessageDto dto = new MessageDto();
            dto.setId(msg.getId());
            dto.setUserId(msg.getUser().getId());
            dto.setContent(msg.getContent());
            dto.setSentAt(msg.getSentAt().toString());
            return dto;
        });
    }
}
