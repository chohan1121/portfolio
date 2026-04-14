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

      // お問い合わせ履歴をJSONBinに保存
      const emailVal = formData.get("email") ?? "";
      const msgVal = formData.get("message") ?? "";
      saveInquiryToServer(String(emailVal), String(msgVal));

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

    // Undo用にデータを退避
    const iconEl = card.querySelector(".work-icon");
    const titleEl = card.querySelector(".work-title");
    const subEl = card.querySelector(".work-sub");
    const linkEl = card.querySelector("a[href]");
    const tagEls = card.querySelectorAll(".work-tag");
    const colorClass = [...(iconEl?.classList ?? [])].find((c) =>
      c.startsWith("work-icon-"),
    );
    const color = colorClass ? colorClass.replace("work-icon-", "") : "purple";
    const rawTitle = titleEl?.textContent ?? "";
    const worksSections = [...document.querySelectorAll("section#works")];
    const sectionIndex = worksSections.indexOf(card.closest("section#works"));
    const list = card.closest(".works-list");
    const insertIndex = list
      ? [...list.querySelectorAll(".work-card")].indexOf(card)
      : 0;

    pushUndo("delete-work", {
      sectionIndex,
      insertIndex,
      icon: iconEl?.textContent?.trim() ?? "💼",
      color,
      title: rawTitle.replace("（ページ遷移します）", "").trim(),
      sub: subEl?.textContent?.trim() ?? "",
      url: linkEl?.getAttribute("href") ?? "",
      tags: [...tagEls].map((t) => t.textContent.trim()),
    });

    card.style.transition = "opacity 0.3s";
    card.style.opacity = "0";
    setTimeout(() => {
      card.remove();
      saveCardsToServer();
      showToast("🗑 削除しました　↩ 元に戻すで復元できます");
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

const SUPABASE_URL = window.CONFIG?.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = window.CONFIG?.SUPABASE_ANON_KEY ?? "";
const SUPABASE_HEADERS = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

/**
 * JSONBin からすべてのデータを一括で読み込んで復元する。
 * ページ読み込み直後に呼ばれる。
 */
async function loadCardsFromServer() {
  try {
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

    // 自己紹介・スキル・ヒーロー・ページビューの復元
    await loadAboutFromServer(record);
    await loadSkillsFromServer(record);
    await loadHeroFromServer(record);
    await loadPageView(record);

    // スキルバーアニメーション（復元後に実行）
    initSkillBarAnimation();
  } catch (err) {
    console.error("データの読み込みに失敗しました:", err);
  }
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
    const record = await fetchCurrentRecord();
    record.works = works;
    await putRecord(record);
    return;
    // ダミー（以下はputRecord内でエラー処理済み）
    if (false) throw new Error();
  } catch (err) {
    console.error("カードの保存に失敗しました:", err);
    alert("保存に失敗しました。時間をおいて再度お試しください。");
  }
}

// ページ読み込み時にサーバーから全データを復元 ＋ PV加算
loadCardsFromServer();
incrementPageView();

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

      // Undo用にデータを退避
      const grid = card.closest(".skill-grid");
      const insertIndex = grid
        ? [...grid.querySelectorAll(".skill-card")].indexOf(card)
        : 0;
      pushUndo("delete-skill", {
        name: card.querySelector(".skill-name")?.textContent?.trim() ?? "",
        level: card.querySelector(".skill-level")?.textContent?.trim() ?? "",
        percent: parseInt(card.querySelector(".skill-bar")?.style.width) || 0,
        tag: card.querySelector(".skill-tag")?.textContent?.trim() ?? "",
        insertIndex,
      });

      card.style.transition = "opacity 0.3s";
      card.style.opacity = "0";
      setTimeout(() => {
        card.remove();
        saveSkillsToServer();
        showToast("🗑 削除しました　↩ 元に戻すで復元できます");
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

// --- Supabase 共通ユーティリティ（キャッシュ・タイムアウト・フォールバック統合版）---

// メモリキャッシュ（ページ内で1回だけfetchする）
var _recordCache = null;

async function fetchCurrentRecord() {
  if (_recordCache !== null && _recordCache !== undefined) {
    return JSON.parse(JSON.stringify(_recordCache));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/portfolio_data?id=eq.1&select=data`,
      { headers: SUPABASE_HEADERS, signal: controller.signal },
    );
    clearTimeout(timeout);
    if (!res.ok) throw new Error("fetch error: " + res.status);
    const rows = await res.json();
    _recordCache = rows[0]?.data ?? {};
    localStorage.setItem("portfolio_cache", JSON.stringify(_recordCache));
    return JSON.parse(JSON.stringify(_recordCache));
  } catch (err) {
    clearTimeout(timeout);
    console.warn("Supabase接続失敗、キャッシュから復元します:", err);
    const cached = localStorage.getItem("portfolio_cache");
    if (cached && cached !== "undefined") {
      try {
        _recordCache = JSON.parse(cached);
        return JSON.parse(JSON.stringify(_recordCache));
      } catch (e) {
        // キャッシュが壊れていた場合は空で返す
      }
    }
    _recordCache = {};
    return {};
  }
}

async function putRecord(record) {
  _recordCache = JSON.parse(JSON.stringify(record));
  localStorage.setItem("portfolio_cache", JSON.stringify(_recordCache));
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/portfolio_data?id=eq.1`, {
      method: "PATCH",
      headers: { ...SUPABASE_HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify({ data: record }),
    });
    if (!res.ok) throw new Error("save error: " + res.status);
  } catch (err) {
    console.error("保存に失敗しました:", err);
    alert("保存に失敗しました。時間をおいて再度お試しください。");
  }
}

function clearRecordCache() {
  _recordCache = null;
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
const _origEnable = enableAdminMode;
enableAdminMode = function () {
  _origEnable();
  enableAboutEdit();
  enableSkillEdit();
  enableHeroEdit();
  enableDragAndDrop();
  enableSkillDragAndDrop();
};

const _origDisable = disableAdminMode;
disableAdminMode = function () {
  _origDisable();
  disableAboutEdit();
  disableSkillEdit();
  disableHeroEdit();
  disableDragAndDrop();
  disableSkillDragAndDrop();
};

// （復元は loadCardsFromServer にまとめて実行）

// ===========================
// /自己紹介・スキル編集
// ===========================

// ===========================
// ① ヒーロー編集（肩書き・バッジ）
// ===========================

function enableHeroEdit() {
  // 肩書きをクリック編集
  const tagline = document.querySelector(".hero-tagline");
  if (tagline) {
    tagline.contentEditable = "true";
    tagline.classList.add("editable-active");
    tagline.addEventListener("blur", saveHeroToServer);
  }

  // バッジエリアに「＋バッジ追加」ボタンを表示
  const heroTags = document.querySelector(".hero-tags");
  if (heroTags && !heroTags.querySelector(".admin-badge-add-btn")) {
    // 既存バッジに削除ボタンを付ける
    heroTags
      .querySelectorAll(".badge")
      .forEach((badge) => attachBadgeDeleteBtn(badge));

    const addBtn = document.createElement("button");
    addBtn.className = "admin-badge-add-btn";
    addBtn.textContent = "+ バッジ追加";
    addBtn.addEventListener("click", () => openBadgeModal());
    heroTags.appendChild(addBtn);
  }
}

function disableHeroEdit() {
  const tagline = document.querySelector(".hero-tagline");
  if (tagline) {
    tagline.contentEditable = "false";
    tagline.classList.remove("editable-active");
    tagline.removeEventListener("blur", saveHeroToServer);
  }
  document
    .querySelectorAll(".admin-badge-add-btn, .badge-delete-btn")
    .forEach((el) => el.remove());
}

function attachBadgeDeleteBtn(badge) {
  if (badge.querySelector(".badge-delete-btn")) return;
  badge.style.position = "relative";
  const btn = document.createElement("button");
  btn.className = "badge-delete-btn";
  btn.textContent = "✕";
  btn.title = "削除";
  btn.addEventListener("click", () => {
    badge.remove();
    saveHeroToServer();
  });
  badge.appendChild(btn);
}

// バッジ追加モーダル（シンプルなpromptで対応）
const BADGE_COLORS = ["gray", "purple", "blue", "pink", "green", "amber"];

function openBadgeModal() {
  const text = prompt("バッジのテキストを入力してください");
  if (!text || !text.trim()) return;

  const colorChoice = prompt(
    `色を選んでください（番号で入力）\n1: グレー\n2: パープル\n3: ブルー\n4: ピンク\n5: グリーン\n6: アンバー`,
    "1",
  );
  const colorIndex = parseInt(colorChoice) - 1;
  const color = BADGE_COLORS[colorIndex] ?? "gray";

  const badge = document.createElement("span");
  badge.className = `badge badge-${color}`;
  badge.textContent = text.trim();

  const heroTags = document.querySelector(".hero-tags");
  const addBtn = heroTags.querySelector(".admin-badge-add-btn");
  heroTags.insertBefore(badge, addBtn);
  attachBadgeDeleteBtn(badge);
  saveHeroToServer();
}

async function saveHeroToServer() {
  const tagline =
    document.querySelector(".hero-tagline")?.textContent?.trim() ?? "";
  const badges = [...document.querySelectorAll(".hero-tags .badge")].map(
    (b) => ({
      text:
        b.childNodes[0]?.textContent?.trim() ??
        b.textContent.replace("✕", "").trim(),
      color:
        [...b.classList]
          .find((c) => c.startsWith("badge-") && c !== "badge")
          ?.replace("badge-", "") ?? "gray",
    }),
  );
  const record = await fetchCurrentRecord();
  record.hero = { tagline, badges };
  await putRecord(record);
}

async function loadHeroFromServer(record) {
  const hero = record?.hero;
  if (!hero) return;

  if (hero.tagline) {
    const tagline = document.querySelector(".hero-tagline");
    if (tagline) tagline.textContent = hero.tagline;
  }

  if (Array.isArray(hero.badges) && hero.badges.length > 0) {
    const heroTags = document.querySelector(".hero-tags");
    // 既存バッジを削除して復元
    heroTags.querySelectorAll(".badge").forEach((b) => b.remove());
    hero.badges.forEach((b) => {
      const badge = document.createElement("span");
      badge.className = `badge badge-${b.color}`;
      badge.textContent = b.text;
      heroTags.appendChild(badge);
    });
  }
}

// ===========================
// /ヒーロー編集
// ===========================

// ===========================
// ② ドラッグ&ドロップ並び替え（実績・制作物）
// ===========================

let dragSrcEl = null;

function enableDragAndDrop() {
  document.querySelectorAll(".works-list").forEach((list) => {
    list.querySelectorAll(".work-card").forEach((card) => attachDrag(card));
    // MutationObserver で後から追加されたカードにも適用
    list._dragObserver = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.classList?.contains("work-card")) attachDrag(node);
        });
      });
    });
    list._dragObserver.observe(list, { childList: true });
  });
}

