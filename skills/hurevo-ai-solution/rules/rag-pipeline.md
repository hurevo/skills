---
title: RAG Pipeline
impact: HIGH
tags: [rag, embeddings, chunking, retrieval, vectorstore]
---

# RAG Pipeline

512-token chunks with 50-token overlap. Embedding model name and version are pinned — changing them requires re-embedding the entire corpus. Apply a relevance threshold of 0.70 before passing chunks to the LLM.

## Why

- **Quality**: 512-token chunks are large enough to carry meaning but small enough to remain topically focused. 50-token overlap prevents relevant context from being split at chunk boundaries.
- **Consistency**: Changing the embedding model without re-embedding produces mismatched vector spaces — queries return semantically wrong results silently.
- **Accuracy**: Passing low-relevance chunks to the LLM increases hallucination risk. A threshold prevents the LLM from inventing answers when no relevant content exists.

## Pattern

```python
# Bad — no overlap, no threshold, unpinned model
EMBEDDING_MODEL = "text-embedding-ada-002"  # no version pin
CHUNK_SIZE = 1000  # too large, no overlap

def ingest_document(text: str) -> None:
    chunks = split_text(text, size=CHUNK_SIZE)  # no overlap
    embeddings = embed(chunks, model=EMBEDDING_MODEL)
    vectorstore.upsert(chunks, embeddings)

def answer(query: str) -> str:
    chunks = vectorstore.search(query, top_k=5)  # no threshold check
    return llm.complete(prompt_with(chunks))  # may use irrelevant chunks

# Good — pinned model, overlapping chunks, relevance threshold
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_MODEL_VERSION = "2024-02-01"
CHUNK_SIZE = 512
CHUNK_OVERLAP = 50
RELEVANCE_THRESHOLD = 0.70

def ingest_document(doc_id: str, text: str) -> None:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    chunks = splitter.split_text(text)
    embeddings = embed(chunks, model=EMBEDDING_MODEL)
    vectorstore.upsert(
        ids=[f"{doc_id}-{i}" for i in range(len(chunks))],
        documents=chunks,
        embeddings=embeddings,
        metadatas=[{"doc_id": doc_id, "embedding_model": EMBEDDING_MODEL} for _ in chunks],
    )

def retrieve(query: str) -> list[Chunk]:
    results = vectorstore.search(
        query_embeddings=embed([query], model=EMBEDDING_MODEL),
        n_results=5,
    )
    return [
        Chunk(text=doc, score=score, doc_id=meta["doc_id"])
        for doc, score, meta in zip(results["documents"][0], results["distances"][0], results["metadatas"][0])
        if score >= RELEVANCE_THRESHOLD
    ]
```

```python
# When changing embedding model — re-embed the entire corpus
def migrate_embeddings(new_model: str) -> None:
    docs = vectorstore.get_all()
    vectorstore.clear()
    # Re-ingest all documents with the new model
    for doc in docs:
        ingest_document(doc["doc_id"], doc["text"])
    settings.EMBEDDING_MODEL = new_model
    settings.save()
```

## Rules

1. Use 512 tokens for chunk size and 50 tokens for overlap — adjust only after benchmarking on project-specific data.
2. Store the embedding model name and version in document metadata so you know which model produced each vector.
3. Pin the embedding model to a specific version — treat model version changes as a breaking change requiring full re-embedding.
4. Apply a relevance threshold of at minimum 0.70 before passing chunks to the LLM — return the fallback response if no chunks pass.
5. Use `RecursiveCharacterTextSplitter` (or equivalent) — not fixed-size splitting — to respect sentence and paragraph boundaries.
6. Implement a re-indexing pipeline that can re-embed the full corpus when the embedding model changes.
7. Track total chunks, average relevance score, and threshold-miss rate in your monitoring dashboard.
