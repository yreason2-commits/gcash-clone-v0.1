# How to Reset MySQL Root Password

## Option 1: Using MySQL Command Line (if you have access)

1. Stop MySQL service
2. Start MySQL in safe mode:
   ```powershell
   mysqld --skip-grant-tables
   ```
3. In another terminal, connect:
   ```powershell
   mysql -u root
   ```
4. Reset password:
   ```sql
   USE mysql;
   UPDATE user SET authentication_string=PASSWORD('newpassword') WHERE User='root';
   FLUSH PRIVILEGES;
   EXIT;
   ```
5. Restart MySQL normally

## Option 2: Using XAMPP

1. Open XAMPP Control Panel
2. Stop MySQL
3. Edit `mysql\bin\my.ini`
4. Add this line under `[mysqld]`:
   ```
   skip-grant-tables
   ```
5. Start MySQL
6. Connect without password:
   ```powershell
   mysql -u root
   ```
7. Run the UPDATE command above
8. Remove the `skip-grant-tables` line
9. Restart MySQL

## Option 3: Create New MySQL User (Easier)

Instead of resetting root password, create a new user:

```sql
CREATE USER 'gcash_user'@'localhost' IDENTIFIED BY 'your_new_password';
GRANT ALL PRIVILEGES ON gcashclone.* TO 'gcash_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update your `.env`:
```
DB_USER=gcash_user
DB_PASSWORD=your_new_password
```

