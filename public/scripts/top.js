"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const keyInput = document.getElementById("web3formsKey");
  if (keyInput) {
    keyInput.value = window.CONFIG?.WEB3FORMS_KEY ?? "";
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.15 },
  );
  const targets = document.querySelectorAll(".fade-up");
  if (targets.length === 0) {
    console.error("エラー: 監視対象の .fade-up 要素が見つかりません。");
  } else {
    targets.forEach((el) => observer.observe(el));
  }
});

// モーダル要素の取得
const modal = document.getElementById("contactModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");
const form = document.getElementById("contactForm");
const statusText = document.getElementById("formStatus");
const submitBtn = form.querySelector(".btn-submit");

// 「メールを送る」でモーダルを開く
openBtn.addEventListener("click", (e) => {
  e.preventDefault();
  modal.style.display = "flex";
});

// キャンセルボタンでモーダルを閉じる
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
  statusText.style.display = "none";
  form.reset();
});

// フォーム送信時の処理（画面遷移を防ぐ非同期通信）
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.textContent = "送信中...";
  submitBtn.disabled = true;

  const formData = new FormData(form);

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      form
        .querySelectorAll("input, textarea, .modal-actions")
        .forEach((el) => (el.style.display = "none"));
      statusText.textContent = "メッセージを送信しました。";
      statusText.style.color = "#16a34a";
      statusText.style.display = "block";

      setTimeout(() => {
        closeBtn.click();
        form
          .querySelectorAll("input, textarea, .modal-actions")
          .forEach((el) => (el.style.display = ""));
        submitBtn.disabled = false;
        submitBtn.textContent = "送信する";
      }, 2000);
    } else {
      throw new Error("API Error");
    }
  } catch (error) {
    statusText.textContent =
      "送信に失敗しました。時間をおいて再度お試しください。";
    statusText.style.color = "#dc2626";
    statusText.style.display = "block";
    submitBtn.disabled = false;
    submitBtn.textContent = "送信する";
  }
});

// ===========================
// 管理者ログイン機能
// 削除したい場合：ここから /管理者ログイン機能 まで全部消す
// ===========================

let isAdminMode = false;

const footerLogo = document.querySelector(".footer-name");
let pressTimer = null;

footerLogo.addEventListener("mousedown", () => {
  pressTimer = setTimeout(() => {
    showAdminLoginModal();
  }, 1500);
});
footerLogo.addEventListener("mouseup", () => {
  if (pressTimer) clearTimeout(pressTimer);
});
footerLogo.addEventListener("mouseleave", () => {
  if (pressTimer) clearTimeout(pressTimer);
});
footerLogo.addEventListener("touchstart", () => {
  pressTimer = setTimeout(() => {
    showAdminLoginModal();
  }, 1500);
});
footerLogo.addEventListener("touchend", () => {
  if (pressTimer) clearTimeout(pressTimer);
});

function showAdminLoginModal() {
  const password = prompt("管理者パスワードを入力してください");
  if (password === window.CONFIG?.ADMIN_PASSWORD) {
    enableAdminMode();
  } else if (password !== null) {
    alert("パスワードが違います");
  }
}

function enableAdminMode() {
  isAdminMode = true;
  showAdminBadge();
  showAdminButtons();
  showDeleteButtons();
  document.body.classList.add("admin-mode");
}

function showAdminBadge() {
  const nav = document.querySelector("nav");
  const badge = document.createElement("span");
  badge.className = "admin-badge";
  badge.textContent = "管理モード中 ✕";
  badge.id = "adminBadge";
  badge.title = "クリックで管理モードを解除";
  badge.style.cursor = "pointer";
  badge.addEventListener("click", () => {
    if (confirm("管理モードを解除しますか？")) {
      disableAdminMode();
    }
  });
  nav.appendChild(badge);
}

function disableAdminMode() {
  isAdminMode = false;
  document.body.classList.remove("admin-mode");

  // バッジを削除
  const badge = document.getElementById("adminBadge");
  if (badge) badge.remove();

  // ＋追加ボタンを削除
  document.querySelectorAll(".admin-add-btn").forEach((btn) => btn.remove());

  // ゴミ箱ボタンを削除
  document.querySelectorAll(".admin-delete-btn").forEach((btn) => btn.remove());
}

function showAdminButtons() {
  const worksSections = document.querySelectorAll("section#works");
  worksSections.forEach((section) => {
    const addBtn = document.createElement("button");
    addBtn.className = "admin-add-btn";
    addBtn.textContent = "+ 追加";
    addBtn.addEventListener("click", () => {
      openAddItemModal(section);
    });
    section.appendChild(addBtn);
  });
}

