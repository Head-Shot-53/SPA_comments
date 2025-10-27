export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const prev = () => onChange(Math.max(1, page - 1));
  const next = () => onChange(Math.min(pageCount, page + 1));

  return (
    <div className="flex items-center gap-3">
      <button onClick={prev} className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700">Назад</button>
      <span className="text-sm text-neutral-400">Сторінка {page} з {pageCount}</span>
      <button onClick={next} className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700">Вперед</button>
    </div>
  );
}
