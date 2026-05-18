package com.ptit.qlphonghoc.student.dto.roomborrow;

public class StudentClubLookupResponse {

    private Integer clubId;
    private String clubCode;
    private String clubName;
    private Boolean representative;

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

    public Boolean getRepresentative() {
        return representative;
    }

    public void setRepresentative(Boolean representative) {
        this.representative = representative;
    }
}
