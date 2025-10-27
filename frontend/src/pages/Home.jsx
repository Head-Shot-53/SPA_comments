import CommentForm from "../components/CommentForm";
import CommentList from "../components/CommentList";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">SPA Коментарі</h1>
      <CommentForm onCreated={() => { /* опціонально: тригерити перезавантаження списку через state менеджер */ }} />
      <CommentList />
    </div>
  );
}
