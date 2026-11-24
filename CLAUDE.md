# rainsafter (QLEAR) 작업 규칙

- 클로즈드 베타 링크는 하나로 고정: https://wontaekim731.github.io/rainsafter/cbeta.html (이름 바꾸지 않음)
- cbeta.html은 lite.html을 줄여 만든 파일. **lite.html을 고쳐 올릴 때마다 같이 다시 만들어 함께 커밋**:
  `npm i terser csso` (아무 폴더) 후 `NODE_PATH=<그 폴더>/node_modules node tools/build-cbeta.js` → cbeta.html, bank.html, lib/cb-*-<해시>.js
- 소개 페이지는 introA.html(선생님용 최신) · introB.html(맨 처음 소개 = intro-v1 내용: "과제 내주면, 제대로 해 오는 건 한 명" + A·B·C 문제지) 두 개. intro-teacher.html은 introA로 넘기는 껍데기라 고치지 않음. intro.html은 5장면(학생 중심) 소개로 따로 남겨 둠
- introP.html: 제휴·파트너용 소개 (introB에서 무료 베타·앱 링크를 모두 뺀 것, noindex). introB를 크게 고치면 같이 맞춤
- lite.html 버전을 올릴 때 verTag 옆 `<span id="verNote" hidden>`에 바뀐 점 한 줄을 같이 고침 (선생님 화면 새 버전 띠에 그대로 보임)
- 문제 은행: https://wontaekim731.github.io/rainsafter/bank.html (lite.html 안 '문제 은행' 모듈, 빌드가 cbeta와 함께 bank.html도 만듦 · 로컬 확인은 lite.html?bank). 저장은 기기 안 IndexedDB 'qlbank'
