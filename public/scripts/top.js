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
  document.body.classList.add("admin-mode");
}

function showAdminBadge() {
  const nav = document.querySelector("nav");
  const badge = document.createElement("span");
  badge.className = "admin-badge";
  badge.textContent = "管理モード中";
  badge.id = "adminBadge";
  nav.appendChild(badge);
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
 * JSONBin からカードを読み込んでページに復元する。
 * ページ読み込み直後に呼ばれる。
 */
async function loadCardsFromServer() {
  try {
    const res = await fetch(`${JSONBIN_URL}/latest`, {
      headers: JSONBIN_HEADERS,
    });
    if (!res.ok) throw new Error(`fetch error: ${res.status}`);
    const data = await res.json();
    const works = data?.record?.works ?? [];

    const worksSections = document.querySelectorAll("section#works");

    works.forEach((item) => {
      const section = worksSections[item.sectionIndex];
      if (!section) return;
      const worksList = section.querySelector(".works-list");
      if (!worksList) return;

      const card = buildWorkCard(item);
      card.dataset.adminAdded = "true";
      worksList.appendChild(card);

      // IntersectionObserver に登録してフェードイン対象にする
      card.classList.add("fade-up");
      requestAnimationFrame(() => {
        card.classList.add("visible");
      });
    });
  } catch (err) {
    console.error("カードの読み込みに失敗しました:", err);
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

// ページ読み込み時にサーバーからカードを復元
loadCardsFromServer();

// ===========================
// /JSONBin
// ===========================
