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

            is_rate_limit = (
                code == 429
                or "429" in msg
                or "RESOURCE_EXHAUSTED" in msg
                or "resource_exhausted" in msg.lower()
                or "quota" in msg.lower()
            )
            is_fatal_client_error = (
                (code in {400, 401, 403, 404} or "not found" in msg.lower())
                and not is_rate_limit
            )
            if is_fatal_client_error:
                raise
            if i == max_retry - 1:
                raise
            wait_time = (2 ** (i + 1)) + (2 if is_rate_limit else 0)
            logger.info(f"Retrying Gemini API call (attempt {i+1}/{max_retry}) after {wait_time}s due to: {e}")
            time.sleep(wait_time)
