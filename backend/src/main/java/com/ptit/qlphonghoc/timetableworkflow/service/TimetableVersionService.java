package com.ptit.qlphonghoc.timetableworkflow.service;

import com.ptit.qlphonghoc.timetableworkflow.entity.TimetableVersion;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableVersionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TimetableVersionService {

    private final TimetableVersionRepository repository;

    public TimetableVersionService(TimetableVersionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public synchronized void createVersion(Long semesterId, Integer userId, String summary) {
        Integer maxVersion = repository.findMaxVersionNo(semesterId);
        int nextVersion = (maxVersion == null) ? 1 : maxVersion + 1;
        repository.save(semesterId, nextVersion, userId, summary);
    }

    @Transactional(readOnly = true)
    public List<TimetableVersion> getVersions(Integer semesterId, String search) {
        return repository.findAll(semesterId, search);
    }
}
