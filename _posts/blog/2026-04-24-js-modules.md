---
layout: post
title: "JS 모듈 시스템 정리 — CJS, ESM, TypeScript 컴파일, 그리고 번들러"
category: blog
tags: typescript javascript node
comments: true
---

<!-- claude --resume 70209cbd-3701-4c60-a601-d1cd08a448cc -->
어떤 SDK를 의존성에 추가했더니, 잘 돌아가던 `crypto`가 갑자기 `undefined`를 뱉기 시작했습니다.
```bash
crypto is not defined
```

서비스에서 `crypto`를 쓰는 곳은 딱 한 군데가 있었고, 당연히 그 파일이 원인인 줄 알고 `import` 문을 이리저리 바꿔봤습니다. `import { createHash } from 'crypto'`, `import crypto from 'crypto'`, `import * as crypto from 'crypto'`, `import { createHash } from 'node:crypto'`. 에러가 나지 않을 때도 있었고, 날 때도 있었습니다.

사실 진짜 범인은 제 코드가 아니었습니다만,, 당시에는 얘네 뭐가 달라서 되다가 안되다가 하는 거야? 하고 컴파일 결과들을 뜯어봤었고, 그때 깨달은 내용들을 적었습니다.

* toc
{:toc}

---

## 1. 같은 모듈, 4가지 import, 4가지 컴파일 결과

TypeScript에서 어떤 모듈을 불러오는 방법은 여러 가지입니다. 각각은 다음과 같이 컴파일 됩니다.

### case #1 — named import

```ts
import { createCipheriv, createDecipheriv, createHash } from 'crypto';
```

컴파일 결과:

```js
const crypto_1 = require("crypto");
// ...
createHash('md5')  // → (0, crypto_1.createHash)('md5')
```

### case #2 — namespace import

```ts
import * as crypto from 'crypto';
```

컴파일 결과:

```js
const crypto = __importStar(require("crypto"));
crypto.createHash('md5')
```

### case #3 — default import

```ts
import crypto from 'crypto';
```

컴파일 결과:

```js
const crypto_1 = __importDefault(require("crypto"));
crypto_1.default.createHash('md5')
```

### case #4 — `node:` prefix + named import

```ts
import { createCipheriv, createDecipheriv, createHash } from 'node:crypto';
```

컴파일 결과:

```js
const node_crypto_1 = require("node:crypto");
(0, node_crypto_1.createHash)('md5')
```

---

세 가지가 눈에 띕니다.

1. `(0, crypto_1.createHash)(...)` — (0, fn)()은 왜 있는거지?
2. `__importDefault`, `__importStar` — 이건  누가 어디서 쓰는 함수지?
3. `crypto_1.default.createHash` — `default`는 왜 붙지?

하나씩 풀어봅시다.


## 2. `(0, fn)()` 콤마 트릭 — `this`의 주인을 끊어내기

이걸 이해하려면 JS의 `this`가 어떻게 정해지는지부터 봐야 합니다.

### `this`는 "누가 나를 불렀냐"로 결정된다

```js
const 강아지 = {
  이름: '뽀삐',
  짖기() {
    console.log(this.이름 + " 왈왈!");
  }
};

강아지.짖기();  // "뽀삐 왈왈!"  ← this === 강아지
```

`짖기()` 안에서 `this`는 **나를 호출한 주체**를 가리킵니다. 점(`.`) 앞에 있는 것이 곧 `this`가 됩니다. 
이 "점 앞에 있는 것"을 프로그래밍 용어로 **receiver(수신자)** 또는 **call context**라고 부릅니다.

같은 함수여도 호출 방식이 다르면 `this`가 달라집니다. 

```js
const fn = 강아지.짖기;
fn();  // "undefined 왈왈!"  ← this === undefined
```

<u>함수를 변수에 담아서 점 없이 부르면, `this`는 사라집니다.</u>

이때 fn은 강아지의 짖기가 아니라, 그저 짖기만을 의미하기 때문이에요.
```js
// (개념적으로 fn은 이것만 남음)
function() {
	console.log(this.이름 + "왈왈!");
}
```



