import requests
import time

def perform_check(url, headers, timeout_ms):
    start = time.time()
    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=timeout_ms / 1000
        )
        elapsed = int((time.time() - start) * 1000)
        return response.status_code, elapsed
    except requests.RequestException:
        elapsed = int((time.time() - start) * 1000)
        return None, elapsed
