import json

def load_config(path="config/monitoring.json"):
    with open(path, "r") as f:
        return json.load(f)
