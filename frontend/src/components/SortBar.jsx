export default function SortBar({ sort, order, onChange }) {
  return (
    <div className="flex gap-2 items-center">
      <select
        className="bg-neutral-900 border border-neutral-700 rounded p-2"
        value={sort}
        onChange={(e) => onChange({ sort: e.target.value, order })}
      >
        <option value="date">Дата</option>
        <option value="username">User Name</option>
        <option value="email">E-mail</option>
      </select>
      <select
        className="bg-neutral-900 border border-neutral-700 rounded p-2"
        value={order}
        onChange={(e) => onChange({ sort, order: e.target.value })}
      >
        <option value="desc">↓ Зменшення (LIFO)</option>
        <option value="asc">↑ Зростання</option>
      </select>
    </div>
  );
}
