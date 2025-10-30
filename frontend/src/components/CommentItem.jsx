import { useEffect, useState } from "react";
import { listReplies } from "../api/comments";
import { sanitize } from "../utils/sanitize";
import CommentForm from "./CommentForm";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

function AttachmentList({ attachments }) {
  const images = attachments?.filter(a => a.file_type === "image") || [];
  const texts = attachments?.filter(a => a.file_type === "text") || [];
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (!attachments || attachments.length === 0) return null;

  const slides = images.map(img => ({ src: img.file }));

  return (
    <div className="mt-2 space-y-2">
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <img
              key={img.id || i}
              src={img.preview_image}
              alt=""
              className="h-20 w-auto rounded cursor-zoom-in border border-neutral-700"
              onClick={() => { setIndex(i); setOpen(true); }}
            />
          ))}

          {/* Lightbox відкривається при натисканні */}
          {open && (
            <Lightbox
              open={open}
              close={() => setOpen(false)}
              slides={slides}
              index={index}
            />
          )}
        </div>
      )}

      {texts.length > 0 && (
        <ul className="list-disc list-inside text-sm text-neutral-300">
          {texts.map((t, i) => (
            <li key={t.id || i}>
              <a href={t.file} target="_blank" rel="noreferrer">
                Переглянути TXT
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CommentItem({ comment }) {
  const [replies, setReplies] = useState([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadReplies = async () => {
    const arr = await listReplies(comment.id);
    setReplies(Array.isArray(arr) ? arr : []);
    setLoaded(true);
  };

  useEffect(() => {
    // replies завантажуються ліниво при натисканні
  }, []);

  return (
    <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
      <div className="text-sm text-neutral-400">
        {comment.author.username} •{" "}
        {new Date(comment.created_at).toLocaleString()}
        {comment.author.homepage && (
          <>
            {" "}
            •{" "}
            <a
              href={comment.author.homepage}
              target="_blank"
              rel="noreferrer"
            >
              homepage
            </a>
          </>
        )}
      </div>

      <div
        className="mt-2 prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitize(comment.text) }}
      />

      <AttachmentList attachments={comment.attachments || []} />

      <div className="mt-3 flex gap-3 text-sm">
        <button
          className="text-blue-400 hover:text-blue-300"
          onClick={() => setShowReplyForm(v => !v)}
        >
          Відповісти
        </button>
        <button
          className="text-neutral-400 hover:text-neutral-300"
          onClick={() =>
            !loaded ? loadReplies() : setLoaded(v => !v)
          }
        >
          {loaded ? "Сховати відповіді" : "Показати відповіді"}
        </button>
      </div>

      {showReplyForm && (
        <div className="mt-3">
          <CommentForm
            parentId={comment.id}
            onCreated={() => {
              setShowReplyForm(false);
              loadReplies();
            }}
          />
        </div>
      )}

      {loaded && replies.length > 0 && (
        <div className="mt-4 space-y-3 pl-4 border-l border-neutral-800">
          {replies.map(r => (
            <CommentItem key={r.id} comment={r} />
          ))}
        </div>
      )}
    </div>
  );
}
