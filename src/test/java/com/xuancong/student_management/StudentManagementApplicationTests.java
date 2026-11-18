package com.xuancong.student_management;

import com.xuancong.student_management.dto.forders.FolderResponse;
import com.xuancong.student_management.entity.*;
import com.xuancong.student_management.entity.enums.FileVisibility;
import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;
import com.xuancong.student_management.repository.*;
import com.xuancong.student_management.service.FolderService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@SpringBootTest
class StudentManagementApplicationTests {

    @Autowired
    private FolderService folderService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private FileItemRepository fileItemRepository;

    @Autowired
    private FilePermissionRepository filePermissionRepository;

    @Test
    void contextLoads() {
    }

    @Test
    @Transactional
    void testFolderVisibilityAndFileException() {
        // 1. Lấy phòng ban RTE và RTW
        Department rtwDept = departmentRepository.findAll().stream()
                .filter(d -> d.getName().equalsIgnoreCase("RTW"))
                .findFirst()
                .orElse(null);

        // 2. Lấy user thường không thuộc RTE (gán vào RTW)
        User testUser = userRepository.findAll().stream()
                .filter(u -> u.getEmail().contains("congle"))
                .findFirst()
                .orElse(null);

        User uploaderUser = userRepository.findAll().stream()
                .filter(u -> u.getEmail().contains("admin"))
                .findFirst()
                .orElse(testUser);

        if (testUser != null && rtwDept != null) {
            testUser.setDepartment(rtwDept);
            userRepository.save(testUser);

            // Khi chưa có file nào được chia sẻ trong RTE:
            List<FolderResponse> tree = folderService.getTree(testUser);
            boolean containsRTE = tree.stream().anyMatch(f -> f.name().equalsIgnoreCase("RTE"));
            System.out.println("Tree size for RTW user: " + tree.size() + ", contains RTE: " + containsRTE);
            Assertions.assertFalse(containsRTE, "Thư mục RTE phải bị ẩn đối với user thuộc RTW");

            // 3. Bây giờ chia sẻ riêng 1 file nằm trong thư mục con SSG (id=5) cho user RTW
            Folder ssgFolder = folderRepository.findAll().stream()
                    .filter(f -> f.getName().equalsIgnoreCase("SSG"))
                    .findFirst()
                    .orElse(null);

            if (ssgFolder != null) {
                FileItem file = new FileItem();
                file.setName("Tai-lieu-chia-se-rieng.pdf");
                file.setFileType("pdf");
                file.setSizeBytes(1024L);
                file.setStoragePath("test/path/test.pdf");
                file.setCompany(testUser.getCompany());
                file.setFolder(ssgFolder);
                file.setUploadedBy(uploaderUser);
                file.setVisibility(FileVisibility.RESTRICTED);
                fileItemRepository.save(file);

                FilePermission perm = new FilePermission();
                perm.setFile(file);
                perm.setSubjectType(PermissionSubjectType.USER);
                perm.setSubjectId(testUser.getId());
                perm.setLevel(PermissionLevel.VIEWER);
                filePermissionRepository.save(perm);

                // Sau khi có file được chia sẻ riêng, cây thư mục dẫn đến SSG phải hiển thị:
                List<FolderResponse> newTree = folderService.getTree(testUser);
                FolderResponse rteRoot = newTree.stream()
                        .filter(f -> f.name().equalsIgnoreCase("RTE"))
                        .findFirst()
                        .orElse(null);

                Assertions.assertNotNull(rteRoot, "Thư mục tổ tiên RTE phải hiển thị khi có file được chia sẻ bên trong");
                Assertions.assertNotNull(rteRoot.children(), "RTE phải có children");
                
                FolderResponse projectFolder = rteRoot.children().stream()
                        .filter(c -> c.name().equalsIgnoreCase("PROJECT"))
                        .findFirst()
                        .orElse(null);
                Assertions.assertNotNull(projectFolder, "PROJECT phải hiển thị trong nhánh RTE");

                FolderResponse ssgChild = projectFolder.children().stream()
                        .filter(c -> c.name().equalsIgnoreCase("SSG"))
                        .findFirst()
                        .orElse(null);
                Assertions.assertNotNull(ssgChild, "SSG phải hiển thị để truy cập file");

                // Thư mục KANBEE không có quyền và không có file chia sẻ phải bị ẩn:
                boolean containsKanbee = projectFolder.children().stream()
                        .anyMatch(c -> c.name().equalsIgnoreCase("KANBEE"));
                Assertions.assertFalse(containsKanbee, "KANBEE không có file chia sẻ và không có quyền phải bị ẩn");

                System.out.println("✅ TẤT CẢ KIỂM THỬ THƯ MỤC VÀ NGOẠI LỆ FILE ĐÃ PASS HOÀN HẢO!");
            }
        }
    }
}
