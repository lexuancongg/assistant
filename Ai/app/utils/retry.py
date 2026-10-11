import time
import logging
from google.genai.errors import ServerError, ClientError, APIError

logger = logging.getLogger(__name__)

def retry(callable_fn, max_retry=4):
    for i in range(max_retry):
        try:
            return callable_fn()
        except (ServerError, ClientError, APIError) as e:
            msg = str(e)
            code = getattr(e, 'code', getattr(e, 'status_code', None))
            if code == 404 or '404' in msg or 'not found' in msg.lower() or 'RESOURCE_EXHAUSTED' in msg or 'quota' in msg.lower():
                raise
            if i == max_retry - 1:
                raise
            wait_time = (2 ** i) + 1
            logger.info(f"Retrying Gemini API call (attempt {i+1}/{max_retry}) after {wait_time}s due to: {e}")
            time.sleep(wait_time)
