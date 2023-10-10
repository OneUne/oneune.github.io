---
layout: post
title: "React(JavaScript)에서 썸네일 생성하기 (Feat.비동기)"
category: blog
tags: react
image:
  path: /assets/img/blog/2023-09-18/thumb-thumb.gif
related_posts:
  - _posts/blog/2023-09-26-the-core-of-asynchronous.md
comments: true
---

엄청난 확대로 화질은 좀 깨졌지만,, 요렇게 썸네일을 만들고 선택하는 기능을 만들었습니다.

1. 
{:toc}

회사에서 동영상 플랫폼을 개발하기 시작하면서, 썸네일의 구현은 아무래도 필수적이었다.  
초기 요구사항에서는 동영상을 업로드하는 과정에서 썸네일을 보여줄 필요가 없었기 때문에 AWS Lambda에서 ffmpeg을 이용해 개발했었다.  
그러나 `동영상 업로드 시 썸네일을 보여주고, 여러 개 중 선택도 할 수 있게 하며, 선택한 썸네일을 저장해야 한다.` 로 요구사항이 바뀌며 썸네일 생성 기능을 프론트엔드로 데려왔다.

# React.js에서 어떻게 썸네일을 생성했나

동영상이 업로드 되면 해당 파일을 입력으로 하는 프레임 추출 [비동기 함수](#왜-프레임-추출은-비동기-함수여야만-하는가)를 실행시켰다.

`URL.createObjectURL()` 메소드를 사용하여 파일을 URL로 변환하고, 이 URL을 사용하여 HTML5의 \<video\> 요소를 생성해 비디오를 로드하고 조작했다.

비디오를 조작하는 데 필요한 metadata 중 duration(length)이 Infinity로 return 되는 크롬 버그가 있어 이에 대한 [조치](https://stackoverflow.com/questions/38443084/how-can-i-add-predefined-length-to-audio-recorded-from-mediarecorder-in-chrome/39971175#39971175)를 취해야 했다.

이미지를 그려내기 위해 canvas 요소를 생성하고, 2D 그래픽 컨텍스트(context)를 얻었다.  
개발 당시 다들 어떻게 개발하나 궁금해서 React 커뮤니티에도 물어봤었는데 canvas 사용이 대다수의 의견이었다.  
비디오의 원래 너비와 높이를 이용해 캔버스에 원하는 너비 및 높이를 정의한 후, 반복문을 돌려 원하는 때마다 extractFrame 함수를 호출하여 프레임을 추출하고 캔버스에 그리는 식으로 구현했다.

- 캔버스 크기를 원래 비디오 크기와 같게 지정해버리면 추출 프로세스가 굉장히 오래걸릴 수도 있다. 필요한 썸네일 크기에 맞게 최적화 해야 한다.

extractFrame에서 특정 프레임을 가져오는 것은 seeked 이벤트를 활용했다.  
가져온 프레임을 캔버스에 그려 이미지 데이터 URL로 변환 후 배열에 추가하여 모든 프레임이 추출되면 배열을 넘겨주면 끝이다.

# 왜 프레임 추출은 비동기 함수여야만 하는가

동기 방식으로 프로그래밍을 하면 간단하고 직관적이기에 프로그래머에겐 편리할 수 있지만, 사용자에겐 불편할 수 있다.  
사용자가 접속해 있는 화면 하나에는 대개 여러 개의 작업이 이루어지기 때문에, 오래 걸리는 작업의 경우 비동기로 처리해야만 한다.

예를 들어, 애플리케이션 상에서 서버에 요청을 보낸 후 응답을 기다려야 하는 작업이나 썸네일 생성을 위한 프레임 추출과 같은 시간이 오래 걸리는 작업 등이 여러 개 있을 때 사용자는 하나하나 전부 다 기다려야만 하기 때문이다.

그 작업이 눈 앞에 보이지 않는 사용자 입장에선 영문도 모르고 그저 앱이 멈춰있는 것처럼 보인다.

{:.centered}
![Weather App](/assets/img/blog/2023-09-18/weather-app.png){:width="200"}

예시로 이 앱을 실행했다고 가정해보자.  
내가 이 앱을 실행하면, 이 앱은 아래와 같이 동작한다.

1. 나의 위치 정보를 받아온다.
2. 위치에 따른 오늘 날씨 정보를 받아온다.
3. 위치에 따른 미래 날씨 정보를 받아온다.

여기서 내가 현재 지역의 날씨가 궁금한 게 아니어서 검색 버튼을 바로 누르고 싶은데, 이 앱이 모든 정보를 받아오기 전까지 내가 검색 버튼을 못 누르게 한다면 꽤나 답답할 것이다.  
또는, 나는 다른 날짜의 날씨는 관심 없고 오늘 날씨만 보고 싶은데, 미래의 날씨까지 전부 기다렸다가 오늘 날씨를 볼 수 있다면 이또한 답답할 것이다.

그러므로 우리는 메인 스레드<sup>\*</sup>(보이는 곳)에서 **브라우저의 응답성**을 유지하며 백그라운드(보이지 않는 곳)에서 비동기 작업을 수행해야 하는 것이다.

> **<sup>\*</sup>스레드란?**
>
> - 하나의 프로그램이 돌아가고 있는 상태를 <b>프로세스</b>라 부르는데, 그 안에서 메모리를 공유하며 더 작은 실행 단위 개념으로 나뉘어지는 것이 <b>스레드</b>
> - 코드에서의 스레드는 <b>코드가 실행되는 하나의 흐름</b>
> - 하나의 프로그램에서 동시에 하나의 코드만 실행할 수 있음을 나타내는 말이 <b>싱글 스레드</b>

# 여기서 비동기는 언제 사용됐는가

프레임 추출을 완료하고 설정하는 것 역시 비동기로 작업되지만, 프레임 추출하는 작업 내에서도 아래와 같은 비동기 작업이 필요하다.

1. video.currentTime을 이동한 후 seeked event가 발생하면, 그때의 프레임을 추출 해야 하므로 seeked event가 발생할 때까지 기다릴 때
2. 순차적으로 프레임을 추출해야 하므로 하나의 프레임 추출이 끝날 때까지 기다릴 때

```jsx
async function extractAllFramesFromVideo(file) {
  ...

  async function extractFrame(currentTime) {
    let seekResolve
    video.addEventListener("seeked", () => seekResolve())
    video.currentTime = i
    await new Promise((r) => (seekResolve = r))
  ...
  }

  for (let i = 0; i < video.duration; i++) {
    await extractFrame(i)
  }
```

대략 이런 형태로 구성된다.

> 위 비동기 동작에 대해 제대로 이해되지 않는다면,
> <a class="heading flip-title" href="/blog/2023-09-26-the-core-of-asynchronous/">JavaScript의 비동기에 대해 당신이 알아야 할 필수 요소: Promise, Async, Await, Event Loop</a>을 참고하길 바란다.
> 당시 자바스크립트에서의 비동기 프로그래밍에 대한 개념이 제대로 잡혀있지 않아 공부 했던 기록을 위 글에 남겼다.

여기서 주의해야할 점은 seekResolve의 위치이다.  
하나의 프레임만 추출하는 함수를 만든 후 모든 프레임을 추출하는 함수로 바꾸면서 프레임 추출하는 부분을 따로 extractFrame으로 분리했는데, `let seekResolve`를 extractFrame에 포함 시키지 않는다면 `Function declared in a loop contains unsafe references to variable(s) 'seekResolve'.`을 만나게 된다.

해당 에러는 ESLint 룰 중에 [no-loop-func](https://eslint.org/docs/latest/rules/no-loop-func) 이라는 rule을 어겨서 그런건데, 반복문 안에서 예기치 못하게 동작할만한 변수를 참조하는 함수가 선언되는 것을 방지하는 룰이다.  
이때 콜백함수로 전달해주는 `() => seekResolve()`와 같은 것도 함수 선언이다.

`seekResolve`가 함수 밖에 위치한다면, 모든 이벤트 핸들러에서 이를 공유하게 된다.  
예를 들어, extractFrame(a)에 대해 resolve가 돼버린 것이 extractFrame(b)에도 영향을 미칠 수 있다.  
즉, 각 seeked 이벤트와 resolve가 적절히 연결되지 않아 예상한대로 동작하지 않는 것이다.  
그러므로 각 반복이 자신의 `seekResolve`를 갖도록 하는 것은 중요하다.
