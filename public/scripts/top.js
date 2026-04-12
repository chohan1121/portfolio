"use strict";
// HTMLの構造が完全に読み込まれてから処理を開始する（空振りを防ぐための必須処置）
document.addEventListener("DOMContentLoaded", () => {
  // IntersectionObserver：要素が画面に入ったか監視するAPI
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // isIntersecting = 要素が画面に15%以上入ったら true になる
        if (entry.isIntersecting) {
          entry.target.classList.add("visible"); // .visible を追加 → CSSアニメーション発動
        }
      });
    },
    { threshold: 0.15 },
  ); // 15%見えたらコールバックを実行
  const targets = document.querySelectorAll(".fade-up");
  // 念のためのエラー検証
  if (targets.length === 0) {
    console.error("エラー: 監視対象の .fade-up 要素が見つかりません。");
  } else {
    // .fade-up クラスを持つ全要素を監視対象に登録
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
  form.reset(); // 入力内容をリセット
});

// フォーム送信時の処理（画面遷移を防ぐ非同期通信）
form.addEventListener("submit", async (e) => {
  e.preventDefault(); // デフォルトの画面遷移を強制ストップ

  // ボタンを送信中状態にする
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
      // 送信成功
      form
        .querySelectorAll("input, textarea, .modal-actions")
        .forEach((el) => (el.style.display = "none"));
      statusText.textContent = "メッセージを送信しました。";
      statusText.style.color = "#16a34a"; // 緑色
      statusText.style.display = "block";

      // 2秒後にモーダルを閉じて元に戻す
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
    // 送信失敗
    statusText.textContent =
      "送信に失敗しました。時間をおいて再度お試しください。";
    statusText.style.color = "#dc2626"; // 赤色
    statusText.style.display = "block";
    submitBtn.disabled = false;
    submitBtn.textContent = "送信する";
  }
});

// ===========================
// 管理者ログイン機能
// 削除したい場合：ここから /管理者ログイン機能 まで全部消す
// ===========================

// 管理モードの状態（true=管理中, false=通常）
let isAdminMode = false;

// フッターロゴの長押し検知
const footerLogo = document.querySelector(".footer-name");
let pressTimer = null;

// 長押し開始
footerLogo.addEventListener("mousedown", () => {
  pressTimer = setTimeout(() => {
    showAdminLoginModal();
  }, 1500); // 1.5秒長押しで発動
});

// 長押しキャンセル（離したり動かしたら無効）
footerLogo.addEventListener("mouseup", () => clearTimeout(pressTimer));
footerLogo.addEventListener("mouseleave", () => clearTimeout(pressTimer));

// スマホ対応（タッチ操作）
footerLogo.addEventListener("touchstart", () => {
  pressTimer = setTimeout(() => {
    showAdminLoginModal();
  }, 1500);
});
footerLogo.addEventListener("touchend", () => clearTimeout(pressTimer));

// パスワード入力モーダルを表示する
function showAdminLoginModal() {
  const password = prompt("管理者パスワードを入力してください");
  if (password === CONFIG.ADMIN_PASSWORD) {
    enableAdminMode();
  } else if (password !== null) {
    // キャンセルは無視、間違いだけ通知
    alert("パスワードが違います");
  }
}

// 管理モードをONにする
function enableAdminMode() {
  isAdminMode = true;

  // ① ナビにバッジを追加
  showAdminBadge();

  // ② 各セクションに＋ボタンを表示
  showAdminButtons();

  // ③ ページ全体に管理モード枠を表示
  document.body.classList.add("admin-mode");
}

// ① 管理バッジをナビに追加
function showAdminBadge() {
  const nav = document.querySelector("nav");
  const badge = document.createElement("span");
  badge.className = "admin-badge";
  badge.textContent = "管理モード中";
  badge.id = "adminBadge";
  nav.appendChild(badge);
}

// ② 実績・制作物セクションに＋ボタンを追加
function showAdminButtons() {
  // id="works" を持つセクションを全部取得（実績と制作物の両方）
  const worksSections = document.querySelectorAll("section#works");

  worksSections.forEach((section) => {
    const addBtn = document.createElement("button");
    addBtn.className = "admin-add-btn";
    addBtn.textContent = "+ 追加";
    addBtn.addEventListener("click", () => {
      // Step3で中身を作る（今はアラートで確認）
      alert("追加ボタンが押されました（Step3で実装します）");
    });
    section.appendChild(addBtn);
  });
}

// ===========================
// /管理者ログイン機能
// ===========================
