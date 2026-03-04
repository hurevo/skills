---
title: AI Architecture
impact: HIGH
tags: [ai, architecture, rag, separation-of-concerns, fallback]
---

# AI Architecture

Retrieval and generation are separate, independently testable units. The system degrades gracefully when the model API is unavailable. Raw LLM output is never exposed to users without sanitisation.

## Why

- **Testability**: Separated retrieval and generation can each be unit-tested with fixtures — no live API call needed.
- **Resilience**: When OpenAI has an outage, a graceful degradation response is better than a 500 error.
- **Safety**: Raw LLM output can contain hallucinations, injection attempts, or inappropriate content that must be filtered before display.

## Pattern

```python
# Bad — retrieval and generation coupled, no fallback, raw output to user
def answer(query: str) -> str:
    docs = vectorstore.search(query)
    prompt = f"Context: {docs}\nQuestion: {query}"
    return openai.complete(prompt)  # raw output, no fallback

# Good — separated, with relevance threshold and fallback
FALLBACK = "I don't have information on that topic. Please contact support."
RELEVANCE_THRESHOLD = 0.70

class RetrievalService:
    def retrieve(self, query: str) -> list[Chunk]:
        return self.vectorstore.search(query, top_k=5)

class GenerationService:
    def generate(self, query: str, chunks: list[Chunk]) -> str:
        if not chunks or chunks[0].score < RELEVANCE_THRESHOLD:
            return FALLBACK
        prompt = self.build_prompt(query, chunks)
        try:
            raw = self.llm.complete(prompt, max_tokens=512)
            return self.sanitise(raw)
        except LLMUnavailableError:
            return FALLBACK

    def sanitise(self, text: str) -> str:
        # Strip prompt-injection attempts, HTML, excessive whitespace
        return bleach.clean(text, strip=True).strip()

# Orchestrator
class ChatService:
    def answer(self, user_id: str, query: str) -> str:
        self.rate_limiter.check(user_id)
        chunks = self.retrieval.retrieve(query)
        return self.generation.generate(query, chunks)
```

```python
# Dependency injection for testability
def test_generation_returns_fallback_when_no_chunks():
    svc = GenerationService(llm=MockLLM())
    result = svc.generate("What is X?", chunks=[])
    assert result == FALLBACK

def test_generation_returns_fallback_on_low_relevance():
    low_score_chunk = Chunk(text="...", score=0.40)
    svc = GenerationService(llm=MockLLM())
    result = svc.generate("What is X?", chunks=[low_score_chunk])
    assert result == FALLBACK
```

## Rules

1. Retrieval and generation must be separate classes/functions — do not inline vector search inside the LLM call.
2. Define a single fallback response string for each AI feature — return it on low relevance, LLM errors, and rate limit exceeded.
3. Never return raw LLM output to users — pass through a sanitisation step (strip HTML, injection patterns, excessive whitespace).
4. Inject the LLM client as a dependency so the service is testable without a live API call.
5. Wrap all LLM API calls in try/except — catch rate limit errors, timeout errors, and API unavailable errors separately.
6. Log every LLM call with token usage, latency, and model name — essential for cost monitoring and debugging.