### 콤마 연산자는 왼쪽 값들을 버린다

JS의 콤마 연산자는 왼쪽부터 전부 평가(evaluate)한 뒤, **마지막 값만 반환**합니다.

```js
(1, 2, 3)       // → 3
(0, 강아지.짖기) // → 짖기 함수 자체 (0은 버려짐)
```

### 그래서 `(0, 강아지.짖기)()`는 `this`를 끊는다

```js
강아지.짖기();            // 점 찍고 호출 → this === 강아지
(0, 강아지.짖기)();        // 점 연결 끊김 → this === undefined
```

함수를 "메서드"가 아닌 **"순수한 함수 참조"로 한 번 꺼내서** 호출하는 트릭입니다.

### TS는 왜 이 트릭을 쓰나

ES 모듈에서 named import는 "모듈 객체의 메서드 호출"이 아닙니다.

```ts
import { createHash } from 'crypto';
createHash('md5');  // 점 없이 호출. this === undefined
```

이걸 CJS로 변환하면 `crypto_1.createHash`가 되는데, 그대로 `crypto_1.createHash()`라고 부르면 `this === crypto_1`이 됩니다. 원본 ESM 의미와 달라집니다. 원본에선 this === undefined 였으니까요.

createHash 함수가 내부적으로 `this`를 참조하는 함수라면 버그가 터질 수도 있습니다. 
그래서 TS는 안전하게 `(0, crypto_1.createHash)()`로 컴파일해서 **`this` 바인딩을 끊어 원본 의미를 지킵니다.**

---

## 3. `__importDefault`와 `__importStar` — TS가 끼워 넣는 번역기

컴파일 결과에 갑자기 등장하는 `__importDefault`, `__importStar`는 어디서 온 함수일까요?

### 이 둘은 TS가 자동으로 삽입하는 헬퍼 함수

개발자가 작성한 코드가 아니라, TS 컴파일러가 **컴파일 시점에 파일 맨 위에 넣는** 번역기입니다.

```js
// TS가 자동으로 심어놓음
var __importDefault = (mod) =>
  (mod && mod.__esModule) ? mod : { "default": mod };

var __importStar = (mod) => { /* ... */ };
```

왜 필요한가? ESM 문법으로 쓴 import를 CJS 런타임에서 돌려야 하는데, **두 체계가 모듈을 표현하는 방식이 다르기 때문**입니다.

### `require('crypto')`가 돌려주는 것

먼저 CJS의 `require()`가 실제로 무엇을 반환하는지 봅시다.

```js
require('crypto')
// →
{
  createHash: [Function],
  createCipheriv: [Function],
  createDecipheriv: [Function],
  // ...
}
```

그냥 평범한 객체입니다. ESM에는 이에 더해, 다음과 같은 프로퍼티가 존재합니다.

- `__esModule: true`
  - TypeScript는 ESM을 CJS로 컴파일할 때 결과물에 ESM의 메타데이터로 <code>Object.defineProperty(exports, "__esModule", { value: true })</code>를 추가합니다.
- `default`

### ESM의 `default export` 개념

ESM에는 **default export**라는 개념이 있습니다.

```ts
// 모듈 파일
export default function () { ... }
export const foo = 1;

// 불러오는 쪽
import bar from './mod';       // default export를 bar라는 이름으로
import { foo } from './mod';   // named export
```

`import X from 'm'`은 "m의 default 슬롯을 꺼내오라"는 뜻입니다. 
그런데 순수 CJS 모듈엔 default 슬롯이 없으니, TS가 불러오는 시점에 { default: mod } 로 감싸서 ESM 문법이 기대하는 모양을 만들어줍니다. 감싸는 방법이 바로  `__importDefault`와 `__importStar`입니다.


### `__importDefault` — default 슬롯 만들기

```js
var __importDefault = (mod) =>
  (mod && mod.__esModule) ? mod : { "default": mod };
```

