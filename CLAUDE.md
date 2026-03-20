# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 커밋 규칙

> 유저 레벨 커밋 규칙 대신 이 규칙을 따릅니다.

형식: `{type}: {한국어 설명}`

| 타입 | 용도 |
|------|------|
| `post` | 새 블로그 포스트 작성 |
| `custom` | 테마/기능 커스터마이징 |
| `etc` | 여행 페이지, 기타 콘텐츠 |
| `fix` | 버그/오류 수정 |

예시: `post: 조인과 인덱스에 대하여`, `custom: 검색 기능 추가`

## 명령어

### 로컬 개발
```bash
bundle exec jekyll serve
bundle exec jekyll serve --livereload   # 저장 시 자동 반영
```

### 빌드만 할 때
```bash
bundle exec jekyll build
```

### 초기 세팅 (gem 미설치 시)
```bash
bundle install
# M2/M3 Mac posix-spawn 오류 시:
bundle config build.posix-spawn --with-cflags="-Wno-incompatible-function-pointer-types"
bundle install
```

> 로컬 서버는 `http://localhost:4000`에서 실행됩니다.

## 아키텍처

[Hydejack v9](https://github.com/hydecorp/hydejack) 테마 기반의 개인 블로그 및 여행 가이드 사이트입니다. 테마를 상당 부분 커스텀해서 사용하고 있습니다.

### 콘텐츠 유형

- **블로그 포스트**: `_posts/blog/YYYY-MM-DD-slug.md` — 표준 Jekyll 포스트. front matter에 `layout: post`, `category: blog`, `tags`, `image`, `comments` 사용.
- **독립 여행 페이지**: `danang/index.html`, `shanghai/index.html` — Jekyll 레이아웃을 사용하지 않는 독립 HTML 파일. `noindex` 처리되어 검색엔진에 노출되지 않음.
- **검색 데이터**: `assets/sitedata.json` — Jekyll이 Liquid 템플릿으로 렌더링하는 파일. 전체 포스트 목록(title, url, tags, description, date)을 JSON 배열로 생성. 클라이언트 검색에서 사용.

### 커스터마이징 레이어

Hydejack이 베이스 테마를 제공하고, 커스텀 내용은 아래 파일에 집중되어 있습니다:

- `_includes/body/menu.html` — 네비게이션 바 전체. 사이드바 토글, TOC 토글, 검색 토글 버튼과 검색 오버레이 UI/JS가 모두 여기에 인라인으로 구현되어 있음. ⌘K 단축키 포함.
- `_sass/my-style.scss` — 네비게이션 바 높이, 커스텀 버튼, 검색 오버레이, TOC 스타일 등 SCSS 오버라이드.
- `_includes/my-scripts.html` — 추가 `<script>` 태그 주입 포인트 (현재 `sidebar-folder.js` 로드 중).
- `_includes/my-comments.html` — 커스텀 댓글 섹션 주입 포인트.
- `_data/` — `authors.yml`, `social.yml`, `strings.yml`, `variables.yml` 등 사이트 전역 데이터.

### 검색

클라이언트 사이드 전용. 검색창을 처음 열 때 `/assets/sitedata.json`을 비동기로 fetch합니다. `site.posts`만 인덱싱되므로 독립 페이지(`danang/`, `shanghai/`)는 검색 결과에 포함되지 않습니다.

### 퍼마링크 구조

```
/:categories/:year-:month-:day-:title/
```

`_posts/blog/` 포스트는 `/blog/YYYY-MM-DD-slug/`로 렌더링됩니다.

### 태그 및 카테고리

- 카테고리: `_featured_categories/`에 정의 (예: `blog.md`)
- 태그: `_featured_tags/`에 정의 (예: `react.md`, `aws.md`). 태그 페이지는 `/tag-{slug}/`로 자동 생성됩니다.
