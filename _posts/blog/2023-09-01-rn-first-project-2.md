---
layout: post
title: "React Native, Expo를 활용한 앱 만들기 (Feat. Nomad Coders) - Part 2. Components, API, Styling"
category: blog
tags: react-native weather-app
related_posts:
  - _posts/blog/2023-08-31-rn-first-project-1.md
  - _posts/blog/2023-09-05-rn-first-project-3.md
image:
  path: /assets/img/blog/2023-09-01/weather-app-design.png
comments: true
---

이런 앱을 만들어 보자.

- this unordered seed list will be replaced by the toc
  {:toc}

# 1. Components & Styling

Location API까지 붙인 전체 코드를 보고 싶다면 [여기](https://github.com/OneUne/NomadWeather/blob/56efbe6852b3f53771fe325b864897c21c059b35/App.js)를 클릭하자.

```javascript
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
```

react-native로부터 import한 View, Text 이런 것들은 Component이다.

- **Component란?** 소프트웨어 개발에서 재사용 가능한 부분 모듈 또는 요소. <u>React에서는 UI를 구축하기 위한 독립적인 단위</u>.

[Core Components and APIs](https://reactnative.dev/docs/components-and-apis)를 확인하면 React Native에서 제공하는 컴포넌트와 API를 확인할 수 있다.  
니콜라 선생님께서 말씀하시기를, React Native에서 이전에는 꽤나 많은 컴포넌트와 API를 제공하고 있었다고 한다.  
그러나 유지보수의 어려움으로 이제는 필수적인 부분들만 제공하고, 커뮤니티가 스스로 필요한 것들을 만들고 유지보수하게끔 변화했다고 한다.

우리의 멋진 플랫폼 EXPO는 React Native가 제공했었으나 이제는 안하는 Component나 API를 비롯하여, 아직도 있는 것(ex. StatusBar)도 보완하여 SDK를 제공하고 있다. [Expo SDK](https://docs.expo.dev/versions/latest/)  
expo-로 시작하는 친구들이 그 SDK로 부터 온 아이들이다.

이런 components들을 활용하여 화면을 구성하게 된다.  
이 앱의 디자인은 [Caroline](https://dribbble.com/shots/14717133-Weather-App-Concept#)의 Concept를 따른다.
![Weather App Design](/assets/img/blog/2023-09-01/weather-app-design.png)
강의 안 보고 만들어보고 싶어서 Weather App Concept라고 구글링했더니 Dribble에서 예쁜 디자인이 꽤나 많았다.  
강의에서 사용된 것도 Dribble에 있던 디자인이었다.  
근데 이거 이렇게 막써도 돼? 상업용 아니라서 괜찮은걸까?

```javascript
  return (
    <View style={styles.container}>
      <StatusBar style="auto"></StatusBar>
      <View style={styles.city}>
        <Text style={styles.cityName}>{city}</Text>
      </View>
      <ScrollView
        horizontal
        pagingEnabled
        indicatorStyle="white"
        // showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weather}
      >
        <View style={styles.day}>
          <Text style={styles.temp}>27</Text>
          <Text style={styles.description}>Sunny</Text>
        </View>
```

디자인을 보면 우린 옆으로 넘길 수 있는 기능이 필요하다.
이를 위해 **ScrollView**를 사용한다.  
이 친구를 사용하려면 style도 아니고 `ContentContainerStyle`이란 prop을 사용해야 한다.  
옆으로 넘길거니까 `horizontal`이라는 prop도 넣어주고, 화면을 끝까지 넘겼을 때 넘어갈 수 있도록 `pagingEnabled`도 명시해준다.

더 많은 prop을 보고 싶다면 [Doc](https://reactnative.dev/docs/scrollview) 참고.  
그 안에 View를 넣어주면 ScrollView 뚝딱.  
우린 View를 Full Screen으로 보는 게 목표이므로 style을 살펴보자.

```jsx
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  day: {
    flex: 1,
    alignItems: "center",
    width: SCREEN_WIDTH,
  },
  ...
```

width를 `SCREEN_WIDTH`로 설정했다.
style은 그냥 객체로 표현해도 되지만, `StyleSheet.create`를 사용하는 것을 추천한다.  
자동완성 기능이 있기 때문. style을 우리가 웹에서 쓰던 거 그대로 다 쓸 수 있는게 아니기 때문에 유용하다.  
flex를 사용하는데 display: flex를 명시하지 않는 이유는 View는 기본적으로 flex container이기 때문이다.

`Dimensions.get("window")`를 통해 width를 가져올 때 `{width, height}`로 둘 다 가져올 수도 있고, `width: SCREEN_WIDTH` 이런식으로 이름 짓기도 가능하다.  
`const SCREEN_WIDTH = Dimensions.get("window").width`도 물론 가능. 전자처럼 데려오는 건 **구조 분해 할당**이라고 ES6에서 도입된 기능이다.  
나 ES6에 대해서도 잘 모르나보다. 함 알아봐야겠군요.

다른 예시도 들어보자면

```jsx
const response = await Location.requestForegroundPermissionsAsync();
// response: {"canAskAgain": true, "expires": "never", "granted": true, "status": "granted"}
// 여기서 granted만 받아오려면 response.granted 할 게 아니라

const { granted } = await Location.requestForegroundPermissionsAsync();
// 와 같이 쓸 수 있다.

// {"coords": {"accuracy": 35, "altitude": 20... 이런 구조일 때는
const {coords:{accuraccy,altitude}}
```

근데 컴포넌트 하나하나에 다 style을 달아줘야 하는건가..  
class 마냥 day안에 Text Component 스타일링 정의하면 알아서 하위 컴포넌트에 적용되었으면 좋겠는데 - ! - !

# 2. API 활용하기

## 2.1 Location API

Location API를 활용하기 위해 우선 설치하자. `npx expo install expo-location`

- Location은 뭘 할 수 있을까? [Doc](https://docs.expo.dev/versions/latest/sdk/location/)
  - requestPermissions: 위치 얻어오려면 필수다. 사용자 동의.
  - getLastKnownPosition: 마지막 위치 확인
  - getCurrentPosition: 현재 위치 확인
  - watchPosition: 유저 이동 확인
  - geocode: 위, 경도 확인 (latitude, longitude)
  - reverseGeocode: 위,경도로 도시, 구역 알아내기 (city, district)
  - geoFacing: 유저가 특정 지역 벗어나면 알림

```jsx
import * as Location from "expo-location";

...

export default function App() {
  const getWeather = async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      setOk(false);
    }
    const {
      coords: { latitude, longitude },
    } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    const location = await Location.reverseGeocodeAsync(
      {
        latitude,
        longitude,
      },
      { useGoogleMaps: false }
    );
    setCity(location[0].city);
  };
  useEffect(() => {
    getWeather();
  });

```

Expo SDK 역시 강의 녹화 당시랑 지금이랑 좀 달라졌다.  
requestPermissions 대신 이제는 requestForegroundPermissionsAsync를 사용해야한다.  
Foreground는 내가 화면에 켜놨을 때, Background는 앱을 굳이 화면에 띄우지 않았을 때도 사용할 수 있는 것이다. 현재는 Foreground 먼저 받아야 Background를 받을 수 있다.  
getCurrentPositionAsync를 통해 위경도를 받고 reverseGeocodeAsync를 통해 도시를 알아냈다.

## 2.2 Weather API

Weather API는 [OpenWeather API](https://openweathermap.org/api)를 사용한다.  
우선 회원 가입하고 API Key를 받는다. Activate 되기 까지 시간이 좀 걸릴 수 있어서, 일단 가입.  
아무리 내가 Free plan을 사용할 거라지만 내 API Key는 소중하니까 env에 두려고 한다.

### React Native에서 .env 사용하는 법?

- `npm install react-native-dotenv --save-dev`
- .gitignore에 .env 추가하고 commit, push
- 그리고 나서 .env 생성 후
- bable.config.js에 이거 추가
  ```jsx
  plugins: [
        [
          "module:react-native-dotenv",
          {
            moduleName: "@env",
            path: ".env",
            blacklist: null,
            whitelist: null,
            safe: false,
            allowUndefined: true,
          },
        ],
      ],
  ```
- 그리고 App.js에서 `import { API_KEY } from '@env';`

강의와 달리 현재는 Free Plan으로 예보를 받으려면 [Call 5 day / 3 hour forecast data](https://openweathermap.org/forecast5#geo5) 으로 데이터를 받아 가공해서 써야 한다.

```jsx
fetch(
  `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`
)
  .then((resp) => resp.json())
  .then((data) => console.log(data))
  .catch((err) => console.log(err));
```

가볍게 fetch 하려는데 TypeError: Network request failed 가 떴다.  
혹시 몰라 url 그대로 Postman으로 get해봤더니 잘만 된다.  
앱 내에 fetch가 잘못됐나 싶어서 다른 url로 fetch해봤더니 그것도 잘 된다.  
console.log로 url 찍어보고, `도 지웠다가 다시 써보고 하니까 작동하더라.

### JSON 예쁘게 보는 법

터미널에서 예쁘게 보려면 `console.log(JSON.stringify(data, null, 2)))` 이렇게 stringify 해서 찍어주면 된다.  
어차피 get요청이니 fetch에 있는 url 그대로 브라우저에 넣고, 크롬일 경우 Json Viewer 같은 확장프로그램 깔면 예쁘게 볼 수 있다.
![Pretty Json](/assets/img/blog/2023-09-01/pretty-json.png)

temp가 296막 이렇게 나오길래 이건 화씨도 섭씨도 아니고 뭐야 그랬더니 Kelvin...! 절대온도다. 이 얼마만에 들어보는..  
우리네 계량법으로 보고싶어서 url에 `&units=metric&lang=kr` 추가해 줬다.  
날씨랑 관련된 description만 한글로 나오고 도시 이름은 한글 지원이 안 되는 구나..

암튼 이렇게 openweather API 에서도 data를 받아오는 데 성공했다.

다음 편에서는 Free Plan으로 받아온 데이터들을 어떻게 가공해서 사용했는지 설명한다.
