package com.ptit.qlphonghoc.staff.dto.class_section;

public class StaffSectionTableResponse {
    private Integer id;
    private String classCode;
    private String courseName;
    private String facultyCode;
    
    // THÊM TRƯỜNG NÀY VÀO ĐÂY
    private String departmentCode; 

    private Integer credits;
    private Integer studentCount;
    private String lecturerName;
    private String day;
    private String dayCode;
    private Integer slot;
    private String schedule;
    private Integer classroomId;
    private String room;
    private String allocationStatus;
    private String statusText;
    private String sectionStatus;
    private Integer semesterId;
    private Integer courseId;
    private Integer lecturerId;
    private Integer maxCapacity;

    // --- GETTERS & SETTERS ---

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getFacultyCode() { return facultyCode; }
    public void setFacultyCode(String facultyCode) { this.facultyCode = facultyCode; }

    // THÊM GETTER/SETTER CHO DEPARTMENT MỚI
    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }

    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }

    public Integer getStudentCount() { return studentCount; }
    public void setStudentCount(Integer studentCount) { this.studentCount = studentCount; }

    public String getLecturerName() { return lecturerName; }
    public void setLecturerName(String lecturerName) { this.lecturerName = lecturerName; }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public String getDayCode() { return dayCode; }
    public void setDayCode(String dayCode) { this.dayCode = dayCode; }

    public Integer getSlot() { return slot; }
    public void setSlot(Integer slot) { this.slot = slot; }

    public String getSchedule() { return schedule; }
    public void setSchedule(String schedule) { this.schedule = schedule; }

    public Integer getClassroomId() { return classroomId; }
    public void setClassroomId(Integer classroomId) { this.classroomId = classroomId; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public String getAllocationStatus() { return allocationStatus; }
    public void setAllocationStatus(String allocationStatus) { this.allocationStatus = allocationStatus; }

    public String getStatusText() { return statusText; }
    public void setStatusText(String statusText) { this.statusText = statusText; }

    public String getSectionStatus() { return sectionStatus; }
    public void setSectionStatus(String sectionStatus) { this.sectionStatus = sectionStatus; }

    public Integer getSemesterId() { return semesterId; }
    public void setSemesterId(Integer semesterId) { this.semesterId = semesterId; }

    public Integer getCourseId() { return courseId; }
    public void setCourseId(Integer courseId) { this.courseId = courseId; }

    public Integer getLecturerId() { return lecturerId; }
    public void setLecturerId(Integer lecturerId) { this.lecturerId = lecturerId; }

    public Integer getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(Integer maxCapacity) { this.maxCapacity = maxCapacity; }
}