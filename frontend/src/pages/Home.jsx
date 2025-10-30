import CommentForm from "../components/CommentForm";
import CommentList from "../components/CommentList";
import AuthPanel from "../components/AuthPanel"; 

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-white">SPA Коментарі</h1>

      {/* Панель авторизації */}
      <AuthPanel />

      {/* Форма коментарів */}
      <CommentForm
        onCreated={() => {
        }}
      />

      {/* Список коментарів */}
      <CommentList />
    </div>
  );
}
