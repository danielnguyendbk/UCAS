package com.ptit.qlphonghoc.staff.dto.allocation;

import java.util.List;

public record PageResponse<T>(
        List<T> items,
        int page,
        int size,
        long totalItems,
        int totalPages
) {
    public static <T> PageResponse<T> from(List<T> items, Integer requestedPage, Integer requestedSize) {
        int page = requestedPage == null ? 0 : Math.max(0, requestedPage);
        int size = requestedSize == null ? 20 : Math.min(100, Math.max(1, requestedSize));
        int totalItems = items.size();
        int totalPages = totalItems == 0 ? 0 : (int) Math.ceil((double) totalItems / size);
        int fromIndex = Math.min(page * size, totalItems);
        int toIndex = Math.min(fromIndex + size, totalItems);

        return new PageResponse<>(items.subList(fromIndex, toIndex), page, size, totalItems, totalPages);
    }
}
