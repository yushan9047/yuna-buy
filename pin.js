// pin.js (非 module 全域版)
(function () {
  const PIN_KEY = "yuna_pin_ok_v1";

  window.ensurePinOrRedirect = function () {
    const ok = localStorage.getItem(PIN_KEY) === "1";
    if (ok) return true;

    const input = prompt("請輸入 4 碼 PIN：");
    if (input && input.trim().length > 0) {
      // 這裡不驗證（驗證交給 Edge Function）
      // 先暫存，等 API 回 401 再清掉
      localStorage.setItem("yuna_pin_value", input.trim());
      localStorage.setItem(PIN_KEY, "1");
      return true;
    }

    alert("PIN 必填");
    window.location.href = "index.html";
    return false;
  };

  window.clearPin = function () {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem("yuna_pin_value");
  };

  window.getPinValue = function () {
    return (localStorage.getItem("yuna_pin_value") || "").trim();
  };
})();
