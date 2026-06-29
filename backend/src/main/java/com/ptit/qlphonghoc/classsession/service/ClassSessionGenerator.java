package com.ptit.qlphonghoc.classsession.service;

import com.ptit.qlphonghoc.classsession.repository.ClassSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ClassSessionGenerator {

    private static final Logger log = LoggerFactory.getLogger(ClassSessionGenerator.class);

    private final ClassSessionRepository repository;

    public ClassSessionGenerator(ClassSessionRepository repository) {
        this.repository = repository;
    }

    @Async
    @Transactional
    public void generateClassSessions(Integer semesterId) {
        log.info("Starting asynchronous class session generation for semester: {}", semesterId);
        try {
            // 1. Safe delete existing SCHEDULED class sessions for the semester
            int deletedCount = repository.deleteScheduledSessions(semesterId);
            log.info("Deleted {} existing SCHEDULED class sessions for semester {}", deletedCount, semesterId);

            // 2. Query active schedules, semester weeks, and calendar blocks
            List<ClassSessionRepository.ScheduleInfo> schedules = repository.getActiveSchedules(semesterId);
            List<ClassSessionRepository.SemesterWeekInfo> weeks = repository.getSemesterWeeks(semesterId);
            List<ClassSessionRepository.CalendarBlockInfo> calendarBlocks = repository.getCalendarBlocks(semesterId);

            if (weeks.isEmpty()) {
                log.warn("No semester weeks found for semester {}. Aborting class session generation.", semesterId);
                return;
            }

            int minWeekNo = weeks.get(0).weekNo();
            int maxWeekNo = weeks.get(weeks.size() - 1).weekNo();

            List<ClassSessionRepository.ClassSessionInsertData> sessionsToInsert = new ArrayList<>();

            // 3. Loop over active schedules
            for (ClassSessionRepository.ScheduleInfo sch : schedules) {
                int fromWeek = sch.fromWeekNo() != null ? sch.fromWeekNo() : minWeekNo;
                int toWeek = sch.toWeekNo() != null ? sch.toWeekNo() : maxWeekNo;

                for (int w = fromWeek; w <= toWeek; w++) {
                    final int currentWeekNo = w;
                    ClassSessionRepository.SemesterWeekInfo sw = weeks.stream()
                            .filter(wk -> wk.weekNo() == currentWeekNo)
                            .findFirst()
                            .orElse(null);

                    if (sw == null) {
                        continue;
                    }
                    if (sw.isBreak()) {
                        continue; // Skip holiday/break weeks
                    }

                    // Calculate session date
                    LocalDate targetDate = calculateSessionDate(sw.startDate(), sch.dayOfWeek());

                    // Check if date falls in any calendar block cấm dạy
                    boolean isTeachingAllowed = true;
                    for (ClassSessionRepository.CalendarBlockInfo block : calendarBlocks) {
                        if (!targetDate.isBefore(block.startDate()) && !targetDate.isAfter(block.endDate())) {
                            isTeachingAllowed = false;
                            break;
                        }
                    }

                    if (!isTeachingAllowed) {
                        continue; // Skip date blocked by academic calendar
                    }

                    // Create session insert data
                    ClassSessionRepository.ClassSessionInsertData session = new ClassSessionRepository.ClassSessionInsertData(
                            sch.scheduleId(),
                            sch.sectionId(),
                            sw.semesterWeekId(),
                            targetDate,
                            sch.classroomId(),
                            sch.lecturerId(),
                            sch.slotStartId(),
                            sch.slotEndId(),
                            sch.startTime(),
                            sch.endTime(),
                            sch.sessionType(),
                            sch.practiceGroupNo(),
                            "SCHEDULED",
                            "Generated on timetable publish"
                    );
                    sessionsToInsert.add(session);
                }
            }

            // 4. Batch insert new class sessions
            if (!sessionsToInsert.isEmpty()) {
                log.info("Batch inserting {} new class sessions for semester {}", sessionsToInsert.size(), semesterId);
                repository.batchInsertClassSessions(sessionsToInsert);
                log.info("Successfully finished class session generation for semester {}", semesterId);
            } else {
                log.info("No class sessions generated for semester {}", semesterId);
            }

        } catch (Exception e) {
            log.error("Error occurred while generating class sessions for semester " + semesterId, e);
        }
    }

    private LocalDate calculateSessionDate(LocalDate weekStartDate, String dayOfWeekCode) {
        int startDayIndex = weekStartDate.getDayOfWeek().getValue() - 1; // Monday = 0, Sunday = 6
        int targetDayIndex = getDayOfWeekIndex(dayOfWeekCode);
        int offset = (targetDayIndex - startDayIndex + 7) % 7;
        return weekStartDate.plusDays(offset);
    }

    private int getDayOfWeekIndex(String code) {
        return switch (code.toUpperCase()) {
            case "MON" -> 0;
            case "TUE" -> 1;
            case "WED" -> 2;
            case "THU" -> 3;
            case "FRI" -> 4;
            case "SAT" -> 5;
            case "SUN" -> 6;
            default -> throw new IllegalArgumentException("Unknown day of week: " + code);
        };
    }
}
