def clean_text(text: str | None) -> str:
  if not text:
    return ""
  t = text.strip()
  return " ".join(t.split())