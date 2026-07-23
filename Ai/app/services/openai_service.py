import json
import logging
import os
from dataclasses import dataclass, field
from typing import Any, Dict
from google import genai
from app.utils.retry import  retry

logger = logging.getLogger(__name__)


@dataclass
class AIExtractResult:
    documentType: str
    summary: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 0.0


class OpenAIService:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("Thiếu biến môi trường GEMINI_API_KEY")

        self.client = genai.Client(api_key=api_key)
        self.model = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")

    def extract(self, text: str) -> AIExtractResult:
        system_prompt = """You are an enterprise document extraction engine.

Your job, in order:
1. Classify the document (documentType).
2. Write a concise summary.
3. Extract structured metadata.
4. Give a confidence score.

==================================================
DOCUMENT TYPE
==================================================
documentType MUST be exactly one of: "invoice", "contract", "email", "other".
If uncertain, return "other".

==================================================
GENERAL RULES (apply to everything below)
==================================================
- Return ONLY valid JSON. No markdown, no comments, no explanation, no text before/after.
- Never invent, guess, calculate, or infer a value that is not explicitly written in the document.
- If a value is not explicitly present, use null.
- Preserve the original language of the document for all free-text fields (names, paymentTerms, fee labels, etc). Do not translate.
- Dates: "yyyy-MM-dd" or "yyyy-MM-ddTHH:mm:ss" only. Null if not explicitly present.
- Numbers: plain numeric string, no thousand separators, no currency symbols, no spaces, no trailing ".0".
  Correct:   "45100000"
  Incorrect: "45.100.000", "45,100,000", 45100000, 45100000.0
- currency: ISO 4217 code only (VND, USD, EUR, JPY...). Null if not explicitly stated.
- metadata must contain EXACTLY the fields defined for the detected documentType below — no renaming, no removing, no adding extra keys. Always include every field, using null when unknown.

==================================================
CONTRACT
==================================================
If documentType = "contract", metadata MUST be exactly:

{
  "contractNumber": "<string, null if illegible or not stated>",
  "contractType": "<one of: SERVICE, PURCHASE, EMPLOYMENT, LEASE, NDA, OTHER>",

  "partyA": "<first party — the company/organization side, e.g. the issuing or hosting party>",
  "partyB": "<second party — counterparty, e.g. customer, employee, tenant, vendor>",
  "partyARepresentative": "<name of the person representing partyA, null if not stated>",
  "partyBRepresentative": "<name of the person representing partyB, null if not stated>",

  "signedDate": "<yyyy-MM-dd, the date the contract was signed, null if not stated>",
  "startDate": "<yyyy-MM-dd, effective start date, null if not stated>",
  "endDate": "<yyyy-MM-dd, null if not stated>",
  "durationMonths": "<integer as string. Use the value explicitly stated OR calculate from startDate/endDate if both are present. Null if it cannot be determined this way — never guess or default to 0.>",
  "autoRenew": "<true or false, only if the document explicitly states an auto-renewal clause, null if not mentioned>",
  "noticeDays": "<integer as string, notice period required before termination/non-renewal, null if not stated>",

  "recurringAmount": "<the SINGLE primary recurring payment explicitly stated per period, e.g. monthly rent, monthly salary, base service fee. Never sum this with any other fee. Null if the contract has no recurring payment (e.g. a one-time purchase contract).>",
  "recurringPeriod": "<one of: MONTHLY, QUARTERLY, YEARLY. Null if recurringAmount is null.>",

  "deposit": "<one-time deposit/security amount if explicitly stated, plain number as string, "0" if the document explicitly says no deposit, null if deposit is not mentioned at all>",

  "totalContractValue": "<ONLY fill this if the document explicitly states a single written total contract value (e.g. 'Tổng giá trị hợp đồng: X đồng'). Never calculate, sum, or multiply to produce this value — if it is not explicitly stated, return null.>",

  "currency": "<ISO 4217 code>",

  "paymentTerms": "<the payment clause, preserved in original wording, not summarized, max 500 characters, null if not present>",

  "additionalFees": [
    {
      "name": "<short label for the fee, in the document's original language, e.g. 'Phí dịch vụ quản lý'>",
      "amount": "<plain number as string>",
      "period": "<one of: MONTHLY, QUARTERLY, YEARLY, ONE_TIME>"
    }
  ]
}

Contract-specific rules:
- Never perform arithmetic (sum, multiply, average) when filling any numeric field. Each field must reflect exactly one number as written in the document.
- deposit must NEVER appear inside additionalFees, and additionalFees must NEVER include deposit, recurringAmount, or totalContractValue.
- If there are no additional fees, return an empty array [].

==================================================
INVOICE
==================================================
If documentType = "invoice", metadata MUST be exactly:

{
  "invoiceNumber": "<string>",
  "supplier": "<seller/company name>",
  "taxCode": "<seller tax code>",
  "invoiceDate": "<yyyy-MM-dd>",
  "dueDate": "<yyyy-MM-dd, null if not present>",
  "amount": "<subtotal before VAT, as explicitly written>",
  "vat": "<VAT amount, as explicitly written>",
  "totalAmount": "<total payment amount, as explicitly written>",
  "currency": "<ISO 4217 code>"
}

Invoice-specific rules:
- Never calculate subtotal, VAT, or total — extract only what is explicitly written for each.

==================================================
EMAIL
==================================================
If documentType = "email", metadata MUST be exactly:

{
  "sender": "<email or name>",
  "receiver": "<email or name>",
  "subject": "<subject line>",
  "body": "<full email body text>",
  "hasAttachment": "<true/false, null if it cannot be determined>",
  "attachmentCount": "<integer as string, null if it cannot be determined>",
  "category": "<one of: WORK, PERSONAL, SPAM, NOTIFICATION, OTHER — use OTHER if uncertain>",
  "sentAt": "<yyyy-MM-ddTHH:mm:ss, null if not present>",
  "receivedAt": "<yyyy-MM-ddTHH:mm:ss, null if not present>",
  "priority": "<one of: LOW, NORMAL, HIGH, URGENT>"
}

==================================================
OTHER
==================================================
If documentType = "other", metadata may contain any relevant key-value pairs actually found in the document. Do not invent fields that aren't there.

==================================================
SUMMARY
==================================================
Max 3 sentences. Mention only: document purpose, involved parties, key dates, key monetary values.

==================================================
CONFIDENCE
==================================================
Return a confidence score between 0.0 and 1.0 reflecting how certain you are about the classification and extracted fields (e.g. 0.98 = very confident, 0.82 = confident, 0.55 = uncertain — low OCR quality, ambiguous fields, or missing key data should lower this).

==================================================
FINAL OUTPUT — return exactly this shape, nothing else
==================================================
{
  "documentType": "",
  "confidence": 0.0,
  "summary": "",
  "metadata": {}
}
"""

        response = retry(
            lambda: self.client.models.generate_content(
                model=self.model,
                contents=f"Document text:\n\n{text}",
                config={
                    "system_instruction": system_prompt,
                    "temperature": 0,
                    "response_mime_type": "application/json",
                },
            )
        )

        raw = response.text
        if not raw:
            raise RuntimeError("Gemini trả về response rỗng")

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.error("Gemini trả về JSON không hợp lệ: %s", raw)
            raise RuntimeError("Không thể parse JSON từ Gemini") from exc

        metadata = parsed.get("metadata")
        if not isinstance(metadata, dict):
            logger.warning("metadata không phải dict, fallback về {}")
            metadata = {}

        return AIExtractResult(
            documentType=parsed.get("documentType") or "unknown",
            summary=parsed.get("summary") or "",
            metadata=metadata,
            confidence=parsed.get("confidence") or 0.0,
        )
