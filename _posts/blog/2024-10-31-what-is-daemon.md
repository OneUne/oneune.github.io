---
layout: post
title: "데몬(Daemon)"
category: blog
tags: etc
image:
  path: /assets/img/blog/2024-10-31/thumb.png
comments: true
---

Demon이 아니라, Daemon 입니다.  
데몬(Daemon)은 유닉스 계열 운영체제<sup>*</sup>에서 중요한 역할을 담당하는 백그라운드 프로세스입니다.  
이 글에서는 데몬이 무엇인지, 어떤 특징이 있는지, 그리고 실제로 어떻게 사용되는지 알아보겠습니다.

<small><sup>*</sup> 윈도우에도 있는데 거긴 데몬이 아니라 서비스(Services)라고 부릅니다.</small>

* toc
{:toc}


## 데몬이란?

데몬은 <u>사용자의 직접적인 제어 없이</u> 백그라운드에서 실행되는 프로세스를 말합니다.  
사실 저는 데몬을 그냥 백그라운드에서 실행되는 프로그램 정도로 생각했는데, 그렇게 되면 맥 유저가 흔히 사용하는 Maccy, Spectacle과 같은 앱들도 데몬이라고 할 수 있잖아요.  
<small>(아님) 저건 백그라운드 앱이라고 부른답니다.</small>  
이런 지점에서 시작된 글입니다.

일반 프로그램과는 달리, 데몬은 시스템 시작부터 종료까지 계속해서 실행되며 시스템 서비스를 제공하는 역할을 합니다.

### 데몬의 특징

1. **사용자 상호작용 없음**
   - 터미널이나 GUI 없이 동작
   - 백그라운드에서만 실행
   - 입력을 기다리지 않음

2. **독특한 수명주기**
   - 시스템 시작부터 종료까지 계속 실행
   - 예기치 않게 종료되면 자동으로 재시작
   - 사용자 로그아웃해도 계속 실행

3. **효율적인 리소스 관리**
   - 최소한의 리소스 사용
   - 일반 프로그램보다 낮은 우선순위
   - 최적화된 메모리 사용

## 주요 시스템 데몬 예시
뒤에 d가 붙은 친구들이 데몬이구나, 생각하시면 됩니다.

### 1. 네트워크 관련 데몬
- **sshd**: SSH 원격 접속 서비스
- **named (bind)**: DNS 서비스
  - macOS는 기본적으로 bind 대신 mDNSResponder를 사용합니다.
    - termianl에 ```ps aux | grep mDNSResponder```을 입력해보면 아래와 같은 프로세스가 실행됨을 확인할 수 있어요.
![mDNSResponder processes](/assets/img/blog/2024-10-31/mDNSResponder.png)
    - 그럼 얘가 뭘 하는 친구냐
      - 프린터 연결할 때 자동으로 프린터 찾기
      - AirDrop으로 파일 전송할 때 주변 기기 찾기
      - Apple TV로 화면 미러링할 때 기기 찾기
      - 같은 네트워크의 Mac끼리 파일 공유
   - 이외에도 macOS의 주요 시스템 데몬으로는 Spotlight(mds), Time Machine(backupd), iCloud 데몬(bird) 등이 있습니다.
      - 엥 Spotlight는 UI가 있는데? 데몬의 특징은 GUI가 없다며?
         - UI는 또 별도의 프로세스로 돌아갑니다. 
- **httpd**: 웹 서버 서비스

### 2. 데이터베이스 데몬
- **mysqld**: MySQL 데이터베이스 서비스
- **mongod**: MongoDB 데이터베이스 서비스

### 3. 시스템 관리 데몬
- **crond**: 예약 작업 실행
- **cupsd**: 프린터 스풀러 서비스
- **syslogd**: 시스템 로그 관리

## macOS에서 데몬 관리하기

### 데몬 확인 방법

```bash
# 실행 중인 모든 데몬 목록 보기
launchctl list

# 시스템 데몬 설정 파일 위치 확인
ls /Library/LaunchDaemons/
ls /System/Library/LaunchDaemons/

# 프로세스 목록에서 데몬 찾기
ps aux | grep daemon

# 네트워크 연결 확인
lsof -i -P | grep LISTEN
```

### 데몬 설정 파일 위치
- 시스템 전체: `/Library/LaunchDaemons/`
- Apple 시스템: `/System/Library/LaunchDaemons/`
- 사용자 단위: `~/Library/LaunchAgents/`

## 일반 프로그램과 데몬의 차이점

1. **오류 처리**
   - 일반 프로그램: 오류 발생 시 종료
   - 데몬: 오류 발생해도 계속 실행

2. **로깅**
   - 일반 프로그램: 콘솔에 출력
   - 데몬: 시스템 로그에 기록

3. **시그널 처리**
   - 일반 프로그램: 기본 시그널 처리
   - 데몬: 시스템 시그널 처리 (종료, 재시작 등)

## 데몬 사용 사례

### 1. 로그 모니터링
- 시스템 로그 파일 감시
- 오류 발생 시 알림 전송
- 로그 분석 및 보고  

이 부분에서 저는 좀 헷갈렸는데, 왜냐면 이 정도는 일반 서버에서도 하잖아요. 로그기록 하는 것: 데몬 이 아니라 로그기록을 할 수 있는 것: 데몬, 서버 정도로 이해하면 좋을 것 같습니다.  
일반 서버에서 데몬을 활용한 위와 같은 작업을 하려면 PM2나 systemd 같은 데몬 매니저를 사용한다네요.

### 2. 백업 서비스
- 주기적인 파일 백업
- 증분 백업 관리
- 백업 로그 유지

### 3. API 모니터링
- 웹 서비스 상태 확인
- 응답 시간 모니터링
- 장애 발생 시 알림

## 결론

사용자 개입 없이 백그라운드에서 지속적으로 실행되면서 시스템의 핵심 서비스를 제공하는 데몬이 필요할 때 생각나시면 좋겠습니다. 안녕