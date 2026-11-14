# rainsafter (QLEAR) 작업 규칙

- 클로즈드 베타 링크는 하나로 고정: https://wontaekim731.github.io/rainsafter/cbeta.html (이름 바꾸지 않음)
- cbeta.html은 lite.html을 줄여 만든 파일. **lite.html을 고쳐 올릴 때마다 같이 다시 만들어 함께 커밋**:
  `npm i terser csso` (아무 폴더) 후 `NODE_PATH=<그 폴더>/node_modules node tools/build-cbeta.js` → cbeta.html, lib/cb-*-<해시>.js
- 소개 페이지는 introA.html(선생님용 최신) · introB.html(첫 화면에 A·B·C 채점된 문제지 그림이 나오는 이전 선생님용) 두 개. intro-teacher.html은 introA로 넘기는 껍데기라 고치지 않음. intro.html은 5장면(학생 중심) 소개로 따로 남겨 둠
