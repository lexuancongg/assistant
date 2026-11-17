@echo off
cd /d "%~dp0"
set GOOGLE_CLIENT_ID=328719666150-q2jcea6fk54u1q71soo2puql4lgvbs8i.apps.googleusercontent.com
call .\mvnw.cmd spring-boot:run
