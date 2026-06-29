package com.ptit.qlphonghoc.admin.timetableimport.parser;

import java.util.List;
import java.util.Map;

public record ParsedImportFile(List<Map<String, String>> rows, List<Integer> rowNumbers) {
}
