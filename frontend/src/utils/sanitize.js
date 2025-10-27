import DOMPurify from "dompurify";

// узгоджено з бекендом: a/code/i/strong
const ALLOWED_TAGS = ["a", "code", "i", "strong"];
const ALLOWED_ATTR = { a: ["href", "title", "target", "rel"] };

export function sanitize(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
