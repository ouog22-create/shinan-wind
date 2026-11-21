# 예산 알림(Pub/Sub)을 받으면 프로젝트 결제를 해제한다.
# 결제가 해제되면 유료 사용이 멈추고 이후 요금이 발생하지 않는다.
import base64
import json
import os

import functions_framework
from googleapiclient import discovery

PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
PROJECT_NAME = f"projects/{PROJECT_ID}"


@functions_framework.cloud_event
def stop_billing(cloud_event):
    payload = json.loads(base64.b64decode(cloud_event.data["message"]["data"]).decode())
    cost = payload.get("costAmount", 0)
    budget = payload.get("budgetAmount", 0)
    print(f"cost={cost} budget={budget}")

    # 사용 금액이 0원을 넘으면 차단
    if cost <= 0:
        return

    billing = discovery.build("cloudbilling", "v1", cache_discovery=False)
    info = billing.projects().getBillingInfo(name=PROJECT_NAME).execute()
    if not info.get("billingEnabled"):
        print("billing already disabled")
        return

    billing.projects().updateBillingInfo(
        name=PROJECT_NAME, body={"billingAccountName": ""}
    ).execute()
    print("billing disabled")
