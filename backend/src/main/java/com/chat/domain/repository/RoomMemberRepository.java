package com.chat.domain.repository;

import com.chat.domain.model.RoomMember;
import com.chat.domain.model.Room;
import com.chat.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    List<RoomMember> findByRoom(Room room);
    List<RoomMember> findByUser(User user);
}
