package com.ptit.qlphonghoc.classsession.service;

import com.ptit.qlphonghoc.classsession.dto.ClassSessionResponse;
import com.ptit.qlphonghoc.classsession.repository.ClassSessionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Unit tests for ClassSessionGenerator.
 *
 * Uses anonymous subclasses instead of Mockito.mock() to bypass
 * the Byte Buddy / Java 25 incompatibility (Byte Buddy supports up to Java 23).
 */
class ClassSessionGeneratorTest {

    // -----------------------------------------------------------------------
    // Helper: builds a fake ClassSessionRepository backed by in-memory state
    // -----------------------------------------------------------------------

    private static ClassSessionRepository fakeRepository(
            List<ClassSessionRepository.ScheduleInfo> schedules,
            List<ClassSessionRepository.SemesterWeekInfo> weeks,
            List<ClassSessionRepository.CalendarBlockInfo> calendarBlocks,
            List<ClassSessionRepository.ClassSessionInsertData> capturedInserts
    ) {
        // JdbcTemplate is never called in our production path under test,
        // so passing null is safe here.
        return new ClassSessionRepository(null) {

            @Override
            public int deleteScheduledSessions(Integer semesterId) {
                return 0; // no-op
            }

            @Override
            public List<ClassSessionRepository.ScheduleInfo> getActiveSchedules(Integer semesterId) {
                return schedules;
            }

            @Override
            public List<ClassSessionRepository.SemesterWeekInfo> getSemesterWeeks(Integer semesterId) {
                return weeks;
            }

            @Override
            public List<ClassSessionRepository.CalendarBlockInfo> getCalendarBlocks(Integer semesterId) {
                return calendarBlocks;
            }

            @Override
            public void batchInsertClassSessions(List<ClassSessionRepository.ClassSessionInsertData> sessions) {
                capturedInserts.addAll(sessions);
            }

            @Override
            public List<ClassSessionResponse> findClassSessions(
                    Integer semesterId, Integer weekNo, String status,
                    Integer lecturerId, Integer classroomId,
                    LocalDate date, LocalDate startDate, LocalDate endDate,
                    String search, Integer studentId, Integer strictLecturerId) {
                return List.of();
            }
        };
    }

    // -----------------------------------------------------------------------
    // Tests
    // -----------------------------------------------------------------------

    /**
     * Schedule on MON, weeks 1-2.
     * Week 2's Monday (2025-08-18) is blocked by a holiday academic_calendar_block.
     * Expected: only 1 session generated (week 1 MON = 2025-08-11).
     */
    @Test
    void generateClassSessionsSuccessfullyCalculatesDatesAndSkipsHolidays() {
        ClassSessionRepository.ScheduleInfo schedule = new ClassSessionRepository.ScheduleInfo(
                100L, 200L, 10L, "MON", 1L, 3L,
                LocalTime.of(7, 0), LocalTime.of(9, 40), 1, 2, "THEORY", 0, 5L
        );

        // Week 1: Mon 11 Aug – isBreak false
        // Week 2: Mon 18 Aug – isBreak false  BUT blocked by calendar
        ClassSessionRepository.SemesterWeekInfo week1 = new ClassSessionRepository.SemesterWeekInfo(
                1L, 1, LocalDate.of(2025, 8, 10), LocalDate.of(2025, 8, 16), false
        );
        ClassSessionRepository.SemesterWeekInfo week2 = new ClassSessionRepository.SemesterWeekInfo(
                2L, 2, LocalDate.of(2025, 8, 17), LocalDate.of(2025, 8, 23), false
        );
        ClassSessionRepository.CalendarBlockInfo holidayBlock = new ClassSessionRepository.CalendarBlockInfo(
                LocalDate.of(2025, 8, 18), LocalDate.of(2025, 8, 18), "Holiday"
        );

        List<ClassSessionRepository.ClassSessionInsertData> captured = new ArrayList<>();
        ClassSessionRepository repo = fakeRepository(
                List.of(schedule), List.of(week1, week2), List.of(holidayBlock), captured
        );

        new ClassSessionGenerator(repo).generateClassSessions(1);

        assertEquals(1, captured.size(), "Should skip holiday week-2 Monday");

        ClassSessionRepository.ClassSessionInsertData session = captured.get(0);
        assertEquals(100L, session.scheduleId());
        assertEquals(200L, session.sectionId());
        assertEquals(1L, session.semesterWeekId());
        assertEquals(LocalDate.of(2025, 8, 11), session.sessionDate(), "Should be week-1 Monday");
        assertEquals(10L, session.classroomId());
        assertEquals(5L, session.lecturerId());
        assertEquals(1L, session.slotStartId());
        assertEquals(3L, session.slotEndId());
        assertEquals(LocalTime.of(7, 0), session.startTime());
        assertEquals(LocalTime.of(9, 40), session.endTime());
        assertEquals("SCHEDULED", session.sessionStatus());
    }

    /**
     * Schedule on MON, weeks 1-2.
     * Week 2 is a break week (is_break = true).
     * Expected: only 1 session generated (week 1 MON = 2025-08-11).
     */
    @Test
    void generateClassSessionsSkipsBreakWeeks() {
        ClassSessionRepository.ScheduleInfo schedule = new ClassSessionRepository.ScheduleInfo(
                100L, 200L, 10L, "MON", 1L, 3L,
                LocalTime.of(7, 0), LocalTime.of(9, 40), 1, 2, "THEORY", 0, 5L
        );

        ClassSessionRepository.SemesterWeekInfo week1 = new ClassSessionRepository.SemesterWeekInfo(
                1L, 1, LocalDate.of(2025, 8, 10), LocalDate.of(2025, 8, 16), false
        );
        ClassSessionRepository.SemesterWeekInfo week2 = new ClassSessionRepository.SemesterWeekInfo(
                2L, 2, LocalDate.of(2025, 8, 17), LocalDate.of(2025, 8, 23), true  // break!
        );

        List<ClassSessionRepository.ClassSessionInsertData> captured = new ArrayList<>();
        ClassSessionRepository repo = fakeRepository(
                List.of(schedule), List.of(week1, week2), List.of(), captured
        );

        new ClassSessionGenerator(repo).generateClassSessions(1);

        assertEquals(1, captured.size(), "Should skip break week");
        assertEquals(LocalDate.of(2025, 8, 11), captured.get(0).sessionDate());
    }

    /**
     * Schedule with no weeks configured.
     * Expected: no sessions generated, no exception.
     */
    @Test
    void generateClassSessionsNoWeeksProducesNoSessions() {
        ClassSessionRepository.ScheduleInfo schedule = new ClassSessionRepository.ScheduleInfo(
                1L, 2L, 3L, "MON", 1L, 2L,
                LocalTime.of(7, 0), LocalTime.of(8, 40), 1, 5, "THEORY", 0, 10L
        );

        List<ClassSessionRepository.ClassSessionInsertData> captured = new ArrayList<>();
        ClassSessionRepository repo = fakeRepository(
                List.of(schedule), List.of(), List.of(), captured
        );

        new ClassSessionGenerator(repo).generateClassSessions(1);

        assertEquals(0, captured.size(), "No sessions expected when no weeks exist");
    }
}
