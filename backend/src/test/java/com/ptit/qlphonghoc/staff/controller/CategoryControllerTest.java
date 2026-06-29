package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CategoryControllerTest {

    @Test
    void returnsCalendarBlocksForSemester() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForList(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any(Integer.class)))
                .thenReturn(List.of(Map.of("id", 1, "semesterId", 2, "title", "Tet")));

        CategoryController controller = new CategoryController(jdbcTemplate);

        ApiResponse<List<Map<String, Object>>> response = controller.getCalendarBlocks(2);

        assertThat(response.success()).isTrue();
        assertThat(response.data()).hasSize(1);
        assertThat(response.data().get(0)).containsEntry("semesterId", 2);
        verify(jdbcTemplate).queryForList(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.eq(2));
    }
}
