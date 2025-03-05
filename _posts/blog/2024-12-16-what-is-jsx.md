---
layout: post
title: "JSX로 마크업 작성하기: 너무 당연하게 써서 몰랐을, JSX에 대하여"
category: blog
tags: react
image:
  path: /assets/img/blog/2024-12-16/thumb.png
comments: true
---

React 공식 문서의 '빠르게 시작하기' 섹션에는 [JSX로 마크업 작성하기](https://ko.react.dev/learn#writing-markup-with-jsx)가 있습니다.  
JSX를 알고 계시나요? 마크업은요?  
시원하게 답할 수 없나요?  

잘 찾아오셨습니다.

JSX는 **React에서 사용하는 JavaScript 확장 문법**으로, HTML과 비슷하게 생겼지만 완전히 다른 녀석입니다.  
이 글에서는 JSX와 Markup의 차이점, 그리고 JSX가 실제로 어떻게 동작하는지 알아보겠습니다.

* toc
{:toc}

## Markup이란?

Markup은 문서의 구조를 표현하는 방법입니다.  
HTML이 가장 대표적인 Markup 언어인데요, 태그를 사용해서 문서의 구조를 나타냅니다.

```html
<div>
  <h1>안녕하세요</h1>
  <p class="content">이것은 단순한 HTML입니다</p>
</div>
```

보시다시피 꺾쇠(`<`, `>`)로 감싸진 태그들로 구성되어 있죠.  
이런 구조는 웹 브라우저가 직접 해석할 수 있습니다.

## JSX는 뭐가 다른가요?

JSX는 얼핏 보면 HTML과 매우 비슷해 보입니다.

```jsx
const element = (
  <div>
    <h1>{title}</h1>
    <p className="content">{content}</p>
  </div>
);
```

하지만 위 코드는 실제로 JavaScript 함수 호출로 변환됩니다.  
<small>이게 바로 JSX의 핵심..!</small>

```javascript
// 바벨이 JSX를 다음과 같이 변환합니다
const element = React.createElement(
  'div',
  null,
  React.createElement('h1', null, title),
  React.createElement('p', { className: 'content' }, content)
);
```

### 잠깐, 바벨(Babel)이란?

바벨은 최신 JavaScript 코드를 구버전 브라우저에서도 동작하는 코드로 변환해주는 도구입니다.  
JSX → JavaScript 변환도 바벨이 해주는 일 중 하나예요.

```javascript
// 바벨 변환 전 (최신 문법)
const message = `Hello, ${name}!`;
const sum = (a, b) => a + b;

// 바벨 변환 후 (구버전 호환)
var message = "Hello, " + name + "!";
var sum = function(a, b) { return a + b; };
```

### 제 프로젝트엔 바벨같은 거 없었는데요?

최근에는 성능상의 이유로 바벨 대신 다른 도구들을 사용하는 추세입니다.  
<small>코드 변환 속도가 엄청 빨라졌어요🙃</small>

1. **SWC (Speedy Web Compiler)**
- Rust로 작성된 초고속 컴파일러
- Next.js 12부터는 기본적으로 바벨 대신 SWC 사용
- 바벨보다 20-70배 더 빠른 컴파일 속도
```javascript
// next.config.js
module.exports = {
    swcMinify: true // SWC로 코드 최소화 ; 는 default입니다.
}
```

2. **esbuild**
- Go로 작성된 번들러/컴파일러
- Vite, Remix 같은 도구들이 채택
- 네이티브 코드로 실행되어 매우 빠름

그래도 여전히 바벨이 프로젝트 내에 있으실 지도 모릅니다.  
아래와 같은 이유로 바벨을 쓰고 있는 것들이 있거든요.

1. **레거시 프로젝트**
   - 이미 바벨을 사용 중인 프로젝트들
   - Create React App 기반 프로젝트

2. **특별한 변환이 필요할 때**
   - styled-components 바벨 플러그인
   - 커스텀 바벨 플러그인 사용
   - 아직 SWC나 esbuild가 지원하지 않는 기능들

### JSX만의 특별한 점

1. **JavaScript 표현식 사용**
   - 중괄호 `{}`를 사용해서 JavaScript 코드를 넣을 수 있습니다
   ```jsx
   const name = "철수";
   const greeting = <h1>안녕하세요, {name}님!</h1>;
   ```

2. **HTML과 다른 속성명**
   - class → className
   - for → htmlFor
   - style은 객체로 전달
   
   ```jsx
   // HTML
   <div class="container" style="background-color: blue;">

   // JSX
   <div className="container" style={{ backgroundColor: 'blue' }}>
   ```

3. **조건부 렌더링**
   ```jsx
   const element = (
     <div>
       {isLoggedIn ? <UserInfo /> : <LoginButton />}
       {unreadMessages.length > 0 && 
         <MessageBox count={unreadMessages.length} />
       }
     </div>
   );
   ```

## JSX는 왜 이렇게 만들어졌나요?

React 팀이 JSX를 만든 이유는 크게 세 가지입니다.

1. **컴포넌트 기반 개발**
   - UI를 재사용 가능한 조각으로 나누기 쉽습니다
   - 마치 레고 블록처럼 조립할 수 있죠

2. **JavaScript의 모든 기능 활용**
   - 반복문, 조건문, 함수 등을 자유롭게 사용
   - 템플릿 엔진보다 더 강력한 표현력

3. **타입 체크와 코드 최적화**
   - 컴파일 단계에서 오류 발견 가능
   - 자동으로 XSS 방지 😮

## 실제 사용 예시

### 1. 컴포넌트 만들기
```jsx
function Welcome({ name }) {
  return <h1>안녕하세요, {name}님!</h1>;
}

// 이렇게 사용합니다
<Welcome name="영희" />
```

### 2. 리스트 렌더링
```jsx
function TodoList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.text}</li>
      ))}
    </ul>
  );
}
```

### 3. 이벤트 처리
```jsx
function Button() {
  const handleClick = () => {
    alert('클릭되었습니다!');
  };

  return (
    <button onClick={handleClick}>
      클릭하세요
    </button>
  );
}
```

## 주의할 점

1. **모든 태그는 닫혀야 합니다**
> JSX는 HTML보다 엄격합니다. JSX에서는 \<br />같이 태그를 닫아야 합니다. 또한 컴포넌트는 여러 개의 JSX 태그를 반환할 수 없습니다. \<div>...\</div> 또는 빈 <>...</> 래퍼와 같이 공유되는 부모로 감싸야 합니다.

위와 같은 내용이 공식 문서에 적혀있는데, {children}과 같은형태도 <>{children}</>처럼 Fragment를 사용하는 것이 권장된다고 합니다. 몰라서 그냥 쓴 것도 많은데, 권장 사항이었네요.


   ```jsx
   // 틀림
   <img src="photo.jpg">
   
   // 맞음
   <img src="photo.jpg" />
   ```

2. **반드시 하나의 부모 요소로 감싸야 합니다**
   ```jsx
   // 틀림
   return (
     <h1>제목</h1>
     <p>내용</p>
   );
   
   // 맞음
   return (
     <div>
       <h1>제목</h1>
       <p>내용</p>
     </div>
   );
   ```

3. **JavaScript 예약어와 겹치는 속성은 다른 이름을 사용합니다**
   ```jsx
   // 틀림
   <label class="label">
   
   // 맞음
   <label className="label">
   ```

## 결론

JSX는 단순한 HTML이 아니라, React 컴포넌트를 작성하기 위한 강력한 도구입니다.  
JavaScript의 모든 기능을 활용하면서도 HTML처럼 직관적으로 UI를 표현할 수 있죠.  
이제 JSX를 보면 "아, 이게 다 React.createElement로 변환되는구나!"라고 생각하시면 됩니다. 

여기까지! 안녕.
