---
layout: post
title: "데이터 모델링의 다양한 관계 패턴, 그 중에서도 부모-자식 관계 설계에 대하여"
category: blog
tags: db
image:
  path: /assets/img/blog/2025-04-02/thumb.png
comments: true
---

데이터베이스 설계에서 테이블 간의 관계를 어떻게 구성하느냐는 애플리케이션의 성능, 확장성, 그리고 유지보수성에 결정적인 영향을 미칩니다. 프로젝트에서 부모-자식 관계를 설계하며 경험한 교훈을 공유합니다.

* toc
{:toc}

## 데이터 모델링에서의 다양한 관계 패턴

데이터 모델링에서 주로 사용되는 관계 패턴은 다음과 같습니다:  

### 1. 일대다(One-to-Many) 관계

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 100 800 320">
<!-- 1. 일대다(One-to-Many) 관계 -->
<rect x="100" y="100" width="600" height="300" rx="10" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/>
<text x="400" y="130" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#1565c0">1. 일대다(One-to-Many) 관계</text>
<!-- User 테이블 -->
<rect x="150" y="160" width="200" height="180" rx="5" fill="#bbdefb" stroke="#1565c0" stroke-width="1.5"/>
<text x="250" y="185" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle">User</text>
<line x1="150" y1="195" x2="350" y2="195" stroke="#1565c0" stroke-width="1.5"/>
<text x="160" y="220" font-family="Arial" font-size="14">id: UUID (PK)</text>
<text x="160" y="245" font-family="Arial" font-size="14">name: string</text>
<text x="160" y="270" font-family="Arial" font-size="14">email: string</text>
<text x="160" y="295" font-family="Arial" font-size="14">...</text>
<!-- Post 테이블 -->
<rect x="450" y="160" width="200" height="180" rx="5" fill="#bbdefb" stroke="#1565c0" stroke-width="1.5"/>
<text x="550" y="185" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle">Post</text>
<line x1="450" y1="195" x2="650" y2="195" stroke="#1565c0" stroke-width="1.5"/>
<text x="460" y="220" font-family="Arial" font-size="14">id: UUID (PK)</text>
<text x="460" y="245" font-family="Arial" font-size="14">title: string</text>
<text x="460" y="270" font-family="Arial" font-size="14">content: text</text>
<text x="460" y="295" font-family="Arial" font-size="14">userId: UUID (FK)</text>
<text x="460" y="320" font-family="Arial" font-size="14">...</text>
<!-- 화살표 -->
<path d="M 350 250 L 450 250" stroke="#1565c0" stroke-width="2" fill="none"/>
<polygon points="440,245 450,250 440,255" fill="#1565c0"/>
<!-- 설명 텍스트 -->
<text x="400" y="370" font-family="Arial" font-size="14" text-anchor="middle">하나의 User가 여러 개의 Post를 가질 수 있음</text>
<text x="400" y="390" font-family="Arial" font-size="14" text-anchor="middle">자식 엔티티(Post)가 부모 엔티티(User)를 참조</text>
</svg>

가장 흔한 관계 유형으로, 하나의 레코드가 여러 개의 다른 레코드와 연관됩니다.

**예시**: 사용자(1)와 그 사용자가 작성한 게시글(N)

```typescript
// TypeORM 예시
@Entity()
class User {
 @OneToMany(() => Post, post => post.author)
 posts: Post[];
}

@Entity()
class Post {
 @ManyToOne(() => User, user => user.posts)
 author: User;
}
```

