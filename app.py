from flask import Flask, jsonify, request, g
from prometheus_flask_exporter import PrometheusMetrics
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from requests.exceptions import ConnectionError, HTTPError, Timeout
from uuid import uuid4
import requests
import logging

# --- 1. 로깅 및 RequestID 설정 ---

# RequestID를 로그에 추가하기 위한 커스텀 필터
class RequestIdLogFilter(logging.Filter):
    def filter(self, record):
        try:
            # Flask의 g 객체에서 RequestID를 가져옵니다.
            record.request_id = g.request_id
        except RuntimeError:
            # Flask 컨텍스트 밖에서는 N/A
            record.request_id = 'N/A'
        return True

# 로깅 포맷에 RequestID 필드를 추가합니다.
LOG_FORMAT = '[%(asctime)s] [%(request_id)s] [%(levelname)s] %(message)s'
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger(__name__)

# 모든 로거 핸들러에 RequestID 필터 추가
for handler in logging.root.handlers:
    handler.addFilter(RequestIdLogFilter())


# --- 2. Flask 및 Metrics 초기화 ---
app = Flask(__name__)
metrics = PrometheusMetrics(app) # /metrics 엔드포인트 자동 생성


# --- 3. RequestID 미들웨어 구현 (작업: RequestID) ---

@app.before_request
def set_request_id():
    """요청 시작 시 RequestID를 설정합니다."""
    # 헤더에서 기존 ID 추출 시도, 없으면 새 ID 생성
    request_id = request.headers.get('X-Request-ID') or str(uuid4())
    g.request_id = request_id

    logger.info(f"Request started: {request.method} {request.path}")

@app.after_request
def log_response(response):
    """응답 후 Response 헤더에 RequestID를 추가합니다."""
    response.headers['X-Request-ID'] = g.request_id
    logger.info(f"Request finished with status: {response.status_code}")
    return response


# --- 4. /health 및 사용자 정의 Metrics 구현 (작업: /health /metrics) ---

# 사용자 정의 카운터: 이벤트 동기화 횟수 추적
EVENT_SYNC_COUNTER = metrics.counter(
    'event_sync_total',
    'Total number of event synchronizations (Success/Failure)',
    labels={'status': lambda: 'success' if True else 'failure'}
)

@app.route('/health', methods=['GET'])
def health_check():
    """
    (성공 조건: 상태 페이지 녹색) DB 및 외부 서비스 연결 상태를 확인합니다.
    """
    try:
        # TODO: 실제 DB 연결 상태를 확인하는 로직 추가
        # if not check_db_connection():
        #     raise Exception("Database connection failed")

        # TODO: 블록체인 노드 등 통합 서비스 연결 상태 확인 로직 추가

        return jsonify({"status": "UP", "services": ["database", "blockchain"]}), 200
    except Exception as e:
        logger.error(f"Health Check Failed: {e}")
        return jsonify({"status": "DOWN", "error": str(e)}), 500


# --- 5. 재시도 백오프 및 핵심 로직 (나머지 부분) ---

# 재시도할 예외 유형 정의
RETRYABLE_EXCEPTIONS = (ConnectionError, HTTPError, Timeout)

@retry(
    wait=wait_exponential(multiplier=1, min=2, max=30), # 지수 백오프: 2초부터 시작하여 최대 30초까지 대기
    stop=stop_after_attempt(5),                          # 최대 5회 시도 후 중단
    retry=retry_if_exception_type(RETRYABLE_EXCEPTIONS)
)
def attempt_event_sync(event_data):
    """
    외부 API(블록체인 노드 등) 통신 및 이벤트 동기화를 시도합니다.
    (여기에 재시도 로직이 들어갑니다.)
    """
    # ... (생략된 로직) ...

    # 예시: 3번 시도 후 성공하는 것으로 가정
    if not hasattr(g, 'retry_count'): g.retry_count = 0
    g.retry_count += 1

    if g.retry_count < 3:
        logger.warning(f"Event sync attempt {g.retry_count} failed. Retrying with backoff...")
        raise HTTPError("Simulated 503 Service Unavailable")

    logger.info("Event synchronization completed successfully.")
    return True

@app.route('/api/event/sync', methods=['POST'])
@metrics.counter('sync_endpoint_calls', 'Number of event sync calls')
def sync_event_api():
    """이벤트 동기화 API 엔드포인트"""
    try:
        event_data = request.json
        attempt_event_sync(event_data)

        EVENT_SYNC_COUNTER.labels(status='success').inc()
        g.retry_count = 0
        return jsonify({"message": "Event synchronization completed"}), 200
    except Exception as e:
        EVENT_SYNC_COUNTER.labels(status='failure').inc()
        g.retry_count = 0
        logger.error(f"Final Event Synchronization Failure: {e}")
        return jsonify({"error": "Event sync failed after retries"}), 503

# --- 6. 서버 실행 구문 (가장 중요) ---
if __name__ == '__main__':
    logger.info("Starting Capstone Backend B Server...")
    # Flask 서버를 구동하는 핵심 명령어
    app.run(host='0.0.0.0', port=5001, debug=True)