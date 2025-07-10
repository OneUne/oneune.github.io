---
layout: post
title: "복붙의 함정에서 벗어나기: 클래스와 인스턴스를 이해하자"
category: blog
tags: nestjs javascript oop
comments: true
---

```typescript
// ReportService.ts
@Injectable() 
export class ReportService {
  private someMemberVariable: any;
  
  constructor(
    private reportTemplate: ReportTemplate,
  ) {
    this.someMemberVariable = { processedData: 'some complex calculation' };
  }
}
```
위와 같은 서비스가 있다고 할 때, ReportTemplate에도 동일한 멤버변수(`someMemberVariable`)가 필요하다고 가정합시다.   
ReportTemplate도 엄연히 별개의 클래스이기 때문에 똑같이, 아래와 같이 구성해야한다고 생각하는 사람만 이 글을 읽으세요. 

```typescript
// ReportTemplate.ts
@Injectable() 
export class ReportTemplate {
  private someMemberVariable: any;
  
  constructor() {
    this.someMemberVariable = { processedData: 'some complex calculation' };
  }
}
```

* toc
{:toc}

<br/>

---

<br/>

비슷한 행위를 하는 또다른 무언가가 필요할 때, 생각없이 냅다 복사 붙여넣기 하는 경우들이 꽤 있습니다. (저만 그런 건 아니겠죠?)  

서론에 나온 '그렇게 생각하는' 사람이 바로 저였고, "몰라서 그렇게 했죠?"라는 코드리뷰를 받고 공부했던 점을 기록합니다.  

사실은 `this.reportTemplate.someMemberVariable = this.someMemberVariable` 한 줄로 해결할 수 있답니다.  

처음에는 저게 어떻게 가능하지? 싶었어요. 

그 멤버변수는 ReportTemplate에도 필요한 건데, ReportTemplate이 ReportService에만 쓰이기 때문인가? 각 클래스들의 생성 시점은 어떻게 되는데? 

이런저런 의문들이 생겼답니다. 왜 이런 의문들을 가졌나 생각해보면, 내가 지금 작성하고 있는 이게 클래스라는 감각조차 없었던 것 같습니다.  

## NestJS에서는 거의 모든 것이 클래스입니다. 근데, 클래스가 뭐죠?
<small style="text-decoration: line-through;">좀 더 정확히 설명하자면 JavaScript는 프로토타입 객체 지향이며, ES6에서의 class는 syntatic sugar일뿐이라고는 하지만,,   
여기서 말하는 클래스는 JS의 클래스입니다.<small>

```typescript
@Injectable()
export class ProductService { }  // 클래스

@Controller('products')
export class ProductController { }  // 클래스

@Entity()
export class Product { }  // 클래스

export class CreateProductDto { }  // 클래스

@Injectable()
export class DatabaseService { }  // 클래스
```

NestJS에서는 거의 모든 것이 클래스입니다.   
Module, Controller, Service, Dto, 심지어는 Nest애플리케이션도 NestFactory 클래스를 사용한 인스턴스이죠.  

```tsx

import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
```

Controller는 HTTP 요청을 처리하고, 더 복잡한 작업은 프로바이더(Provider; Service, Repository, Factory, Helper, ...)에게 위임해야합니다.  
위와 같이 쓰는 패턴이 너무 당연해서 눈치채지 못했을 수도 있는데, Service 그 자체로는 아무것도 아닌 **구조체**일 뿐입니다.  
Controller의 생성자(constructor)에서 주입되고, 사용될 때 의미를 가지죠.  

### 클래스만으로는 아무것도 할 수 없습니다.


```tsx
class Calculator {
    add(a: number, b: number): number {
        return a + b;
    }
}
```

위와 같은 Calculator가 있을 때, 제가 바로 Calculator.add(1,2)를 한다면 어떤 일이 벌어질까요?

![calculator-class-add-error](/assets/img/blog/2025-06-10/calculator-class-add.png)

*얘, 그건 함수가 아니란다.* 라는 에러를 목격하게 됩니다.


```tsx
const calc = new Calculator();
console.log(calc.add(1, 2)); // 3
```

이런식으로 인스턴스를 생성해야만, 원하던 값인 3을 얻게 되죠.

클래스는 <u>객체를 만들기 위한 설계도이자 템플릿</u>으로 그렇다 할 실체가 존재하지 않습니다.  
이러한 클래스로부터 만들어진 실제 객체가 <u>인스턴스</u>이고, 얘는 메모리에 존재하며 실제 동작 가능합니다.  

다시 말해, 클래스만으로는 아무것도 할 수 없고, 반드시 new 키워드로 인스턴스를 만들어야 비로소 메서드를 호출하고 데이터를 저장할 수 있습니다.  

<br/>

앞서 Service 또한 Controller의 생성자에서 주입되고, 사용될 때 의미를 갖는다는 말을 했습니다.  