- `__esModule: true` 플래그가 있으면 → 진짜 ES 모듈이니 그대로 둠
- 아니면 → `{ default: mod }`로 **한 겹 감싸서** default 슬롯을 만듦

```
입력:  { createHash, createCipheriv }
출력:  { default: { createHash, createCipheriv } }
```

그래서 `import crypto from 'crypto'`의 컴파일 결과가:

```js
const crypto_1 = __importDefault(require("crypto"));
crypto_1.default.createHash('md5')  // ← default 거쳐서 접근
```

`.default`가 붙은 이유가 이것입니다.

### `__importStar` — 모두 펼쳐놓고 default도 얹기

`import * as crypto from 'crypto'`는 "모듈의 모든 export를 객체로 묶어 달라"는 의미입니다. 
모든 export를 객체로 묶으면, 어떤 export가 있는지 미리 알지 않아도 되며, 어느 모듈에서 온 함수인지 알기 명확해진다는 장점이 있습니다.
이 경우 `__importStar`는 다르게 동작합니다.

```
입력:  { createHash, createCipheriv }
출력:  {
         createHash,                           // ← 펼쳐짐
         createCipheriv,                       // ← 펼쳐짐
         default: { createHash, createCipheriv } // ← default도 같이
       }
```

원본 모듈의 프로퍼티들을 **그대로 펼쳐 복사**한 뒤, 덤으로 `default` 슬롯까지 붙입니다. 그래서:

```js
const crypto = __importStar(require("crypto"));
crypto.createHash('md5')   // ← 바로 접근
crypto.default             // ← default도 접근 가능 (혹시 쓸까봐)
```

`default`까지 같이 넣어두는 이유는, namespace import와 default import가 섞여 쓰일 때를 대비해서입니다.


## 4. 왜 이런 변환이 필요한가 (CJS vs ESM)

CJS, ESM은 뭐고 얘네는 왜 공존해서 이런 변환이 필요한 걸까요?

### CommonJS (CJS)

**2009년 Node.js가 탄생하면서 채택한 모듈 시스템**입니다. 
당시 JS에는 공식 모듈 표준이 없었고, 서버 환경을 위해 Node가 자체적으로 만든 규약입니다.

```js
// 내보내기
module.exports = { createHash: () => ... };

// 가져오기
const crypto = require('crypto');
```

특징:
- **동기 로딩**: `require()`는 호출 즉시 파일을 읽고 실행해 바로 결과 반환
- **위치 자유**: import가 코드 어디에나 올 수 있음 (조건문, 함수 안 등)
- **유연한 경로 해석**: 확장자 없어도 `.js`, `.json`, `/index.js` 순으로 찾음

### ES Modules (ESM)

**2015년 ES6\* 표준에 들어간 공식 모듈 시스템**입니다. 브라우저와 서버 통합을 목표로 설계됐습니다.

```ts
// 내보내기
export function createHash() { ... }
export default class { ... }

// 가져오기
import { createHash } from 'crypto';
import crypto from 'crypto';
```

특징:
- **비동기 로딩**: 의존성 그래프를 먼저 전부 파악한 뒤 비동기로 로드
- **최상단 고정**: import는 파일 최상단에만 가능. 조건문 안 불가
- **정적 분석 가능**: 덕분에 tree-shaking(안 쓰는 코드 제거) 가능
- **엄격한 경로**: 파일 확장자 명시 필수

<div class="callout callout-tip">*ES6 = ECMAScript 2015

JavaScript는 1995년 넷스케이프(당시 크롬 같은 존재였던 브라우저 회사)가 만든 언어입니다. 
인기를 끌자 MS가 IE에 JScript라는 유사품을 따로 만들었고, 브라우저마다 동작이 달라져 개발자들이 혼란을 겪었습니다. 
이를 통일하려고 ECMA International이 공식 표준을 정리한 것이 ECMAScript입니다. 
JS와 ECMAScript는 사실상 같은 언어예요.
	
