import { useEffect, useMemo, useState } from "react";
import { listComments } from "../api/comments";
import SortBar from "./SortBar";
import Pagination from "./Pagination";
import CommentItem from "./CommentItem";

export default function CommentList() {
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ count: 0, results: [] });
  const pageCount = useMemo(() => Math.max(1, Math.ceil((data.count || 0) / 25)), [data.count]);

  const load = async () => {
    const d = await listComments({ page, sort, order });
    setData(d);
  };

  useEffect(() => { load(); }, [page, sort, order]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Коментарі</h2>
        <SortBar sort={sort} order={order} onChange={({ sort, order }) => { setSort(sort); setOrder(order); setPage(1); }} />
      </div>

      <div className="space-y-3">
        {data.results.map(c => <CommentItem key={c.id} comment={c} />)}
        {data.results.length === 0 && <div className="text-neutral-400">Поки що немає коментарів.</div>}
      </div>

      <div className="flex justify-center">
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}
