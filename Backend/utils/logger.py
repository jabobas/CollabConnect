import logging
import os

LOG_DIR = os.path.join(os.path.dirname(__file__), '../logs')
LOG_FILE = os.path.join(LOG_DIR, 'app.log')

if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('CollabConnectBackend')

# Checkpoint counter
_log_counter = 0
_checkpoint_interval = 50  # Create checkpoint every 50 log messages

def _auto_checkpoint():
    """Automatically create checkpoint after interval"""
    global _log_counter
    _log_counter += 1
    if _log_counter % _checkpoint_interval == 0:
        logger.info(f"=== AUTO CHECKPOINT [{_log_counter}] ===")

def log_info(message):
    logger.info(message)
    _auto_checkpoint()

def log_error(message):
    logger.error(message)
    _auto_checkpoint()

def log_warning(message):
    logger.warning(message)
    _auto_checkpoint()

def log_checkpoint(checkpoint_id, context=None):
    """Log a checkpoint marker for recovery purposes"""
    if context:
        logger.info(f"=== CHECKPOINT [{checkpoint_id}] === | Context: {context}")
    else:
        logger.info(f"=== CHECKPOINT [{checkpoint_id}] ===")
