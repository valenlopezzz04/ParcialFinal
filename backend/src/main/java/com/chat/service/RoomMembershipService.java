package com.chat.service;

import com.chat.domain.model.Room;
import com.chat.domain.model.RoomMember;
import com.chat.domain.model.User;
import com.chat.domain.repository.RoomMemberRepository;
import com.chat.domain.repository.RoomRepository;
import com.chat.domain.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RoomMembershipService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    /**
     * Verifica que una sala exista.
     */
    public Room validateRoomExists(Long roomId) {
        return roomRepository.findById(roomId)
                .orElse(null);
    }

    /**
     * Verifica que un usuario exista.
     */
    public User validateUserExists(Long userId) {
        return userRepository.findById(userId)
                .orElse(null);
    }

    /**
     * Verifica si un usuario ya pertenece a la sala.
     */
    public boolean isUserInRoom(Room room, User user) {
        return roomMemberRepository.existsByRoomAndUser(room, user);
    }

    /**
     * Intenta agregar al usuario a la sala (si no estaba ya).
     */
    public RoomMember addUserToRoom(Room room, User user) {
        if (isUserInRoom(room, user)) return null;

        RoomMember member = new RoomMember();
        member.setRoom(room);
        member.setUser(user);

        return roomMemberRepository.save(member);
    }

    /**
     * Verifica si el usuario puede enviar mensajes.
     * - Debe existir
     * - Debe pertenecer a la sala
     */
    public boolean canSendMessage(Room room, User user) {
        return roomMemberRepository.existsByRoomAndUser(room, user);
    }
}
