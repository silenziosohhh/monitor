import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="mysql-1b89fbbc-neirly-1f0b.h.aivencloud.com",
        port=12792,
        user="avnadmin",
        password="AVNS_WFVVRKoptRF2XSo8wm2",
        database="defaultdb",
        ssl_disabled=False
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
