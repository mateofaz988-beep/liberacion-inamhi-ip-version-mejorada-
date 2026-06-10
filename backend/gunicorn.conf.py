import multiprocessing

bind        = "127.0.0.1:5050"
workers     = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
threads     = 2
timeout     = 120
keepalive   = 5

accesslog   = "logs/access.log"
errorlog    = "logs/error.log"
loglevel    = "info"
capture_output = True

preload_app = True
