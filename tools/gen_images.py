#!/usr/bin/env python3
"""SLAY THE MONSTARZ 이미지 생성기 (Gemini / Nano Banana).

표준 라이브러리만 사용한다. .env.local의 GEMINI_API_KEY로 generativelanguage REST를 호출해
프롬프트 JSON의 각 asset을 이미지로 생성하고 리뷰 폴더에 저장한다.

프롬프트 JSON 형식:
  { "defaultModel","negativePrompt","globalStyle","globalConstraints",
    "assets":[ { "id","prompt","ref"?(레퍼런스 파일명),"file"? } ] }

예:
  python tools/gen_images.py --prompts tools/card_art_prompts.json --out assets/review/cards
  python tools/gen_images.py --prompts tools/card_art_prompts.json --out assets/review/cards --only strike,guard,bash
  python tools/gen_images.py --prompts tools/card_art_prompts.json --out assets/review/cards --limit 3
"""
import argparse, base64, json, os, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"


def load_key() -> str:
    path = os.path.join(ROOT, ".env.local")
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.strip().startswith("GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("GEMINI_API_KEY not found in .env.local")


def compose(spec: dict, asset: dict) -> str:
    parts = [
        spec.get("globalStyle", ""),
        asset["prompt"],
        spec.get("globalConstraints", ""),
    ]
    neg = spec.get("negativePrompt")
    if neg:
        parts.append("Strictly avoid: " + neg)
    return "\n\n".join(p for p in parts if p)


def ref_part(ref: str):
    """레퍼런스 이미지를 inlineData 파트로 (assets/refs 우선, 절대/상대 경로 허용)."""
    for cand in (ref, os.path.join(ROOT, "assets", "refs", ref), os.path.join(ROOT, ref)):
        if os.path.isfile(cand):
            data = base64.b64encode(open(cand, "rb").read()).decode()
            mime = "image/webp" if cand.endswith(".webp") else "image/jpeg" if cand.endswith((".jpg", ".jpeg")) else "image/png"
            return {"inlineData": {"mimeType": mime, "data": data}}
    print(f"    ! ref not found: {ref}")
    return None


def generate(model: str, key: str, prompt: str, refs, retries: int = 4):
    parts = []
    for ref in refs or []:
        if not ref:
            continue
        rp = ref_part(ref)
        if rp:
            parts.append(rp)
    parts.append({"text": prompt})
    body = json.dumps({
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }).encode()
    url = API.format(model=model, key=key)
    delay = 5
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=180) as r:
                d = json.load(r)
            for p in d.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                inl = p.get("inlineData") or p.get("inline_data")
                if inl:
                    return base64.b64decode(inl["data"])
            return None  # no image part
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:200]
            if e.code in (429, 500, 503) and attempt < retries - 1:
                print(f"    retry ({e.code}) in {delay}s… {msg[:80]}")
                time.sleep(delay); delay *= 2; continue
            print(f"    HTTP {e.code}: {msg}")
            return None
        except Exception as e:  # noqa
            if attempt < retries - 1:
                print(f"    error, retry in {delay}s: {e}"); time.sleep(delay); delay *= 2; continue
            print(f"    failed: {e}")
            return None
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompts", default="tools/card_art_prompts.json")
    ap.add_argument("--out", default="assets/review/cards")
    ap.add_argument("--model", default=None, help="기본: 프롬프트 JSON의 defaultModel 매핑 또는 gemini-2.5-flash-image")
    ap.add_argument("--only", default=None, help="쉼표로 id 지정")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--suffix", default="-v1")
    ap.add_argument("--delay", type=float, default=4.0, help="요청 간 대기(초)")
    ap.add_argument("--overwrite", action="store_true")
    args = ap.parse_args()

    key = load_key()
    spec = json.load(open(os.path.join(ROOT, args.prompts), encoding="utf-8"))
    # defaultModel 문자열("GPT Image 1.5" 등)은 무시하고 Gemini 모델로 고정/지정.
    model = args.model or "gemini-2.5-flash-image"
    out_dir = os.path.join(ROOT, args.out); os.makedirs(out_dir, exist_ok=True)

    assets = spec["assets"]
    if args.only:
        want = {x.strip() for x in args.only.split(",")}
        assets = [a for a in assets if a["id"] in want]
    if args.limit:
        assets = assets[: args.limit]

    print(f"model={model}  out={args.out}  count={len(assets)}")
    ok = 0
    for i, a in enumerate(assets, 1):
        dest = os.path.join(out_dir, f"{a['id']}{args.suffix}.png")
        if os.path.exists(dest) and not args.overwrite:
            print(f"[{i}/{len(assets)}] {a['id']}: exists, skip (--overwrite to replace)"); ok += 1; continue
        print(f"[{i}/{len(assets)}] {a['id']} …", flush=True)
        # 스타일 앵커(styleRef)를 먼저, 정체성 ref를 다음 입력 이미지로 넣는다.
        refs = [spec.get("styleRef"), a.get("styleRef"), a.get("ref")]
        raw = generate(model, key, compose(spec, a), refs)
        if raw and raw[:8].hex().startswith("89504e47"):
            open(dest, "wb").write(raw)
            print(f"    OK {len(raw)} bytes -> {os.path.relpath(dest, ROOT)}"); ok += 1
        else:
            print("    NO IMAGE")
        if i < len(assets):
            time.sleep(args.delay)
    print(f"done: {ok}/{len(assets)}")


if __name__ == "__main__":
    main()
