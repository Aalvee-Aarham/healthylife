# HealthyLife Policy Assistant — RAG Demo

**Retrieval-Augmented Generation with LangChain, MongoDB Atlas Vector Search and Groq (Qwen)**

---

## 1. Overview

The HealthyLife Policy Assistant answers questions about the company's policy handbook in plain language, for example *"Can I get a refund if I cancel my annual plan?"* or *"How many days of leave do employees get?"*

A language model on its own does not know HealthyLife's policies and may invent an answer. Retrieval-Augmented Generation (RAG) fixes this. For each question, the system looks up the most relevant passages in the handbook and gives only those passages to the model. The model then answers from the handbook text and cites the page it used.

| Item | Value |
|---|---|
| Source document | *HealthyLife Company Policy Handbook v3.0* (4 pages, 11 sections) |
| Framework | LangChain |
| Vector database | MongoDB Atlas Vector Search |
| Embedding model | `sentence-transformers/all-MiniLM-L6-v2` (runs locally, 384 dimensions) |
| LLM | `qwen/qwen3.8-27b` served by Groq |
| Implementation | Jupyter notebook, `rag_demo.ipynb` |

---

## 2. Architecture

The system has two pipelines. The **indexing pipeline** runs once, or whenever the document changes. The **query pipeline** runs for every question.

### A. Indexing pipeline

```
+--------+     +----------+     +-----------+     +----------------------+
|  PDF   | --> | Chunking | --> | Embedding | --> | MongoDB Atlas        |
| (pypdf)|     | 800 char |     | MiniLM-L6 |     | Vector Search index  |
+--------+     +----------+     +-----------+     +----------------------+
```

### B. Query pipeline

```
+----------+    +-----------+    +---------------+    +------------------+
| Question | -> |   Query   | -> | Vector Search | -> | Relevant chunks  |
+----------+    | Embedding |    |  (top k = 4)  |    |  + page numbers  |
                +-----------+    +---------------+    +--------+---------+
                                                               |
                                                               v
                +--------+    +------------------+    +------------------+
                | Answer | <- | LLM (Groq, Qwen) | <- | Prompt + Context |
                +--------+    +------------------+    +------------------+
```

---

## 3. Technology Choices

| Component | Choice | Why |
|---|---|---|
| PDF loading | `pypdf` | Extracts plain text page by page and keeps the page number for citations. |
| Chunking | LangChain `RecursiveCharacterTextSplitter` | Splits on paragraphs, then lines, then sentences, so chunks stay readable. |
| Embeddings | `all-MiniLM-L6-v2` | Free, runs on a CPU, needs no API key, and is small (~90 MB). |
| Vector store | MongoDB Atlas Vector Search | The chunks, their metadata and their vectors live in one database, and the free M0 tier supports vector indexes. |
| LLM | Qwen 3.8 27B on Groq | Groq runs open models very fast and has a free tier. |
| Orchestration | LangChain (LCEL) | Joins retriever → prompt → LLM → parser into one chain. |

### Can Groq be used for this RAG system?

**Groq can be used for the generation step.** Groq serves open LLMs (Llama, Qwen, GPT-OSS) through an OpenAI-compatible API, and `langchain-groq` supports it.

**Groq cannot be used for the embedding step.** Groq does not offer an embeddings endpoint. The embedding step therefore uses a separate model. This demo runs MiniLM locally. A hosted alternative is Google's Gemini embeddings (see Section 10).

Note: `qwen/qwen3.8-27b` is a **preview** model on Groq and may be retired without notice. If that happens, changing one line (`LLM_MODEL`) switches the demo to a production model such as `llama-3.3-70b-versatile`.

---

## 4. Source Document

The handbook is a fictional document written for this demo. It contains specific facts, such as numbers, deadlines and prices, which make it easy to check whether an answer is correct.

| # | Section | Example facts |
|---|---|---|
| 1 | About This Handbook | Effective 1 Jan 2026, reviewed every 12 months |
| 2 | Code of Conduct | No medical diagnoses; gifts over USD 50 must be reported |
| 3 | Coach Certification & Onboarding | NASM/ACE/ACSM/ISSA + CPR/AED; 3-week onboarding; max 40 clients |
| 4 | Membership Plans & Billing | Basic USD 19, Pro USD 49, Elite USD 99; 20% off annual |
| 5 | Cancellation & Refund | 14-day money-back; USD 25 admin fee; 3-month medical freeze |
| 6 | Booking, Late Cancellation & No-Shows | 24-hour window; 2 no-shows → 7-day suspension |
| 7 | Health Data & Privacy | AES-256; deleted 30 days after closure; breach reported in 1 hour |
| 8 | Workplace Safety & Injury Reporting | PAR-Q+ screening; injuries reported within 24 hours |
| 9 | Employee Benefits & Wellness | 22 days leave; USD 75/month wellness stipend; 16 weeks parental leave |
| 10 | Remote Work & Working Hours | 60 days abroad per year; core hours 10:00–15:00 |
| 11 | Complaints & Escalation | Acknowledged within 24 h, resolved within 5 business days |

