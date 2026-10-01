# Railway service "policy-bot": runs rag_demo.ipynb top to bottom; its last cell (section C)
# keeps the FastAPI server up on $PORT. Deploy: railway up ./rag-demo --path-as-root --service policy-bot
FROM python:3.12-slim
WORKDIR /app

# CPU-only PyTorch: the default Linux wheel pulls ~3 GB of CUDA libraries
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Bake the embedding model into the image so boot doesn't download it
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

COPY . .
CMD ["jupyter", "execute", "rag_demo.ipynb"]
