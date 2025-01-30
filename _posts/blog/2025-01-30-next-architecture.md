---
layout: post
title: "Next.js는 어떻게 구성되어 있을까?: Next.js Architecture"
category: blog
tags: nextjs
image:
  path: /assets/img/blog/2024-01-30/thumb.png
comments: true
---

next.config.js를 만지작 거리다가, 쭈욱 읽어 내려간 Next.js의 Architecture에 대하여

* toc
{:toc}

## 접근성: 모두를 위한 웹

Next.js는 기본적으로 웹 접근성을 고려하여 설계되었습니다.
가장 눈에 띄는 기능은 <u>Route Announcements</u>

일반적인 서버 렌더링 페이지에서는 `<a>` 태그를 통해 페이지가 이동될 때 스크린리더가 페이지의 타이틀을 읽어줍니다. Next.js는 여기서 한 걸음 더 나아가 `<Link>` 컴포넌트를 사용한 클라이언트 사이드 페이지 전환에서도 이러한 알림이 가능하도록 만들었죠.

```jsx
// 스크린리더는 다음과 같은 우선순위로 페이지를 인식합니다
1. document.title
2. h1 태그
3. URL pathname
```

또한 Next.js는 프로젝트 생성 시 접근성 관련 ESLint 설정을 자동으로 포함시킵니다. `eslint-plugin-jsx-a11y`라는 플러그인을 통해 다음과 같은 접근성 이슈들을 미리 잡아낼 수 있습니다:

1. ARIA 속성의 올바른 사용
2. 키보드 탐색 가능성
3. 이미지의 대체 텍스트
4. 색상 대비

```jsx
// 잘못된 예시
<div onClick={handleClick}>클릭하세요</div>

// ESLint가 추천하는 방식
<button onClick={handleClick}>클릭하세요</button>
```

### 실제 접근성이 왜 중요할까요?

웹 접근성 관련 영상을 보면, iOS의 접근성 기능들이 실제로 어떻게 사용되는지, 그리고 마우스 스틱, 스위치 장치, 시선 추적 기술과 같은 특수 하드웨어 솔루션들이 어떻게 활용되는지 알 수 있습니다.

가장 중요한 점은, 접근성 있는 웹사이트를 만들기 위한 첫 걸음이 HTML 표준을 준수하는 것이라는 거예요. 예를 들어, 커스텀 버튼을 만들 때도 네이티브 `<button>` 요소를 기반으로 만드는 것이 보조 기술과의 호환성을 보장하는 가장 확실한 방법입니다.

## Error Handling: 우아한 에러 처리

Next.js는 React의 Error Boundary를 기반으로 강력한 에러 처리 시스템을 제공합니다. 

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

Next.js의 error.tsx는 내부적으로 React Error Boundary를 사용하는데요, 큰 차이점이 있습니다:
- error.tsx: 페이지/라우트 레벨의 에러 처리에 적합
- React Error Boundary: 특정 기능이나 컴포넌트의 에러 처리에 적합

## Fast Refresh: 개발 경험의 혁신

Next.js의 Fast Refresh는 코드 수정 시 전체 페이지를 새로고침하지 않고도 변경사항을 즉시 반영해주는 기능입니다. v9.4부터 기본으로 탑재되어 있죠.

### 어떻게 동작하나요?

1. React 컴포넌트만 수정한 경우: 해당 컴포넌트만 업데이트
2. 일반 JS/TS 파일 수정: 해당 파일을 import하는 모든 파일 업데이트

하지만 주의할 점이 있습니다. React 트리 외부에서 import하는 파일을 수정하면 전체 새로고침이 발생합니다.

```jsx
// 이런 구조는 피하세요
// ProductList.tsx
export const CURRENCY = 'KRW';  // 상수
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

// cart.ts
import { CURRENCY } from './ProductList';  // React 트리 외부에서 import
```

```jsx
// 이렇게 분리하세요
// constants.ts
export const CURRENCY = 'KRW';

// ProductList.tsx
import { CURRENCY } from './constants';
```

### 전체 새로고침의 문제점

전체 새로고침이 발생하면 다음과 같은 문제들이 생깁니다:

1. **상태 초기화**
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  // count가 10까지 증가한 상태에서 코드를 수정하면
  // 전체 새로고침 시 count가 다시 0으로 초기화됩니다
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

2. **사용자 입력 손실**
```jsx
function Form() {
  const [text, setText] = useState('');
  // 폼에 긴 텍스트를 입력한 상태에서 다른 컴포넌트를 수정하면
  // 전체 새로고침으로 인해 입력한 내용이 모두 사라집니다
  return <textarea value={text} onChange={e => setText(e.target.value)} />;
}
```

3. **네트워크 요청 중복**
```jsx
function UserProfile() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    // 데이터를 이미 불러온 상태에서 코드를 수정하면
    // 전체 새로고침으로 인해 API를 다시 호출하게 됩니다
    fetch('/api/user').then(r => r.json()).then(setUser);
  }, []);
  return <div>{user?.name}</div>;
}
```

### Fast Refresh가 동작하지 않는 경우