### 2. 다대다(Many-to-Many) 관계
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 450 800 370">
<rect x="100" y="450" width="600" height="350" rx="10" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
  <text x="400" y="480" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#2e7d32">2. 다대다(Many-to-Many) 관계</text>
  <!-- Student 테이블 -->
  <rect x="130" y="510" width="160" height="150" rx="5" fill="#c8e6c9" stroke="#2e7d32" stroke-width="1.5"/>
  <text x="210" y="535" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle">Student</text>
  <line x1="130" y1="545" x2="290" y2="545" stroke="#2e7d32" stroke-width="1.5"/>
  <text x="140" y="570" font-family="Arial" font-size="14">id: UUID (PK)</text>
  <text x="140" y="595" font-family="Arial" font-size="14">name: string</text>
  <text x="140" y="620" font-family="Arial" font-size="14">...</text>
  <!-- StudentCourse 중간 테이블 -->
  <rect x="320" y="510" width="160" height="150" rx="5" fill="#c8e6c9" stroke="#2e7d32" stroke-width="1.5"/>
  <text x="400" y="535" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle">StudentCourse</text>
  <line x1="320" y1="545" x2="480" y2="545" stroke="#2e7d32" stroke-width="1.5"/>
  <text x="330" y="570" font-family="Arial" font-size="14">studentId: UUID (FK)</text>
  <text x="330" y="595" font-family="Arial" font-size="14">courseId: UUID (FK)</text>
  <text x="330" y="620" font-family="Arial" font-size="14">enrolledDate: date</text>
  <!-- Course 테이블 -->
  <rect x="510" y="510" width="160" height="150" rx="5" fill="#c8e6c9" stroke="#2e7d32" stroke-width="1.5"/>
  <text x="590" y="535" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle">Course</text>
  <line x1="510" y1="545" x2="670" y2="545" stroke="#2e7d32" stroke-width="1.5"/>
  <text x="520" y="570" font-family="Arial" font-size="14">id: UUID (PK)</text>
  <text x="520" y="595" font-family="Arial" font-size="14">name: string</text>
  <text x="520" y="620" font-family="Arial" font-size="14">...</text>
  <!-- 화살표 -->
  <path d="M 290 585 L 320 585" stroke="#2e7d32" stroke-width="2" fill="none"/>
  <polygon points="310,580 320,585 310,590" fill="#2e7d32"/>
  <path d="M 480 585 L 510 585" stroke="#2e7d32" stroke-width="2" fill="none"/>
  <polygon points="500,580 510,585 500,590" fill="#2e7d32"/>
  <!-- 설명 텍스트 -->
  <text x="400" y="700" font-family="Arial" font-size="14" text-anchor="middle">한 학생이 여러 과목을 수강할 수 있고, 한 과목에 여러 학생이 등록할 수 있음</text>
  <text x="400" y="720" font-family="Arial" font-size="14" text-anchor="middle">중간 테이블(StudentCourse)을 통해 관계를 표현하고 추가 속성도 저장 가능</text>
  <text x="400" y="740" font-family="Arial" font-size="14" text-anchor="middle">양쪽 테이블의 기본 키를 외래 키로 참조</text>
</svg>

여러 레코드가 다른 테이블의 여러 레코드와 연관되는 관계입니다.  

**예시**: 학생과 수강하는 과목

```typescript
// TypeORM 예시
@Entity()
class Student {
  @ManyToMany(() => Course)
  @JoinTable()
  courses: Course[];
}

@Entity()
class Course {
  @ManyToMany(() => Student)
  students: Student[];
}
```

### 3. 일대일(One-to-One) 관계