ES6는 그 6번째 버전(2015년)으로, <code>const/let</code>, 화살표 함수, <code>class</code>, 구조분해, 그리고 <code>import/export</code>가 이때 한꺼번에 추가됐습니다. 이후부터는 번호 대신 연도를 붙여 ES2016, ES2017... 로 부릅니다.
</div>


### 비교표

| | CJS | ESM |
|---|---|---|
| 문법 | `require` / `module.exports` | `import` / `export` |
| 로딩 | 동기 | 비동기 |
| 위치 | 어디든 | 최상단만 |
| Tree-shaking | 불가 | 가능 |
| 등장 | 2009 (Node) | 2015 (ES6 표준) |
| 확장자 | 생략 가능 | 필수 |
| 동적 로딩 | `require()` | `await import()` |

### ESM에서의 동적 로딩

ESM이 CJS에 비해 조금 더 엄격해졌다고는 해도 여전히 동적으로, **런타임에 조건부로 모듈을 부르는 것** 을 허용합니다.
그 방법이 `await import()`입니다.

```ts
// 정적 import (최상단)
import { createHash } from 'crypto';

// 동적 import (함수 내부, 조건부 등)
const { createHash } = await import('crypto');
```

동적 import는 Promise를 반환하기 때문에 `await`가 필요하고, `await`를 쓰려면 `async` 함수 안이거나 top-level await가 지원되는 환경이어야 합니다.

```js
  // top-level await
  const data = await fetch('...');  // async 함수 없이 바로 
```

### ESM이 더 최신 표준이면 ESM만 쓰면 안되나요?

ESM 문법이 아무래도 더 편리한 선택처럼 보입니다. 최신이고, 표준이고, IDE 지원도 좋고, tree-shaking도 됩니다.
그래서 우리는 ESM 문법으로 코드를 쓰고 있죠.
그런데 실제로 코드가 돌아가는 **Node 런타임은 CJS 체계**로 돌고 있습니다 (대부분의 백엔드에서). 
TS는 그 사이의 번역기 역할을 합니다.

> **"문법은 ESM, 런타임은 CJS" — 이 이중 세계관이 TS가 `__importDefault`, `__importStar`, `(0, fn)()` 같은 장치를 만들어낸 이유입니다.**

---

## 5. NestJS 기반 프로젝트는 CJS입니다. 왜일까요?

Node에서 CJS냐 ESM이냐는 `package.json`의 `"type"` 필드가 결정합니다.

```json
// CJS 모드 (기본값)
{ /* "type" 필드 없음 */ }
{ "type": "commonjs" }

// ESM 모드
{ "type": "module" }
```

TypeScript 쪽도 `tsconfig.json`에서 결정합니다.

```json
{
  "compilerOptions": {
    "module": "commonjs"   // CJS로 컴파일
    // 또는 "esnext", "nodenext" 등 → ESM으로 컴파일
  }
}
```

많은 Node 백엔드 프로젝트, 특히 **NestJS** 기반 프로젝트는 CJS를 사용합니다. 이유가 있습니다.

### 데코레이터와 `reflect-metadata`

Nest의 핵심은 데코레이터입니다.

```ts
@Injectable()
@Controller('users')
export class UserController { ... }
```

이게 동작하려면 `emitDecoratorMetadata: true` 옵션이 필요하고, 이 매커니즘은 **런타임에 `reflect-metadata`로 메타데이터를 심어놓는 방식**으로 설계됐습니다. 이 전체 흐름이 <u>CJS 환경에서 개발되고 검증됐기 때문에</u>, ESM에선 미묘한 버그가 발생할 수 있습니다.

### 동적 모듈 로딩 패턴

Nest는 런타임에 모듈을 조립하는 `DynamicModule`, `forRoot()` 같은 패턴을 씁니다. 
<b>`require()`의 동기 로딩 특성에 맞춰 설계</b>돼 있고, ESM의 비동기 `import()`와는 궁합이 잘 맞지 않습니다. (ㅠㅠ)

### Circular dependency 해결 방식

