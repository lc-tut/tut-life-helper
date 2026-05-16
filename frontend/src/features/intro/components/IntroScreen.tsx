export function IntroScreen({ onContinue }: { onContinue: () => void }) {
  const appIconPath = '/icons/tut-maps-icon-512-20260514.png';

  return (
    <main className="intro-screen" aria-label="TUT MAPSの案内">
      <section className="intro-card">
        <img className="intro-logo" src={appIconPath} alt="TUT MAPS" />
        <p className="intro-kicker">TUT MAPS</p>
        <h1>非公式アプリです</h1>
        <p className="intro-copy">
          このアプリは東京工科大学の公式アプリではありません。キャンパス生活を便利にするための個人制作アプリです。
        </p>

        <div className="intro-install-box">
          <h2>スマホではPWAとして使えます</h2>
          <p>ホーム画面に追加すると、次回からこの案内を表示せずにアプリ画面を開けます。</p>
          <ul>
            <li>iPhone: Safariの共有ボタンから「ホーム画面に追加」</li>
            <li>Android: Chromeのメニューから「アプリをインストール」または「ホーム画面に追加」</li>
          </ul>
        </div>

        <button className="intro-primary" type="button" onClick={onContinue}>
          アプリを開く
        </button>
      </section>
    </main>
  );
}