<svg xmlns="http://www.w3.org/2000/svg" viewbox="0 850 800 370">
<!-- 3. 일대일(One-to-One) 관계 -->
  <rect x="100" y="850" width="600" height="300" rx="10" fill="#fff3e0" stroke="#e65100" stroke-width="2"/>
  <text x="400" y="880" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#e65100">3. 일대일(One-to-One) 관계</text>
  <!-- User 테이블 -->
  <rect x="150" y="910" width="200" height="180" rx="5" fill="#ffe0b2" stroke="#e65100" stroke-width="1.5"/>
  <text x="250" y="935" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle">User</text>
  <line x1="150" y1="945" x2="350" y2="945" stroke="#e65100" stroke-width="1.5"/>
  <text x="160" y="970" font-family="Arial" font-size="14">id: UUID (PK)</text>
  <text x="160" y="995" font-family="Arial" font-size="14">username: string</text>
  <text x="160" y="1020" font-family="Arial" font-size="14">email: string</text>
  <text x="160" y="1045" font-family="Arial" font-size="14">profileId: UUID (FK)</text>
  <text x="160" y="1070" font-family="Arial" font-size="14">...</text>
  <!-- Profile 테이블 -->
  <rect x="450" y="910" width="200" height="180" rx="5" fill="#ffe0b2" stroke="#e65100" stroke-width="1.5"/>
  <text x="550" y="935" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle">Profile</text>
  <line x1="450" y1="945" x2="650" y2="945" stroke="#e65100" stroke-width="1.5"/>
  <text x="460" y="970" font-family="Arial" font-size="14">id: UUID (PK)</text>
  <text x="460" y="995" font-family="Arial" font-size="14">bio: text</text>
  <text x="460" y="1020" font-family="Arial" font-size="14">location: string</text>
  <text x="460" y="1045" font-family="Arial" font-size="14">website: string</text>
  <text x="460" y="1070" font-family="Arial" font-size="14">...</text>
  <!-- 화살표 -->
  <path d="M 350 1000 L 450 1000" stroke="#e65100" stroke-width="2" fill="none"/>
  <polygon points="440,995 450,1000 440,1005" fill="#e65100"/>
  <circle cx="350" cy="1000" r="4" fill="#e65100"/>
  <circle cx="450" cy="1000" r="4" fill="#e65100"/>
  <!-- 설명 텍스트 -->
  <text x="400" y="1110" font-family="Arial" font-size="14" text-anchor="middle">하나의 User는 정확히 하나의 Profile을 가질 수 있고,</text>
  <text x="400" y="1130" font-family="Arial" font-size="14" text-anchor="middle">하나의 Profile은 정확히 하나의 User에 연결됨</text>
</svg>

하나의 레코드가 다른 테이블의 딱 하나의 레코드와만 연관됩니다.

**예시**: 사용자와 프로필
```typescript
// TypeORM 예시
@Entity()
class User {
  @OneToOne(() => Profile)
  @JoinColumn()
  profile: Profile;
}

@Entity()
class Profile {
  @OneToOne(() => User)
  user: User;
}
```

### 4. 자기 참조(Self-Referencing) 관계
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 370">
  <!-- 4. 자기 참조(Self-Referencing) 관계 -->
  <rect x="100" y="10" width="600" height="300" rx="10" fill="#e1f5fe" stroke="#0288d1" stroke-width="2"/>
  <text x="400" y="40" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#0288d1">4. 자기 참조(Self-Referencing) 관계</text>
  <!-- Employee 테이블 -->
  <rect x="200" y="70" width="400" height="180" rx="5" fill="#bbdefb" stroke="#0288d1" stroke-width="1.5"/>
  <text x="400" y="95" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle">Employee</text>
  <line x1="200" y1="105" x2="600" y2="105" stroke="#0288d1" stroke-width="1.5"/>
  <text x="220" y="130" font-family="Arial" font-size="14">id: UUID (PK)</text>
  <text x="220" y="155" font-family="Arial" font-size="14">name: string</text>
  <text x="220" y="180" font-family="Arial" font-size="14">position: string</text>
  <text x="220" y="205" font-family="Arial" font-size="14">managerId: UUID (FK → Employee.id)</text>
  <text x="220" y="230" font-family="Arial" font-size="14">...</text>
  <!-- 자기 참조 화살표 -->
  <path d="M 400 205 C 650 205, 650 130, 600 130" stroke="#0288d1" stroke-width="2" fill="none"/>
  <polygon points="605,135 600,130 605,125" fill="#0288d1"/>
  <!-- 설명 텍스트 -->
  <text x="400" y="270" font-family="Arial" font-size="14" text-anchor="middle">한 직원(Employee)은 다른 직원을 관리자로 가질 수 있으며,</text>
  <text x="400" y="290" font-family="Arial" font-size="14" text-anchor="middle">하나의 테이블 내에서 레코드가 자기 자신의 다른 레코드를 참조함</text>
