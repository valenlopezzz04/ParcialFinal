package com.chat.domain.repository;

import com.chat.domain.model.RoomMember;
import com.chat.domain.model.Room;
import com.chat.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

    List<RoomMember> findByRoom(Room room);

    List<RoomMember> findByUser(User user);

    Optional<RoomMember> findByRoomAndUser(Room room, User user);

    boolean existsByRoomAndUser(Room room, User user);
}
