/* api.js - Yuna 前端共用：PIN + 呼叫 Supabase Edge Function + 同步 localStorage */

const YUNA_STORAGE_KEY = "yunaOrders";
const YUNA_PIN_KEY = "yunaPin";

/**
 * 1) 這裡填你的 Edge Function URL（swift-api）
 * 位置：Supabase Dashboard → Edge Functions → Functions → swift-api → URL（複製）
 * 例如：https://xxxx.supabase.co/functions/v1/swift-api
 */
const YUNA_API_URL = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/swift-api";

/**
 * 2) PIN 傳給後端的方式（你可以二選一，後端也要配合）
 * - header: x-yuna-pin
 * - body: { pin: "1234" }
 */
function getPin() {
  return localStorage.getItem(YUNA_PIN_KEY) || "";
}
function setPin(pin) {
  localStorage.setItem(YUNA_PIN_KEY, String(pin || "").trim());
}
function clearPin() {
  localStorage.removeItem(YUNA_PIN_KEY);
}

/** 統一呼叫 API：會自動帶 PIN */
async function yunaFetch(action, payload = {}) {
  const pin = getPin();
  if (!pin) throw new Error("NO_PIN");

  const res = await fetch(YUNA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-yuna-pin": pin,
    },
    body: JSON.stringify({
      action,
      ...payload,
      // 如果你後端是看 body pin，就打開這行
      // pin,
    }),
  });

  // Edge Function 常見回傳錯誤格式：先盡量讀 json
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) ? (data.error || data.message) : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

/** 從 Supabase 拉 orders，寫回 localStorage（讓你舊頁面照樣吃 yunaOrders） */
async function syncFromServerToLocal() {
  const result = await yunaFetch("orders_list", {});
  // 你後端回傳格式我先用最常見：{ ok:true, data:[...] }
  const list = Array.isArray(result?.data) ? result.data : [];
  localStorage.setItem(YUNA_STORAGE_KEY, JSON.stringify(list));
  return list;
}

/** 新增一筆 order 到 Supabase（成功後建議再 sync 一次） */
async function saveOrderToServer(order) {
  // 後端要 insert：orders_save
  return await yunaFetch("orders_save", { order });
}

/** 前端簡易 PIN UI（可用於 index.html） */
function mountPinModal() {
  if (document.getElementById("yuna-pin-modal")) return;

  const modal = document.createElement("div");
  modal.id = "yuna-pin-modal";
  modal.style.cssText = `
    position:fixed; inset:0; background:rgba(17,24,39,0.45);
    display:none; align-items:center; justify-content:center; z-index:9999;
    padding:16px;
  `;

  modal.innerHTML = `
    <div style="
      width:min(420px, 100%);
      background:#fff; border-radius:18px; padding:16px 16px 14px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
      border:1px solid #e5e7eb;
    ">
      <div style="font-weight:900; font-size:1.1rem;">🔐 請輸入 PIN</div>
      <div style="margin-top:6px; color:#6b7280; font-size:0.9rem; line-height:1.5;">
        這個 PIN 用來存取你的 Supabase 資料，不需要登入帳號。
      </div>

      <input id="yuna-pin-input" type="password" inputmode="numeric" placeholder="例如：1234"
        style="
          margin-top:12px; width:100%;
          font-size:1rem; padding:10px 12px;
          border-radius:12px; border:1px solid #e5e7eb;
          outline:none;
        " />

      <div style="display:flex; gap:10px; margin-top:12px;">
        <button id="yuna-pin-save" type="button"
          style="
            flex:1; border:none; border-radius:999px;
            padding:10px 14px; font-weight:700;
            background:linear-gradient(135deg,#3b82f6,#2563eb);
            color:#fff; cursor:pointer;
          ">確認</button>

        <button id="yuna-pin-cancel" type="button"
          style="
            border:1px solid #e5e7eb; border-radius:999px;
            padding:10px 14px; font-weight:700;
            background:#fff; cursor:pointer;
          ">取消</button>
      </div>

      <div id="yuna-pin-err" style="margin-top:10px; color:#ef4444; font-size:0.88rem; display:none;"></div>
    </div>
  `;

  document.body.appendChild(modal);

  const input = modal.querySelector("#yuna-pin-input");
  const btnSave = modal.querySelector("#yuna-pin-save");
  const btnCancel = modal.querySelector("#yuna-pin-cancel");
  const err = modal.querySelector("#yuna-pin-err");

  function showErr(msg) {
    err.style.display = "block";
    err.textContent = msg;
  }
  function hideErr() {
    err.style.display = "none";
    err.textContent = "";
  }

  btnCancel.onclick = () => {
    hideErr();
    modal.style.display = "none";
  };

  btnSave.onclick = async () => {
    hideErr();
    const pin = String(input.value || "").trim();
    if (!pin) return showErr("請輸入 PIN");

    setPin(pin);

    // 立刻試拉資料驗證 PIN 是否有效
    try {
      await syncFromServerToLocal();
      modal.style.display = "none";
      // 成功後刷新頁面，讓各頁面初始化一致
      location.reload();
    } catch (e) {
      // PIN 錯或後端拒絕：清掉
      clearPin();
      showErr("PIN 驗證失敗，請確認 PIN 或後端設定。");
      console.error(e);
    }
  };

  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") btnSave.click();
  });
}

function openPinModal() {
  mountPinModal();
  const modal = document.getElementById("yuna-pin-modal");
  const input = document.getElementById("yuna-pin-input");
  modal.style.display = "flex";
  setTimeout(() => input?.focus(), 0);
}

/**
 * 供每個頁面呼叫：確保有 PIN，沒有就跳出 PIN 視窗
 * 回傳 true = 已有 PIN
 */
function ensurePin() {
  const pin = getPin();
  if (!pin) {
    openPinModal();
    return false;
  }
  return true;
}

// 將常用函式掛到 window，讓各頁 script 可直接用
window.YunaAPI = {
  getPin,
  setPin,
  clearPin,
  ensurePin,
  openPinModal,
  syncFromServerToLocal,
  saveOrderToServer,
};