1. 클래스 컴포넌트
2. React 컴포넌트가 아닌 export가 있는 파일
3. 익명 화살표 함수로 작성된 컴포넌트

```jsx
// 동작하지 않음
export default () => <div>Hello</div>

// 동작함
export default function Hello() {
  return <div>Hello</div>
}
```

## Next.js Compiler: SWC와 WebAssembly의 만남

Next.js v12부터는 Rust로 작성된 SWC(Speedy Web Compiler)를 기본 컴파일러로 사용합니다. 전통적인 Babel보다 최대 17배나 빠르다고 하네요.

### WebAssembly란?

WebAssembly(WASM)는 C, C++, Rust와 같은 저수준 언어로 작성된 코드를 웹에서 실행할 수 있게 해주는 기술입니다. 실제로 다음과 같은 곳에서 사용됩니다:

- 구글 드라이브의 대용량 파일 압축
- 화상회의 앱의 실시간 비디오 스트림 압축
- 웹 기반 게임 엔진
- 3D 렌더링
- 복잡한 계산이 필요한 암호화/압축 작업

### SWC를 선택한 이유

1. **확장성**: Rust의 강력한 타입 시스템과 안정성
2. **성능**: 싱글 코어에서 20배, 멀티 코어에서 70배까지 빠른 컴파일 속도
3. **WebAssembly 지원**: 어떤 플랫폼에서든 실행 가능
4. **커뮤니티**: 활발한 Rust 생태계

```javascript
// next.config.js에서 설정 가능
module.exports = {
  transpilePackages: ['@acme/ui', 'lodash-es'], // 특정 패키지 트랜스파일
  compiler: {
    // 빌드 시점에 변수 값 설정
    define: {
      MY_STRING_VARIABLE: JSON.stringify('my-string'),
      MY_NUMBER_VARIABLE: '42',
    },
  }
}
```

```javascript
// next.config.js에서 설정 가능
module.exports = {
  transpilePackages: ['@acme/ui', 'lodash-es'], // 특정 패키지 트랜스파일
  compiler: {
    // 빌드 시점에 변수 값 설정
    define: {
      MY_STRING_VARIABLE: JSON.stringify('my-string'),
      MY_NUMBER_VARIABLE: '42',
    },
  }
}
```
### Module Transpilation

Next.js는 프로젝트 내의 패키지들을 자동으로 관리합니다. local package(npm에 배포되지 않은 내부 패키지)나 node_modules 안의 패키지들 중 트랜스파일이 필요한 것들을 자동으로 감지하고 처리합니다.

주로 다음과 같은 변환을 수행합니다:
- TypeScript → JavaScript
- ES 6+ → ES5
- JSX → JavaScript

만약 자동 감지가 실패한다면, 수동으로 설정할 수 있습니다:

```javascript
// next.config.js
module.exports = {
  transpilePackages: ['@acme/ui', 'lodash-es'],
}
```

### Build-time Variables with Define

빌드 타임에 변수값을 설정할 수 있는 기능도 제공합니다. 이는 env나 constant를 사용하는 것과는 다르게, 빌드 시점에 값이 결정되어 코드에 직접 삽입됩니다.

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

이는 특히 빌드 환경별 설정값이나 피처 플래그와 같은 용도로 유용합니다.

### Experimental Features

Next.js Compiler는 실험적인 기능들도 제공합니다. 그 중 하나가 SWC Trace profiling입니다.

```javascript
// next.config.js
module.exports = {
  experimental: {
    swcTraceProfiling: true
  }
}
```

이 기능을 활성화하면 컴파일 과정의 성능을 프로파일링할 수 있어서, 빌드 최적화가 필요한 부분을 찾아내는 데 도움이 됩니다.

### 브라우저 지원

Next.js는 기본적으로 많이 사용되는 polyfill을 자동으로 주입하며, 프로젝트의 dependency에 중복되는 polyfill이 있다면 이를 제거합니다. 더 중요한 것은, 이러한 polyfill들이 필요한 경우에만 로드된다는 점입니다.

> "The majority of the web traffic globally will not download these polyfills"

특정 브라우저(예: IE11)에 대한 지원이 필요한 경우, custom polyfill을 추가할 수 있습니다:

```javascript
// _app.tsx에서 전체 앱에 적용
import 'core-js/features/array/flat'

// 또는 필요한 컴포넌트에서만
import 'specific-polyfill'
```

이렇게 하면 필요한 브라우저 지원을 유지하면서도 불필요한 코드 로딩을 최소화할 수 있습니다.

## 마치며

Next.js의 이러한 기능들은 단순한 편의성을 넘어 더 나은 웹을 만들기 위한 철학을 담고 있습니다. 접근성은 더 많은 사용자에게 다가갈 수 있게 하고, Fast Refresh는 개발자의 생산성을 높이며, 컴파일러는 성능 최적화를 통해 더 나은 사용자 경험을 제공하죠.

이제 이러한 기능들을 어떻게 활용할지는 여러분의 몫입니다. 더 나은 웹을 만들어봅시다! 👋