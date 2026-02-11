// ВАЖНО: замените на ваши реальные значения ниже
const SUPABASE_URL = "https://hocudyimgknwaitlsagk.supabase.co"; // ваш проект URL
const SUPABASE_ANON_KEY = "sb_publishable_vpdM56mSm1zukhIXNCPQkg_6vM9qxMH"; // ваш publishable ключ

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const itemsList = document.getElementById("items");
const form = document.getElementById("item-form");
const nameInput = document.getElementById("name");
const qtyInput = document.getElementById("quantity");
const descInput = document.getElementById("description");

async function loadItems() {
  const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Ошибка при загрузке:", error);
    itemsList.innerHTML = "<li>Ошибка загрузки данных</li>";
    return;
  }
  itemsList.innerHTML = "";
  data.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-left">
        <strong>${escapeHtml(item.name)}</strong>
        <span>(${item.quantity})</span>
        <div style="color:#666; margin-left:8px;">${escapeHtml(item.description || "")}</div>
      </div>
      <div>
        <button class="delete-btn" data-id="${item.id}">Удалить</button>
      </div>
    `;
    itemsList.appendChild(li);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const quantity = parseInt(qtyInput.value) || 1;
  const description = descInput.value.trim();
  if (!name) return alert("Введите название");

  const { data, error } = await supabase.from("items").insert([{ name, description, quantity }]);
  if (error) {
    console.error("Ошибка добавления:", error);
    alert("Ошибка при добавлении");
    return;
  }
  nameInput.value = "";
  descInput.value = "";
  qtyInput.value = "1";
  loadItems();
});

// Делегирование клика для удаления
itemsList.addEventListener("click", async (e) => {
  if (e.target.matches(".delete-btn")) {
    const id = e.target.dataset.id;
    if (!confirm("Удалить запись?")) return;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) {
      console.error("Ошибка удаления:", error);
      alert("Ошибка при удалении");
      return;
    }
    loadItems();
  }
});

// Простая функция для защиты от XSS при выводе
function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Загрузка при старте
loadItems();