`forwardRef(() => SomeService)` 같은 패턴은 CJS의 지연 평가 특성에 의존합니다. 
ESM의 엄격한 정적 분석에선 깨지기 쉽습니다.

<div class="callout callout-tip"><b>forwardRef는 어떤 트릭인가</b>

A 모듈과 B 모듈이 서로 import하는 순환 참조 상황에서, CJS는 "아직 평가 안 끝난 쪽엔 일단 빈 객체를 돌려주고 나중에 채운다"는 관용을 가집니다. 그래서 클래스 <b>호출</b> 시점엔 양쪽이 이미 채워져 있어 동작합니다.

<pre><code>1. UserService 평가 시작
2. AuthService import → AuthService 평가 시작
3. AuthService에서 다시 UserService import
   → ⚠️ 아직 평가 중 → 빈 객체 {} 반환
4. AuthService 평가 완료
5. UserService 평가 완료 → 빈 객체였던 곳이 채워짐</code></pre>NestJS DI는 모듈 등록 시점에 클래스 참조를 박아둬야 해서 3번 시점에 죽기 쉬운데, <code>forwardRef(() => UserService)</code> 처럼 <b>함수로 감싸면</b> 클래스 평가가 모두 끝난 뒤(인스턴스 생성 시점)에 함수를 호출해서 클래스를 꺼냅니다.

ESM은 다릅니다. <code>import</code>된 바인딩은 <code>const</code>처럼 다뤄지고, 평가 전 접근은 <b>TDZ(Temporal Dead Zone)</b>로 막혀서 <code>Cannot access 'X' before initialization</code> 에러가 납니다. CJS의 "빈 객체라도 일단" 관용이 없어서, forwardRef 같은 트릭의 전제가 흔들려요.
</div>

### 라이브러리 생태계

TypeORM, Passport, Mongoose 등 Nest 생태계의 주요 라이브러리 대부분이 CJS를 가정하고 작성됐습니다.
이게 CJS인거랑, NestJS가 CJS인 연관 관계는 아래 전환의 비용을 보시면 좀 더 이해가 되실 수도 있겠습니다.

### CJS → ESM 전환의 비용

`package.json`에 `"type": "module"` 한 줄만 추가하면 ESM 기반이 되는 걸까요?
아쉽게도, 많은 것들을 함께 변경해야 합니다.

**1. 파일 import에 확장자 필수**

```ts
// CJS
import { foo } from './utils';       // 됨

// ESM
import { foo } from './utils';       // ❌
import { foo } from './utils.js';    // ✅ (TS 파일인데도 .js)
```

**2. `__dirname`, `__filename` 사라짐**

```js
// CJS에선 자동 제공
console.log(__dirname);

  // Node가 내부적으로 이렇게 실행하기 때문
  (function(exports, require, module, __filename, __dirname) {
    // 내 코드                
  });  

// ESM에선 위와 같이 래핑하지 않아 직접 만들어야 함
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```
라이브러리 내부에서 이런 걸 쓰고 있다면, ESM 환경에선 import만 해도 죽습니다.

**3. `require()` 못 씀**

CJS에서 자주 쓰던 JSON 로딩, 동적 require 전부 안 됩니다.

**4. 설정 파일 이름 변경**

`.eslintrc.js` → `.eslintrc.mjs`, `jest.config.js` → `jest.config.mjs` 등.

**5. 프레임워크 레벨 이슈**

위에서 얘기한 데코레이터, 동적 모듈, circular dep 등이 ESM에선 터지기 쉽습니다.

**결론**: CJS → ESM 전환은 프로젝트를 거의 새로 만드는 수준의 공사입니다. 
그래서 대부분의 Node 백엔드 프로젝트는 **CJS에 남아있습니다.**

---

## 6. 반면, 프론트엔드는 거의 다 ESM 기반

그러나 근래의 프론트엔드 스택은 거의 다 ESM 기반입니다. Vite, Next.js App Router, Remix, SvelteKit, Astro. 
그리고 새로 나온 Deno, Bun 같은 런타임은 아예 ESM 우선이거나 ESM-only입니다.
프론트엔드는 뭐가 달라서 이런 변화가 있었을까요?

