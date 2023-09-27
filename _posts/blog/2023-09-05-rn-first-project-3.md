---
layout: post
title: "React Native, Expo를 활용한 앱 만들기 - Part 3. OpenWeatherAPI Free Plan 데이터 가공하기"
category: blog
tags: react-native weather-app
related_posts:
  - _posts/blog/2023-08-31-rn-first-project-1.md
  - _posts/blog/2023-09-01-rn-first-project-2.md
image:
  path: /assets/img/blog/2023-09-05/thumb.gif
comments: true
---

Nomad Coders의 강의와 달리 현재는 Free Plan을 사용해 일기예보를 받으려면  
`Current Weather Data API`와 `5 Day / 3 Hour Forecast API`를 사용해 적절히 가공해야 한다.  
물론 그냥 8일치 예보 주는 One Call API 써도 하루 1,000 콜 까지는 무료다만 그냥 이게 더 재밌을 거 같아서,, ~

- this unordered seed list will be replaced by the toc
{:toc}

결과 코드를 보면서 글을 읽고 싶다면 [여기](https://github.com/OneUne/NomadWeather/tree/c070c0a7980be724a7fa17296d9f5f96cc3f2d53)를 클릭하자.

# 0. 이전 포스트와 달라진 코드 부분

1. 이전 포스트에서 언급했던대로 .env에 키를 정의하고 이를 import 하는 부분이 추가 되었다.
```jsx
import { API_KEY } from "@env";
```

2. react-native로부터 ActivityIndicator를 import해 데이터를 받아오기 전 loader를 표시하여 주었다.
```jsx
import { ActivityIndicator } from "react-native";
```

3. 한글 폰트가 영 안 예뻐서 [expo-google-fonts](https://docs.expo.dev/develop/user-interface/fonts/?redirected#use-a-google-font)를 이용해 새로운 폰트를 적용해주었다.

```jsx
import {
  useFonts,
  BlackHanSans_400Regular,
} from "@expo-google-fonts/black-han-sans";

export default function App() {
  let [fontsLoaded, fontError] = useFonts({
    BlackHanSans_400Regular,
  });
...
if (!fontsLoaded && !fontError) {
    return null;
  } else {
    return (
      <View style={styles.container}>
```

- 마음에 드는 폰트를 [Google Fonts](https://fonts.google.com/)에서 찾아 [expo의 패키지](https://github.com/expo/google-fonts/tree/master/font-packages)에서는 어떤 이름으로 관리하는지 확인한다음, 그 이름을 가지고 `npx expo install expo-font @expo-google-fonts/{폰트이름}` 해주면 된다. 나는 black-han-sans을 이용했다.

# 1. 데이터 받아오기

목표 디자인에서 사용하는 데이터는 다음과 같다.

> - 도시명
> - 날짜(요일, 월, 일)
> - 온도(현재, 최저, 최고)
> - 날씨 설명
> - 강수량
> - 풍속

도시명은 이미 Location API를 통해 받아왔으니, OpenWeather API를 통해 나머지 데이터를 받아오면 된다.

강의에서는 받아온 데이터를 days에 배열로 바로 넣었으나, 이번에는 Current Weater Data와 5 Day / 3 Hour Forecast 를 조합해서 days에 넣어야 하므로 데이터를
`{날짜: {온도:-, 설명:-, 강수량:-, ...}, 다른날짜: {...}}`
이런식으로 저장하려고 한다.

App.js 의 getWeather function에서 Current에서 먼저 데이터를 받아 가공하고, 이후 Forecast에서 데이터를 받아 가공하기로 했다.

**🤔 근데 가공이 왜 필요해? 왜 둘 다 써?**

> Forecast는 현 시점을 기준으로 3시간 단위의 정보를 준다.  
> 그럼 이걸 취합해서 최저 온도, 최고 온도, 적절한 강수량, 풍속 등을 구해야 하므로 가공이 필요하다.  
> 또한, Forecast가 조금은 예상한 바와 다르게 동작하기 때문이다.  
> 예를 들어 오늘이 9월 5일 UTC 6시라면, 00시의 정보부터 주는 것이 아니라 UTC 9시부터의 정보를 준다.  
> Current를 사용해야 하는 이유는 3시간 단위의 날씨 정보보다 실시간 날씨를 표현하기에 더 적합하기 때문이다.

```jsx
  const getWeather = async () => {
    ...
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`
    )
      .then((resp) => resp.json())
      .then((data) => {
        const updatedDays = processCurrentData(data, locale, setDays);
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`
        )
          .then((resp) => resp.json())
          .then((data) =>
            processForecastData(data, locale, updatedDays, setDays)
          )
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  };
```

React Native는 처음이라 새로 만들 process\*Data 함수 친구들을 어디다 위치 시켜야 하나 찾아보다가 utils 폴더 안 helpers.js 를 생성해 두 함수를 작성했다.  
cf.

- [React Native Project Structure: A Best Practices Guide](https://www.waldo.com/blog/react-native-project-structure)
- [Best Folder Structure for React Native Project](https://learn.habilelabs.io/best-folder-structure-for-react-native-project-a46405bdba7)

# 2. 데이터 가공하기 - processCurrentData

[Current Weather Data API](https://openweathermap.org/current#fields_json) [5 Day / 3 Hour Forecast API](https://openweathermap.org/forecast5#fields_JSON) API Doc을 찾아보면 어떻게 데이터를 보내주는 지 알 수 있다.

여기서 우리가 필요한 데이터는 Current 기준으로 weather.description, main.temp, main.temp_min, main.temp_max, wind.speed, rain.1h, dt 정도이다.  
이를 받아 days에 넣고 싶은 형태대로 넣어보자.

```js
export function processCurrentData(data, locale, setDays) {
  const {
    weather,
    main: { temp, temp_min, temp_max },
    wind: { speed },
    dt,
  } = data;

  const date = new Date(dt * 1000).toISOString().split("T")[0];
  const curWeather = {
    [date]: {
      temp: Math.floor(temp),
      temp_min: Math.floor(temp_min),
      temp_max: Math.floor(temp_max),
      wind_speed: speed,
      rainfall: data.rain ? data.rain["1h"] : 0,
      day: new Intl.DateTimeFormat(locale, {
        weekday: "long",
      }).format(dt * 1000),
      md: new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
      }).format(dt * 1000),
      desc: weather[0].description,
    },
  };
  setDays(curWeather);
  return curWeather;
}
```

weather은 배열이라 우선 weather을 받아오고, rain.1h의 경우는 비가 내리지 않으면 없을 수도 있어서 후에 data.rain? data.rain["1h"] : 0으로 처리했다.  
사실상 current weather의 temp_min, temp_max는 크게 의미가 없지만 구조 맞춰주려고 받아왔다.

setDays로 해당 데이터를 days에 넣고, return도 하는데 그 이유는 days만 사용한다면 updated된 days가 processForecastData에 제대로 전달되지 않기 때문이다.  
그래서 updatedDays로 데이터를 받아 이걸 processForcastData에 넘겨주었다.

근데 외않되? 챗지피티한테 물어봤더니 비동기적 특성과 클로저 때문이라는 답변을 들려줬다.  
(근데 클로저 때문 아니었음)

## 클로저?

클로저란 함수와 렉시컬 환경의 조합을 의미한다.  
함수가 생성될 당시의 외부 변수를 기억한다는 의미이며, 생성 이후에도 계속 접근 가능하다는 뜻이다.

- Lexical Environment(렉시컬 환경)? JS 엔진에서 변수와 스코프를 관리하는 내부 데이터 구조. 코드 실행 중에 변수 식별자와 그에 대응하는 값을 저장하며, 클로저, 스코프 체인 등 JS의 중요한 기능을 구현하는 데 사용된다. 함수 실행 컨텍스트와 관련이 있으며, 각 함수 호출은 자체 렉시컬 환경을 생성한다.

  - Java Script Engine(JS 엔진)? 코드를 해석하고 실행하는 소프트웨어. <small>eg. V8 of Chrome, JavaScroptCore of Safari, Nashorn of Java</small>
  - Lexical Scope(렉시컬 스코프)? 함수가 선언될 때 결정되는 변수의 스코프를 나타낸다. 함수의 호출 위치가 아닌 정의 위치에 따라 결정된다. 렉시컬 환경이 렉시컬 스코프를 구현하기 위한 도구로 사용된다.
  - Execution Context(실행 컨텍스트)? Lexical Environment의 상위 개념으로, 맨 처음 코드가 실행되었을 때 생성되는 Global Execution Context, 함수가 호출 될 때나 eval() 사용 시 생성되는 Execution Context 등을 일컫는다.

  {:.centered width="250"}
  ![JS Engine](/assets/img/blog/2023-09-05/js-engine.png){:width="250"}

  JS 엔진의 콜 스택에 쌓인다.  
  출처: https://m.blog.naver.com/dlaxodud2388/222655214381
  {:.figcaption}

클로저가 왜 문제라고 하는지 코드를 보면서 이해해보자.

```jsx
fetch(
  `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`
)
  .then((resp) => resp.json())
  .then((data) => processCurrentData(data, locale, setDays))
  .catch((err) => console.log(err));
fetch(
  `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`
)
  .then((resp) => resp.json())
  .then((data) => processForecastData(data, locale, days, setDays));
```

이렇게 하려고 한다면, 의도대로 작동할까?

그렇지 않다. 이건 fetch가 비동기 작업이기 때문이다.  
위의 fetch가 실행되고, 이후 작업이 완료되기 이전에 아래 fetch가 실행되기 때문이다. 즉, 작업의 순서를 보장할 수 없다.

```jsx
fetch(
  `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`
)
  .then((resp) => resp.json())
  .then((data) => {
    processCurrentData(data, locale, setDays);
    return fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`
    );
  })
  .then((resp) => resp.json())
  .then((data) => {
    processForecastData(data, locale, days, setDays);
  })
  .catch((err) => console.log(err));
```

아, 그럼 이렇게 하면 되겠네?  
그렇지 않다. 여기서 클로저 문제가 아님이 드러난다.  
분명 processCurrentData를 끝내고, fetch를 한 뒤 then에서 processForecastData에 days를 넘겨주므로 이때 생성될 렉시컬 환경에서의 days는 업데이트 된 상태여야 한다.

그럼 뭐가 문제야?

## setState는 비동기 방식으로 동작한다.

> React는 인지 성능(perceived performance)의 향상을 위해 setState() 함수의 실행을 미루거나 여러 컴포넌트를 일괄적으로 업데이트 할 수 있습니다. 즉, setState() 함수는 컴포넌트를 항상 즉각 업데이트하는 것은 아니라는 점을 기억해야 합니다.
>
> 이와 같은 특성으로 인해 setState() 함수를 호출하자마자 state 객체에 접근하는 것은 잠재적으로 문제의 원인이 될 수 있습니다.
>
> setCount() 함수가 언제나 가장 최신의 state 값을 사용하도록 보장하기 위해서는 다음 예제처럼 setCount() 함수를 호출할 때 state 객체 대신 함수를 인수로 전달해야만 합니다.

출처: http://www.tcpschool.com/react/react_data_state
{:.figcaption}

setState()를 한다고 해서 즉시 반영되지 않는다. setState()가 업데이트를 보장하는 것이 아니라, 업데이트 할 데이터를 [차후 배치할 큐](https://stackoverflow.com/questions/48563650/does-react-keep-the-order-for-state-updates)에 등록한 것이기 때문이다.  
업데이트를 보장하고 싶다면 `setAge(age+1)`이 아닌 `setAge(a => a+1)`과 같은 형태의 Functional Update(함수형 업데이트)를 해야 한다.  
무슨 차이가 있길래 Functional Update는 최신 상태를 보장할까? 비동기적으로 동작하는 게 아닌걸까?  
[React의 공식 문서](https://stackoverflow.com/questions/48563650/does-react-keep-the-order-for-state-updates)를 살펴보면, updater function을 사용할 경우 pending state, 즉, 실행이 되지는 않았지만 우리가 큐에 등록해 둔 데이터를 가져온다고 한다.  
예시에서처럼 바로 바로 업데이트를 할 거라면 함수형 업데이트만으로 충분했겠지만, processForecastData에서 업데이트 된 days의 데이터가 필요하므로 상태가 아닌, 데이터 자체를 넘겨주었다.

# 3. 데이터 가공하기 - processForecastData

```jsx
export function processForecastData(data, locale, days, setDays) {
  const dataByDate = new Map();
  const today = new Date(data.list[0].dt * 1000).toISOString().split("T")[0];

  for (let i of data.list) {
    const date = new Date(i.dt * 1000).toISOString().split("T")[0];
    const weatherObject = {
      temp: Math.floor(i.main.temp),
      wind_speed: i.wind.speed,
      rainfall: i.rain ? i.rain["3h"] : 0,
      day: new Intl.DateTimeFormat(locale, {
        weekday: "long",
      }).format(i.dt * 1000),
      md: new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
      }).format(i.dt * 1000),
      desc: i.weather[0].description,
    };
    dataByDate.set(
      date,
      dataByDate.get(date)
        ? [...dataByDate.get(date), weatherObject]
        : [weatherObject]
    );
  }

```

`dataByDate`라는 Map을 하나 만들어서 날짜를 키 값으로, 필요한 날씨 정보 객체를 배열 안에 넣은 것을 값으로 저장했다.

```jsx
  dataByDate.forEach((value, key) => {
    if (key === today) {
      let [temp_min, temp_max] = [days[today].temp_min, days[today].temp_max];
      for (i of value) {
        temp_min = Math.min(temp_min, i.temp);
        temp_max = Math.max(temp_max, i.temp);
      }
      setDays((prevDays) => ({
        ...prevDays,
        [today]: {
          ...prevDays[today],
          temp_min: temp_min,
          temp_max: temp_max,
        },
      }));
    }
```

그리고 해당 Map을 순회하면서 오늘일 경우와 아닐 경우를 나누어 처리해주었다.  
오늘 날씨의 경우 최저 온도, 최고 온도 정도만 수정하면 되기 때문이다.

```jsx
 else {
      const vlen = value.length;
      if (vlen > 4) {
        let [temp_min, temp_max] = [value[0].temp, value[0].temp];
        const descCounts = {};
        let [temp, wind_speed, rainfall] = [0, 0, 0];
        for (i of value) {
          temp_min = Math.min(temp_min, i.temp);
          temp_max = Math.max(temp_max, i.temp);
          temp += i.temp;
          wind_speed += i.wind_speed;
          rainfall += i.rainfall;
          const desc = i.desc;
          descCounts[desc] = (descCounts[desc] || 0) + 1;
        }

        const sortedDesc = Object.entries(descCounts).sort(
          (a, b) => b[1] - a[1]
        );

        setDays((prevDays) => ({
          ...prevDays,
          [key]: {
            temp: Math.floor(temp / vlen),
            temp_min: temp_min,
            temp_max: temp_max,
            wind_speed: (wind_speed / vlen).toFixed(2),
            rainfall: (rainfall / vlen).toFixed(2),
            day: value[0].day,
            md: value[0].md,
            desc: sortedDesc[0][0],
          },
        }));
      }
    }
  });
}
```

오늘이 아닌 다른 날에 대해서는 4개 이상의 즉, 12시간 이상의 날씨 기록이 있는 날짜만 받아오도록 했다. 어느 날의 날씨가 00-03시의 1 개의 기록만 있다면, 실제 최고 온도가 30도 이더라도, 새벽 기준의 최고 온도인 22도 정도로 기록될 수 있기 때문.

최저, 최고 온도는 Math.min,max 를 이용했고, 강수량과 풍속의 경우 모두 더해 평균 값을 구해 넣었다. desc는 최빈값으로 넣었다.

이렇게 구한 데이터를 렌더링한다면, 우리가 원하는 날씨 앱을 만들 수 있다.
