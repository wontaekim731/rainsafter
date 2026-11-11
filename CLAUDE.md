# rainsafter (QLEAR) 작업 규칙

- 클로즈드 베타 링크는 하나로 고정: https://wontaekim731.github.io/rainsafter/cbeta.html (이름 바꾸지 않음)
- cbeta.html은 lite.html을 줄여 만든 파일. **lite.html을 고쳐 올릴 때마다 같이 다시 만들어 함께 커밋**:
  `npm i terser csso` (아무 폴더) 후 `NODE_PATH=<그 폴더>/node_modules node tools/build-cbeta.js` → cbeta.html, lib/cb-*-<해시>.js