프론트엔드가 ESM 기반으로 넘어간 이유는 크게 두 가지입니다.

### 번들 크기 (Tree-shaking)

프론트엔드에서 번들 크기는 곧 로딩 속도입니다. JS 파일이 크면 사용자가 페이지를 기다려야 하니까요.

ESM은 `import`가 항상 파일 최상단에 고정되어 있어서, 실행 전에 "어떤 코드가 실제로 쓰이는지"를 정적으로 파악할 수 있습니다. 
번들러가 이를 활용해 안 쓰는 코드를 빌드 시점에 제거합니다. 이게 tree-shaking입니다.

```ts
import { foo } from 'big-lib';
// → foo만 번들에 포함, 나머지는 빌드 시 제거됨
```

CJS의 `require()`는 코드 어디서든 호출할 수 있어서 실행 전에 의존성을 파악할 수 없습니다. 
무엇이 쓰일지 모르니 라이브러리 전체를 번들에 포함해야 합니다.

### 개발 속도 (브라우저 네이티브 ESM)

옛날 브라우저는 `import/export`를 몰랐습니다. 파일 간 의존성은 개발자가 `<script>` 순서를 손으로 맞춰야 했고, <u>번들러가 여러 파일을 하나로 합쳐서 브라우저에 주는 이유도 이 때문</u>이었습니다.

현대 브라우저는 ESM을 직접 이해합니다. 
`<script type="module">`으로 로드하면 브라우저가 `import`를 만날 때마다 필요한 파일을 알아서 가져옵니다.

```html
<script type="module" src="./app.js"></script>
```

Vite는 이걸 개발 서버에 활용합니다. webpack은 개발 중에도 전체 파일을 하나로 번들링한 뒤 브라우저에 줘서, 파일 하나 수정하면 전체를 다시 빌드해야 합니다. Vite는 파일을 그대로 브라우저에 넘기기 때문에 수정된 파일만 다시 전달하면 됩니다. 브라우저가 ESM을 직접 이해하기에 가능한 방식입니다.


### ESM의 불편한 점은 번들러가 가려준다

ESM에도 불편한 점은 있습니다. 확장자를 명시해야 하고, CJS 라이브러리와 섞어 쓸 때 interop 이슈가 생기고, Node 환경에선 `bare import`(`import 'lodash'` 같은 것) 해석도 직접 처리해야 합니다. 그런데 프론트엔드에서 이게 거의 느껴지지 않는 이유는 **번들러가 이 모든 걸 가려주기 때문**입니다.

---

## 7. 번들러

### 번들러란?

여러 JS/CSS/이미지 파일을 묶어서 브라우저가 효율적으로 로드할 수 있게 만드는 도구입니다.

| 이름 | 특징 | 주 사용처 |
|------|------|----------|
| webpack | 원조. 설정 복잡, 기능 풍부 | 오래된 프로젝트, Next.js (Turbopack 전환 중) |
| Vite | 개발 서버가 브라우저 네이티브 ESM 활용 | Vue/React/Svelte 등 대부분의 최신 프론트엔드 |
| esbuild | Go로 작성돼 매우 빠름 | Vite·Remix 내부 엔진, 단독 사용보다 다른 툴에 내장 |
| Rollup | 라이브러리 번들링 특화 | npm에 배포하는 라이브러리, Vite 프로덕션 빌드 |
| Parcel | 설정 없이 동작 | 빠르게 프로토타입 만들 때, 소규모 프로젝트 |
| Turbopack | Rust 기반 차세대 webpack | Next.js 15+ |

하는 일:
- 수백 개 파일을 소수의 파일로 뭉침
- TS → JS 변환
- JSX → JS 변환
- CSS/이미지 처리
- Tree-shaking
- Code splitting (lazy load)


### 번들러가 ESM에 대하여 해주는 일들

**확장자 강제 불필요**

