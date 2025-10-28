import { useEffect, useMemo, useRef, useState } from "react";
import { listComments } from "../api/comments";
import { connectWS, onWS } from "../api/ws";
import SortBar from "./SortBar";
import Pagination from "./Pagination";
import CommentItem from "./CommentItem";

export default function CommentList() {
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ count: 0, results: [] });

  // трекер побачених id, щоб не додавати дубль
  const seenIdsRef = useRef(new Set());

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil((data.count || 0) / 25)),
    [data.count]
  );

  const load = async () => {
    try {
      const d = await listComments({ page, sort, order });
      // після повного reload оновлюємо трекер id
      seenIdsRef.current = new Set((d.results || []).map((c) => c.id));
      setData(d);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  // Завантаження списку при зміні page/sort/order
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await listComments({ page, sort, order });
        if (cancelled) return;
        seenIdsRef.current = new Set((d.results || []).map((c) => c.id));
        setData(d);
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, order]);

  // Підключення до WS (один раз)
  useEffect(() => {
    connectWS(); // бажано, щоб усередині був guard від повторного конекту
  }, []);

  // Підписка на повідомлення WS
  useEffect(() => {
    const off = onWS((msg) => {
      if (msg?.kind === "root_created" && msg?.comment?.id != null) {
        const id = msg.comment.id;

        // якщо ми на 1 сторінці з date/desc — додаємо зверху
        if (page === 1 && sort === "date" && order === "desc") {
          // уникнути дублю
          if (seenIdsRef.current.has(id)) return;
          seenIdsRef.current.add(id);

          setData((prev) => ({
            ...prev,
            count: (prev.count || 0) + 1,
            results: [msg.comment, ...(prev.results || [])].slice(0, 25),
          }));
        } else {
          // не на першій сторінці — принаймні оновимо лічильник
          setData((prev) => ({ ...prev, count: (prev.count || 0) + 1 }));
        }
      }

      if (msg?.kind === "root_deleted" && msg?.id != null) {
        const id = msg.id;
        // якщо цей комент є в поточному вікні — прибираємо
        setData((prev) => {
          const exists = (prev.results || []).some((c) => c.id === id);
          const next = {
            ...prev,
            results: (prev.results || []).filter((c) => c.id !== id),
            count: Math.max(0, (prev.count || 0) - (exists ? 1 : 0)),
          };
          if (exists) seenIdsRef.current.delete(id);
          return next;
        });
      }

      // reply_created — ігноруємо тут (обробляє CommentItem при відкритті)
    });
    return off;
  }, [page, sort, order]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Коментарі</h2>
        <SortBar
          sort={sort}
          order={order}
          onChange={({ sort, order }) => {
            setSort(sort);
            setOrder(order);
            setPage(1);
          }}
        />
      </div>

      <div className="space-y-3">
        {data.results.map((c) => (
          <CommentItem key={c.id} comment={c} />
        ))}
        {data.results.length === 0 && (
          <div className="text-neutral-400">Поки що немає коментарів.</div>
        )}
      </div>

      <div className="flex justify-center">
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}
