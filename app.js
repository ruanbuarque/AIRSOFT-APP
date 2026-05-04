const STORAGE_KEY = "mcm-arsenal-v1";

const imageSources = [
  { label: "WT", site: "wtairsoft.com.br" },
  { label: "Warsoft", site: "warsoftbrasil.com.br" },
  { label: "GM Tatico", site: "gmtatico.com.br" },
  { label: "Carabina", site: "lojadacarabina.com.br" },
];

const initialState = {
  logo: "",
  inventory: [
    {
      id: uid(),
      name: "Rifle AEG principal",
      brand: "Configurar marca e modelo",
      category: "AEG",
      image: "",
      notes: "Cadastre bateria, magazines, upgrades e manutencoes.",
    },
    {
      id: uid(),
      name: "Mascara de protecao",
      brand: "Full face / goggles",
      category: "Protecao",
      image: "",
      notes: "Item critico para jogos e trabalho de Ranger.",
    },
  ],
  supplies: [
    { id: uid(), name: "BBs 0.25g", quantity: 4000, minimum: 2000, type: "Consumivel" },
    { id: uid(), name: "Gas green gas", quantity: 1, minimum: 2, type: "Suprimento" },
    { id: uid(), name: "O-rings de vedacao", quantity: 6, minimum: 4, type: "Peca de reposicao" },
  ],
  wishes: [
    { id: uid(), name: "Tracer unit", budget: "R$ 350", priority: "Media" },
  ],
  events: [
    { id: uid(), title: "Jogo MCM", date: todayOffset(6), type: "Jogo", notes: "Confirmar loadout e suprimentos." },
    { id: uid(), title: "Trabalho de Ranger", date: todayOffset(13), type: "Ranger - Arena Leao Carpina", notes: "Arena Leao Carpina." },
  ],
};

let state = loadState();
let calendarDate = new Date();

const $ = (selector) => document.querySelector(selector);

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `mcm-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function todayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return clone(initialState);
  try {
    return { ...clone(initialState), ...JSON.parse(saved) };
  } catch {
    return clone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function openSearch(itemName, site) {
  const query = encodeURIComponent(`${itemName} site:${site}`);
  window.open(`https://www.google.com/search?tbm=isch&q=${query}`, "_blank", "noopener,noreferrer");
}

function renderInventory() {
  const search = $("#inventorySearch").value.trim().toLowerCase();
  const category = $("#categoryFilter").value;
  const filtered = state.inventory.filter((item) => {
    const haystack = `${item.name} ${item.brand} ${item.category}`.toLowerCase();
    return haystack.includes(search) && (category === "todos" || item.category === category);
  });

  $("#inventoryList").innerHTML = filtered.length ? filtered.map((item) => `
    <article class="item-card">
      <div class="thumb">
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` : escapeHtml(item.name.slice(0, 2).toUpperCase())}
      </div>
      <div class="item-body">
        <div class="item-top">
          <div>
            <div class="item-title">${escapeHtml(item.name)}</div>
            <div class="item-meta">${escapeHtml(item.brand || "Sem marca")} - ${escapeHtml(item.category)}</div>
          </div>
          <span class="pill">${escapeHtml(item.category)}</span>
        </div>
        ${item.notes ? `<p class="item-note">${escapeHtml(item.notes)}</p>` : ""}
        <div class="actions">
          ${imageSources.map((source) => `<button class="mini-button" data-search-image="${item.id}" data-site="${source.site}">${source.label}</button>`).join("")}
          <button class="mini-button delete-button" data-delete-inventory="${item.id}">Excluir</button>
        </div>
      </div>
    </article>
  `).join("") : `<div class="empty-state">Nenhum equipamento encontrado. Toque em + para cadastrar seu arsenal.</div>`;
}

function renderSupplies() {
  $("#supplyList").innerHTML = state.supplies.length ? state.supplies.map((item) => {
    const ratio = item.minimum > 0 ? Math.min(item.quantity / item.minimum, 1.5) : 1;
    const percent = Math.max(8, Math.min(100, ratio * 70));
    const low = item.quantity < item.minimum;
    return `
      <article class="stock-card">
        <div class="stock-top">
          <div>
            <div class="item-title">${escapeHtml(item.name)}</div>
            <div class="item-meta">${escapeHtml(item.type)} - minimo ${item.minimum}</div>
          </div>
          <span class="pill">${item.quantity}</span>
        </div>
        <div class="meter ${low ? "is-low" : ""}"><span style="width:${percent}%"></span></div>
        <div class="actions">
          <button class="mini-button" data-adjust-supply="${item.id}" data-delta="-1">-1</button>
          <button class="mini-button" data-adjust-supply="${item.id}" data-delta="1">+1</button>
          <button class="mini-button delete-button" data-delete-supply="${item.id}">Excluir</button>
        </div>
      </article>
    `;
  }).join("") : `<div class="empty-state">Cadastre BBs, gas, baterias, pecas e consumiveis.</div>`;
}

function renderWishes() {
  const priorityOrder = { Alta: 0, Media: 1, Baixa: 2 };
  const wishes = [...state.wishes].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  $("#wishList").innerHTML = wishes.length ? wishes.map((item) => `
    <article class="stock-card">
      <div class="stock-top">
        <div>
          <div class="item-title">${escapeHtml(item.name)}</div>
          <div class="item-meta">${escapeHtml(item.budget || "Sem orcamento definido")}</div>
        </div>
        <span class="pill">${escapeHtml(item.priority)}</span>
      </div>
      <div class="actions">
        ${imageSources.map((source) => `<button class="mini-button" data-search-wish="${item.id}" data-site="${source.site}">${source.label}</button>`).join("")}
        <button class="mini-button delete-button" data-delete-wish="${item.id}">Excluir</button>
      </div>
    </article>
  `).join("") : `<div class="empty-state">Guarde replicas, pecas e acessorios que voce pretende comprar.</div>`;
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  $("#monthLabel").textContent = calendarDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const iso = day.toISOString().slice(0, 10);
    const hasEvent = state.events.some((event) => event.date === iso);
    days.push(`<button class="day ${day.getMonth() === month ? "in-month" : ""} ${hasEvent ? "has-event" : ""}" data-date="${iso}">${day.getDate()}</button>`);
  }
  $("#calendarGrid").innerHTML = days.join("");

  const events = [...state.events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((event) => new Date(`${event.date}T00:00:00`).getMonth() === month);

  $("#eventList").innerHTML = events.length ? events.map((event) => {
    const date = new Date(`${event.date}T00:00:00`);
    return `
      <article class="event-card">
        <div class="event-date">${String(date.getDate()).padStart(2, "0")}<br>${date.toLocaleDateString("pt-BR", { month: "short" })}</div>
        <div>
          <div class="item-title">${escapeHtml(event.title)}</div>
          <div class="item-meta">${escapeHtml(event.type)}</div>
          ${event.notes ? `<p class="item-note">${escapeHtml(event.notes)}</p>` : ""}
          <div class="actions">
            <button class="mini-button delete-button" data-delete-event="${event.id}">Excluir</button>
          </div>
        </div>
      </article>
    `;
  }).join("") : `<div class="empty-state">Sem eventos neste mes. Adicione jogos ou escala de Ranger.</div>`;
}

function renderSummary() {
  $("#totalItems").textContent = state.inventory.length;
  $("#lowStock").textContent = state.supplies.filter((item) => item.quantity < item.minimum).length;
  const upcoming = state.events
    .filter((event) => event.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  $("#nextEvent").textContent = upcoming ? new Date(`${upcoming.date}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "--";

  if (state.logo) {
    $("#teamLogo").src = state.logo;
    $("#teamLogo").style.display = "block";
    $("#logoText").style.display = "none";
  }
}

