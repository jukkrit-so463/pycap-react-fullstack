-- ไฟล์: mysql-init/init.sql

-- คำสั่งนี้จะสร้างหรืออัปเดตผู้ใช้ที่คุณระบุ
-- และกำหนดให้ใช้ 'mysql_native_password' สำหรับการตรวจสอบสิทธิ์
-- ซึ่งเข้ากันได้กับ Node.js MySQL driver ที่คุณใช้
ALTER USER 'app_user'@'%' IDENTIFIED WITH mysql_native_password BY 'Sompan2528***';

-- บังคับให้ MySQL Reload Privileges ทันที
FLUSH PRIVILEGES;

-- (Optional) ถ้าคุณต้องการให้ root user ก็ใช้ mysql_native_password ด้วย
-- ซึ่งบางครั้งอาจช่วยในการ Debug ได้ หากคุณเคยใช้ root
-- ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_root_password';
-- ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'your_root_password';