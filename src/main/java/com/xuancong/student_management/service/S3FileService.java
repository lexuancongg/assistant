package com.xuancong.student_management.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3FileService {

    private final S3Client s3Client;

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
}