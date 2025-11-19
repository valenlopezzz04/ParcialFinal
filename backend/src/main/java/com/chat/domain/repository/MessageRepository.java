package com.chat.domain.repository;

import com.chat.domain.model.Message;
import com.chat.domain.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByRoom(Room room);
    Page<Message> findByRoom(Room room, Pageable pageable);
}
