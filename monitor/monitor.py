import os
import json
import time
import requests
import mysql.connector
from datetime import datetime
from dotenv import load_dotenv

# Carica variabili d'ambiente per DB
load_dotenv(dotenv_path="api/.env")

CONFIG_PATH = "config/monitoring.json"

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

def load_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

def get_last_status(cursor, service_id):
    query = "SELECT status FROM checks WHERE service_id = %s ORDER BY checked_at DESC LIMIT 1"
    cursor.execute(query, (service_id,))
    result = cursor.fetchone()
    return result[0] if result else None

def log_event(cursor, service_id, new_status, old_status):
    event_type = None
    
    if old_status is None:
        return

    if new_status == 'offline' and old_status != 'offline':
        event_type = 'FAIL'
    elif new_status == 'degraded' and old_status == 'online':
        event_type = 'DEGRADED'
    elif new_status == 'online' and old_status != 'online':
        event_type = 'RECOVERY'
    
    if event_type:
        query = "INSERT INTO events (service_id, type, created_at) VALUES (%s, %s, %s)"
        cursor.execute(query, (service_id, event_type, datetime.now()))
        print(f"[{datetime.now()}] EVENTO {event_type} per Service ID {service_id}")

def check_service(service_row, config, db_conn):
    cursor = db_conn.cursor()
    
    s_id = service_row[0]
    name = service_row[1]
    url = service_row[2]
    
    service_conf = next((s for s in config.get('services', []) if s['id'] == s_id), {})
    headers = service_conf.get('headers', {})
    
    timeout = config.get('timeout_ms', 3000) / 1000.0
    degraded_threshold = config.get('degraded_threshold_ms', 1000)
    
    status = 'offline'
    http_code = 0
    response_time = 0
    
    try:
        start_time = time.time()
        response = requests.get(url, headers=headers, timeout=timeout)
        end_time = time.time()
        
        response_time = int((end_time - start_time) * 1000)
        http_code = response.status_code
        
        if http_code >= 400:
            status = 'offline'
        elif response_time > degraded_threshold:
            status = 'degraded'
        else:
            status = 'online'
            
    except requests.exceptions.RequestException as e:
        print(f"Connection error {name}: {e}")
        status = 'offline'
        response_time = 0

    # Recupera stato precedente per logica eventi
    old_status = get_last_status(cursor, s_id)
    
    # Inserisci Check
    insert_query = """
        INSERT INTO checks (service_id, status, http_code, response_time_ms, checked_at)
        VALUES (%s, %s, %s, %s, %s)
    """
    cursor.execute(insert_query, (s_id, status, http_code, response_time, datetime.now()))
    
    # Gestione Eventi
    log_event(cursor, s_id, status, old_status)
    
    db_conn.commit()
    cursor.close()
    print(f"Check {name}: {status} ({response_time}ms)")

def run_monitor():
    print("Starting Monitor Engine...")
    config = load_config()
    
    while True:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT id, name, base_url FROM services WHERE enabled = 1")
            services = cursor.fetchall()
            cursor.close()
            
            for service in services:
                check_service(service, config, conn)
            
            conn.close()
            
        except Exception as e:
            print(f"Critical error in loop: {e}")
        
        sleep_time = config.get('check_interval_sec', 30)
        print(f"Next call in {sleep_time} seconds...")
        time.sleep(sleep_time)

if __name__ == "__main__":
    run_monitor()