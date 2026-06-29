package com.ptit.qlphonghoc.admin.timetableimport.parser;

import org.springframework.web.multipart.MultipartFile;

public interface TimetableImportParser {
    ParsedImportFile parse(MultipartFile file);
}
