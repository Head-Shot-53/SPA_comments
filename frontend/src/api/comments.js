import { api } from "./client";

// Comments
export const listComments = async ({ page = 1, sort = "date", order = "desc" } = {}) => {
  const { data } = await api.get("/comments/", { params: { page, sort, order } });
  return data; // DRF pagination: {count, next, previous, results}
};

export const createComment = async (payload) => {
  const { data } = await api.post("/comments/", payload);
  return data;
};

// Replies
export const listReplies = async (commentId, page = 1) => {
  const { data } = await api.get(`/comments/${commentId}/replies/`, { params: { page } });
  const results = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
    ? data
    : [];
  return results;
};

export const createReply = async (commentId, payload) => {
  const { data } = await api.post(`/comments/${commentId}/replies/`, payload);
  return data;
};

// CAPTCHA
export const getCaptcha = async () => {
  const { data } = await api.get("/captcha/");
  return data; // { token, image }
};

// Attachments
export const uploadAttachment = async (commentId, file) => {
  const form = new FormData();
  form.append("comment", commentId);
  form.append("file", file);

  const { data } = await api.post("/attachments/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
