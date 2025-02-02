---
layout: post
title: "Next.js는 어떻게 구성되어 있을까?: Next.js Architecture"
category: blog
tags: nextjs
image:
  path: /assets/img/blog/2025-01-30/thumb.jpg
comments: true
---

next.config.js를 만지작 거리다가, 쭈욱 읽어 내려간 Next.js의 [Architecture](https://nextjs.org/docs/architecture)에 대하여

* toc
{:toc}

## 접근성: 모두를 위한 웹

Next.js는 기본적으로 웹 접근성을 고려하여 설계되었더라.
가장 눈에 띄는 기능은 <u>Route Announcements</u>

### Route Annoucements
일반적인 서버 렌더링 페이지에서는 `<a>` 태그를 통해 페이지가 이동될 때 스크린리더나 기타 보조 기술이 페이지의 타이틀을 읽어준다. Next.js는 여기서 한 걸음 더 나아가 `<Link>` 컴포넌트를 사용한 클라이언트 사이드 페이지 전환에서도 이러한 알림이 가능하도록 만들었다.

스크린 리더는 <u>document.title > h1 > URL pathname</u> 순으로 페이지를 인식하므로,  
**각 페이지마다 title을 갖게 하는 것이 접근성을 위해 권장**된다.

``` tsx
export const RouteAnnouncer = () => {
  ...
  React.useEffect(
    () => {
      // If the path hasn't change, we do nothing.
      if (previouslyLoadedPath.current === asPath) return
      previouslyLoadedPath.current = asPath

      if (document.title) {
        setRouteAnnouncement(document.title)
      } else {
        const pageHeader = document.querySelector('h1')
        const content = pageHeader?.innerText ?? pageHeader?.textContent

        setRouteAnnouncement(content || asPath)
      }
    },
    [asPath]
  )
  return (
    <p
      aria-live="assertive" // Make the announcement immediately.
      id="__next-route-announcer__"
      role="alert"
      style={nextjsRouteAnnouncerStyles}
    >
      {routeAnnouncement}
    </p>
  )
```

위와 같은 RouteAnnouncer는 renderReactElement안에 포함되는데,  
이 `renderReactElement`가 클라이언트 사이드 네비게이션 중에 새로운 페이지 컴포넌트를 렌더링할 때 사용된다.   
`<Link>`가 basically router를 통한 push/replace를 한다는 점을 생각해보면 <u>모든 클라이언트 사이드 네비게이션에 RouteAnnouncer가 사용된다</u>는 점을 알 수 있다.


### Linting
또한 Next.js는 프로젝트 생성 시 접근성 관련 ESLint 설정을 자동으로 포함시킨다.  
우리가 `create-next-app`을 할 때 ESLint를 사용한다면, devDependencies로 `eslint-config-next`가 설치된다.  
권장되는 ESLint plugin인 `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-next`는 모두 eslnt-config-next 안에 사용되며, **해당 구성은 next.config.js보다 우선**한다.  
이외에도 `eslint-plugin-jsx-a11y`가 설치되는데, 플러그인을 통해 다음과 같은 접근성 이슈들을 미리 잡아낼 수 있다:

1. ARIA(Accessible Rich Internet Applications) 속성의 올바른 사용
2. 키보드 탐색 가능성
3. 이미지의 대체 텍스트
4. 색상 대비

<small>
*a11y는 'accessibility'의 줄임말이다. 단어 'accessibility'에서 첫 글자 'a'와 마지막 글자 'y' 사이에 있는 글자 수가 11개여서 'a11y'로 표기한다.  
*ARIA는 웹 콘텐츠와 애플리케이션을 장애가 있는 사용자들도 더 쉽게 접근할 수 있도록 만든 HTML 속성들의 모음이다.   
&nbsp;&nbsp;ex) role, aria-label, aria-expanded, aria-hidden
</small>

![jsx-a11y](/assets/img/blog/2025-01-30/jsx-a11y.png)
아마 이런 걸 제일 자주보지 않았을까
{:.figcaption}


