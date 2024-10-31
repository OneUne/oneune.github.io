---
layout: post
title: "커밋 메시지에도 규칙이 있다는 걸 알고 계셨나요?: Conventional Commits"
category: blog
tags: github
image:
  path: /assets/img/blog/2024-08-18/thumb.jpg
comments: true
---

제가 처음 접한 커밋 메시지 규칙은, 대학시절 존경하던 선배님의 규칙이었습니다.  
자세히 언급하면 혹여 이 글을 보실까 부끄러워 적지 못하겠지만, 저도 선배님을 따라 저만의 커밋 메시지 규칙을 정의한 적이 있었습니다.  
<small>그러고보니, 이 블로그 레포에도 제 나름의 커밋 메시지 규칙이 있긴 한 것 같네요.</small>

이전 회사에서의 규칙은
1. Jira의 티켓명: 으로 시작할 것 (그럼 Jira와 연동되거든요)
2. 메시지는 동사로 시작할 것 (미국회사였습니다)

위와 같았고,

지금 재직중인 회사에서는 feat, fix, chore와 같은 해당 커밋의 ^타입^을 적곤 했습니다.  
그러다 다른 깃헙 레포에서 chore와 같은 커밋 메시지를 만날 때면, 아? 생각보다 일반적인 규칙인가? 라는 생각이 들었습니다.  
<small>feat, fix는 그렇다 쳐도 chore는 진짜 우리만 쓰는 줄 알았어요 저는 </small>

오늘은 문득 이게 진짜 정해진 규칙인지 궁금해서 찾아봤습니다.  
이름하여, <b>Conventional Commits</b>.

<br>

아마 코딩 스타일 가이드에 대해서는 누구나 한번쯤 들어봤을 거라 생각합니다.  
Python의 PEP 8이나 JavaScript의 Airbnb 스타일 가이드와 같이 들여쓰기, 변수명 작명법, 함수와 클래스의 네이밍 규칙 등 다양한 사항을 포함하고 있는 그런 가이드요.  

이런 가이드가 커밋 메시지에도 있었는데, 그게 바로 [Conventional Commmits](https://www.conventionalcommits.org/ko/v1.0.0/) 였습니다.  
목적은 여타 규칙들과 동일하게, 합의를 통한 원활한 의사소통이었습니다.  
이를 통해 Release와 Change Log의 자동화도 이룰 수 있었고요.  
> [Husky](https://typicode.github.io/husky/)와 [Conventional Config](https://www.npmjs.com/package/@commitlint/config-conventional)를 사용하면 pre-commit이라는 [Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)를 이용해 commit 이전에 메시지가 이 규칙을 따르는지 확인할 수도 있습니다. <br>cf. [Tutorial](https://blog.openreplay.com/automating-releases-in-github-with-conventional-commits/)

> Google의 [Release Please](https://github.com/googleapis/release-please)는 이런 Conventional Commits를 파싱하여 Change Log를 생성해주고 Release PR을 만들어주며, 버저닝도 해주는 Github Action입니다. Conventional Commits이 Semantic Versioning과 일맥상통한다더니, 그래서 버저닝도 가능한가봅니다. <br>
<small>저는 사실 Semantic Versioning도 잘 모르기 때문에, 다음엔 그걸 한 번 살펴봐야겠다..라고.. </small>


[Angular Commit Guidelines](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines)를 기반으로 하고 있으며, 규칙은 다음과 같습니다.

```
<타입>[적용 범위(선택 사항)](!): <설명>

[본문(선택 사항)]

[꼬리말(선택 사항)]
```

```
// 예시
fix(api)!: send an email to the customer when a product is shipped

Reviewed-by: Z
Refs: #123
```

적용 범위에는 api, auth 등을 적을 수 있으며 !는 모두가 알아야하는 Breaking Change를 의미합니다.  
```BREAKING CHANGE:<description>```와 같은 꼬리말은 적어도 되고, 안 적어도 되고요. 중요한건 !임.  
필수 요소는 <타입>과 <설명>입니다.  

타입은 다음과 같습니다.  

## 타입
### 1. **feat** (feature)

- **의미**: 새로운 기능을 추가할 때 사용합니다.
- **예시**: `feat: add user login functionality`

### 2. **fix**

- **의미**: 버그를 수정할 때 사용합니다.
- **예시**: `fix: resolve issue with user login`

### 3. **chore**

- **의미**: 코드 변경이 아닌 기타 작업(예: 빌드 작업, 문서 작성, 패키지 업데이트 등)을 할 때 사용합니다.
- **예시**: `chore: update npm dependencies`

### 4. **refactor**

- **의미**: 버그 수정이나 기능 추가 없이 코드를 리팩토링할 때 사용합니다. 코드 구조를 개선하지만 동작에 변화는 없을 때 사용됩니다.
- **예시**: `refactor: optimize login validation logic`

### 5. **style**

- **의미**: 코드의 스타일을 변경할 때 사용합니다. 포맷팅, 공백 추가/제거, 세미콜론 추가/제거 등 코드의 의미에 영향을 미치지 않는 변경을 할 때 사용됩니다.
- **예시**: `style: fix indentation in login form`

### 6. **docs**

- **의미**: 문서(README, 코드 주석 등)를 추가하거나 수정할 때 사용합니다.
- **예시**: `docs: add API documentation`

### 7. **test**

- **의미**: 테스트 코드를 추가하거나 기존 테스트를 수정할 때 사용합니다.
- **예시**: `test: add unit tests for login module`

### 8. **build**

- **의미**: 빌드 시스템이나 외부 종속성(예: npm, Gradle 등)과 관련된 변경 사항에 사용됩니다.
- **예시**: `build: update webpack configuration`

### 9. **perf** (performance)

- **의미**: 성능을 개선할 때 사용합니다.
- **예시**: `perf: improve login form rendering speed`

### 10. **ci**

- **의미**: CI(Continuous Integration) 설정 파일 및 스크립트 변경에 사용됩니다.
- **예시**: `ci: add GitHub Actions for CI`

### 11. **revert**

- **의미**: 이전 커밋을 되돌릴 때 사용합니다.
- **예시**: `revert: revert commit 1234567`


hotfix, etc 이정도는 있을 줄 알았는데 없는게 놀랍네요.  
그리고 VS Code에서 Source Control로 revert하면 revert:하고 refs 도 적어주는데, 이게 Conventional Commits에 따른 거였구나 새삼 알아갑니다.