function disableDragAndDrop() {
  document.querySelectorAll(".work-card").forEach((card) => {
    card.draggable = false;
    card.classList.remove("dragging");
  });
  document.querySelectorAll(".works-list").forEach((list) => {
    if (list._dragObserver) {
      list._dragObserver.disconnect();
      delete list._dragObserver;
    }
  });
}

function attachDrag(card) {
  card.draggable = true;

  card.addEventListener("dragstart", (e) => {
    dragSrcEl = card;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    document
      .querySelectorAll(".work-card.drag-over")
      .forEach((c) => c.classList.remove("drag-over"));
    dragSrcEl = null;
    saveCardsToServer();
    showToast("並び順を保存しました");
  });

  attachTouchDrag(card);

  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragSrcEl && dragSrcEl !== card) {
      card.classList.add("drag-over");
    }
  });

  card.addEventListener("dragleave", () => {
    card.classList.remove("drag-over");
  });

  card.addEventListener("drop", (e) => {
    e.preventDefault();
    card.classList.remove("drag-over");
    if (!dragSrcEl || dragSrcEl === card) return;
    const list = card.closest(".works-list");
    if (!list) return;
    const cards = [...list.querySelectorAll(".work-card")];
    const srcIdx = cards.indexOf(dragSrcEl);
    const tgtIdx = cards.indexOf(card);
    if (srcIdx < tgtIdx) {
      list.insertBefore(dragSrcEl, card.nextSibling);
    } else {
      list.insertBefore(dragSrcEl, card);
    }
  });
}