```ts
import { foo } from './utils';  // ❌ 순수 Node ESM에선 에러
```

번들러가 해주는 일: 확장자 없어도 `./utils.ts`, `./utils/index.ts` 등을 알아서 찾아줌.

**CJS/ESM interop**

라이브러리가 CJS인지 ESM인지 번들러가 자동 감지하고 interop 코드를 주입합니다. 개발자는 신경 쓰지 않아도 됨.

**Bare import 해석**

```ts
import React from 'react';
```

패키지 이름뿐인 `'react'`를 `./node_modules/react/index.js`로 번들러가 바꿔줍니다. 

**다양한 파일 형식**

`.ts`, `.jsx`, `.vue`, `.svelte`, CSS, JSON, 이미지. 전부 JS로 변환하거나 모듈처럼 취급해서 처리합니다.


### 백엔드는 왜 번들러를 안 쓰나요?

번들러가 하는 일 대부분이 백엔드에선 의미가 없거나 해롭습니다.

**이득 없음**
- 파일 크기가 (크게) 중요하지 않음 - 서버 디스크에 있을 뿐, 네트워크로 내려보내지 않음
- Tree-shaking 이득 (크게) 없음 - 안 쓰는 코드가 메모리에 올라가 있어도 상관없음
- 파일 수 줄이는 이득 (크게) 없음 - 시작 시간에만 영향

**오히려 해로움**
- 스택 트레이스가 망가짐 (`Error at main.js:1:28493` 같은 식)
- 동적 `require` 패턴과 안 맞음 (번들러는 정적 분석 필요)
- 데코레이터 메타데이터 꼬임
- 네이티브 모듈(`.node`) 번들 불가

그래서 백엔드는 보통 **TS 컴파일러(tsc)만** 씁니다. 
`src/*.ts` → `dist/*.js`로 1:1 변환만 하고, `node_modules`는 그대로 두고 런타임에 `require`로 로드합니다.

### `"type"` 없이도 소스에서 ESM을 쓸 수 있는 이유

번들러가 있는 프로젝트라면 `package.json`에 `"type": "module"`이 없어도 소스 코드에서 `import/export`를 자유롭게 쓸 수 있습니다.

**`package.json "type"`이 하는 일**: 
- Node.js가 `.js` 파일을 직접 실행할 때 CJS로 볼지 ESM으로 볼지 결정합니다.

**번들러의 영역**: 
- 소스 코드(`src/` 안)는 Node가 직접 실행하지 않습니다. 번들러가 먼저 가로채서 변환한 뒤에 브라우저나 Node에 전달합니다. 번들러는 `"type"` 설정과 무관하게 자체 규칙으로 `import/export`를 처리합니다.

즉, `"type"`은 **번들러 밖 파일에만** 영향을 줍니다.

```
번들러 안 (소스 코드)     → "type" 무관. import/export 자유롭게 사용
번들러 밖 (설정 파일들)   → "type" 따름. next.config.js, tailwind.config.js 등
```

이 때문에 Next.js 프로젝트에서 `"type"` 없이도 소스는 전부 `import/export`로 작성하면서, `next.config.js` 같은 설정 파일은 `module.exports`를 써야 하는 겁니다. 설정 파일을 ESM으로 쓰고 싶다면 `next.config.mjs`처럼 확장자를 바꾸면 됩니다.


## 8. 그래서 진짜 범인은?

CJS, ESM, 번들러 등에 대해서 알아봤지만, 사실 진짜 범인은 따로 있었습니다.

알고 보니 undefined 에러는 새로 붙인 SDK 내부에서 터지고 있었습니다.

그 SDK는 Node 20 이상을 요구했고, 서버는 그보다 낮은 버전으로 돌고 있었습니다.  

그 시점엔 마치 `import` 문법에 따라 됐다 안 됐다 하는 것처럼 보였지만, 돌이켜보면 그건 빌드 캐시가 stale했거나 서버 재시작 타이밍이 어긋났거나 하는 부수 요인 때문이었을 가능성이 더 큽니다. 


