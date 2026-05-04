"""
ddodle AI Chatbot — Qwen2-0.5B generative model + dataset grounding
Serves POST /chat  and  GET /health  on port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoTokenizer, AutoModelForCausalLM
from sentence_transformers import SentenceTransformer
import faiss, numpy as np, json, os, torch
from pydantic import BaseModel

# ──────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────
app = FastAPI(title="NOVA chatbot", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Load Qwen2-0.5B  (fine-tuned if available, else base)
# ──────────────────────────────────────────────
BASE_MODEL    = "Qwen/Qwen2-0.5B"
FINETUNED_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "finetuned_model")
MODEL_ID      = FINETUNED_DIR if os.path.isdir(FINETUNED_DIR) else BASE_MODEL

print(f"🤖 Loading model: {MODEL_ID} ...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float32,   # float32 for CPU; change to float16 if GPU available
    device_map="auto",
    trust_remote_code=True,
)
model.eval()
DEVICE = next(model.parameters()).device
print(f"✅ Model loaded on {DEVICE}  ({'fine-tuned' if MODEL_ID == FINETUNED_DIR else 'base'})")

# ──────────────────────────────────────────────
# Load embedding model for dataset retrieval
# ──────────────────────────────────────────────
print("🔍 Loading MiniLM for dataset retrieval…")
EMBEDDER = SentenceTransformer("all-MiniLM-L6-v2")

# ──────────────────────────────────────────────
# Load dataset
# ──────────────────────────────────────────────
DATASET_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "rag_dataset.json"
)
with open(DATASET_PATH, "r", encoding="utf-8") as f:
    DATASET = json.load(f)

QUESTIONS  = [item["question"]  for item in DATASET]
ANSWERS    = [item["answer"]    for item in DATASET]
CATEGORIES = [item["category"]  for item in DATASET]
print(f"📚 Loaded {len(DATASET)} Q&A pairs")

# Build FAISS index
print("⚙️  Building FAISS index…")
embs = EMBEDDER.encode(QUESTIONS, convert_to_numpy=True, show_progress_bar=True).astype("float32")
faiss.normalize_L2(embs)
DIM   = embs.shape[1]
INDEX = faiss.IndexFlatIP(DIM)
INDEX.add(embs)
print(f"✅ FAISS ready — {INDEX.ntotal} vectors")

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
DISCLAIMER = (
    "\n\n⚠️ DISCLAIMER: This chatbot provides general platform guidance only. "
    "It is non-diagnostic and cannot provide medical advice. "
    "Always consult a qualified healthcare professional for any medical concerns about your baby."
)
SAFETY_CATS           = {"safety_disclaimer", "expert_advice"}
LOW_CONFIDENCE_THRESHOLD = 0.35
TOP_K                 = 3      # number of dataset passages to retrieve
MAX_NEW_TOKENS        = 220
TEMPERATURE           = 0.7
TOP_P                 = 0.9


# ──────────────────────────────────────────────
# Retrieval helper
# ──────────────────────────────────────────────
def retrieve(question: str, k: int = TOP_K):
    q_emb = EMBEDDER.encode([question], convert_to_numpy=True).astype("float32")
    faiss.normalize_L2(q_emb)
    D, I = INDEX.search(q_emb, k=k)
    results = []
    for score, idx in zip(D[0], I[0]):
        results.append({
            "question": QUESTIONS[idx],
            "answer":   ANSWERS[idx],
            "category": CATEGORIES[idx],
            "score":    float(score),
        })
    return results


# ──────────────────────────────────────────────
# Generation helper
# ──────────────────────────────────────────────
def generate_answer(user_question: str, context_passages: list[dict]) -> str:
    # Build context block
    context_lines = []
    for i, p in enumerate(context_passages, 1):
        context_lines.append(f"[{i}] Q: {p['question']}\n    A: {p['answer']}")
    context_block = "\n\n".join(context_lines)

    # Use the same ChatML prompt format as fine-tuning
    prompt = (
        "<|im_start|>system\n"
        "You are ddodle Assistant, a helpful support chatbot for the ddodle baby video "
        "assessment platform. Use the context below to answer the user's question clearly "
        "and concisely (3-5 sentences). If the context does not cover the question, say "
        "you are not sure and suggest the Expert Advice Desk.\n\n"
        f"Context:\n{context_block}\n<|im_end|>\n"
        "<|im_start|>user\n"
        f"{user_question}\n<|im_end|>\n"
        "<|im_start|>assistant\n"
    )

    inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            do_sample=True,
            temperature=TEMPERATURE,
            top_p=TOP_P,
            pad_token_id=tokenizer.eos_token_id,
        )

    # Only decode newly generated tokens
    new_tokens = output_ids[0][inputs["input_ids"].shape[1]:]
    answer = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

    # Stop at any secondary prompt leakage
    for stop in ["<|im_start|>", "<|im_end|>", "user\n", "system\n"]:
        if stop in answer:
            answer = answer[:answer.index(stop)].strip()

    return answer or "I'm not sure about that. Please try rephrasing or contact the Expert Advice Desk."


# ──────────────────────────────────────────────
# Request / Response schemas
# ──────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    category: str
    confidence: float
    matched_question: str


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    question = req.question.strip()

    if not question:
        return ChatResponse(
            answer="Please type a question — I'm here to help with the ddodle platform!",
            category="general",
            confidence=0.0,
            matched_question="",
        )

    passages = retrieve(question)
    top      = passages[0]

    # Low-confidence: model still tries but we flag it
    if top["score"] < LOW_CONFIDENCE_THRESHOLD:
        answer = generate_answer(question, passages)
        if not answer or len(answer) < 20:
            answer = (
                "I don't have specific information about that. You can:\n"
                "• Browse the Help section in the app\n"
                "• Use the Expert Advice Desk to reach a clinician\n"
                "• Contact the ddodle support team directly"
            )
        answer += DISCLAIMER
        return ChatResponse(
            answer=answer,
            category="general",
            confidence=round(top["score"], 3),
            matched_question="",
        )

    # Generate grounded answer
    answer = generate_answer(question, passages)

    # Safety disclaimer for medical/safety categories
    if top["category"] in SAFETY_CATS and DISCLAIMER not in answer:
        answer += DISCLAIMER

    return ChatResponse(
        answer=answer,
        category=top["category"],
        confidence=round(top["score"], 3),
        matched_question=top["question"],
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "generative_model": MODEL_ID,
        "model_type": "fine-tuned" if MODEL_ID == FINETUNED_DIR else "base",
        "retrieval_model": "all-MiniLM-L6-v2",
        "index_size": INDEX.ntotal,
        "device": str(DEVICE),
    }


# ──────────────────────────────────────────────
# Dev entry-point
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ──────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────
app = FastAPI(title="ddodle AI Chatbot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Load MiniLM model
# ──────────────────────────────────────────────
print("🤖 Loading all-MiniLM-L6-v2 model...")
MODEL = SentenceTransformer("all-MiniLM-L6-v2")
print("✅ Model loaded!")

# ──────────────────────────────────────────────
# Load RAG dataset (200 Q&A pairs)
# ──────────────────────────────────────────────
DATASET_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "rag_dataset.json"
)
with open(DATASET_PATH, "r", encoding="utf-8") as f:
    DATASET = json.load(f)

QUESTIONS  = [item["question"]  for item in DATASET]
ANSWERS    = [item["answer"]    for item in DATASET]
CATEGORIES = [item["category"]  for item in DATASET]

print(f"📚 Loaded {len(DATASET)} Q&A pairs from knowledge base")

# ──────────────────────────────────────────────
# Build FAISS index (cosine similarity via L2-normalised inner product)
# ──────────────────────────────────────────────
print("🔍 Building FAISS index…")
embeddings = MODEL.encode(QUESTIONS, convert_to_numpy=True, show_progress_bar=True)
embeddings = embeddings.astype("float32")
faiss.normalize_L2(embeddings)

DIM   = embeddings.shape[1]
INDEX = faiss.IndexFlatIP(DIM)
INDEX.add(embeddings)

print(f"✅ FAISS index ready — {INDEX.ntotal} vectors, dim={DIM}")

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
DISCLAIMER = (
    "\n\n⚠️ DISCLAIMER: This chatbot provides general platform guidance only. "
    "It is non-diagnostic and cannot provide medical advice. "
    "Always consult a qualified healthcare professional for any medical concerns about your baby."
)
SAFETY_CATS = {"safety_disclaimer", "expert_advice"}
LOW_CONFIDENCE_THRESHOLD = 0.35


# ──────────────────────────────────────────────
# Request / Response schemas
# ──────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    category: str
    confidence: float
    matched_question: str


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    question = req.question.strip()

    if not question:
        return ChatResponse(
            answer="Please type a question — I'm here to help with the ddodle platform!",
            category="general",
            confidence=0.0,
            matched_question="",
        )

    # Encode and search
    q_emb = MODEL.encode([question], convert_to_numpy=True).astype("float32")
    faiss.normalize_L2(q_emb)
    D, I = INDEX.search(q_emb, k=1)

    idx      = int(I[0][0])
    score    = float(D[0][0])
    answer   = ANSWERS[idx]
    category = CATEGORIES[idx]
    matched  = QUESTIONS[idx]

    # Low-confidence fallback
    if score < LOW_CONFIDENCE_THRESHOLD:
        answer = (
            "I don't have a specific answer for that. You can:\n"
            "• Browse the Help section in the app\n"
            "• Use the Expert Advice Desk to reach a clinician\n"
            "• Contact the ddodle support team directly"
        )
        answer += DISCLAIMER
        return ChatResponse(
            answer=answer,
            category="general",
            confidence=round(score, 3),
            matched_question="",
        )

    # Append disclaimer for safety / medical topics
    if category in SAFETY_CATS and DISCLAIMER not in answer:
        answer += DISCLAIMER

    return ChatResponse(
        answer=answer,
        category=category,
        confidence=round(score, 3),
        matched_question=matched,
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "all-MiniLM-L6-v2",
        "index_size": INDEX.ntotal,
        "dimension": DIM,
    }


# ──────────────────────────────────────────────
# Dev entry-point
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
