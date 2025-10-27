import clsx from "clsx";

export default function Toolbar({ onInsert, className }) {
  const btn = "px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm";

  return (
    <div className={clsx("flex gap-2", className)}>
      <button type="button" className={btn} onClick={() => onInsert("<i>", "</i>")}>[i]</button>
      <button type="button" className={btn} onClick={() => onInsert("<strong>", "</strong>")}>[strong]</button>
      <button type="button" className={btn} onClick={() => onInsert("<code>", "</code>")}>[code]</button>
      <button type="button" className={btn} onClick={() => onInsert('<a href="" title="">', "</a>")}>[a]</button>
    </div>
  );
}