즉, **서비스 또한 인스턴스**로 전달된다는 거죠.

NestJS를 접할 때 싱글톤 패턴, 의존성 주입 등의 단어를 들어보신 적이 있을 겁니다.

그게 무슨 의미냐면, **생성한 인스턴스를 생성자에 전달**한다는 거예요.

```typescript
constructor(
  private readonly reportTemplate: ReportTemplate, // << 이것도 인스턴스 
  private readonly emailService: EmailService,
) {}
```

하나는 알고 둘은 모르는 저는 NestJS가 이미 했을 new ReportTemplate()이 눈에 보이지 않으니, 이걸 인스턴스라고 느끼지 않았던 것 같습니다.  
아, 글쎄 저는 인스턴스를 저렇게 생성하는 걸 본 적이 없다니까요. <small style="text-decoration: line-through;">라고 매일 NestJS로 개발하는 사람이 말했습니다.</small>

눈에 안 보이는 걸 보기 위해, NestJS의 인스턴스 생성 과정을 간략하게 알아보겠습니다.  


### NestJS는 이렇게 인스턴스를 만들고 있습니다.

NestJS는 애플리케이션 시작 시 다음과 같은 일을 합니다:

1. **클래스 스캔**: `@Injectable()` 데코레이터가 붙은 클래스들을 찾아요
2. **의존성 그래프 생성**: 어떤 클래스가 어떤 클래스를 필요로 하는지 파악해요
3. **인스턴스 생성**: 필요한 순서대로 인스턴스를 생성하고 주입해요

```typescript
// NestJS가 내부적으로 하는 일 (수도코드)
const reportTemplate = new ReportTemplate(); // 인스턴스 생성
const reportService = new ReportService(
  reportTemplate,  // 이미 생성된 인스턴스를 전달
);
```

그래서 `ReportService`의 생성자에서 받는 `reportTemplate`은 이미 **완성된 인스턴스**인 거예요.


## 한 줄로 해결되는 이유는, 인스턴스가 객체이기 때문입니다.

앞서 인스턴스는 클래스로부터 만들어진 실제 객체임을 설명했습니다.  

그러니까, ReportService에 주입된 reportTemplate은 **인스턴스이자 객체**인 거죠. 

그리고 객체는 **참조타입**입니다.

```tsx
const calc1 = new Calculator();
const calc2 = new Calculator();
// calc1과 calc2는 서로 다른 객체
console.log(calc1 === calc2); // false
```

같은 템플릿을 찍어냈으나, calc1과 calc2는 같지 않습니다.  
각각은 그저 객체가 저장된 메모리값을 가지고 있죠. 
그래서 객체의 경우, const로 선언했지만 그 안의 내용은 변경이 가능합니다.

```tsx
calc1.add = (a,b) => (a-b)
console.log(calc1.add(1,2)) // -1
```

제가 위와 같은 극악무도한 짓을 저질러버려도 된다는 뜻이죠 ㅋㅋ

<br/>

JavaScript/TypeScript에서 객체는 참조 타입이라서:
1. `this.reportTemplate`은 메모리에 있는 ReportTemplate 인스턴스의 주소를 가지고 있습니다.
2. 그리고 그 주소를 통해 언제든 멤버변수에 접근하고 수정할 수 있죠.
3. 이는 앱 구동 / 변수 초기화 시점과는 무관한 언어의 기본 특성입니다.


그렇기에 **ReportService에서 ReportTemplate의 someMemberVariable을 직접 수정하는 것이 가능❗️**합니다.  


```typescript
// ReportService.ts
constructor(
  private readonly reportTemplate: ReportTemplate,
) {
  this.someMemberVariable = { processedData: 'some complex calculation' };
  this.reportTemplate.someMemberVariable = this.someMemberVariable;
}
```

한 줄로 간략하게 적어서 그렇지, someMemberVariable이 꽤 큰 무언가였다면 아주 간편해진 걸 체감하실 거예요.  

이토록 **간단하고, 직관적이며, 런타임에 유연**하게 의존성을 연결할 수 있었습니다.  
그러나 **타입 안정성이 다소 약하고, 의존성 관계가 명시적이지 않다**는 단점이 있습니다.  
분명 ReportTemplate에도 someMemberVariable이 정의는 되어있는데,   
도대체 어디서 이 값이 와서 어떻게 쓰는 건지 알기 쉽지 않겠죠.  

밖에서 정의해줘야 하는 값이라는 걸 명시하려면 setter 메서드를 제공하는 것도 괜찮지 않을까 싶네요.

```typescript
// ReportTemplate.ts
export class ReportTemplate {
  private someMemberVariable?: any;

  setSomeMemberVariable(data: any) {
    this.someMemberVariable = data;
  }
}
```

## 각각의 멤버변수는 언제 값을 갖게 되고, 사용이 가능한가?

여전히 해결되지 않았던 궁금증은 위와 같은 것이었습니다. 

