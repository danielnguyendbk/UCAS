package com.ptit.qlphonghoc.timetableworkflow.service;

public interface TimetableMutationPolicy {

    void assertOriginalTimetableMutable(Integer semesterId);
}
