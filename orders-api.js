// orders-api.js
import { supabase } from "./supabase-client.js";

// 把前端 order 轉成 DB 欄位
function toDbRow(order) {
  // 你 DB 欄位：sell_price；前端：sellPrice
  const extra = (order.extra && typeof order.extra === "object") ? { ...order.extra } : {};

  // 你目前很多頁會用 order.image（base64）
  // 方案2不處理 Storage，先放 extra 內
  if (order.image) extra.imageBase64 = order.image;

  // loc 欄位如果 DB 沒有，就放 extra
  if (order.loc && extra.loc == null) extra.loc = order.loc;

  const row = {
    type: order.type ?? null,
    country: order.country ?? null,
    buyer: order.buyer ?? null,
    customer: order.customer ?? null,
    name: order.name ?? null,
    qty: order.qty ?? 1,
    sell_price: order.sellPrice ?? null,
    cost: order.cost ?? null,
    currency: order.currency ?? null,
    currency2: order.currency2 ?? null,
    cost2: order.cost2 ?? null,
    // 你 schema 是否有 loc/image_path 不確定，所以不硬塞
    extra,
  };

  return row;
}

function fromDbRow(r) {
  const extra = r.extra || {};
  return {
    ...r,
    sellPrice: r.sell_price ?? null,
    image: extra.imageBase64 ?? null,
    loc: r.loc ?? extra.loc ?? null,
  };
}

export async function listOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(fromDbRow);
}

export async function createOrder(order) {
  const row = toDbRow(order);
  const { data, error } = await supabase
    .from("orders")
    .insert(row)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return fromDbRow(data);
}

export async function updateOrder(id, patch) {
  const row = toDbRow(patch);
  const { data, error } = await supabase
    .from("orders")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return fromDbRow(data);
}

export async function deleteOrder(id) {
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return true;
}