// 管理者モード：既存カードにゴミ箱ボタンを表示
function showDeleteButtons() {
  document
    .querySelectorAll(".work-card[data-admin-added='true']")
    .forEach((card) => {
      attachDeleteButton(card);
    });
}

// カード1枚にゴミ箱ボタンを付ける
function attachDeleteButton(card) {
  // 二重追加防止
  if (card.querySelector(".admin-delete-btn")) return;
  const btn = document.createElement("button");
  btn.className = "admin-delete-btn";
  btn.title = "削除";
  btn.textContent = "🗑";
  btn.addEventListener("click", () => {
    if (!confirm("このカードを削除しますか？")) return;
    card.style.transition = "opacity 0.3s";
    card.style.opacity = "0";
    setTimeout(() => {
      card.remove();
      saveCardsToServer();
    }, 300);
  });
  card.style.position = "relative";
  card.appendChild(btn);
}

// ===========================
// アイテム追加モーダル
// ===========================

const addItemModal = document.getElementById("addItemModal");
const closeAddItemModalBtn = document.getElementById("closeAddItemModalBtn");
const submitAddItemBtn = document.getElementById("submitAddItemBtn");
const addItemStatus = document.getElementById("addItemStatus");

// アイコン選択
let selectedIcon = "💼";
const iconPicker = document.getElementById("iconPicker");
iconPicker.querySelectorAll(".icon-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    iconPicker
      .querySelectorAll(".icon-option")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedIcon = btn.dataset.icon ?? "💼";
  });
});

// カラー選択
let selectedColor = "purple";
const colorPicker = document.getElementById("colorPicker");
colorPicker.querySelectorAll(".color-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    colorPicker
      .querySelectorAll(".color-option")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedColor = btn.dataset.color ?? "purple";
  });
});

// モーダルを開く（どのセクションに追加するか保持）
let targetSection = null;

function openAddItemModal(section) {
  targetSection = section;
  addItemStatus.style.display = "none";
  document.getElementById("addItemTitle").value = "";
  document.getElementById("addItemSub").value = "";
  document.getElementById("addItemUrl").value = "";
  document.getElementById("addItemTags").value = "";
  addItemModal.style.display = "flex";
}

// キャンセルで閉じる
closeAddItemModalBtn.addEventListener("click", () => {
  addItemModal.style.display = "none";
  targetSection = null;
});

// 追加ボタン
submitAddItemBtn.addEventListener("click", () => {
  const title = document.getElementById("addItemTitle").value.trim();
  if (!title) {
    addItemStatus.textContent = "タイトルは必須です";
    addItemStatus.style.color = "#dc2626";
    addItemStatus.style.display = "block";
    return;
  }

  const sub = document.getElementById("addItemSub").value.trim();
  const url = document.getElementById("addItemUrl").value.trim();
  const tagsRaw = document.getElementById("addItemTags").value.trim();
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const card = buildWorkCard({
    icon: selectedIcon,
    color: selectedColor,
    title,
    sub,
    url,
    tags,
  });

  card.dataset.adminAdded = "true";

  if (targetSection) {
    const worksList = targetSection.querySelector(".works-list");
    worksList.appendChild(card);
    requestAnimationFrame(() => {
      card.classList.add("visible");
    });
  }

  addItemModal.style.display = "none";
  targetSection = null;

  // JSONBin に保存
  saveCardsToServer();
});

// カードDOM生成
function buildWorkCard(item) {
  const card = document.createElement("div");
  card.className = "work-card fade-up";

  const iconDiv = document.createElement("div");
  iconDiv.className = `work-icon work-icon-${item.color}`;
  iconDiv.textContent = item.icon;

  const body = document.createElement("div");

  if (item.url) {
    const a = document.createElement("a");
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    const p = document.createElement("p");
    p.className = "work-title";
    p.textContent = item.title + "（ページ遷移します）";
    a.appendChild(p);
    body.appendChild(a);
  } else {
    const p = document.createElement("p");
    p.className = "work-title";
    p.textContent = item.title;
    body.appendChild(p);
  }

  if (item.sub) {
    const subP = document.createElement("p");
    subP.className = "work-sub";
    subP.textContent = item.sub;
    body.appendChild(subP);
  }

  if (item.tags.length > 0) {
    const tagsDiv = document.createElement("div");
    tagsDiv.className = "work-tags";
    item.tags.forEach((t) => {
      const span = document.createElement("span");
      span.className = "work-tag";
      span.textContent = t;
      tagsDiv.appendChild(span);
    });
    body.appendChild(tagsDiv);
  }

  card.appendChild(iconDiv);
  card.appendChild(body);

  // 管理者モード中に生成されたカードには即ゴミ箱ボタンを付ける
  if (isAdminMode) {
    attachDeleteButton(card);
  }

  return card;
}

