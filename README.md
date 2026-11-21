# 신안어의 해상풍력발전사업

사이트: https://ouog22-create.github.io/shinan-wind/
관리자: https://ouog22-create.github.io/shinan-wind/admin/

정적 HTML·CSS·JavaScript + Firebase Authentication / Firestore / Storage. GitHub Pages main 브랜치 루트에서 배포합니다. Firebase Hosting은 사용하지 않습니다.

## 관리

관리자 페이지에서 제공된 관리자 계정으로 로그인합니다. 뉴스·인증서·추진경과를 작성·수정·삭제하고 게시 여부를 바꿀 수 있습니다. 저장은 Firestore에 즉시 반영됩니다. 대표 이미지와 인증서는 최대 변 1600px, WebP, 1MB 미만으로 변환합니다. 인증서는 표시 순서 숫자를 수정해 정렬합니다. 비밀번호를 저장소나 채팅에 기록하지 않습니다.

프로젝트: shinan-wind / Firestore: asia-northeast3 / Storage: us-central1.
Firebase 설정과 관리자 UID는 공개 식별자입니다. 실제 권한은 보안 규칙에서 판단합니다.
과금 차단은 월 1,000원 예산 알림 → budget-alerts → stop-billing으로 연결됩니다. 비용 집계 지연으로 0원은 보장되지 않습니다. 비용 0 테스트만 실행했습니다.

## 로컬

`python3 -m http.server 8096` 후 http://localhost:8096/ 에서 확인합니다. SDK는 로컬 파일로 번들되어 모든 사이트 리소스가 상대경로로 참조됩니다. SDK 재빌드: Node 22 이상에서 `npm install` 및 `npm run build:sdk`.

## 미수급 콘텐츠

- 확정 인사말 원고, 대표자 성명, 대표 사진
- 실제 방문 사무실명·도로명주소·대표전화·약도·교통·주차 안내
- 인증서 원본·대체텍스트
- 주민상생 뉴스 승인 원고·사진
- 조감도 웹용 원본 및 사용 승인
- 사업정보 공개 승인·최신 현황, 2026.10 이후 계획 이행 여부 및 준공·운전 일정 관계

미수급 내용은 화면기획서의 안내 문구를 유지합니다. 샘플 뉴스와 인증서는 공개 데이터에 입력하지 않았습니다. 방문 주소가 없어서 지도 링크는 비활성 상태입니다. 고객사 최종 콘텐츠 승인을 대행한 것으로 간주하지 않습니다.

## 구현 결정

GitHub 실제 인증 계정 ouog22-create를 사용합니다. 요청 초기에 적은 ouog22는 조회되지 않아 배포 계정을 정정했습니다. Storage는 사용자 선택에 따라 us-central1을 사용하고 Firestore는 서울을 유지합니다. Storage 삭제 요청에는 request.resource가 없으므로 관리자 전용 delete 규칙을 분리했습니다. 초기 데이터는 프로젝트 소유자의 인증된 API로 입력했습니다.

## 검증

checks/QA_RESULT.txt 참고. 관리자 편집 화면은 격리 테스트 데이터로 검증했고 서버 권한은 실제 Firebase Rules API로 검증했습니다. 실제 관리자 비밀번호로 수행하는 로그인·저장 E2E는 수행하지 않았습니다.
