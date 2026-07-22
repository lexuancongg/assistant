import time
from google.genai.errors import ServerError

def retry(callable_fn, max_retry=5):
    for i in range(max_retry):
        try:
            return callable_fn()

        except ServerError:
            if i == max_retry - 1:
                raise

            time.sleep(2 ** i)
