# 📚 Pages Hub — 모바일 최적화 아티클 저장소

지정된 주제 없이 그때그때 흥미로운 기술, 이론, 컴퓨터 구조 등의 주제를 모바일 환경에서 편안하게 읽을 수 있도록 변환 및 배포하는 정적 웹 아카이브입니다.

---

## 🌟 주요 특징

- 📱 **모바일 최적화 레이아웃**: 스마트폰 화면에서도 줄바꿈, 폰트 크기, 좌우 여백이 최적화된 유려한 타이포그래피 (Pretendard)
- 📑 **슬라이드 목차 (TOC Drawer)**: 언제든 원터치로 목차를 열어 원하는 섹션으로 부드럽게 이동
- ⏱️ **읽기 진행률 & 소요 시간**: 상단 스크롤 진행 바 및 예상 독서 시간 표시
- 🌓 **다크 / 라이트 모드**: 시스템 설정 자동 감지 및 원터치 테마 전환 (설정 유지)
- 🔍 **미니멀 타임라인 & 실시간 검색**: 메인 홈(`index.html`)에서 제목·태그·본문 요약을 즉각 검색
- 💻 **코드 복사 & 테이블 가로스크롤 보호**: 모바일 화면에서도 코드가 깨지지 않고 원클릭 복사 지원
- 📐 **KaTeX 수식 렌더링**: 수식이 포함된 기술 문서 완벽 지원
- 🚀 **GitHub Actions 자동 배포**: 공개 저장소에 push하면 GitHub Pages로 무중단 자동 배포

---

## 📁 디렉터리 구조

```text
Pages/
├── sources/                         # ✍️ 마크다운(.md) 정규 아티클 소스 보관 폴더
│   ├── preview/                     # 미발행 / 검수 대기 초안 마크다운
│   └── *.md                         # 발행 대상 본문 마크다운 파일들
├── raw_data/                        # 🎙️ 1차 원천 데이터 및 스크립트 아카이브
│   └── chat_logs/                   # AI 질의응답 및 리서치 대화 원본 로그
├── templates/                       # 웹페이지 HTML 템플릿
│   ├── article.html                 # 모바일 최적화 아티클 뷰어 템플릿
│   └── index.html                   # 메인 타임라인 홈 피드 템플릿
├── scripts/                         # 빌드/검수 유틸리티 스크립트
├── assets/                          # 공용 정적 리소스 (quiz, visualizer 등)
├── .github/workflows/
│   └── deploy.yml                   # GitHub Pages 자동 배포 워크플로우
├── build.js                         # 정적 사이트 빌더 스크립트
├── package.json                     # 프로젝트 설정 및 실행 스크립트
├── index.html                       # 생성된 메인 타임라인 홈 페이지
└── *.html                           # 생성된 아티클 HTML 파일들
```

---

## ✍️ 새로운 글 추가 방법

1. `sources/` 디렉터리에 새로운 마크다운 파일(`.md`)을 생성합니다.
2. 파일 상단에 다음과 같이 YAML Frontmatter(메타데이터)를 작성합니다:

```markdown
---
title: 글 제목
subtitle: 부제목 또는 한 줄 설명 (선택사항)
slug: english-url-slug (생성될 html 파일명)
date: 2026-03-01
tags:
  - 주제1
  - 주제2
summary: 글 요약문 (메인 피드 카드 및 메타태그에 표시됩니다)
author: 작성자 이름 (선택사항)
---

# 본문 내용 작성 시작...
```

3. 로컬에서 빌드하여 확인합니다:
```bash
npm run build
```

---

## 🚀 로컬 실행 및 테스트

```bash
# 1. 의존성 설치
npm install

# 2. 정적 페이지 및 인덱스 빌드
npm run build

# 3. 로컬 웹 서버 실행 (선택사항)
npx serve .
```

---

## 🌐 GitHub Pages 공개 배포 설정 안내

1. 본 저장소를 GitHub **Public(공개)** 저장소로 생성/설정합니다.
2. GitHub 저장소의 **Settings** → **Pages** 메뉴로 이동합니다.
3. **Build and deployment** > **Source** 항목에서 **`GitHub Actions`**를 선택합니다.
4. 코드를 `main` 브랜치에 `git push`하면 `.github/workflows/deploy.yml`이 실행되어 사이트가 자동으로 빌드 및 배포됩니다.
