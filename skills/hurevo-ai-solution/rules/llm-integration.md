---
title: LLM Integration
impact: HIGH
tags: [llm, openai, anthropic, tokens, retry, cost]
---

# LLM Integration

Set `max_tokens` on every call. Use structured output for programmatically-parsed responses. Retry with exponential backoff on rate limits. Use the cheapest model that meets the quality bar.

## Why

- **Cost control**: Without `max_tokens`, a single runaway prompt can consume thousands of tokens unnecessarily.
- **Reliability**: LLM APIs rate-limit aggressively. Immediate retry makes the problem worse; exponential backoff lets the API recover.
- **Parsing safety**: Unstructured text responses are fragile to parse. Structured output (`response_format: json_object`) guarantees a parseable response.

## Pattern

```python
# Bad — no token limit, no retry, most expensive model, plain text output
def classify_document(text: str) -> str:
    response = openai.chat.completions.create(
        model="gpt-4o",  # most expensive, not benchmarked
        messages=[{"role": "user", "content": f"Classify: {text}"}],
        # no max_tokens
    )
    # parse free-text — fragile
    return "invoice" if "invoice" in response.choices[0].message.content else "other"

# Good — explicit limits, cheapest benchmarked model, structured output, retry
import time
from openai import RateLimitError, APITimeoutError

MODELS = {
    "classify": "gpt-4o-mini",   # benchmarked: 97% accuracy at 1/10th the cost
    "summarise": "gpt-4o-mini",
    "extract":   "gpt-4o",       # requires higher reasoning
}

def classify_document(text: str) -> dict:
    for attempt in range(3):
        try:
            response = openai.chat.completions.create(
                model=MODELS["classify"],
                messages=[
                    {"role": "system", "content": CLASSIFY_SYSTEM_PROMPT},
                    {"role": "user",   "content": text[:4000]},  # truncate input too
                ],
                max_tokens=64,
                response_format={"type": "json_object"},
                temperature=0,  # deterministic for classification
            )
            return json.loads(response.choices[0].message.content)
        except RateLimitError:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt * 5)  # 5s, 10s, then raise
        except APITimeoutError:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
```

```python
# Structured output schema — define before writing the prompt
CLASSIFY_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "enum": ["invoice", "receipt", "contract", "other"]},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
    },
    "required": ["category", "confidence"],
}
```

## Rules

1. Set `max_tokens` on every LLM call — determine the maximum reasonable response length and set it explicitly.
2. Use `gpt-4o-mini` (or equivalent) by default; only escalate to `gpt-4o` after benchmarking shows the cheaper model fails the quality bar.
3. For any response you will parse programmatically, use `response_format: json_object` and define the schema in the system prompt.
4. Retry on `RateLimitError` and `APITimeoutError` with exponential backoff: wait `2^attempt * base_seconds` before each retry.
5. Truncate user-supplied input before including it in a prompt — never allow unbounded input to consume the context window.
6. Set `temperature=0` for classification, extraction, and any task where determinism matters; use higher values only for creative generation.
7. Log model name, token usage (`prompt_tokens`, `completion_tokens`), and latency for every call — required for cost attribution and debugging.
