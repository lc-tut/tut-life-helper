# 3D Campus Map - Frontend

このディレクトリは、React Three Fiberを使用した3Dキャンパスマップのフロントエンドです。

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:5173`（またはViteが指定するポート）を開いて確認してください。

## カスタマイズについて

### デザインの変更
ご要望に合わせて、白を基調としたクリーンなモックアップ風に仕上げています。
建物の見た目を変更したい場合は、`src/components/Building.jsx` の `<meshStandardMaterial>` のプロパティ（`color`, `roughness` など）を変更してください。現在はホバー時に少し青みがかかるように設定しています。

### UIの変更
建物をクリックしたときのオーバーレイや、タイトルなどのUIは `src/App.jsx` 内のHTMLレイヤー（`Canvas`の外側の`div`要素）に記述されています。必要に応じてスタイルを変更してください。

### カメラ設定の変更
俯瞰（鳥の目）視点を実現するために、`OrthographicCamera`（平行投影カメラ）を使用しています。`src/App.jsx` の `<OrthographicCamera>` の `zoom` や `position` を変更することで、初期表示のスケールや角度を調整できます。