function render() {
  renderSummary();
  renderInventory();
  renderSupplies();
  renderWishes();
  renderCalendar();
}

function bindForms() {
  $("#itemForm").addEventListener("submit", (event) => {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (!data.name) return;
    state.inventory.unshift({ id: uid(), ...data });
    event.currentTarget.reset();
    saveState();
  });

  $("#supplyForm").addEventListener("submit", (event) => {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.supplies.unshift({
      id: uid(),
      name: data.name,
      quantity: Number(data.quantity),
      minimum: Number(data.minimum),
      type: data.type,
    });
    event.currentTarget.reset();
    saveState();
  });

  $("#wishForm").addEventListener("submit", (event) => {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.wishes.unshift({ id: uid(), ...data });
    event.currentTarget.reset();
    saveState();
  });

  $("#eventForm").addEventListener("submit", (event) => {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.events.push({ id: uid(), ...data });
    event.currentTarget.reset();
    saveState();
  });
}

document.addEventListener("click", (event) => {
  const tab = event.target.closest(".tab");
  if (tab) {
    document.querySelectorAll(".tab, .view").forEach((element) => element.classList.remove("is-active"));
    tab.classList.add("is-active");
    $(`#${tab.dataset.view}`).classList.add("is-active");
  }

  const opener = event.target.closest("[data-open]");
  if (opener) $(`#${opener.dataset.open}`).showModal();

  const dialogCloser = event.target.closest("[data-close-dialog]");
  if (dialogCloser) {
    dialogCloser.closest("dialog").close();
  }

  const imageSearch = event.target.closest("[data-search-image]");
  if (imageSearch) {
    const item = state.inventory.find((entry) => entry.id === imageSearch.dataset.searchImage);
    if (item) openSearch(`${item.name} ${item.brand}`, imageSearch.dataset.site);
  }

  const wishSearch = event.target.closest("[data-search-wish]");
  if (wishSearch) {
    const item = state.wishes.find((entry) => entry.id === wishSearch.dataset.searchWish);
    if (item) openSearch(item.name, wishSearch.dataset.site);
  }

  const supplyAdjust = event.target.closest("[data-adjust-supply]");
  if (supplyAdjust) {
    const item = state.supplies.find((entry) => entry.id === supplyAdjust.dataset.adjustSupply);
    if (item) {
      item.quantity = Math.max(0, item.quantity + Number(supplyAdjust.dataset.delta));
      saveState();
    }
  }

  const dateButton = event.target.closest("[data-date]");
  if (dateButton) {
    $("#eventForm").elements.date.value = dateButton.dataset.date;
    $("#eventDialog").showModal();
  }

  [
    ["deleteInventory", "inventory", "delete-inventory"],
    ["deleteSupply", "supplies", "delete-supply"],
    ["deleteWish", "wishes", "delete-wish"],
    ["deleteEvent", "events", "delete-event"],
  ].forEach(([, collection, attr]) => {
    const button = event.target.closest(`[data-${attr}]`);
    if (button) {
      state[collection] = state[collection].filter((item) => item.id !== button.dataset[attr.replace(/-([a-z])/g, (_, char) => char.toUpperCase())]);
      saveState();
    }
  });
});

$("#inventorySearch").addEventListener("input", renderInventory);
$("#categoryFilter").addEventListener("change", renderInventory);
$("#prevMonth").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});
$("#nextMonth").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

$("#logoInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.logo = reader.result;
    saveState();
  });
  reader.readAsDataURL(file);
});

bindForms();
render();