// ===========================
// /ドラッグ&ドロップ
// ===========================

// ===========================
// ③ ページビューカウンター
// ===========================

async function incrementPageView() {
  try {
    // RPC で pageviews を +1（競合しないようにサーバー側でインクリメント）
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_pageview`, {
      method: "POST",
      headers: { ...SUPABASE_HEADERS, Prefer: "return=representation" },
      body: JSON.stringify({ row_id: 1 }),
    });
    if (!res.ok) throw new Error("increment error: " + res.status);
    const count = await res.json();
    renderPageView(count);
  } catch (err) {
    console.warn("ページビューの更新に失敗しました:", err);
  }
}

function renderPageView(count) {
  const el = document.getElementById("pageViewCount");
  if (el) el.textContent = Number(count).toLocaleString();
}

async function loadPageView(record) {
  // loadCardsFromServer経由では使わず、incrementPageViewで兼ねる
}

// ===========================
// /ページビューカウンター
// ===========================

// ===========================
// ④ スキルバーアニメーション修正
// ===========================

function initSkillBarAnimation() {
  const bars = document.querySelectorAll(".skill-bar");
  // 実際の幅を data-width に退避して初期値を0にする
  bars.forEach((bar) => {
    const target = bar.style.width || "0%";
    bar.dataset.targetWidth = target;
    bar.style.width = "0%";
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          bar.style.width = bar.dataset.targetWidth;
          observer.unobserve(bar);
        }
      });
    },
    { threshold: 0.3 },
  );

  bars.forEach((bar) => observer.observe(bar));
}

// ===========================
// /スキルバーアニメーション
// ===========================

// ===========================
// ⑤ スキル ドラッグ&ドロップ
// ===========================

let skillDragSrc = null;

function enableSkillDragAndDrop() {
  const grid = document.querySelector(".skill-grid");
  if (!grid) return;
  grid.querySelectorAll(".skill-card").forEach((card) => attachSkillDrag(card));

  grid._skillDragObserver = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.classList?.contains("skill-card")) attachSkillDrag(node);
      });
    });
  });
  grid._skillDragObserver.observe(grid, { childList: true });
}

function disableSkillDragAndDrop() {
  document.querySelectorAll(".skill-card").forEach((card) => {
    card.draggable = false;
    card.classList.remove("dragging", "drag-over");
  });
  const grid = document.querySelector(".skill-grid");
  if (grid?._skillDragObserver) {
    grid._skillDragObserver.disconnect();
    delete grid._skillDragObserver;
  }
}

function attachSkillDrag(card) {
  card.draggable = true;

  card.addEventListener("dragstart", (e) => {
    skillDragSrc = card;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    document
      .querySelectorAll(".skill-card.drag-over")
      .forEach((c) => c.classList.remove("drag-over"));
    skillDragSrc = null;
    saveSkillsToServer();
    showToast("並び順を保存しました");
  });

  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (skillDragSrc && skillDragSrc !== card) card.classList.add("drag-over");
  });

  card.addEventListener("dragleave", () => card.classList.remove("drag-over"));

  card.addEventListener("drop", (e) => {
    e.preventDefault();
    card.classList.remove("drag-over");
    if (!skillDragSrc || skillDragSrc === card) return;
    const grid = card.closest(".skill-grid");
    if (!grid) return;
    const cards = [...grid.querySelectorAll(".skill-card")];
    const srcIdx = cards.indexOf(skillDragSrc);
    const tgtIdx = cards.indexOf(card);
    if (srcIdx < tgtIdx) {
      grid.insertBefore(skillDragSrc, card.nextSibling);
    } else {
      grid.insertBefore(skillDragSrc, card);
    }
  });

  // スマホ対応（touch events）
  let touchStartY = 0;
  card.addEventListener(
    "touchstart",
    (e) => {
      skillDragSrc = card;
      touchStartY = e.touches[0].clientY;
      card.classList.add("dragging");
    },
    { passive: true },
  );

  card.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const target = el?.closest(".skill-card");
      document
        .querySelectorAll(".skill-card.drag-over")
        .forEach((c) => c.classList.remove("drag-over"));
      if (target && target !== skillDragSrc) target.classList.add("drag-over");
    },
    { passive: false },
  );

  card.addEventListener("touchend", (e) => {
    card.classList.remove("dragging");
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const target = el?.closest(".skill-card");
    document
      .querySelectorAll(".skill-card.drag-over")
      .forEach((c) => c.classList.remove("drag-over"));
    if (target && target !== skillDragSrc) {
      const grid = target.closest(".skill-grid");
      if (grid) {
        const cards = [...grid.querySelectorAll(".skill-card")];
        const srcIdx = cards.indexOf(skillDragSrc);
        const tgtIdx = cards.indexOf(target);
        if (srcIdx < tgtIdx) {
          grid.insertBefore(skillDragSrc, target.nextSibling);
        } else {
          grid.insertBefore(skillDragSrc, target);
        }
      }
    }
    skillDragSrc = null;
    saveSkillsToServer();
    showToast("並び順を保存しました");
  });
}

// ===========================
// /スキル ドラッグ&ドロップ
// ===========================

// ===========================
// ⑥ 実績カード スマホ対応 D&D（touch）
// ===========================

function attachTouchDrag(card) {
  let touchSrc = null;

  card.addEventListener(
    "touchstart",
    (e) => {
      touchSrc = card;
      card.classList.add("dragging");
    },
    { passive: true },
  );

  card.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const target = el?.closest(".work-card");
      document
        .querySelectorAll(".work-card.drag-over")
        .forEach((c) => c.classList.remove("drag-over"));
      if (target && target !== touchSrc) target.classList.add("drag-over");
    },
    { passive: false },
  );

  card.addEventListener("touchend", (e) => {
    card.classList.remove("dragging");
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const target = el?.closest(".work-card");
    document
      .querySelectorAll(".work-card.drag-over")
      .forEach((c) => c.classList.remove("drag-over"));
    if (target && target !== touchSrc) {
      const list = target.closest(".works-list");
      if (list) {
        const cards = [...list.querySelectorAll(".work-card")];
        const srcIdx = cards.indexOf(touchSrc);
        const tgtIdx = cards.indexOf(target);
        if (srcIdx < tgtIdx) {
          list.insertBefore(touchSrc, target.nextSibling);
        } else {
          list.insertBefore(touchSrc, target);
        }
      }
    }
    touchSrc = null;
    saveCardsToServer();
    showToast("並び順を保存しました");
  });
}

// ===========================
// /スマホ対応 D&D
// ===========================

// ===========================
// ⑦ トースト通知
// ===========================

function showToast(message, isError = false) {
  const existing = document.getElementById("adminToast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "adminToast";
  toast.className = "admin-toast" + (isError ? " admin-toast-error" : "");
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// putRecord・saveCardsToServer・saveSkillsToServer・saveAboutToServer・saveHeroToServer にトーストを追加
const _origPutRecord = putRecord;
putRecord = async function (record) {
  await _origPutRecord(record);
  showToast("✅ 保存しました");
};

// ===========================
// /トースト通知
// ===========================

// ===========================
// ⑧ 削除取り消し（Undo）
// ===========================

let undoStack = [];
const MAX_UNDO = 10;

function pushUndo(type, data) {
  undoStack.push({ type, data });
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  updateUndoBtn();
}

function updateUndoBtn() {
  const btn = document.getElementById("adminUndoBtn");
  if (btn) btn.disabled = undoStack.length === 0;
}

function showUndoButton() {
  if (document.getElementById("adminUndoBtn")) return;
  const btn = document.createElement("button");
  btn.id = "adminUndoBtn";
  btn.className = "admin-undo-btn";
  btn.textContent = "↩ 元に戻す";
  btn.disabled = true;
  btn.addEventListener("click", performUndo);
  document.body.appendChild(btn);
}

function hideUndoButton() {
  const btn = document.getElementById("adminUndoBtn");
  if (btn) btn.remove();
  undoStack = [];
}

async function performUndo() {
  const last = undoStack.pop();
  if (!last) return;
  updateUndoBtn();

  if (last.type === "delete-work") {
    // 実績カードを復元
    const section =
      document.querySelectorAll("section#works")[last.data.sectionIndex];
    if (!section) return;
    const worksList = section.querySelector(".works-list");
    const card = buildWorkCard(last.data);
    card.dataset.adminAdded = "true";
    if (last.data.insertBefore) {
      const ref = worksList.children[last.data.insertIndex];
      worksList.insertBefore(card, ref ?? null);
    } else {
      worksList.appendChild(card);
    }
    requestAnimationFrame(() => card.classList.add("visible"));
    if (isAdminMode) {
      attachDeleteButton(card);
      attachDrag(card);
      attachTouchDrag(card);
    }
    await saveCardsToServer();
    showToast("↩ 元に戻しました");
  } else if (last.type === "delete-skill") {
    // スキルカードを復元
    const grid = document.querySelector(".skill-grid");
    const addBtn = grid.querySelector(".admin-skill-add-btn");
    const card = buildSkillCard(
      last.data.name,
      last.data.level,
      last.data.percent,
      last.data.tag,
    );
    const ref = grid.querySelectorAll(".skill-card")[last.data.insertIndex];
    grid.insertBefore(card, ref ?? addBtn ?? null);
    requestAnimationFrame(() => card.classList.add("visible"));
    if (isAdminMode) {
      attachSkillButtons(card);
      attachSkillDrag(card);
    }
    await saveSkillsToServer();
    showToast("↩ 元に戻しました");
  }
}

// enableAdminMode / disableAdminMode にUndo連携
const _origEnable2 = enableAdminMode;
enableAdminMode = function () {
  _origEnable2();
  showUndoButton();
};

const _origDisable2 = disableAdminMode;
disableAdminMode = function () {
  _origDisable2();
  hideUndoButton();
};

// ===========================
// /削除取り消し（Undo）
// ===========================

// ===========================
// ⑨ お問い合わせ履歴
// ===========================

async function saveInquiryToServer(email, message) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/inquiries`, {
      method: "POST",
      headers: { ...SUPABASE_HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify({ email, message }),
    });
    if (!res.ok) throw new Error("inquiry save error: " + res.status);
  } catch (err) {
    console.error("お問い合わせの保存に失敗しました:", err);
  }
}

