"""
Fine-tune Qwen2-0.5B on the ddodle Q&A dataset (200 pairs)
using supervised instruction tuning (SFT).

Output model saved to: ./finetuned_model/

Run:
    python finetune.py
"""

import json
import os
import math

import torch
from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    get_cosine_schedule_with_warmup,
)

# ──────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────
BASE_MODEL   = "Qwen/Qwen2-0.5B"
OUTPUT_DIR   = os.path.join(os.path.dirname(__file__), "finetuned_model")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "rag_dataset.json")

EPOCHS       = 5
BATCH_SIZE   = 2          # increase to 4 if you have ≥8 GB RAM
GRAD_ACCUM   = 4          # effective batch = BATCH_SIZE * GRAD_ACCUM = 8
LR           = 2e-5
MAX_LENGTH   = 384
WARMUP_RATIO = 0.1
SEED         = 42

torch.manual_seed(SEED)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {DEVICE}")


# ──────────────────────────────────────────────
# Prompt template  (instruction → response)
# ──────────────────────────────────────────────
def make_prompt(question: str, answer: str) -> str:
    return (
        "<|im_start|>system\n"
        "You are ddodle Assistant, a helpful support chatbot for the ddodle baby video "
        "assessment platform. Answer clearly and concisely.\n<|im_end|>\n"
        "<|im_start|>user\n"
        f"{question}\n<|im_end|>\n"
        "<|im_start|>assistant\n"
        f"{answer}<|im_end|>"
    )


# ──────────────────────────────────────────────
# Dataset
# ──────────────────────────────────────────────
class QADataset(Dataset):
    def __init__(self, records, tokenizer, max_length):
        self.samples = []
        for item in records:
            prompt = make_prompt(item["question"], item["answer"])
            enc = tokenizer(
                prompt,
                truncation=True,
                max_length=max_length,
                padding="max_length",
                return_tensors="pt",
            )
            input_ids      = enc["input_ids"][0]
            attention_mask = enc["attention_mask"][0]

            # Labels: mask the prompt part (up to and including "<|im_start|>assistant\n")
            # so the loss is only computed on the answer tokens.
            marker = "<|im_start|>assistant\n"
            marker_ids = tokenizer.encode(marker, add_special_tokens=False)
            labels = input_ids.clone()

            # Find end of assistant marker in token sequence
            m_len = len(marker_ids)
            prompt_end = 0
            for i in range(len(input_ids) - m_len):
                if input_ids[i : i + m_len].tolist() == marker_ids:
                    prompt_end = i + m_len
                    break

            labels[:prompt_end] = -100            # mask prompt tokens from loss
            labels[attention_mask == 0] = -100    # mask padding

            self.samples.append({
                "input_ids":      input_ids,
                "attention_mask": attention_mask,
                "labels":         labels,
            })

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        return self.samples[idx]


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────
def main():
    # Load dataset
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)
    print(f"Loaded {len(records)} training examples")

    # Load tokenizer & model
    print(f"Loading base model: {BASE_MODEL} …")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float32,
        trust_remote_code=True,
    ).to(DEVICE)

    model.train()

    # Build dataset & dataloader
    dataset    = QADataset(records, tokenizer, MAX_LENGTH)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

    # Optimizer & scheduler
    total_steps  = math.ceil(len(dataloader) / GRAD_ACCUM) * EPOCHS
    warmup_steps = max(1, int(total_steps * WARMUP_RATIO))

    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=0.01)
    scheduler = get_cosine_schedule_with_warmup(
        optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=total_steps,
    )

    print(f"\nFine-tuning for {EPOCHS} epochs — {total_steps} optimizer steps\n")
    print("─" * 60)

    global_step = 0
    optimizer.zero_grad()

    for epoch in range(1, EPOCHS + 1):
        epoch_loss = 0.0
        for step, batch in enumerate(dataloader, 1):
            input_ids      = batch["input_ids"].to(DEVICE)
            attention_mask = batch["attention_mask"].to(DEVICE)
            labels         = batch["labels"].to(DEVICE)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels,
            )
            loss = outputs.loss / GRAD_ACCUM
            loss.backward()
            epoch_loss += outputs.loss.item()

            if step % GRAD_ACCUM == 0 or step == len(dataloader):
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
                global_step += 1

                avg = epoch_loss / step
                print(
                    f"Epoch {epoch}/{EPOCHS}  "
                    f"Step {global_step}/{total_steps}  "
                    f"Loss: {avg:.4f}  "
                    f"LR: {scheduler.get_last_lr()[0]:.2e}"
                )

        print(f"─ Epoch {epoch} done — avg loss: {epoch_loss / len(dataloader):.4f}\n")

    # Save fine-tuned model
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print(f"\n✅ Fine-tuned model saved to: {OUTPUT_DIR}")
    print("Run 'python app.py' — it will auto-detect and load the fine-tuned model.")


if __name__ == "__main__":
    main()
