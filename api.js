// api.js (非 module 全域版)

// 你的 Supabase 專案資訊（你已提供）
const SUPABASE_URL = "https://iaiobzgajtbllszpllbx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhaW9iemdhanRibGxzenBsbGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjIyMTAsImV4cCI6MjA4ODIzODIxMH0.UeAYQib1ZQ8l1WzGmT4Bg_hOIAOPRhZ6JbPQYug0GN0";

const FN_BASE = `${SUPABASE_URL}/functions/v1/orders-api`;

async function fnFetch(path, options = {}) {
  const pin = (window.getPinValue ? window.getPinValue() : "") || "";

  const res = await fetch(FN_BASE + path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "x-pin": pin,
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  // PIN 錯誤 → 清掉並重來
  if (res.status === 401) {
    if (window.clearPin) window.clearPin();
    alert("PIN 錯誤或已失效，請重新輸入。");
    window.location.href = "index.html";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${t}`);
  }

  return res.json();
}

// ----- Orders API -----
window.OrdersAPI = {
  async list() {
    return fnFetch("/orders");
  },
  async create(order) {
    return fnFetch("/orders", { method: "POST", body: order });
  },
  async update(id, patch) {
    return fnFetch(`/orders/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
  },
  async remove(id) {
    return fnFetch(`/orders/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
};
