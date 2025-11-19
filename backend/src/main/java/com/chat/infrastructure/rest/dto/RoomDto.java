package com.chat.infrastructure.rest.dto;

public class RoomDto {
    private Long id;
    private String name;
    private String roomType;
    private String password;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
