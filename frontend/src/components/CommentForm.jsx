import { useEffect, useRef, useState } from "react";
import Toolbar from "./Toolbar";
import { getCaptcha, createComment, createReply, uploadAttachment } from "../api/comments";
import { sanitize } from "../utils/sanitize";

export default function CommentForm({ parentId = null, onCreated }) {
  const [author, setAuthor] = useState({ username: "", email: "", homepage: "" });
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [captcha, setCaptcha] = useState({ token: "", image: "" });
  const [captchaSolution, setCaptchaSolution] = useState("");
  const [loading, setLoading] = useState(false);
  const taRef = useRef(null);

  const loadCaptcha = async () => {
    const data = await getCaptcha();
    setCaptcha(data);
    setCaptchaSolution("");
  };

  useEffect(() => { loadCaptcha(); }, []);

  const onInsert = (open, close) => {
    const ta = taRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = text.slice(0, start);
    const sel = text.slice(start, end);
    const after = text.slice(end);
    const updated = before + open + sel + close + after;
    setText(updated);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + open.length;
      ta.selectionEnd = start + open.length + sel.length;
    }, 0);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        author: {
          username: author.username.trim(),
          email: author.email.trim(),
          homepage: author.homepage.trim() || null,
        },
        text,
        captcha_token: captcha.token,
        captcha_solution: captchaSolution.trim(),
      };

      const created = parentId
        ? await createReply(parentId, payload)
        : await createComment(payload);

      // upload files (optional)
      for (const f of files) {
        await uploadAttachment(created.id, f);
      }

      setAuthor({ username: "", email: "", homepage: "" });
      setText("");
      setFiles([]);
      await loadCaptcha();
      onCreated?.(created);
      } catch (err) {
        const msg = err?.response?.data
           ? JSON.stringify(err.response.data)
           : (err?.message || "Помилка створення коментаря");
        alert(msg);
        await loadCaptcha();
      } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-neutral-900 p-4 rounded-xl shadow">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="User Name (латиниця/цифри)"
          className="p-2 rounded bg-neutral-800 outline-none border border-neutral-700"
          value={author.username}
          onChange={(e) => setAuthor((a) => ({ ...a, username: e.target.value }))}
          required
        />
        <input
          type="email"
          placeholder="E-mail"
          className="p-2 rounded bg-neutral-800 outline-none border border-neutral-700"
          value={author.email}
          onChange={(e) => setAuthor((a) => ({ ...a, email: e.target.value }))}
          required
        />
        <input
          type="url"
          placeholder="Home page (необов’язково)"
          className="p-2 rounded bg-neutral-800 outline-none border border-neutral-700"
          value={author.homepage}
          onChange={(e) => setAuthor((a) => ({ ...a, homepage: e.target.value }))}
        />
      </div>

      <Toolbar onInsert={onInsert} />

      <textarea
        ref={taRef}
        rows={6}
        placeholder="Текст повідомлення (доступні теги: a/code/i/strong)"
        className="w-full p-3 rounded bg-neutral-800 outline-none border border-neutral-700"
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
      />

      {/* Live preview */}
      <div>
        <div className="text-sm text-neutral-400 mb-1">Preview:</div>
        <div
          className="p-3 rounded bg-neutral-800 border border-neutral-700 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitize(text) }}
        />
      </div>

      {/* Files */}
      <div>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="block"
        />
        <div className="text-xs text-neutral-400 mt-1">
          Допустимо: JPG/PNG/GIF (авторесайз ≤ 320×240), TXT ≤ 100KB.
        </div>
      </div>

      {/* CAPTCHA */}
      <div className="flex items-center gap-3">
        {captcha.image && (
          <img src={captcha.image} alt="captcha" className="h-14 rounded bg-white" />
        )}
        <input
          type="text"
          placeholder="Введи символи з картинки"
          className="p-2 rounded bg-neutral-800 outline-none border border-neutral-700"
          value={captchaSolution}
          onChange={(e) => setCaptchaSolution(e.target.value)}
          required
        />
        <button type="button" onClick={loadCaptcha} className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700">
          Оновити
        </button>
      </div>

      <div className="flex justify-end">
        <button
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
        >
          {parentId ? "Відповісти" : "Надіслати"}
        </button>
      </div>
    </form>
  );
}