즉 **import 문법은 표면 증상만 들쭉날쭉하게 보여줬을 뿐, 근본 원인은 항상 같은 곳에 있었습니다.**
진짜 해결은 import를 어떻게 하느냐가 아니라, **Node 버전을 올리는 것**이었던 거죠. (SDK를 버리거나..)

### Node 20미만의 crypto와 이상의 crpyto는 뭐가 다른가요?

<u>JS 세계엔 이름이 같지만 완전히 다른 두 개의 crypto가 있습니다.</u>

**1. Node 내장 `crypto` 모듈** — `import`해서 쓰는 것

```ts
import { createHash } from 'crypto';
import { createHash } from 'node:crypto';
```

Node 초창기부터 있었고, 버전 무관하게 동작합니다. 우리가 위에서 4가지 import 케이스로 살펴본 게 바로 이것입니다.

**2. Web Crypto API** — `globalThis.crypto`로 글로벌하게 그냥 쓰는 것

```js
crypto.subtle.digest('SHA-256', data);
crypto.randomUUID();
crypto.getRandomValues(new Uint8Array(16));
```

원래 **브라우저 표준**이고, Node에는 늦게 추가됐습니다.

| Node 버전 | `globalThis.crypto` |
|-----------|---------------------|
| ~17 | ❌ 글로벌 아님 (`require('crypto').webcrypto`로만 접근 가능) |
| 19 | ⚠️ `--experimental-global-webcrypto` 플래그 필요 |
| **20** | ✅ **기본 글로벌** |

요즘 SDK는 브라우저와 Node 양쪽에서 돌아가도록(isomorphic) 짜는 경우가 많습니다. 이때 SDK 내부에서 `crypto.subtle.digest(...)` 같이 **글로벌 `crypto`를 가정하고 쓰는 코드**가 들어가곤 합니다.

- 브라우저 → 옛날부터 글로벌 `crypto` 있음 → 동작
- Node 20+ → 글로벌 `crypto` 추가됨 → 동작
- **Node 18 이하 → 글로벌 `crypto` 없음 → `crypto is not defined` 또는 `cannot read properties of undefined (reading 'subtle')`**

<u>즉, 새로 추가한 SDK에서는 Web Crypto API를 쓰고 있었고 node 20 미만이었던 저희 서버에 그 녀석은 없었던 것이죠.</u>

<div class="callout callout-tip"><code>globalThis.crypto</code>는 그냥 <code>crypto</code>로 쓸 수도 있습니다.

JS는 이름을 만나면 <strong>안쪽 스코프부터 바깥으로</strong> 찾아 올라갑니다. 함수 안 → 모듈 스코프 → 글로벌 순으로요. <code>crypto</code>를 import하지도, 선언하지도 않은 채 그냥 썼다면, 엔진은 자동으로 글로벌 슬롯(<code>globalThis.crypto</code>)을 찾아갑니다.

즉 <code>globalThis.</code>를 안 적은 건 단지 생략일 뿐, JS 입장에선 어차피 같은 곳을 찾습니다. Node 18에선 <code>globalThis.crypto</code>가 없으니, <code>crypto.subtle</code>이라고 적든 <code>globalThis.crypto.subtle</code>이라고 적든 똑같이 <code>ReferenceError: crypto is not defined</code>로 터집니다.
</div>


## 9. 그럼에도 이 삽질이 남긴 것

엉뚱한 곳을 헤맸지만, 이 과정에서 정리하게 된 것들이 있었네요.

- `import` 한 줄이 컴파일을 거쳐 어떻게 `require()`로 바뀌는지
- `(0, fn)()`, `__importDefault`, `__importStar` 같은 장치가 왜 필요한지
- CJS와 ESM이라는 두 경계 사이에 우리가 서 있다는 것
- 번들러가 프론트엔드에서 얼마나 많은 갭을 가려주고 있는지
- 왜 Nest 같은 백엔드 프레임워크는 여전히 CJS에 머물러 있는지

여기까지. 안녕!