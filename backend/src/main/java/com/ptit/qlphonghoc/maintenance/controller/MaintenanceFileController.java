package com.ptit.qlphonghoc.maintenance.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/maintenance-files")
public class MaintenanceFileController {

    private static final long MAX_FILE_SIZE = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private final Path uploadDirectory = Path.of("uploads", "maintenance").toAbsolutePath().normalize();

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File anh khong duoc de trong.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File anh khong duoc vuot qua 5MB.");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi ho tro anh jpg, jpeg, png, gif, webp.");
        }

        try {
            Files.createDirectories(uploadDirectory);
            String filename = UUID.randomUUID() + "." + extension;
            Path destination = uploadDirectory.resolve(filename).normalize();
            if (!destination.startsWith(uploadDirectory)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten file khong hop le.");
            }
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            return Map.of(
                    "fileName", filename,
                    "imageUrl", "/api/maintenance-files/" + filename
            );
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong luu duoc file anh.");
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> view(@PathVariable String filename) {
        try {
            Path filePath = uploadDirectory.resolve(filename).normalize();
            if (!filePath.startsWith(uploadDirectory) || !Files.exists(filePath)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay file anh.");
            }

            Resource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(resource);
        } catch (MalformedURLException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay file anh.");
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong doc duoc file anh.");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
