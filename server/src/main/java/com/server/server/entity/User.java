package com.server.server.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
// ...existing code...
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "cid", length = 11, nullable = false, unique = true)
    @Pattern(regexp = "\\d{11}", message = "CID must be exactly 11 digits")
    private String cid; // exactly 11 digits

    @NotBlank
    @Column(name = "name", nullable = false)
    private String name;

    @NotBlank
    @Column(name = "password", nullable = false)
    private String password;

    @jakarta.persistence.Convert(converter = RoleConverter.class)
    @Column(name = "role", nullable = false)
    private com.server.server.entity.Role role;

    @Column(name = "location")
    private String location;

    @NotBlank
    @Column(name = "phone_number", nullable = false, unique = true)
    private String phoneNumber;

    public User() {
    }

    public String getCid() {
        return cid;
    }

    public void setCid(String cid) {
        this.cid = cid;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
}
