package com.xuancong.student_management.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3FileService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    private final Region region = Region.AP_SOUTHEAST_1;

    public String uploadFile(MultipartFile file) throws IOException {

        String originalFilename = file.getOriginalFilename();

        String extension = "";

        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(
                    originalFilename.lastIndexOf(".") + 1);
        }

        String key = "docs/"
                + UUID.randomUUID()
                + "."
                + extension;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(
                request,
                RequestBody.fromInputStream(
                        file.getInputStream(),
                        file.getSize()
                )
        );

        String url = s3Client.utilities()
                .getUrl(builder ->
                        builder.bucket(bucketName)
                                .key(key))
                .toExternalForm();

        return url;
    }

    public String uploadThumbnail(MultipartFile file) throws IOException {
        String key = "thumbnails/" + UUID.randomUUID() + ".jpg";
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("image/jpeg")
                .build();

        s3Client.putObject(
                request,
                RequestBody.fromInputStream(file.getInputStream(), file.getSize())
        );
        return key;
    }

    public String uploadThumbnailBytes(byte[] bytes) {
        String key = "thumbnails/" + UUID.randomUUID() + ".jpg";
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("image/jpeg")
                .build();

        s3Client.putObject(
                request,
                RequestBody.fromBytes(bytes)
        );
        return key;
    }

    public byte[] downloadFile(String keyOrUrl) {
        if (keyOrUrl == null || keyOrUrl.isBlank()) {
            throw new IllegalArgumentException("Key or URL cannot be empty");
        }
        String key = keyOrUrl;
        if (keyOrUrl.contains("docs/")) {
            key = keyOrUrl.substring(keyOrUrl.indexOf("docs/"));
        } else if (keyOrUrl.contains("thumbnails/")) {
            key = keyOrUrl.substring(keyOrUrl.indexOf("thumbnails/"));
        }
        var getObjectRequest = software.amazon.awssdk.services.s3.model.GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
        return s3Client.getObjectAsBytes(getObjectRequest).asByteArray();
    }

    public String generatePresignedUrl(String keyOrUrl, Duration expiration) {
        if (keyOrUrl == null || keyOrUrl.isBlank() || s3Presigner == null) {
            return null;
        }
        try {
            String key = keyOrUrl;
            if (keyOrUrl.contains("docs/")) {
                key = keyOrUrl.substring(keyOrUrl.indexOf("docs/"));
            } else if (keyOrUrl.contains("thumbnails/")) {
                key = keyOrUrl.substring(keyOrUrl.indexOf("thumbnails/"));
            }
            final String finalKey = key;
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(expiration != null ? expiration : Duration.ofMinutes(30))
                    .getObjectRequest(b -> b.bucket(bucketName).key(finalKey))
                    .build();
            return s3Presigner.presignGetObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.error("Error generating S3 presigned URL for key/url: {}", keyOrUrl, e);
            return null;
        }
    }

    public void deleteFile(String keyOrUrl) {
        if (keyOrUrl == null || keyOrUrl.isBlank()) {
            return;
        }
        String key = keyOrUrl;
        if (keyOrUrl.contains("docs/")) {
            key = keyOrUrl.substring(keyOrUrl.indexOf("docs/"));
        } else if (keyOrUrl.contains("thumbnails/")) {
            key = keyOrUrl.substring(keyOrUrl.indexOf("thumbnails/"));
        }
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3Client.deleteObject(deleteObjectRequest);
            log.info("Deleted S3 object successfully: key={}", key);
        } catch (Exception e) {
            log.error("Failed to delete S3 object key={}: {}", key, e.getMessage());
        }
    }
}