---

## 5. Indexing Pipeline in Detail

### 5.1 Load
Each PDF page becomes one LangChain `Document` with `source` and `page` metadata. The page number is kept so that answers can cite it.

### 5.2 Chunk

| Parameter | Value | Reason |
|---|---|---|
| `chunk_size` | 800 characters | Large enough to hold one policy rule with its conditions; small enough to stay on one topic. |
| `chunk_overlap` | 120 characters | A sentence that falls on a chunk boundary still appears whole in one of the two chunks. |

The 4-page handbook produces **13 chunks**.

### 5.3 Embed
Each chunk is converted into a **384-dimensional** vector with `all-MiniLM-L6-v2`. The vectors are normalised, so cosine similarity measures how close two pieces of text are in meaning.

### 5.4 Store and index
Each chunk is stored as one MongoDB document in `healthylife_rag.policy_chunks`:

```json
{
  "_id": "ObjectId(...)",
  "text": "5. Cancellation and Refund Policy\nMembers may cancel at any time ...",
  "embedding": [-0.0191, 0.0555, -0.0078, "... 384 values"],
  "source": "data/healthylife_policy_handbook.pdf",
  "page": 3
}
```

The Atlas Vector Search index `vector_index` is defined as follows:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" }
  ]
}
```

The notebook creates this index automatically on its first run. Every run first deletes the old chunks, so re-running the notebook never creates duplicates.

---

## 6. Query Pipeline in Detail

### 6.1 Query embedding
The question is embedded with the **same** MiniLM model used for the chunks. Query vectors and chunk vectors must come from the same model, otherwise they cannot be compared.

### 6.2 Vector search
MongoDB's `$vectorSearch` aggregation stage finds the chunks whose vectors are closest to the question's vector:

```python
{"$vectorSearch": {
    "index": "vector_index", "path": "embedding",
    "queryVector": query_vector, "numCandidates": 100, "limit": 4
}}
```

`numCandidates: 100` sets how many chunks the approximate-nearest-neighbour search considers before it returns the best 4.

**Example result.** Question: *"Can I get a refund if I cancel my annual plan after two months?"*

| Rank | Score | Page | Chunk begins with |
|---|---|---|---|
| 1 | 0.766 | 3 | "5. Cancellation and Refund Policy — Members may cancel at any time…" |
| 2 | 0.657 | 3 | "Medical freeze: a member with a documented injury or illness…" |
| 3 | 0.635 | 2 | "HealthyLife offers three membership plans, billed in advance…" |
| 4 | 0.623 | 3 | "If a coach cancels with less than 24 hours' notice…" |

The refund policy chunk is ranked first by a clear margin.

### 6.3 Prompt + context
The retrieved chunks are joined into a context block, each labelled with its page, and inserted into this prompt:

```
System: You are the HealthyLife policy assistant. Answer using ONLY the context
        below. If the answer is not in the context, say you don't know.
        Keep it short and cite pages like (p. 3). Reply in plain text
        without Markdown; use '- ' for list items.

        Context:
        [p. 3] 5. Cancellation and Refund Policy ...
        [p. 3] Medical freeze: ...
        ...
Human:  Can I get a refund if I cancel my annual plan after two months?
```

The instruction to answer only from the context is the main defence against made-up answers. When the handbook does not cover a question, the model should say so rather than guess. The plain-text rule exists because the website's chat bubble displays raw text and does not render Markdown.

### 6.4 LLM and answer
The prompt goes to `qwen/qwen3.8-27b` on Groq with `temperature=0`, which makes answers consistent from run to run. Qwen is a reasoning model and can output its internal "thinking". The setting `reasoning_format="hidden"` removes that output, so only the final answer is returned.

The whole query pipeline is a single LangChain chain:

```python
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt | llm | StrOutputParser()
)
```

---

## 7. Evaluation

### 7.1 Retrieval check (automated)
The *Retrieval sanity check* cell of the notebook asserts that, for each question below, the chunk containing the correct fact is among the top 4 results. The check passes on the current index.

| Question | Fact that must be retrieved |
|---|---|
| How many days of paid annual leave do employees get? | "22 days" |
| How much is the monthly wellness stipend? | "USD 75" |
| How soon must an injury during a session be reported? | "24 hours" |
| What is the late cancellation window for sessions? | "24 hours before" |

### 7.2 Answer check (manual)
The table below lists the answers the handbook supports (ground truth), so the model's output can be checked against it.

| Question | Correct answer according to the handbook |
|---|---|
| Can I get a refund if I cancel my annual plan after two months? | Yes, pro rata for the unused full months, minus a USD 25 admin fee; paid within 7–10 business days (p. 3). |
| What happens if I miss two sessions in a month? | Two no-shows within 30 days lead to a 7-day booking suspension (p. 3). |
| How long is health data kept after I close my account? | Deleted within 30 days; anonymised aggregates kept up to 24 months (p. 3). |
| What certifications does a coach need? | NASM-CPT, ACE, ACSM, ISSA or approved equivalent, plus valid CPR/AED (p. 2). |
| Does HealthyLife offer a free trial for dogs? | Not in the handbook — the assistant should say it doesn't know. |

---

## 8. How to Run

```bash
cd rag-demo
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env
```

Fill in `.env`:

```
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=rag-demo"
GROQ_API_KEY="gsk_..."          # free key from https://console.groq.com/keys
```

Then open `rag_demo.ipynb` and run all cells. The first run downloads the MiniLM model (~90 MB) and creates the vector index in Atlas, which takes up to about a minute.

**Atlas checklist:** the cluster's *Network Access* list must include your IP address, and the database user needs read/write access.

---

## 9. Website Policy Chatbot

The landing page of the HealthyLife web app has a floating **"Policy questions?"** chat button. Visitors can ask policy questions without signing in.

```
Browser (PolicyChatWidget)  --POST /api/policy/ask-->  Laravel (PolicyBotController)
                                                           |  validates, 10 requests/min per IP
                                                           v
                                   rag_demo.ipynb, section C (FastAPI on port 8001)  --POST /ask-->  rag_chain