</svg>

같은 테이블 내에서 레코드 간에 관계가 형성되는 패턴입니다.

**예시**: 조직도에서 관리자와 부하 직원 관계
```typescript
// TypeORM 예시
@Entity()
class Employee {
  @ManyToOne(() => Employee, employee => employee.subordinates)
  manager: Employee;
  
  @OneToMany(() => Employee, employee => employee.manager)
  subordinates: Employee[];
}
```

### 5. 부모-자식(Parent-Child) 관계
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 1200 800 900">
<!-- 5. 부모-자식(Parent-Child) 관계 -->
  <rect x="100" y="1200" width="600" height="300" rx="10" fill="#f3e5f5" stroke="#6a1b9a" stroke-width="2"/>
  <text x="400" y="1230" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#6a1b9a">4. 부모-자식(Parent-Child) 관계</text>
  <!-- Comments 테이블 -->
  <rect x="200" y="1260" width="400" height="180" rx="5" fill="#e1bee7" stroke="#6a1b9a" stroke-width="1.5"/>
  <text x="400" y="1285" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle">Comment</text>
  <line x1="200" y1="1295" x2="600" y2="1295" stroke="#6a1b9a" stroke-width="1.5"/>
  <text x="220" y="1320" font-family="Arial" font-size="14">id: UUID (PK)</text>
  <text x="220" y="1345" font-family="Arial" font-size="14">content: text</text>
  <text x="220" y="1370" font-family="Arial" font-size="14">userId: UUID (FK)</text>
  <text x="220" y="1395" font-family="Arial" font-size="14">postId: UUID (FK)</text>
  <text x="220" y="1420" font-family="Arial" font-size="14">parentCommentId: UUID (FK)</text>
  <!-- 자기 참조 화살표 -->
  <path d="M 400 1420 C 650 1420, 650 1320, 600 1320" stroke="#6a1b9a" stroke-width="2" fill="none"/>
  <polygon points="605,1325 600,1320 605,1315" fill="#6a1b9a"/>
  <!-- 설명 텍스트 -->
  <text x="400" y="1470" font-family="Arial" font-size="14" text-anchor="middle">댓글(Comment)은 자신이 속한 부모 댓글을 참조</text>
  <text x="400" y="1490" font-family="Arial" font-size="14" text-anchor="middle">최상위 댓글은 parentCommentId가 null</text>
  <!-- 부모-자식 관계 구조 시각화 -->
  <rect x="100" y="1550" width="600" height="500" rx="10" fill="#e8eaf6" stroke="#283593" stroke-width="2"/>
  <text x="400" y="1580" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#283593">부모-자식 관계 구조 시각화</text><!-- 댓글 트리 구조 -->
  <!-- 레벨 1 댓글 -->
  <rect x="250" y="1620" width="300" height="40" rx="5" fill="#c5cae9" stroke="#283593" stroke-width="1.5"/>
  <text x="400" y="1645" font-family="Arial" font-size="14" text-anchor="middle">댓글 1: "이 글 정말 유익해요!"</text>
  <!-- 레벨 2 댓글들 -->
  <rect x="300" y="1690" width="250" height="40" rx="5" fill="#9fa8da" stroke="#283593" stroke-width="1.5"/>
  <text x="425" y="1715" font-family="Arial" font-size="14" text-anchor="middle">댓글 2: "저도 동의합니다."</text>
  <rect x="300" y="1740" width="250" height="40" rx="5" fill="#9fa8da" stroke="#283593" stroke-width="1.5"/>
  <text x="425" y="1765" font-family="Arial" font-size="14" text-anchor="middle">댓글 3: "좋은 정보 감사합니다."</text>
  <!-- 레벨 3 댓글 -->
  <rect x="350" y="1810" width="200" height="40" rx="5" fill="#7986cb" stroke="#283593" stroke-width="1.5"/>
  <text x="450" y="1835" font-family="Arial" font-size="14" text-anchor="middle" fill="white">댓글 4: "질문이 있어요."</text>
  <!-- 레벨 4 댓글 -->
  <rect x="380" y="1880" width="170" height="40" rx="5" fill="#5c6bc0" stroke="#283593" stroke-width="1.5"/>
  <text x="465" y="1905" font-family="Arial" font-size="14" text-anchor="middle" fill="white">댓글 5: "답변드립니다."</text>
  <!-- 연결선 -->
  <line x1="400" y1="1660" x2="400" y2="1690" stroke="#283593" stroke-width="1.5"/>
  <line x1="400" y1="1660" x2="400" y2="1740" stroke="#283593" stroke-width="1.5"/>
  <line x1="425" y1="1780" x2="425" y2="1810" stroke="#283593" stroke-width="1.5"/>
  <line x1="450" y1="1850" x2="450" y2="1880" stroke="#283593" stroke-width="1.5"/>
  <!-- 설명 텍스트 -->
  <text x="400" y="1950" font-family="Arial" font-size="14" text-anchor="middle">자식이 부모를 참조하는 구조로 계층적 댓글 시스템 구현</text>
  <text x="400" y="1970" font-family="Arial" font-size="14" text-anchor="middle">각 댓글은 자신의 부모 댓글 ID를 저장하여 계층 구조 형성</text>
  <text x="400" y="1990" font-family="Arial" font-size="14" text-anchor="middle">조회 시 부모-자식 관계를 재구성하여 중첩된 댓글 트리 생성</text>
