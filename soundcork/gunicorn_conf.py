# gunicorn_conf.py
from multiprocessing import cpu_count

from soundcork.config import Settings

settings = Settings()
port = settings.port

bind = f"0.0.0.0:{port}"

# Worker Options
workers = cpu_count() + 1
worker_class = "uvicorn.workers.UvicornWorker"

# Logging Options
# FIXME: make these all configurable in conf
loglevel = "debug"
accesslog = "/tmp/soundcork_access.log"
errorlog = "/tmp/soundcork_error.log"