```

- The notebook's last section, **C. Serve the RAG bot as an API**, starts a small FastAPI server that calls the notebook's own `rag_chain`. The website therefore uses exactly the same retrieval, prompt and model as the notebook, with no second copy of the code.
- The server runs in a background thread, so the notebook stays usable, and it stops when the notebook kernel stops.
- The browser never calls the Python API directly. Laravel proxies each request, validates the question (at most 500 characters) and rate-limits it. The API's address comes from `RAG_API_URL`.

**Run locally:** run `.\dev.ps1` from the repo root. It starts PostgreSQL, Laravel and Vite, plus the chatbot, which runs this notebook headless with `jupyter execute`. The chatbot's API is ready on port 8001 about a minute later, and Ctrl+C stops everything.

To work on the notebook interactively instead, open it and run all cells first. `dev.ps1` sees that port 8001 is already in use and leaves your notebook's API running.

---

## 10. Deployment Notes (Railway)

**Can MiniLM run on Railway?** Yes. The model needs only about 300–500 MB of RAM and runs on a CPU. The drawback is the container size: PyTorch and sentence-transformers add roughly 1–2 GB to the image, which slows builds and cold starts.

| Option | Pros | Cons |
|---|---|---|
| **MiniLM (local, current)** | Free; no API key; no rate limits; data stays in the container | Large image (PyTorch); uses the container's CPU and RAM |
| **Gemini embeddings (API)** | Small image (no PyTorch); higher-quality vectors | Needs a Google API key; subject to rate limits; text is sent to Google |

**Recommendation:** use MiniLM for the notebook demo. If the assistant becomes a service on Railway, switch to Gemini embeddings to keep the image small. The switch changes one line, plus a re-index:

```python
from langchain_google_genai import GoogleGenerativeAIEmbeddings
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
```

The vector index must then be recreated with the new model's dimension count, and every chunk must be re-embedded. Vectors from different models cannot be mixed in one index.

**Deploying the chatbot:** the notebook itself runs on Railway as the `policy-bot` service.

- `rag-demo/Dockerfile` installs CPU-only PyTorch and the requirements, builds the MiniLM model into the image, and starts `jupyter execute rag_demo.ipynb`.
- On Railway, the API cell in section C detects `RAILWAY_ENVIRONMENT_NAME`, listens on `::` (private networking) and keeps running, so the API stays up.
- Every boot re-runs the whole notebook: it re-indexes the PDF, runs the example questions and the retrieval check, then starts the API.
- The service has no public domain. The `web` service reaches it at `RAG_API_URL=http://policy-bot.railway.internal:8001`.
- `policy-bot` variables: `MONGODB_URI`, `GROQ_API_KEY`, `PORT=8001`.
- MongoDB Atlas must accept connections from Railway. Railway's outgoing IP addresses change, so the Atlas *Network Access* list needs `0.0.0.0/0`.

```bash
railway up ./rag-demo --path-as-root --service policy-bot
```

---

## 11. Limitations and Next Steps

- **Page footer in chunks.** The repeated footer text ends up in some chunks. It is harmless at this size, but should be stripped for larger documents.
- **Tables flatten.** `pypdf` reads the plans table as one cell per line. Retrieval still finds it; a table-aware parser would keep rows together.
- **No re-ranking.** Retrieval uses vector similarity only. Adding keyword search (Atlas `$search`) or a cross-encoder re-ranker would help with exact terms such as "PAR-Q+".
- **Single document.** Supporting several documents needs only a `source` filter on the index (`filters=["source"]`) and a `pre_filter` at query time.
- **No chat memory.** Each question is answered on its own; follow-up questions would need conversation history in the prompt.

---

## 12. Security

- Credentials live in `.env`, which git ignores. Only `.env.example`, with placeholder values, is committed.
- The MongoDB password for this demo was shared in plain text while the demo was being built and **should be rotated** in Atlas (*Database Access → Edit user → Edit password*), after which `.env` must be updated.
- The handbook contains no real personal data. A production version that indexes member health data would need the access controls described in Section 7 of the handbook.