앞서 간략하게 설명한 NestJS의 클래스 초기화 메커니즘을 좀 더 자세히 살펴봐야 했습니다.  


#### NestJS 클래스 초기화 메커니즘
```tsx
@Injectable()
export class ReportService {
// 1. 멤버변수 선언 (아직 값 없음)
  private someMemberVariable: any;
  private anotherVariable: string;

// 2. 생성자 (인스턴스 생성 시 실행됨)
  constructor(
    private reportTemplate: ReportTemplate,// 생성자 매개변수
  ) {
// 3. 생성자 바디 실행
    this.someMemberVariable = this.calculateData();// 멤버변수에 값 할당
    this.anotherVariable = "초기화됨";
  }

  private calculateData() {
    return { data: "복잡한 계산 결과" };
  }
}

```

위와 같은 클래스가 있을 때, NestJS의 실행순서는 다음과 같습니다.

**1단계: NestJS가 클래스 스캔 및 의존성 분석**

```tsx
// NestJS가 메타데이터를 읽어서 파악
"ReportTemplate 클래스가 있네"
"ReportService 클래스가 있고, ReportTemplate이 필요하네"
"ReportService → ReportTemplate 순서로 만들어야겠다"

```

**2단계: 의존성 순서대로 인스턴스 생성**
```tsx
// NestJS가 내부적으로 실행 (의사코드)
const reportTemplate = new ReportTemplate();  // 의존성 먼저 생성
const reportService = new ReportService(reportTemplate);  // 실제 인스턴스 생성
```

**3단계: 인스턴스 생성 과정 (세부 단계)**

**3-1. 메모리 할당**

```tsx
// 메모리에 객체 공간 생성
reportService = {
  someMemberVariable: undefined,// 아직 값 없음
  anotherVariable: undefined,// 아직 값 없음
  reportTemplate: undefined,// 아직 값 없음
}

```

**3-2. 생성자 매개변수 할당**

```tsx
// 생성자 매개변수를 멤버변수로 자동 할당 (TypeScript 기능😲)
reportService = {
  someMemberVariable: undefined,
  anotherVariable: undefined,
  reportTemplate: [전달받은 ReportTemplate 인스턴스],// 값 할당됨
}

```

>**TypeScript 생성자 매개변수 특별 기능?**
> 
> ```tsx
> constructor(private injectedService: SomeService) {}
> // ↓ 자동으로 이렇게 변환됨
> private injectedService: SomeService;// 멤버변수 자동 생성
> constructor(injectedService: SomeService) {
>   this.injectedService = injectedService;// 자동 할당
> }
> ```

**3-3. 생성자 바디 실행**

```tsx
// 생성자 안의 코드가 순서대로 실행
this.someMemberVariable = this.calculateData();
// → calculateData() 메서드 실행// → 결과값을 someMemberVariable에 할당

this.anotherVariable = "초기화됨";
// → anotherVariable에 값 할당

```

**3-4. 최종 상태**

```tsx
reportService = {
  someMemberVariable: { data: "복잡한 계산 결과" },// 초기화 완료
  anotherVariable: "초기화됨",// 초기화 완료
  reportTemplate: [ReportTemplate 인스턴스],// 주입 완료
}

```

짧은 초기화 시간에 Nest는 꽤 많은 일을 하고 있었네요..!  
시간 순서대로 나열해보면 다음과 같을 것입니다.
```
T=0: 앱 시작
T=1: NestJS가 클래스들 스캔, 의존성 그래프 생성
T=2: ReportTemplate 인스턴스 생성
  T=2.1: ReportTemplate 메모리 할당
  T=2.2: ReportTemplate 생성자 실행 (비어있음)
T=3: ReportService 인스턴스 생성
  T=3.1: ReportService 메모리 할당 
  T=3.2: 생성자 매개변수(reportTemplate) 할당
  T=3.3: ReportService 생성자 바디 실행
    - this.someMemberVariable = ... (계산)
    - this.reportTemplate.someMemberVariable = ... (할당)
T=4: 모든 인스턴스 준비 완료
```

아래와 같은 의문을 가졌었는데,

>ReportTemplate이 ReportService의 멤버변수를 써야 하는데, 이게 어떻게 가능하지?  
>ReportService의 someMemberVariable이 값을 갖는 것과 이를 할당해주는 시점은 어떻게 되는 거지? 

이에 대한 답을 해보자면,  
ReportTemplate이 ReportService의 멤버변수를 쓴다기 보다는,   
ReportService가 ReportTemplate의 멤버변수를 수정하는 것이라고 보는게 맞겠네요.  
ReportService의 someMemberVariable이 값을 갖는 것과 이를 할당해주는 시점은 ReportService 인스턴스가 생성되고, 생성자 바디가 실행될 때겠네요.


## 마치며

NestJS와 좀 더 친해지는 시간이 되셨길.

여기까지. 안녕!