### 접근성은 실제로 어떻게 사용되나
[Intro to Web Accessibility](https://mawconsultingllc.com/videos/v/hzzcebcywrh37xperxt54z53bryzea)

위 동영상은 Making Accessibility Work에서 제작한 웹 접근성 입문 영상이다. 영상을 보면 iOS의 접근성 기능들이 어떻게 사용되는지 볼 수 있다.   
또한, 이를 보완할 수 있는 서드파티 소프트웨어, 마우스 스틱이나 스위치 장치, 시선 추적 기술과 같은 특수 하드웨어 솔루션을 함께 설명한다.   
위 동영상에서 개발자에게 있어 접근성 있는 웹사이트를 만들기 위한 첫 걸음이자 가장 효과적인 방법은 <u>HTML 표준을 준수하는 것</u>이라고 말한다. 예를 들어, 커스텀 버튼을 만들기보다는 네이티브 `<button>` 요소를 사용하는 것이 보조 기술과의 호환성을 보장하는 가장 확실한 방법이라고 한다. (커스텀 버튼을 만들지 말라는 게 아니라 button을 기본으로 만들자는 뜻)  
웹 개발자뿐만 아니라 디지털 제품을 만드는 모든 이들에게 접근성의 중요성과 실제 구현 방법을 이해하는 데 큰 도움이 될 것 같다. 


## Fast Refresh: 우리가 앱을 계속 껐다 키지 않아도 되는 이유

많은 Github blog(이 블로그를 포함하여)들을 제작하는 데 쓰이는 Jekyll과 같은 정적 사이트 생성기에서도 실행시 —livereload를 하면 저장 시 새로고침이되며 수정사항이 반영된 페이지를 볼 수 있다. Next에서는 v9.4 이후부터 이러한 기능을 기본으로 가져간다.  
Next.js의 Fast Refresh는 코드 수정 시 전체 페이지를 새로고침하지 않고도 변경사항을 즉시 반영해주는 기능이다.

### 어떻게 동작하나

1. React 컴포넌트만 export하는 파일을 수정한 경우: 해당 컴포넌트만 업데이트
2. 일반 JS/TS 파일 수정: 해당 파일을 import하는 모든 파일 업데이트

주의할 점은, <u>React 트리 외부에서 import하는 파일을 수정하면 전체 새로고침이 발생한다</u>는 것이다.

예를 들어,
```jsx
// app/components/ProductList.tsx
export const CURRENCY = 'KRW';  // 상수
export const TAX_RATE = 0.1;    // 상수

export default function ProductList({ products }) {
  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>
          {product.name}: {CURRENCY} {product.price}
        </li>
      ))}
    </ul>
  );
}

// lib/cart.ts (non-React 유틸리티)
import { CURRENCY, TAX_RATE } from '../app/components/ProductList';

export function calculateTotal(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * TAX_RATE;
  return `${CURRENCY} ${(subtotal + tax).toFixed(2)}`;
}
```
이런 코드가 있다고 할 때 ProductList를 수정하면 전체 새로고침이 발생한다는 거다.  
그래서 export 하는 constants는 별도 파일로 분리해야 Fast Refresh를 정상적으로 쓸 수 있다.

```jsx
// constants.ts
export const CURRENCY = 'KRW';

// ProductList.tsx
import { CURRENCY } from './constants';
```

### 전체 새로고침이 왜 안좋죠?

전체 새로고침이 발생하면 다음과 같은 문제들이 생긴다:

1. **상태 초기화**
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  // count가 10까지 증가한 상태에서 코드를 수정하면
  // 전체 새로고침 시 count가 다시 0으로 초기화된다.
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

2. **사용자 입력 손실**
```jsx
function Form() {
  const [text, setText] = useState('');
  // 폼에 긴 텍스트를 입력한 상태에서 다른 컴포넌트를 수정하면
  // 전체 새로고침으로 인해 입력한 내용이 모두 사라진다.
  return <textarea value={text} onChange={e => setText(e.target.value)} />;
}
```

3. **네트워크 요청 중복**
```jsx
function UserProfile() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    // 데이터를 이미 불러온 상태에서 코드를 수정하면
    // 전체 새로고침으로 인해 API를 다시 호출하게 된다.
    fetch('/api/user').then(r => r.json()).then(setUser);
  }, []);
  return <div>{user?.name}</div>;
}
```

4. **개발 경험 저하**
  - 전체 새로고침이 3-5초 정도 걸릴 때에도, Fast Refresh는 밀리초 단위로 빠르다.
  - 코드를 수정하고 결과를 보는 피드백 루프가 느려져서 개발 속도가 저하된다.


이러한 문제들은 개발 과정을 크게 방해할 수 있는데, 특히

- 폼 개발할 때 입력 데이터가 계속 날아가서 테스트가 어려움
- 여러 단계의 상태를 가진 UI를 개발할 때 매번 처음부터 다시 시작해야 함
- API 호출이 불필요하게 반복되어 개발 서버에 부하가 갈 수 있음

따라서 가능한 한 Fast Refresh가 작동하도록 코드를 구조화하는 것이 좋겠다.

### Fast Refresh가 동작하지 않는 경우
즉, 뭐 변경할 때마다 자꾸 상태가 초기화 되는 경우는

1. 클래스 컴포넌트
- local state가 보존되는 건 function components들이랑 hooks만이다.
  - state가 보존되는 게 default인데, state reset이 필요한 경우에는 `// @refresh reset` 이걸 코드 아무데나 넣으면 수정할 때마다 다 상태 초기화해준다고 한다. <span style="color: white">local state 계속 날리는 방법</span>
  - dependency를 정의해야하는 hooks like `useEffect`, `useMemo`, `useCallback`의 경우는 **늘 업데이트를 하는 게 기본 동작**이라 mounted될 때만 실행하라고 빈 배열을 뒀어도 fast refresh하면 한 번 더 돈다.
2. React 컴포넌트가 아닌 export가 있는 파일
3. 익명 화살표 함수(Anonymous arrow function)로 작성된 컴포넌트
- 이런 함수가 많은 경우 Next에서 코드 자동으로 마이그레이션해주는 도구인 codemod로 name-default-component를 제공하기도 하니, 사용해볼 수 있겠다.

```jsx
// 동작하지 않음
export default () => <div>Hello</div>

// 동작함
export default function Hello() {
  return <div>Hello</div>
}
```

## Error Handling: React Error Boundary를 통한 에러 처리

Next.js에서 error는 error.tsx를 통해 처리한다.

```jsx
// error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>문제가 발생했습니다!</h2>
      <button onClick={() => reset()}>다시 시도</button>
    </div>
  );
}
```
위와 같은 error.tsx도 내부적으로 React Error Boundary를 사용한다.
Next.js의 Error Resilience가 의미있는 이유는 <u>에러가 발생한 컴포넌트만 문제가 되고, 다른 컴포넌트들은 정상적으로 동작</u>한다는 것이다.  
고로 에러 수정 시에 상태가 유지된다. 여러 폼이나 단계의 상태가 있는 경우 개발 생산성에 의미가 있을 것..

## Next.js Compiler: SWC와 WebAssembly의 만남
**컴파일러**는 모던 JavaScript를 쓰면서도 (ex. ⇒) 구형 브라우저에서도 지원되는 <u>코드로 변환</u>해주며, TS도 JS로 바꿔주고, JSX도 React.createElement같은 걸로 바꿔주는 웹 개발의 필수적인 부분이다.  
이러한 코드 변환뿐만 아니라, <u>minification</u>을 하면서 프로젝트의 번들 사이즈를 80%쯤 감소시켜주면서 로딩 속도도 향상시켜주는 최적화 기능도 갖추고 있다.  
이런 일을 하려면 큰 프로젝트에선 빌드 시간이 좀 걸리기 마련인데 전통적인 Babel보다 빠르다! 라고 하는 게 **SWC**이다.   
싱글 코어에서는 20배, 멀티 코어에서는 70배까지도 컴파일이 빠르단다.

Next.js Compiler는 이런 SWC를 이용해 Rust로 짜였는데, v12부터 default로 들어가 있다. Next.js가 짠 Compiler는 Babel보다 17배쯤 빠르단다. 근데 프로젝트에 .bablerc가 있거나, Next가 지원하지 않는 custom Bable plugin이 있다면 알아서 babel 쓰도록 fallback도 해준다.  

### Next가 SWC를 선택한 이유
Next가 SWC를 선택한 이유는 주로 Rust의 장점으로 인한 것 같다.
1. **확장성**: Rust의 강력한 타입 시스템과 안정성
2. **성능**: 싱글 코어에서 20배, 멀티 코어에서 70배까지 빠른 컴파일 속도
3. **WebAssembly 지원**: 어떤 플랫폼에서든 실행 가능
4. **커뮤니티**: 활발한 Rust 생태계

#### WebAssembly?
WebAssembly(WASM)는 C, C++, Rust와 같은 저수준 언어로 작성된 코드를 웹에서 실행할 수 있게 해주는 기술이다.  

실제로 다음과 같은 곳에서 사용된다:
- 구글 드라이브의 대용량 파일 압축
- 화상회의 앱의 실시간 비디오 스트림 압축
- 웹 기반 게임 엔진
- 3D 렌더링
- 복잡한 계산이 필요한 암호화/압축 작업

Rust가 이러한 WebAssembly를 지원해서, 어느 플랫폼에나 쓰기 좋다고.


## Supported Features
Supported Features는 next.config.js를 어떻게 구성할 수 있는지 안내해주는데, 몇 부분만 소개하자면

### Module Transpilation

Next.js는 프로젝트 내의 패키지들을 자동으로 관리한다. local package(npm에 배포되지 않은 내부 패키지, 각 패키지별로 독립적인 버전 관리가 가능해 사용됨)나 node_modules 안의 패키지들 중 트랜스파일이 필요한 것들을 <u>자동으로 감지하고 처리</u>한다.

주로 다음과 같은 변환을 수행한다:
- TypeScript → JavaScript
- ES 6+ → ES5
- JSX → JavaScript

만약 자동 감지가 실패한다면, 수동으로 설정할 수 있다:

```javascript
// next.config.js
module.exports = {
  transpilePackages: ['@acme/ui', 'lodash-es'],
}
```

### Build-time Variables with Define

빌드 타임에 변수값을 설정할 수 있는 기능도 제공한다.  
이는 env나 constant를 사용하는 것과는 다르게, 빌드 시점에 값이 결정되어 코드에 직접 삽입된다.

```javascript
module.exports = {
  compiler: {
    define: {
      MY_STRING_VARIABLE: JSON.stringify('my-string'),
      MY_NUMBER_VARIABLE: '42',
    },
  },
}
```

빌드 환경별 설정값이나 피처 플래그와 같은 용도도로 사용된다고.

### Experimental Features

Next.js Compiler는 실험적인 기능들도 제공한다. 그 중 하나가 [SWC Trace profiling](https://nextjs.org/docs/architecture/nextjs-compiler#swc-trace-profiling)이다.

```javascript
// next.config.js
module.exports = {
  experimental: {
    swcTraceProfiling: true
  }
}
```

이 기능을 활성화하면 컴파일 과정의 성능을 프로파일링할 수 있어서, 빌드 최적화가 필요한 부분을 찾아내는 데 도움이 될 것 같다.

## Supported Browsers

Next.js는 기본적으로 많이 사용되는 polyfill<sup>*</sup>을 자동으로 주입하며, 프로젝트의 dependency에 중복되는 polyfill이 있다면 이를 제거한다. 더 중요한 것은, 이러한 polyfill들이 필요한 경우에만 로드된다는 점이다.  
<small>*polyfill: 오래된 브라우저에서 지원하지 않는 최신 기능을 사용할 수 있게 해주는 코드</small>

> "The majority of the web traffic globally will not download these polyfills"

특정 브라우저(예: IE11)에 대한 지원이 필요한 경우, custom polyfill을 추가할 수 있다:

```javascript
// _app.tsx에서 전체 앱에 적용
import 'core-js/features/array/flat'

// 또는 필요한 컴포넌트에서만
import 'specific-polyfill'
```

이렇게 하면 필요한 브라우저 지원을 유지하면서도 불필요한 코드 로딩을 최소화할 수 있다.

## 마치며

Next.js의 이러한 기능들은 단순한 편의성을 넘어 더 나은 웹을 만들기 위한 철학을 담고 있지 않나 싶다.  
접근성은 더 많은 사용자에게 다가갈 수 있게 하고, Fast Refresh는 개발자의 생산성을 높이며, 컴파일러는 성능 최적화를 통해 더 나은 사용자 경험을 제공하니까.  

여기까지. 안녕!