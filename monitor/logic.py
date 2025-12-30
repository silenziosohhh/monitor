from datetime import datetime

def classify_status(http_code, response_time, degraded_threshold):
    if http_code is None or http_code >= 500:
        return "offline"
    if response_time > degraded_threshold:
        return "degraded"
    return "online"

def store_check(cursor, service_id, status, http_code, response_time):
    cursor.execute(
        """
        INSERT INTO checks
        (service_id, status, http_code, response_time_ms, checked_at)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (service_id, status, http_code, response_time, datetime.utcnow())
    )

def store_event_if_needed(cursor, service_id, old_status, new_status):
    if old_status == new_status:
        return

    mapping = {
        "offline": "FAIL",
        "degraded": "DEGRADED",
        "online": "RECOVERY"
    }

    cursor.execute(
        """
        INSERT INTO events (service_id, type, created_at)
        VALUES (%s, %s, %s)
        """,
        (service_id, mapping[new_status], datetime.utcnow())
    )
