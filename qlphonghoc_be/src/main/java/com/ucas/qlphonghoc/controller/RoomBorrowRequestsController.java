package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/room-borrow-requests", "/api/room-borrow-requests"})
public class RoomBorrowRequestsController extends BaseCrudController {
    public RoomBorrowRequestsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "room_borrow_requests", "id", List.of("id", "request_title", "request_type", "booking_scope", "semester_id", "section_id", "booking_date", "slot_start_id", "slot_end_id", "start_time", "end_time", "requested_by", "club_id", "expected_attendees", "preferred_building_id", "preferred_classroom_id", "requested_room_type", "purpose_note", "status", "approved_classroom_id", "approved_by", "approved_at", "processing_note", "reject_reason", "created_at", "updated_at"), false, "r.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT r.*, u.full_name AS requester_name, c.room_number AS approved_room_number FROM room_borrow_requests r JOIN users u ON r.requested_by = u.id LEFT JOIN classrooms c ON r.approved_classroom_id = c.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT r.*, u.full_name AS requester_name, c.room_number AS approved_room_number FROM room_borrow_requests r JOIN users u ON r.requested_by = u.id LEFT JOIN classrooms c ON r.approved_classroom_id = c.id"; }

    @Override
    protected String selectWhere() { return "1 = 1"; }

    @Override
    protected String idColumnForPath() { return "r.id"; }
}
