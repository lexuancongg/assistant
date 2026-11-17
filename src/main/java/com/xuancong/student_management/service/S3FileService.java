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

    public software.amazon.awssdk.core.ResponseInputStream<software.amazon.awssdk.services.s3.model.GetObjectResponse> downloadFileInputStream(String keyOrUrl) {
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
        return s3Client.getObject(getObjectRequest);
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
        return generatePresignedUrl(keyOrUrl, expiration, null);
    }

    public String generatePresignedUrl(String keyOrUrl, Duration expiration, String responseContentType) {
        return generatePresignedUrl(keyOrUrl, expiration, responseContentType, null);
    }

    public String generatePresignedUrl(String keyOrUrl, Duration expiration, String responseContentType, String responseContentDisposition) {
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
                    .getObjectRequest(b -> {
                        b.bucket(bucketName).key(finalKey);
                        if (responseContentType != null && !responseContentType.isBlank()) {
                            b.responseContentType(responseContentType);
                        }
                        if (responseContentDisposition != null && !responseContentDisposition.isBlank()) {
                            b.responseContentDisposition(responseContentDisposition);
                        }
                    })
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

    public String copyFile(String sourceKeyOrUrl, String newKey) {
        if (sourceKeyOrUrl == null || sourceKeyOrUrl.isBlank() || newKey == null || newKey.isBlank()) {
            return null;
        }
        String sourceKey = sourceKeyOrUrl;
        if (sourceKeyOrUrl.contains("docs/")) {
            sourceKey = sourceKeyOrUrl.substring(sourceKeyOrUrl.indexOf("docs/"));
        } else if (sourceKeyOrUrl.contains("thumbnails/")) {
            sourceKey = sourceKeyOrUrl.substring(sourceKeyOrUrl.indexOf("thumbnails/"));
        }
        try {
            software.amazon.awssdk.services.s3.model.CopyObjectRequest copyRequest =
                    software.amazon.awssdk.services.s3.model.CopyObjectRequest.builder()
                            .sourceBucket(bucketName)
                            .sourceKey(sourceKey)
                            .destinationBucket(bucketName)
                            .destinationKey(newKey)
                            .build();
            s3Client.copyObject(copyRequest);
            log.info("Copied S3 object successfully from {} to {}", sourceKey, newKey);
            return s3Client.utilities().getUrl(builder -> builder.bucket(bucketName).key(newKey)).toExternalForm();
        } catch (Exception e) {
            log.error("Failed to copy S3 object from {} to {}: {}", sourceKey, newKey, e.getMessage(), e);
            throw new RuntimeException("Lỗi sao chép file trên storage", e);
        }
    }


    public String uploadBytes(String key, byte[] bytes, String contentType) {
        if (key == null || bytes == null) return null;
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType != null ? contentType : "application/octet-stream")
                .build();

        s3Client.putObject(
                request,
                RequestBody.fromBytes(bytes)
        );

        return s3Client.utilities()
                .getUrl(builder -> builder.bucket(bucketName).key(key))
                .toExternalForm();
    }

}
