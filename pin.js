// pin.js
const PIN_KEY = "yuna_pin_ok_v1";
const PIN_VALUE = "1234"; // 你要的 4 碼（方案2：放前端，所以不可避免會被看到）

export function ensurePinOrRedirect() {
  const ok = localStorage.getItem(PIN_KEY) === "1";
  if (ok) return;

  const input = prompt("請輸入 4 碼 PIN：");
  if (input === PIN_VALUE) {
    localStorage.setItem(PIN_KEY, "1");
    return;
  }

  alert("PIN 錯誤");
  // 回首頁或停留
  window.location.href = "index.html";
}

export function clearPin() {
  localStorage.removeItem(PIN_KEY);
}
