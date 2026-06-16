package com.ptit.qlphonghoc.lecturer.dto.roomborrow;

public class LecturerClubLookupResponse {

    private Integer clubId;
    private String clubCode;
    private String clubName;
    private Boolean advisor;

    public Integer getClubId() {
        return clubId;
    }

    public void setClubId(Integer clubId) {
        this.clubId = clubId;
    }

    public String getClubCode() {
        return clubCode;
    }

    public void setClubCode(String clubCode) {
        this.clubCode = clubCode;
    }

    public String getClubName() {
        return clubName;
    }

    public void setClubName(String clubName) {
        this.clubName = clubName;
    }

    public Boolean getAdvisor() {
        return advisor;
    }

    public void setAdvisor(Boolean advisor) {
        this.advisor = advisor;
    }
}
