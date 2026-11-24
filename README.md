# 신안어의 해상풍력발전사업

사이트: https://ouog22-create.github.io/shinan-wind/

정적 HTML·CSS·JavaScript(GitHub Pages, main 브랜치 루트) + Firebase Authentication / Firestore / Storage.
공개 페이지는 웹디자인 시안에서 빌드하며, 관리 대상은 주민상생 뉴스입니다.

Firebase 설정과 관리자 UID는 공개 식별자이며, 실제 권한은 보안 규칙(firestore.rules, storage.rules)에서 판단합니다.

## 로컬 확인

`python3 -m http.server 8096` 후 http://localhost:8096/

SDK 재빌드: Node 22 이상에서 `npm install` 후 `npm run build:sdk`