function showInquiryHistory() {
  const existing = document.getElementById("inquiryModal");
  if (existing) {
    existing.style.display = "flex";
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "inquiryModal";
  overlay.className = "modal-overlay";
  overlay.style.display = "flex";

  const box = document.createElement("div");
  box.className = "modal-content inquiry-modal-content";
  box.innerHTML = `<h3 style="margin-top:0;color:#1e1b4b">📬 お問い合わせ履歴</h3><div id="inquiryList"><p style="color:#6b7280;font-size:14px">読み込み中...</p></div><div class="modal-actions" style="margin-top:16px"><button class="btn-cancel" id="closeInquiryBtn">閉じる</button></div>`;
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  document.getElementById("closeInquiryBtn").addEventListener("click", () => {
    overlay.style.display = "none";
  });

  // データ取得して表示
  fetch(
    `${SUPABASE_URL}/rest/v1/inquiries?select=email,message,created_at&order=created_at.desc&limit=50`,
    { headers: SUPABASE_HEADERS },
  )
    .then((r) => r.json())
    .then((list) => {
      const el = document.getElementById("inquiryList");
      if (list.length === 0) {
        el.innerHTML = `<p style="color:#6b7280;font-size:14px">まだお問い合わせはありません</p>`;
        return;
      }
      el.innerHTML = list
        .map(
          (item) => `
      <div class="inquiry-item">
        <div class="inquiry-meta">
          <span class="inquiry-email">${escapeHtml(item.email)}</span>
          <span class="inquiry-date">${escapeHtml(new Date(item.created_at).toLocaleString("ja-JP"))}</span>
        </div>
        <p class="inquiry-message">${escapeHtml(item.message)}</p>
      </div>
    `,
        )
        .join("");
    });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 管理者バッジに「履歴」ボタンを追加
const _origShowAdminBadge = showAdminBadge;
showAdminBadge = function () {
  _origShowAdminBadge();
  const nav = document.querySelector("nav");
  const historyBtn = document.createElement("button");
  historyBtn.className = "admin-history-btn";
  historyBtn.textContent = "📬 履歴";
  historyBtn.id = "adminHistoryBtn";
  historyBtn.addEventListener("click", showInquiryHistory);
  nav.appendChild(historyBtn);
};

const _origDisableForHistory = disableAdminMode;
disableAdminMode = function () {
  _origDisableForHistory();
  const historyBtn = document.getElementById("adminHistoryBtn");
  if (historyBtn) historyBtn.remove();
  const modal = document.getElementById("inquiryModal");
  if (modal) modal.remove();
};

// ===========================
// /お問い合わせ履歴
// ===========================

// ===========================
// ③ スキルバー数値表示
// ===========================

function initSkillPercents() {
  document.querySelectorAll(".skill-card").forEach((card) => {
    attachSkillPercent(card);
  });
}

function attachSkillPercent(card) {
  if (card.querySelector(".skill-percent-label")) return;
  const bar = card.querySelector(".skill-bar");
  if (!bar) return;
  const label = document.createElement("span");
  label.className = "skill-percent-label";
  // data-targetWidth がある場合はそちらを使う（アニメーション前）
  const pct = bar.dataset.targetWidth ?? bar.style.width ?? "0%";
  label.textContent = pct;
  const barBg = card.querySelector(".skill-bar-bg");
  if (barBg) barBg.after(label);
}

// loadSkillsFromServer 後に呼べるよう、loadCardsFromServer からも呼ぶ
const _origInitSkillBar = initSkillBarAnimation;
initSkillBarAnimation = function () {
  _origInitSkillBar();
  initSkillPercents();
  // バーが伸びるたびにラベルも更新（MutationObserver）
  document.querySelectorAll(".skill-bar").forEach((bar) => {
    const observer = new MutationObserver(() => {
      const card = bar.closest(".skill-card");
      const label = card?.querySelector(".skill-percent-label");
      if (label)
        label.textContent = bar.dataset.targetWidth ?? bar.style.width ?? "0%";
    });
    observer.observe(bar, { attributes: true, attributeFilter: ["style"] });
  });
};

// ===========================
// /スキルバー数値表示
// ===========================

// ===========================
// ④ スケルトン表示
// ===========================

function showSkeleton() {
  // works-list と skill-grid にスケルトンを挿入
  document.querySelectorAll(".works-list").forEach((list) => {
    for (let i = 0; i < 2; i++) {
      const sk = document.createElement("div");
      sk.className = "skeleton-card";
      sk.dataset.skeleton = "true";
      sk.innerHTML = `<div class="sk-icon"></div><div class="sk-body"><div class="sk-line sk-line-wide"></div><div class="sk-line sk-line-mid"></div><div class="sk-line sk-line-narrow"></div></div>`;
      list.appendChild(sk);
    }
  });
}

function removeSkeleton() {
  document
    .querySelectorAll("[data-skeleton='true']")
    .forEach((el) => el.remove());
}

// ページ読み込み時にスケルトンを表示（DOMContentLoaded後すぐ）
document.addEventListener("DOMContentLoaded", showSkeleton);

// ===========================
// /スケルトン表示
// ===========================

// ===========================
// ⑤ バックアップ機能
// ===========================

function initBackupButton() {
  // 管理者モード時にバックアップボタンをナビに追加
}

async function downloadBackup() {
  const record = await fetchCurrentRecord();
  const json = JSON.stringify(record, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("📦 バックアップをダウンロードしました");
}

// 管理者バッジにバックアップボタンを追加
const _origShowAdminBadge2 = showAdminBadge;
showAdminBadge = function () {
  _origShowAdminBadge2();
  const nav = document.querySelector("nav");
  const backupBtn = document.createElement("button");
  backupBtn.className = "admin-history-btn";
  backupBtn.textContent = "📦 バックアップ";
  backupBtn.id = "adminBackupBtn";
  backupBtn.addEventListener("click", downloadBackup);
  nav.appendChild(backupBtn);
};

const _origDisableForBackup = disableAdminMode;
disableAdminMode = function () {
  _origDisableForBackup();
  const btn = document.getElementById("adminBackupBtn");
  if (btn) btn.remove();
};

// ===========================
// /バックアップ機能
// ===========================

// ===========================
// ⑥ エラー時フォールバック
// ===========================

// ===========================
// /エラー時フォールバック（fetchCurrentRecord に統合済み）
// ===========================

// ===========================
// コピーライト年 自動更新
// ===========================

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("footerCopy");
  if (el) el.textContent = `© ${new Date().getFullYear()} 張 帆 / Cho Han`;
});

// ===========================
// /コピーライト年
// ===========================

// ===========================
// ⑦ 訪問者リファラー記録
// ===========================

async function recordReferrer() {
  const ref = document.referrer;
  let source = "直接アクセス";
  if (ref) {
    try {
      const host = new URL(ref).hostname;
      if (host.includes("google")) source = "Google";
      else if (host.includes("twitter") || host.includes("x.com"))
        source = "X (Twitter)";
      else if (host.includes("line")) source = "LINE";
      else if (host.includes("facebook")) source = "Facebook";
      else if (host.includes("instagram")) source = "Instagram";
      else source = host;
    } catch {
      source = ref;
    }
  }

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/referrers`, {
      method: "POST",
      headers: { ...SUPABASE_HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify({ source, path: location.pathname }),
    });
  } catch (err) {
    console.warn("リファラーの記録に失敗しました:", err);
  }
}

// 管理者モード：リファラー履歴を表示
function showReferrerHistory() {
  const existing = document.getElementById("referrerModal");
  if (existing) {
    existing.style.display = "flex";
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "referrerModal";
  overlay.className = "modal-overlay";
  overlay.style.display = "flex";

  const box = document.createElement("div");
  box.className = "modal-content inquiry-modal-content";
  box.innerHTML = `
    <h3 style="margin-top:0;color:#1e1b4b">📊 アクセス元一覧</h3>
    <div id="referrerList"><p style="color:#6b7280;font-size:14px">読み込み中...</p></div>
    <div class="modal-actions" style="margin-top:16px">
      <button class="btn-cancel" id="closeReferrerBtn">閉じる</button>
    </div>`;
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  document.getElementById("closeReferrerBtn").addEventListener("click", () => {
    overlay.style.display = "none";
  });

  fetch(
    `${SUPABASE_URL}/rest/v1/referrers?select=source,path,created_at&order=created_at.desc&limit=100`,
    { headers: SUPABASE_HEADERS },
  )
    .then((r) => r.json())
    .then((list) => {
      const el = document.getElementById("referrerList");
      if (list.length === 0) {
        el.innerHTML = `<p style="color:#6b7280;font-size:14px">まだデータがありません</p>`;
        return;
      }
      // 集計
      const counts = {};
      list.forEach((r) => {
        counts[r.source] = (counts[r.source] ?? 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const total = list.length;
      el.innerHTML = `
      <p style="font-size:12px;color:var(--text-sub);margin-bottom:12px">直近${total}件の集計</p>
      ${sorted
        .map(
          ([src, cnt]) => `
        <div class="referrer-item">
          <span class="referrer-source">${escapeHtml(src)}</span>
          <div class="referrer-bar-wrap">
            <div class="referrer-bar" style="width:${Math.round((cnt / total) * 100)}%"></div>
          </div>
          <span class="referrer-count">${cnt}回</span>
        </div>`,
        )
        .join("")}
      <details style="margin-top:12px">
        <summary style="font-size:12px;color:var(--text-sub);cursor:pointer">詳細ログを見る</summary>
        <div style="margin-top:8px">
          ${list
            .map(
              (r) => `
            <div class="inquiry-item" style="margin-bottom:6px">
              <div class="inquiry-meta">
                <span class="inquiry-email">${escapeHtml(r.source)}</span>
                <span class="inquiry-date">${escapeHtml(new Date(r.created_at).toLocaleString("ja-JP"))}</span>
              </div>
            </div>`,
            )
            .join("")}
        </div>
      </details>`;
    });
}

// 管理者バッジにリファラーボタンを追加
const _origShowAdminBadge3 = showAdminBadge;
showAdminBadge = function () {
  _origShowAdminBadge3();
  const nav = document.querySelector("nav");
  const btn = document.createElement("button");
  btn.className = "admin-history-btn";
  btn.textContent = "📊 流入元";
  btn.id = "adminReferrerBtn";
  btn.addEventListener("click", showReferrerHistory);
  nav.appendChild(btn);
};

const _origDisableForReferrer = disableAdminMode;
disableAdminMode = function () {
  _origDisableForReferrer();
  const btn = document.getElementById("adminReferrerBtn");
  if (btn) btn.remove();
  const modal = document.getElementById("referrerModal");
  if (modal) modal.remove();
};

// ページ読み込み時にリファラーを記録（loadCardsFromServer完了後）
const _origLoadCards = loadCardsFromServer;
loadCardsFromServer = async function () {
  try {
    await _origLoadCards();
  } finally {
    removeSkeleton();
    recordReferrer();
  }
};

// ===========================
// /訪問者リファラー記録
// ===========================

// ===========================
// ⑧ コピーライト年 自動更新（フッター）
// すでに /コピーライト年 で実装済み
// ===========================

// ===========================
// ⑨ 管理者モード セッション維持
// ===========================

// ページ読み込み時にsessionStorageから管理者モードを復元
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("adminMode") === "true") {
    // 少し遅延させてDOM・JS初期化完了後に有効化
    setTimeout(() => {
      enableAdminMode();
    }, 500);
  }
});

// enableAdminMode / disableAdminMode にsessionStorage連携
const _origEnableForSession = enableAdminMode;
enableAdminMode = function () {
  _origEnableForSession();
  sessionStorage.setItem("adminMode", "true");
};

const _origDisableForSession = disableAdminMode;
disableAdminMode = function () {
  _origDisableForSession();
  sessionStorage.removeItem("adminMode");
};

// ===========================
// /管理者モード セッション維持
// ===========================
