import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        ssl_disabled=os.getenv("DB_SSL_DISABLED", "False").lower() in ("true", "1", "yes")
    )

def get_last_status(cursor, service_id):
    cursor.execute(
        """
        SELECT status
        FROM checks
        WHERE service_id = %s
        ORDER BY checked_at DESC
        LIMIT 1
        """,
        (service_id,)
    )
    row = cursor.fetchone()
    return row[0] if row else None