</svg>

계층적 데이터 구조를 표현하는 관계로, 자기 참조의 특별한 형태입니다.  
일대다 관계에서도 부모엔티티, 자식엔티티 이런 말을 썼었는데 이때의 부모-자식과는 조금 다릅니다.  
* 일대다 관계: 서로 **다른** 엔티티 간의 관계를 설명합니다.
* 부모-자식 관계: 주로 **계층적** 데이터를 설명하거나 동일 엔티티 내 **자기 참조** 관계를 나타냅니다.

## 부모-자식 관계

### 부모-자식 관계는 언제 쓰일까요?
부모-자식 관계는 다양한 시나리오에서 활용될 수 있습니다:

- 조직도 구조
- 카테고리와 하위 카테고리
- 댓글과 대댓글
- 파일 시스템의 폴더 구조
- 게시글과 수정 이력
- 문서 버전 관리

### 부모-자식 관계를 설계하는 방법
부모-자식 관계를 설계할 때는 크게 두 가지 접근 방식이 있습니다:
1. **자식이 부모를 참조하는 방식**
- 자식 엔티티에 부모 ID를 외래 키로 저장
- 가장 일반적이고 직관적인 방식

2. **부모가 자식들을 참조하는 방식**
- 부모 엔티티에 자식 ID 목록을 저장
- 관계형 DB에서는 보통 중간 테이블이 필요하고, NoSQL에서는 배열로 저장

두 접근법 중에서 대부분의 경우 **자식이 부모를 참조하는 방식이 더 효과적**입니다.  
그렇게 느낀 이유를 예시와 함께 설명하겠습니다.

### 예시: 댓글 시스템에서의 부모-자식 관계
소셜 미디어 플랫폼에서 댓글과 대댓글(답글) 기능을 개발 중이라고 가정합시다.  
요구사항은 단순히 댓글을 나열하는 것이 아니라, 대댓글이 원래 댓글 아래에 계층적으로 표시되어야 하는 것이며 이 구조가 무한히 깊어질 수 있다는 것입니다.    

**해결 접근법: 부모-자식 관계 모델링**  
이 문제를 해결하기 위해서는 몇 가지 방법이 있을 수 있습니다.

1. **평면적 접근법**: 모든 댓글에 부모 댓글 ID 필드 추가
```json
댓글 테이블
- id: 1, content: "좋은 글이네요", parent_id: NULL (최상위 댓글)
- id: 2, content: "저도 동의합니다", parent_id: 1 (1번 댓글에 대한 답글)
- id: 3, content: "감사합니다", parent_id: 2 (2번 댓글에 대한 답글)
```
- 장점: 구현 간단, 직접적인 부모-자식 관계 표현
- 단점: 깊은 중첩 구조 조회 시 여러 번의 쿼리 필요