// ===========================
// /管理者ログイン機能
// ===========================

// ===========================
// Step 5: JSONBin.io 保存・読み込み
// 削除したい場合：ここから /JSONBin まで全部消す
// ===========================

const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${window.CONFIG?.JSONBIN_BIN_ID}`;
const JSONBIN_HEADERS = {
  "Content-Type": "application/json",
  "X-Master-Key": window.CONFIG?.JSONBIN_SECRET_KEY ?? "",
};

/**
 * JSONBin からすべてのデータを一括で読み込んで復元する。
 * ページ読み込み直後に呼ばれる。
 */
async function loadCardsFromServer() {
  const record = await fetchCurrentRecord();

  // 実績カードの復元
  const works = record?.works ?? [];
  const worksSections = document.querySelectorAll("section#works");
  works.forEach((item) => {
    const section = worksSections[item.sectionIndex];
    if (!section) return;
    const worksList = section.querySelector(".works-list");
    if (!worksList) return;
    const card = buildWorkCard(item);
    card.dataset.adminAdded = "true";
    worksList.appendChild(card);
    card.classList.add("fade-up");
    requestAnimationFrame(() => card.classList.add("visible"));
  });

  // 自己紹介・スキルの復元
  await loadAboutFromServer(record);
  await loadSkillsFromServer(record);
}

/**
 * 現在の管理者追加カードを全件 JSONBin に保存する。
 * カード追加後に呼ぶ。
 */
async function saveCardsToServer() {
  const worksSections = document.querySelectorAll("section#works");
  const works = [];

  worksSections.forEach((section, sectionIndex) => {
    section
      .querySelectorAll(".work-card[data-admin-added='true']")
      .forEach((card) => {
        const iconEl = card.querySelector(".work-icon");
        const titleEl = card.querySelector(".work-title");
        const subEl = card.querySelector(".work-sub");
        const linkEl = card.querySelector("a[href]");
        const tagEls = card.querySelectorAll(".work-tag");

        const colorClass = [...(iconEl?.classList ?? [])].find((c) =>
          c.startsWith("work-icon-"),
        );
        const color = colorClass
          ? colorClass.replace("work-icon-", "")
          : "purple";
        const rawTitle = titleEl?.textContent ?? "";
        const title = rawTitle.replace("（ページ遷移します）", "").trim();

        works.push({
          sectionIndex,
          icon: iconEl?.textContent?.trim() ?? "💼",
          color,
          title,
          sub: subEl?.textContent?.trim() ?? "",
          url: linkEl?.getAttribute("href") ?? "",
          tags: [...tagEls].map((t) => t.textContent.trim()),
        });
      });
  });

  try {
    const res = await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: JSONBIN_HEADERS,
      body: JSON.stringify({ works }),
    });
    if (!res.ok) throw new Error(`save error: ${res.status}`);
  } catch (err) {
    console.error("カードの保存に失敗しました:", err);
    alert("保存に失敗しました。時間をおいて再度お試しください。");
  }
}

// ページ読み込み時にサーバーから全データを復元
loadCardsFromServer();

// ===========================
// /JSONBin
// ===========================

// ===========================
// 自己紹介・スキル編集機能
// 削除したい場合：ここから /自己紹介・スキル編集 まで全部消す
// ===========================

// --- 自己紹介：クリックで直接編集 ---

function enableAboutEdit() {
  const paragraphs = document.querySelectorAll(".about-card p");
  paragraphs.forEach((p) => {
    p.contentEditable = "true";
    p.classList.add("editable-active");
    p.addEventListener("blur", onAboutBlur, { once: false });
  });
}

function disableAboutEdit() {
  const paragraphs = document.querySelectorAll(".about-card p");
  paragraphs.forEach((p) => {
    p.contentEditable = "false";
    p.classList.remove("editable-active");
    p.removeEventListener("blur", onAboutBlur);
  });
}

function onAboutBlur() {
  saveAboutToServer();
}

async function saveAboutToServer() {
  const paragraphs = document.querySelectorAll(".about-card p");
  const texts = [...paragraphs].map((p) => p.textContent.trim());
  const record = await fetchCurrentRecord();
  record.about = texts;
  await putRecord(record);
}

async function loadAboutFromServer(record) {
  const texts = record?.about;
  if (!texts || !Array.isArray(texts)) return;
  const paragraphs = document.querySelectorAll(".about-card p");
  texts.forEach((text, i) => {
    if (paragraphs[i]) paragraphs[i].textContent = text;
  });
}

// --- スキル：追加・編集・削除 ---

function enableSkillEdit() {
  // 既存カードに編集・削除ボタンを付ける
  document.querySelectorAll(".skill-card").forEach((card) => {
    attachSkillButtons(card);
  });

  // ＋追加ボタンを表示
  const grid = document.querySelector(".skill-grid");
  if (grid && !grid.querySelector(".admin-skill-add-btn")) {
    const addBtn = document.createElement("button");
    addBtn.className = "admin-skill-add-btn";
    addBtn.textContent = "+ スキル追加";
    addBtn.addEventListener("click", () => openSkillModal(null));
    grid.appendChild(addBtn);
  }
}

function disableSkillEdit() {
  document
    .querySelectorAll(
      ".skill-edit-btn, .skill-delete-btn, .admin-skill-add-btn",
    )
    .forEach((el) => el.remove());
  document.querySelectorAll(".skill-card").forEach((card) => {
    card.style.position = "";
  });
}

function attachSkillButtons(card) {
  if (card.querySelector(".skill-edit-btn")) return;
  card.style.position = "relative";

  const editBtn = document.createElement("button");
  editBtn.className = "skill-edit-btn";
  editBtn.textContent = "✏️";
  editBtn.title = "編集";
  editBtn.addEventListener("click", () => openSkillModal(card));
  card.appendChild(editBtn);

  // data-admin-added のカードのみ削除可能
  if (card.dataset.adminAdded === "true") {
    const delBtn = document.createElement("button");
    delBtn.className = "skill-delete-btn";
    delBtn.textContent = "🗑";
    delBtn.title = "削除";
    delBtn.addEventListener("click", () => {
      if (!confirm("このスキルを削除しますか？")) return;
      card.style.transition = "opacity 0.3s";
      card.style.opacity = "0";
      setTimeout(() => {
        card.remove();
        saveSkillsToServer();
      }, 300);
    });
    card.appendChild(delBtn);
  }
}

// スキルモーダルを開く（card=nullなら新規追加）
let editingSkillCard = null;

function openSkillModal(card) {
  editingSkillCard = card;
  const modal = document.getElementById("skillEditModal");

  if (card) {
    const name = card.querySelector(".skill-name")?.textContent ?? "";
    const level = card.querySelector(".skill-level")?.textContent ?? "";
    const barEl = card.querySelector(".skill-bar");
    const width = barEl ? parseInt(barEl.style.width) : 0;
    const tag = card.querySelector(".skill-tag")?.textContent ?? "";
    document.getElementById("skillName").value = name;
    document.getElementById("skillLevel").value = level;
    document.getElementById("skillPercent").value = width;
    document.getElementById("skillPercentVal").textContent = width + "%";
    document.getElementById("skillTag").value = tag;
  } else {
    document.getElementById("skillName").value = "";
    document.getElementById("skillLevel").value = "学習中";
    document.getElementById("skillPercent").value = 0;
    document.getElementById("skillPercentVal").textContent = "0%";
    document.getElementById("skillTag").value = "";
  }

  modal.style.display = "flex";
}

function buildSkillCard(name, level, percent, tag) {
  const card = document.createElement("div");
  card.className = "skill-card fade-up";
  card.dataset.adminAdded = "true";
  card.innerHTML = `
    <div class="skill-header">
      <span class="skill-name">${name}</span>
      <span class="skill-level">${level}</span>
    </div>
    <div class="skill-bar-bg">
      <div class="skill-bar" style="width: ${percent}%"></div>
    </div>
    <p class="skill-tag">${tag}</p>
  `;
  return card;
}

async function saveSkillsToServer() {
  const cards = document.querySelectorAll(".skill-card");
  const skills = [...cards].map((card) => ({
    name: card.querySelector(".skill-name")?.textContent?.trim() ?? "",
    level: card.querySelector(".skill-level")?.textContent?.trim() ?? "",
    percent: parseInt(card.querySelector(".skill-bar")?.style.width) || 0,
    tag: card.querySelector(".skill-tag")?.textContent?.trim() ?? "",
    adminAdded: card.dataset.adminAdded === "true",
  }));
  const record = await fetchCurrentRecord();
  record.skills = skills;
  await putRecord(record);
}

async function loadSkillsFromServer(record) {
  const skills = record?.skills;
  if (!skills || !Array.isArray(skills)) return;

  const grid = document.querySelector(".skill-grid");
  // HTMLに最初からある既存カード（adminAdded でないもの）
  const existingCards = [
    ...grid.querySelectorAll(".skill-card:not([data-admin-added])"),
  ];
  let existingIndex = 0;

  skills.forEach((skill) => {
    if (skill.adminAdded) {
      // 管理者追加カードは新規生成
      const card = buildSkillCard(
        skill.name,
        skill.level,
        skill.percent,
        skill.tag,
      );
      grid.appendChild(card);
      requestAnimationFrame(() => card.classList.add("visible"));
    } else {
      // 既存カードを順番に更新
      const c = existingCards[existingIndex++];
      if (!c) return;
      const nameEl = c.querySelector(".skill-name");
      const levelEl = c.querySelector(".skill-level");
      const barEl = c.querySelector(".skill-bar");
      const tagEl = c.querySelector(".skill-tag");
      if (nameEl) nameEl.textContent = skill.name;
      if (levelEl) levelEl.textContent = skill.level;
      if (barEl) barEl.style.width = skill.percent + "%";
      if (tagEl) tagEl.textContent = skill.tag;
    }
  });
}

// --- JSONBin 共通ユーティリティ ---

async function fetchCurrentRecord() {
  try {
    const res = await fetch(`${JSONBIN_URL}/latest`, {
      headers: JSONBIN_HEADERS,
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data?.record ?? {};
  } catch {
    return {};
  }
}

async function putRecord(record) {
  try {
    const res = await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: JSONBIN_HEADERS,
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`save error: ${res.status}`);
  } catch (err) {
    console.error("保存に失敗しました:", err);
    alert("保存に失敗しました。時間をおいて再度お試しください。");
  }
}

// --- スキル編集モーダルのイベント ---

document.addEventListener("DOMContentLoaded", () => {
  const skillModal = document.getElementById("skillEditModal");
  const skillCancelBtn = document.getElementById("skillEditCancelBtn");
  const skillSaveBtn = document.getElementById("skillEditSaveBtn");
  const skillPercent = document.getElementById("skillPercent");
  const skillPercentVal = document.getElementById("skillPercentVal");

  if (skillPercent) {
    skillPercent.addEventListener("input", () => {
      skillPercentVal.textContent = skillPercent.value + "%";
    });
  }

  if (skillCancelBtn) {
    skillCancelBtn.addEventListener("click", () => {
      skillModal.style.display = "none";
      editingSkillCard = null;
    });
  }

  if (skillSaveBtn) {
    skillSaveBtn.addEventListener("click", () => {
      const name = document.getElementById("skillName").value.trim();
      if (!name) {
        alert("スキル名は必須です");
        return;
      }
      const level =
        document.getElementById("skillLevel").value.trim() || "学習中";
      const percent =
        parseInt(document.getElementById("skillPercent").value) || 0;
      const tag = document.getElementById("skillTag").value.trim();

      if (editingSkillCard) {
        // 既存カードを更新
        const nameEl = editingSkillCard.querySelector(".skill-name");
        const levelEl = editingSkillCard.querySelector(".skill-level");
        const barEl = editingSkillCard.querySelector(".skill-bar");
        const tagEl = editingSkillCard.querySelector(".skill-tag");
        if (nameEl) nameEl.textContent = name;
        if (levelEl) levelEl.textContent = level;
        if (barEl) barEl.style.width = percent + "%";
        if (tagEl) tagEl.textContent = tag;
      } else {
        // 新規カードを追加
        const grid = document.querySelector(".skill-grid");
        const addBtn = grid.querySelector(".admin-skill-add-btn");
        const card = buildSkillCard(name, level, percent, tag);
        grid.insertBefore(card, addBtn);
        requestAnimationFrame(() => card.classList.add("visible"));
        attachSkillButtons(card);
      }

      skillModal.style.display = "none";
      editingSkillCard = null;
      saveSkillsToServer();
    });
  }
});

// --- enableAdminMode / disableAdminMode に編集機能を連携 ---
// （元の関数をラップして上書き）

const _origEnable = enableAdminMode;
enableAdminMode = function () {
  _origEnable();
  enableAboutEdit();
  enableSkillEdit();
};

const _origDisable = disableAdminMode;
disableAdminMode = function () {
  _origDisable();
  disableAboutEdit();
  disableSkillEdit();
};

// （復元は loadCardsFromServer にまとめて実行）

// ===========================
// /自己紹介・スキル編集
// ===========================
