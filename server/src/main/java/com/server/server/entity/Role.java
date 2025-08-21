package com.server.server.entity;

public enum Role {
    CONSUMER,
    FARMER,
    RESTAURANT;

    public static Role fromString(String value) {
        if (value == null) return null;
        try {
            return Role.valueOf(value.trim().toUpperCase());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid role: " + value);
        }
    }
}
