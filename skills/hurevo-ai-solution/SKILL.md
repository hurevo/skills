---
name: hurevo-ai-solution
description: Load for RAG chatbots, document intelligence, and AI-ready application projects. Covers pipeline architecture, LLM integration, and PII handling.
---

# Hurevo AI Solution

RAG, chatbot, and document intelligence standards for Hurevo AI Solutions projects. Contains 4 rules covering architecture, RAG pipeline design, LLM integration, and security.

## When to Apply

- Building RAG pipelines, chatbots, or document intelligence features
- Integrating OpenAI, Anthropic, or open-source models
- Any feature that sends user data to an external LLM API

## Rules Summary

### Architecture (HIGH)

#### ai-architecture - @rules/ai-architecture.md

Separate retrieval from generation — they are independently testable units. Degrade gracefully when the model API is unavailable. Never expose raw LLM output to users without sanitisation.

```python
# Bad — retrieval and generation coupled, no fallback
def answer(query: str) -> str:
    docs = vectorstore.search(query)
    return llm.complete(f"{docs}\n{query}")

# Good — separated, with fallback
def retrieve(query: str) -> list[Chunk]:
    return vectorstore.search(query, top_k=5)

def generate(query: str, chunks: list[Chunk]) -> str:
    if not chunks or max(c.score for c in chunks) < 0.70:
        return "I don't have information on that."
    return llm.complete(build_prompt(query, chunks))
```

### RAG Pipeline (HIGH)

#### rag-pipeline - @rules/rag-pipeline.md

512-token chunks with 50-token overlap. Pin embedding model name and version — changing it requires re-embedding. Relevance threshold of 0.70 before passing to LLM.

```python
# Bad — no threshold, hallucination risk
chunks = vectorstore.search(query, top_k=5)
return llm.complete(prompt_with(chunks))

# Good — threshold check
chunks = vectorstore.search(query, top_k=5)
if not chunks or chunks[0].score < 0.70:
    return FALLBACK_RESPONSE
return llm.complete(prompt_with(chunks))
```

### LLM Integration (HIGH)

#### llm-integration - @rules/llm-integration.md

Set `max_tokens` on every call. Use structured output for any programmatically-parsed response. Exponential backoff on rate limits. Cheapest model that meets the quality bar.

```python
# Bad — no token limit, no retry
response = openai.chat.complete(model="gpt-4o", messages=messages)

# Good — explicit limits, retry with backoff
response = openai.chat.complete(
    model="gpt-4o-mini",  # benchmarked first
    messages=messages,
    max_tokens=512,
    response_format={"type": "json_object"},
)
```

### Security (HIGH)

#### ai-security - @rules/ai-security.md

Sanitise user inputs before including in prompts. Mask PII before storing in the vector store. Never send PII to an LLM API without documented client consent. Per-user rate limiting on all AI endpoints.

```python
# Bad — raw user input in prompt, no rate limit
prompt = f"Answer this: {user_query}"
return llm.complete(prompt)

# Good — sanitised input, rate limited
sanitised = sanitise_for_prompt(user_query)
check_rate_limit(user_id)
prompt = build_system_prompt(sanitised)
return llm.complete(prompt)
```
