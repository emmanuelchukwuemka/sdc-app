import sqlite3
import os
import sys

# Add parent to path to import src if needed, but here we use direct sqlite
def migrate():
    # Database paths to check
    paths = ['instance/sdc_dev.db', 'sdc_dev.db']
    db_path = None
    for p in paths:
        if os.path.exists(p):
            db_path = p
            break
            
    if db_path:
        print(f"Migrating database: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current columns
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'first_name' not in columns:
            print("Adding first_name to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN first_name VARCHAR(255)")
            
        if 'last_name' not in columns:
            print("Adding last_name to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN last_name VARCHAR(255)")
        
        if 'profile_image' not in columns:
            print("Adding profile_image to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN profile_image VARCHAR(500)")
            
        if 'referral_code' not in columns:
            print("Adding referral_code to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN referral_code VARCHAR(20)")
            
        if 'referred_by_id' not in columns:
            print("Adding referred_by_id to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN referred_by_id VARCHAR(36)")
            
        conn.commit()
        conn.close()
        print("Migration complete!")
    else:
        print("Database not found, skip migration.")

if __name__ == "__main__":
    migrate()
