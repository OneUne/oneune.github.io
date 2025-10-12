---
layout: post
title: "작업하는 내 모습이 궁금해서, Auto Snapshot 만들기"
category: blog
tags: project
image:
  path: /assets/img/blog/2025-10-12/thumb.png
comments: true
---

나는 기록을 좋아한다.
그 날 어떤 일들을 했는지, 어떤 음식을 먹었는지, 어디에 돈을 썼는지, 어떤 생각을 했는지.
그저 흘려보내기보다는 매사 기록하는 걸 즐기는 편이다. 잘 까먹어서 그런가.

* toc
{:toc}

아무튼 그런 의미에서 타임랩스도 좋아하는데, 한창 집에서 운동할 땐 운동 기록을 타임랩스로 찍었다.  
집에서야 핸드폰 삼각대로 설치하고 스스로 운동하는 모습을 찍는 게 괜찮았는데,  
밖에서 작업 같은 거 하면서 내 모습을 찍기 위해 삼각대를 설치해 촬영하는 건.. 좀.. 부끄럽더라..ㅎ  

컴퓨터 화면 정도야 맥북 화면 녹화 켜두고 나중에 빨리 감기하면 대충 비슷할 거 같긴 했다.  
만, 맥 화면 녹화는.. 진짜.. 용량이 어마무시하다.  

## 영감의 출처

해서 좀 찾아봤는데, [이 분의 글](https://steemit.com/kr-dev/@kingori2/kjgug)이 딱 내가 찾던 내용인 것 같아서 해당 내용을 토대로 프로그램을 짰다.

해당 글의 작성자 분은 `ImageSnap`이라는 도구로 웹캠을 캡처하고 `Automator`로 자동화하셨는데,   
난 스크립트 하나로 다 처리하고 싶어서 아래와 같이 구성했다. 

## 다르게 간 부분

### 1. ImageSnap 대신 FFmpeg

`ImageSnap`은 macOS 웹캠 캡처 전용 도구인데, 나는 `FFmpeg`를 선택했다.

```bash
ffmpeg -f avfoundation -video_size 1280x720 -framerate 30 -i "0:" -vframes 1 -y cam.jpg
```

왜냐면:
- **범용성**: FFmpeg는 웹캠뿐만 아니라 화면 합성, 리사이징, 타임스탬프 추가 등 모든 작업을 하나의 도구로 처리할 수 있다
- **크로스 플랫폼**: 나중에 리눅스나 윈도우로 확장하기도 쉽다
- **파이프라인**: 이미지 처리 파이프라인을 구성하기 용이하다

### 2. Automator 대신 Node.js

반복 작업을 위해서 Automator를 쓰셨는데, script로도 반복이야 충분히 가능하니까 Node.js로 스크립트를 짰다. 코드 관리도 용이하고, 더 친숙하기도 해서.

```javascript
setInterval(() => {
  takeSnapshot();
}, 30_000); // 30초마다 실행
```

## 사용법

사용법은 간단하다.

```bash
# 스냅샷 자동 촬영 시작 (30초마다)
node auto-snapshot.js

# Ctrl+C로 종료하면 자동으로 타임랩스 영상 생성
```

종료 시그널(`SIGINT`)를 잡아서 자동으로 타임랩스를 만들도록 했다.

```javascript
process.on("SIGINT", async () => {
  console.log("\n\n🎬 영상 생성을 시작합니다...");
  await createVideoFromSnapshots();
  console.log("👋 프로그램 종료");
  process.exit();
});
```

FFmpeg로 이미지들을 하나의 영상으로 합친다:

```bash
ffmpeg -framerate 33 -pattern_type glob -i 'snapshots/2025-10-12/*.jpg' \
  -c:v libx264 -pix_fmt yuv420p -y timelapse.mp4
```

`-framerate 33`은 초당 33프레임이라는 뜻으로, 30초마다 찍은 사진이 약 0.03초씩 재생된다.

## 결과물

실제로 작업하면서 돌려봤는데, 생각보다 재밌다.
내가 어떤 일에 얼마나 시간을 쓰는지, 어떤 자세로 일하는지, 언제 자리를 비우는지 다 보인다.
몰랐는데, 표정이 꽤 다이나믹하다. 그리고 약간 집중하고 싶으면 눈을 가늘게 뜨는 습관이 있더라.
웃기다. 라식 수술도 했는데 왜.
<br/><br/>

![스냅샷 예시](/assets/img/blog/2025-10-12/expic.jpg)
이런 식으로 웹캠과 화면, 시간이 합성된 스냅샷이 찍힌다
{:.figcaption}

그리고 무엇보다 기록하기 위한 별도의 장치가 필요하지 않다는 점이 좋았다.  

## 개선할 점

- **macOS 전용**: 내가 맥북을 쓰기 때문에(ㅋㅋ) 오로지 맥 전용이다.
- **카메라 셔터음**: FFmpeg로 웹캠 캡처할 때마다 소리가 난다.

셔터음 문제가 좀 거슬리는데, `sudo nvram SystemAudioVolume=" "` 같은 걸로 시스템 볼륨을 꺼보려 했는데 딱히 안 먹더라. 크게 시간 쓰고 싶진 않아서 일단 넘어갔다.  

타임랩스 생성 후 원본 이미지를 자동으로 삭제하진 않았다. 타임랩스는 빠르게 지나가기 때문에 한장한장 보기엔 무리가 있기 때문이다. 그냥 작업 끝나고 사진도 쭉 돌려보면서 한 번 웃으셔라면서.

## 마치며

코드는 [GitHub](https://github.com/OneUne/snapshot-project)에 올려뒀으니, 관심 있으면 구경 오세요.

여기까지. 안녕!