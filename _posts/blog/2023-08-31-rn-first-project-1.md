---
layout: post
title: "React Native, Expo를 활용한 앱 만들기 (Feat. Nomad Coders) - Part 1. Set Up & Create an APP"
category: blog
tags: react-native weather-app
related_posts:
  - _posts/blog/2023-09-01-rn-first-project-2.md
  - _posts/blog/2023-09-05-rn-first-project-3.md
comments: true
---

일을 쉬게 된 김에 앱이나 하나 만들어볼까 해서 시작하게 된 프로젝트<br>
주로 웹 개발을 하는 터라, 앱과 관련된 경험이라곤 이전 회사에서 복잡한 구조의 Android App을 간소화하는 작업 정도뿐이었다.<br>
익숙치 않아서 그런지, 앱 개발의 특성인지, 안드로이드 앱 개발 경험은 썩 유쾌하지 않았다.<br>
그으런데 React로 앱을 만들 수 있다? 냅다 해봐야지.<br>
<br>
마침 Nomad Coders에 **[왕초보를 위한 React Native 101](https://nomadcoders.co/react-native-for-beginners/lobby)** 이란 무료 강의가 오픈되어 있었다.<br>
뭔가를 새로 시작할 때는 이런식으로 강의를 찾아보는 걸 선호하는 편인데, <br>

> 1. 따라하며 빠른 시작이 가능하다.
> 2. 있으면 좋은 툴이나 해당 언어/프레임워크만의 특성들을 바로 알 수 있다. (ex. Expo, Expo SDK, Community)

없으면 맨땅에 헤딩 당근 해야겠지만, 있는데 외 활용 않헤? <br>
빠르게 필요한 최소한의 정보들을 얻기엔 충분하다고 생각한다.

- this unordered seed list will be replaced by the toc
{:toc}

# 1. Set Up

강의에서는 초기 세팅의 번거로움을 없애고 빠른 시작을 하기 위해 **Expo**를 사용한다. Expo를 사용함으로써 Native 앱 개발 시 필요한 Xcode나 Android Studio의 설치, 설정, 에뮬레이터 등을 신경쓰지 않고 개발을 시작할 수 있다. Expo는 무려 React Native 공홈에서도 사용되는 아주 멋진 플랫폼이라면서~

- node.js 필요하다. 터미널에 `node -v` 해서 14 이상 version이 필요하다. Expo의 Recommend는 LTS releases이다. [참고](https://docs.expo.dev/get-started/installation/)
- Expo CLI 설치하자. `npm install —global expo-cli`
  - Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules/expo-cli’
    - 에러를 맞닥뜨렸다. npm 공식문서에 따른 permission issues를 피하는 최고의방법은 nvm을 사용해 다시 npm을 설치하는 것이다. [참고](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)
      - `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash`
      - `command -v nvm`
      - `nvm install 18, nvm use 18`
    - 이렇게 해결했다.
- 맥을 사용한다면, watchman을 설치해야한다. `brew update`, `brew install watchman`
- 앱스토어에서 `expo go` 를 다운로드한다.

## 셋업하며 주워들은 React Native란 무엇인가

나는 React로 앱을 만든다길래 웹뷰인가? 했는데 React Native는 Native 앱을 만드는 프레임워크였다. <br>
React Native가 iOS / Android code 로 번역된다길래 컴파일러같은 느낌인가 했더니,<br>
React Native는 **브릿지**란 개념을 사용하며 이는 네이티브 환경에 적합한 네이티브 컴포넌트를 생성하는 것이라고 한다.<br>
![How Does React Native Work](/assets/img/blog/2023-08-31/how-does-react-native-work.png)

# 2. Create an App

- [Expo Docs - create a project](https://docs.expo.dev/get-started/create-a-project/)
- 강의에서 나온대로 `expo init first-rn-app` 했더니
  WARNING: The legacy expo-cli does not support Node +17. 을 만났다. 어느덧 legacy expo-cli가 있어버리고 ~ - 요즘은 `npx create-expo-app frist-rn-app` 이렇게 해줘야 한다. - `cd first-rn-app` - `code .` - 이건 내가 위치한 곳에서 vscode 여는 건데, vscode에서 cmd+shift+p 눌러서 Install 'code' command in PATH 해주면 가능하다. - 또또 에러. eacces permission error <br>—> usr/local/bin에서 code삭제하고 다시 install하면 됨.
- and then, just `npm start`!
- Expo 앱에서 보려면 컴퓨터와 핸드폰이 같은 와이파이 연결되어 있어야 한다.

이렇게 하면 앱 개발 세팅과 생성까지 완료다.
