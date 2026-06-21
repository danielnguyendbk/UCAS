package com.ptit.qlphonghoc.common.exception;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void businessErrorKeepsCodeMessageAndDetailsSeparate() {
        Map<String, Object> details = Map.of("requiredCapacity", 80);

        var response = handler.handleBadRequest(new BadRequestException(
                "CAPACITY_EXCEEDED",
                "Phòng học không đủ sức chứa.",
                details
        ));

        assertEquals(400, response.getStatusCode().value());
        assertFalse(response.getBody().success());
        assertEquals("CAPACITY_EXCEEDED", response.getBody().errorCode());
        assertEquals("Phòng học không đủ sức chứa.", response.getBody().message());
        assertEquals(details, response.getBody().details());
    }

    @Test
    void notFoundErrorUses404AndTypedCode() {
        var response = handler.handleNotFound(new ResourceNotFoundException(
                "SCHEDULE_NOT_FOUND",
                "Không tìm thấy lịch học."
        ));

        assertEquals(404, response.getStatusCode().value());
        assertEquals("SCHEDULE_NOT_FOUND", response.getBody().errorCode());
    }
}
