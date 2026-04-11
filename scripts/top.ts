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
