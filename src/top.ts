"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const keyInput = document.getElementById("web3formsKey") as HTMLInputElement;
  if (keyInput) {
    keyInput.value = (window as any).CONFIG?.WEB3FORMS_KEY ?? "";
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
const modal = document.getElementById("contactModal") as HTMLElement;
const openBtn = document.getElementById("openModalBtn") as HTMLElement;
const closeBtn = document.getElementById("closeModalBtn") as HTMLElement;
const form = document.getElementById("contactForm") as HTMLFormElement;
const statusText = document.getElementById("formStatus") as HTMLElement;
const submitBtn = form.querySelector(".btn-submit") as HTMLButtonElement;

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
    const response = await fetch((form as HTMLFormElement).action, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      form
        .querySelectorAll("input, textarea, .modal-actions")
        .forEach((el) => ((el as HTMLElement).style.display = "none"));
      statusText.textContent = "メッセージを送信しました。";
      statusText.style.color = "#16a34a";
      statusText.style.display = "block";

      setTimeout(() => {
        closeBtn.click();
        form
          .querySelectorAll("input, textarea, .modal-actions")
          .forEach((el) => ((el as HTMLElement).style.display = ""));
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

const footerLogo = document.querySelector(".footer-name") as HTMLElement;
let pressTimer: ReturnType<typeof setTimeout> | null = null;

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
  if (password === (window as any).CONFIG?.ADMIN_PASSWORD) {
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
  const nav = document.querySelector("nav") as HTMLElement;
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
      alert("追加ボタンが押されました（Step3で実装します）");
    });
    section.appendChild(addBtn);
  });
}

// ===========================
// /管理者ログイン機能
// ===========================