2. **경로 열거 접근법**: 각 댓글에 전체 경로 저장 (예: "1/5/12")
```json
댓글 테이블
- id: 1, content: "좋은 글이네요", path: "1" (최상위 댓글)
- id: 2, content: "저도 동의합니다", path: "1/2" (1번 댓글의 답글)
- id: 3, content: "감사합니다", path: "1/2/3" (2번 댓글의 답글)
```
- 장점: 전체 계층 구조를 한 번의 쿼리로 조회 가능
- 단점: 경로 문자열 처리 복잡, 부모 이동 시 모든 자식 경로 업데이트 필요

3. **중첩 집합 모델(Nested Set Model)**: 왼쪽/오른쪽 값으로 계층 표현
```json
댓글 테이블
- id: 1, content: "좋은 글이네요", left: 1, right: 6 (최상위 댓글)
- id: 2, content: "저도 동의합니다", left: 2, right: 5 (1번의 자식)
- id: 3, content: "감사합니다", left: 3, right: 4 (2번의 자식)
```
- 장점: 전체 트리 검색 효율적, 조상/자손 쿼리 빠름
- 단점: 구현 복잡, 삽입/삭제 시 많은 레코드 업데이트 필요


이 중에서 저는 **평면적 접근법(자식이 부모를 참조)**을 선택했습니다.  
이유는 실제 사용 패턴에서 2단계 이상의 중첩 댓글을 거의 작성하지 않는다는 점에서, 성능과 복잡성의 균형에서 단순성을 선택했기 때문입니다.  
물론 향후 더 복잡한 계층 구조가 필요하면 다른 접근법으로 쉽게 마이그레이션할 수 있는 구조이기도 했습니다.

이 데이터를 표현할 때, 자식이 부모 ID를 갖는 게 맞을까 부모가 자식 ID를 갖는 게 맞을까 고민을 했었고, 그 고민 속에서 배운 점을 서술하기 위해 기나긴 서론을 작성했네요.  

처음엔 자식이 부모 ID를 갖게 하고 싶었습니다. 이유는, 필터링이 쉬울 것 같아서..!  
사실 기본적인 댓글들이야 그냥 나열해도 되지만, 특별한 처리가 필요한 건 자식들이니까요.  
그렇게 생각하고 작업을 하던 도중 뭔가 이상한 낌새를 느끼고, 갈팡질팡하고 있던 찰나


![도움](/assets/img/blog/2025-04-02/help.jpg)

을 얻게 됩니다.

### 자식이 부모를 참조해야 하는 이유
는 다음과 같습니다.

1. **일대다 관계의 자연스러운 표현**
- 한 부모에 여러 자식이 존재할 수 있지만, 자식은 하나의 부모만 가짐
- 이는 데이터베이스의 외래 키 제약조건과 자연스럽게 맞음


2. **레코드 속성 판단**
- 자식이 부모를 참조할 때: 부모 ID가 있으면 자식, 없으면 부모
- 부모가 자식을 참조할 때: 자식 목록이 비어 있어도 부모일 수 있어서 판단 모호


3. **데이터 일관성**
- 자식이 부모를 참조하면 부모 삭제 시 무결성 제약조건으로 처리 가능
- 부모가 자식들을 참조하면 부모 삭제 시 자식 ID 목록의 유효성 검증 필요



## 결론
결론은 사실 [자식이 부모를 참조해야 하는 이유](#자식이-부모를-참조해야-하는-이유)만 잘 알아두시면, 나중에 저처럼 갈팡질팡 안 하실 거라는 이야기! 

읽어보니 꽤나 당연한 소리같죠? 그렇지만 언젠가 떠오를 때가 있으실 겁니다. (그러길,,)

여기까지. 안녕!