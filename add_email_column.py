import sqlite3
import os

DB_PATH = 'database/expense_tracker.db'

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(budgets)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'email' not in columns:
            print("Adding email column to budgets table...")
            cursor.execute("ALTER TABLE budgets ADD COLUMN email VARCHAR(255)")
            
            # Backfill email from users table
            print("Backfilling email addresses...")
            cursor.execute("""
                UPDATE budgets 
                SET email = (SELECT email FROM users WHERE users.id = budgets.user_id)
            """)
            
            conn.commit()
            print("Migration successful: email column added and populated.")
        else:
            print("Column 'email' already exists in budgets table.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
