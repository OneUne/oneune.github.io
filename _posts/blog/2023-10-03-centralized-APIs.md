---
layout: post
title: "Fetch 말고 Axios(Feat.Refresh Token, Context)"
category: blog
tags: react
image:
  path: /assets/img/blog/2023-10-03/thumb.jpeg
comments: true
---

Refresh Token을 사용하기 위해서는 요청들이 한 곳에서 관리되어야 했다.  
여기저기 산재되어 있는 fetch들을 Axios를 사용해 싹 바꿔본 후기.  

* toc
{:toc}

# 1. Axios가 뭔데?
Axios는 JavaScript를 위한 강력한 HTTP 클라이언트 라이브러리 중 하나이다.   
간편한 HTTP 요청(GET, POST, PUT, DELETE)을 생성할 수 있고, Promise 기반이기 때문에 비동기 작업을 효율적으로 처리할 수 있다.   
  
> ? 그건 fetch도 잖아요  

맞다.   
  
간단한 HTTP 요청을 처리해야한다면 fetch를 사용해도 되지만, 모든 요청에 동일한 설정(eg. baseURL, headers, etc)을 적용해야 한다든지, 에러가 발생했을 때 동일한 처리가 필요하다든지, 이런 **중앙화된 관리**를 하려면 axios를 사용해야 한다.  
<small>cf. HTTP 요청을 처리하는 또다른 JavaScript 라이브러리로 Superagent가 있다만, 더 많이 사용되고 더 자주 업데이트 되는 Axios를 골랐다.</small>

뿐만 아니라 axios를 사용하면 자동으로 **JSON 파싱**도 해주고, 보다 **간결한 문법**으로 요청들을 처리할 수 있다.  

나의 경우에는 <u>에러가 발생했을 때 동일한 처리가 필요</u>해서 axios를 도입하게 되었다.  
그 김에 baseURL이나 headers도 공통으로 설정해주며 앱 여기저기서 사용하던 fetch들을 axios instance를 활용해 전부 바꿔보았다.

# 2. Axios를 활용해 토큰 재발급 받기

axios를 활용해서 토큰을 재발급 받는 프로세스를 구현하려면,

**1.axios instance를 생성하고**

```jsx
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://api.example.com',
  headers: {
    "Content-Type": "application/json",
    'Authorization': `Bearer ${accessToken}`,
  }
});
```

**2.HTTP interceptor를 정의해야 한다.**

```jsx
instance.interceptors.request.use(
  async (config) => {
    const expirationTime = new Date(localStorage.getItem('expirationTime'));
    if (expirationTime && expirationTime < new Date()) {
      const newAccessToken = await refreshToken();
      config.headers.Authorization = `Bearer ${newAccessToken}`;
      localStorage.setItem('accessToken', newAccessToken);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await axios.post('https://auth.example.com/token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });
  const { access_token } = response.data;
  const expirationTime = new Date();
  expirationTime.setSeconds(expirationTime.getSeconds() + response.data.expires_in);
  localStorage.setItem('accessToken', access_token);
  localStorage.setItem('expirationTime', expirationTime.getTime());
  return access_token;
}
```

위 코드는 요청을 보내기 전에 토큰의 만료 시간을 확인하고 만료되었다면 refreshToken을 이용해 재발급 받는 예시이다.  

실제로 사용하기 위해서는 고려해야할 것들이 조금 더 있다.

> 첫째, [이 Instance를 어떻게 모든 컴포넌트에서 사용할 것인가](#3-axios-instance를-모든-컴포넌트에서-사용하는-방법)  
> 둘째, [토큰 재발급을 진행하는 중 생성된 또다른 요청에 대해 어떻게 처리할 것인가](#4-토큰-재발급-중-생성된-요청에-대한-처리)


# 3. Axios Instance를 모든 컴포넌트에서 사용하는 방법
우리가 AutoRefreshToken라는 function에 인스턴스와 인터셉터를 정의했다고 하자.  

그럼 이 인스턴스를 사용해 요청을 보내기 위해서는 컴포넌트마다 다 패스해주거나,  
요청이 필요한 컴포넌트마다 가서 AutoRefreshToken을 import하고, instance(이하 apiClient)를 이렇게 받아와 써야할 것만 같다.  

```jsx
useEffect(() => {
    if (accessToken) {
      setApiClient(
        <AutoRefreshToken accessToken={accessToken} setAccessToken={setAccessToken} />
      );
    }
  }, [accessToken]);
```

좀 더 간단한 방법은 없을까?  

있다.

## Context

React에는 [Context](https://react.dev/learn/passing-data-deeply-with-context)라는 게 있고, 하위 컴포넌트에서 props를 통해 일일이 넘겨주지 않아도 데이터를 공유할 수 있게 해준다.  
무려 React 공식 문서에 useState, useEffect와 함께 기본 Hook으로 명시되어 있는 useContext를 이용해 사용할 수 있다.  
이 친구는 하위 컴포넌트 Depth가 깊을 때 특히 유용한데,

```jsx
import React, { useState } from 'react';

function GrandchildComponent({ message }) {
  return <div>{message}</div>;
}

function ChildComponent({ message }) {
  return <GrandchildComponent message={message} />;
}

function ParentComponent({ message }) {
  return <ChildComponent message={message} />;
}

function App() {
  const [message, setMessage] = useState('Hello from the top level!');

  const changeMessage = () => {
    setMessage('Updated message from the top level!');
  };

  return (
    <div className="App">
      <h1>Deep Component Tree Example</h1>
      <button onClick={changeMessage}>Change Message</button>
      <ParentComponent message={message} />
    </div>
  );
}

export default App;
```

이런 코드가 있을 때 GrandchildComponent에서 메세지를 나타내기 위해서 ParentComponene, ChildComponent에 Props로 넘겨 주어야만 가능했던 것을, 

```jsx
import React from 'react';
import { MessageProvider, useMessage } from './MessageContext';

function GrandchildComponent() {
  const { message } = useMessage();
  return <div>{message}</div>;
}

function ChildComponent() {
  return <GrandchildComponent />;
}

function ParentComponent() {
  return <ChildComponent />;
}

function App() {
  ...
  return (
    <MessageProvider>
      <div className="App">
        <h1>Deep Component Tree Example</h1>
        <button onClick={changeMessage}>Change Message</button>
        <ParentComponent />
      </div>
    </MessageProvider>
  );
}

export default App;
```

이런식으로 필요한 데에서만 쓸 수 있게 해주기 때문이다.  
여기서 봤던 것처럼 불필요하게 중간 단계의 컴포넌트에도 Props를 넘겨줘야 하는 문제를 **Prop Drilling**이라고 부르고,  
이를 해결하기 위해 Contex뿐만 아니라 Redux나 MobX와 같은 상태 관리 도구가 많이 사용된다.  
Context가 아닌 Redux를 사용하면 순수함수로만 변경이 가능하고 예측 가능한 상태 관리가 가능하며 Redux Dev Tool로 디버깅도 유용하다는 장점이 있으나, 현재 애플리케이션의 규모가 크지 않고 데이터 흐름이 복잡하지 않아 여기서는 Context를 사용하고자 한다.  
  
  
Context를 사용하기 위해 첫번째로 해야할 일은 Context를 생성하는 것이다.  

```jsx
import { createContext } from "react"

export const AuthContext = createContext(1)
```

간단하다.  

이를 다른 컴포넌트에서 사용하려면

```jsx
import React, { useEffect } from "react"
```
아마 이 정도 import 되어있던 구문에

```jsx
import React, { useEffect, useContext } from "react"
import { AuthContext } from "../AutoRefreshToken"

const contextValue = useContext(AuthContext)
```
이 정도 추가해서 사용해주면 된다.  
이러면 어디서든 contextValue에 우리가 설정해줬던 default 값인 1이 들어가고, 이를 사용할 수 있게 된다.  

여기다 우리가 생성한 axios instance인 apiClient를 전달하려면 contetxt를 제공(provide)해줘야 한다.  

```jsx
import { createContext } from "react"
import axios from "axios"

export const AuthContext = createContext()

export function AuthProvider({ children }) {
	const apiClient = axios.create({
		baseURL: "https://api.example.com",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
	})

	apiClient.interceptors.request.use(
		async (config) => {
			const expirationTime = new Date(localStorage.getItem("expirationTime"))
			if (expirationTime && expirationTime < new Date()) {
				const newAccessToken = await refreshToken()
				config.headers.Authorization = `Bearer ${newAccessToken}`
				localStorage.setItem("accessToken", newAccessToken)
			}
			return config
		},
		(error) => {
			return Promise.reject(error)
		}
	)

	async function refreshToken() {
		const refreshToken = localStorage.getItem("refreshToken")
		const response = await axios.post("https://auth.example.com/token", {
			grant_type: "refresh_token",
			refresh_token: refreshToken,
		})
		const { access_token } = response.data
		const expirationTime = new Date()
		expirationTime.setSeconds(
			expirationTime.getSeconds() + response.data.expires_in
		)
		localStorage.setItem("accessToken", access_token)
		localStorage.setItem("expirationTime", expirationTime.getTime())
		return access_token
	}

	return (
		<AuthContext.Provider value={apiClient}>{children}</AuthContext.Provider>
	)
}
```

이런식으로 AuthProvider를 따로 떼서 얘가 AuthContext.Provider와 하위 컴포넌트를 렌더링하게 하고,  
우리가 앱을 렌더링하는 곳(아마도 App.js)에서 최상위 컴포넌트로 \<AuthProvider\>를 집어넣어주면 apiClient를 하위 컴포넌트 어디서나 사용할 수 있게 된다.  

# 4. 토큰 재발급 중 생성된 요청에 대한 처리
위 예시에서는 요청을 보내기 전 토큰 만료 시간을 확인해서 재발급했었으나,  
이번에는 만료된 요청이 보내져 401이 응답으로 왔을 때 에러 처리로 재발급하는 예시를 가져왔다.  

```jsx
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      const originalConfig = error.config
      //error.config.headers.authorizationToken = `Bearer ${newAccessToken}` 이렇게 사용하는 것은 config object가 immutable해 불가능하다.
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const response = await apiClient.post(
            `/auth/refresh-token`,
            {
              refreshToken: refreshToken,
            }
          )
          if (response && response.code === 201) {
            accessToken = response.accesstoken
            refreshToken = response.refreshtoken

            sessionStorage.setItem("accessToken", accessToken)
            sessionStorage.setItem("refreshToken", refreshToken)
            originalConfig.headers.authorizationToken = `Bearer ${accessToken}`

            failedRequests.forEach((f) => f(accessToken))
            failedRequests = []

            return apiClient.request(originalConfig)
          } else {
            window.location.href = "/login"
          }
        } catch (refreshError) {
          console.error("Error refreshing access token:", refreshError)
          window.location.href = "/login"
          throw refreshError
        } finally {
          isRefreshing = false
        }
      } else {
        const retryOriginalRequest = new Promise((resolve) => {
          failedRequests.push((token) => {
            originalConfig.headers.authorizationToken = `Bearer ${token}`
            resolve(apiClient.request(originalConfig))
          })
        })

        return retryOriginalRequest
      }
    } else if (error.response.status === 403) {
      window.location.href = "/login"
    }
  }
)
```


토큰 재발급 중 생성된 요청에 대한 처리를 위해 재발급이 되고 있는 상태를 `isRefreshing`이라는 변수를 통해 설정했다.  

이 처리는 다음과 같은 이유로 필요하다.  
> 만료된 토큰 `a`와 함께 보내진 요청 A가 `a'` 라는 refresh token과 함께 재발급되던 중, 만료된 토큰 `a`로 요청 B가 들어오고 이미 재발급 받은 토큰 `b`, `b'`가 있을 때 `a'`로 요청 B를 위한 토큰을 재발급하려면 이미 사용된 refresh token으로 토큰 재발급이 되지 않는다. 그럼 다시 401.. infinite loop에 빠지게 된다.  

그래서 `isRefreshing`이 `true`이면 그때 생성된 다른 요청들은 재발급이 완료되면 그 토큰과 함께 실행할 수 있도록 failedRequests array에 Promise로 넣어주어 해결하려고 했다.  

이 부분이 나는 좀 어려웠었는데, Promise와 배열 그리고 외부 변수를 어떻게 조합해야하는지가 생소했다.  

<u>정답은</u>`failedRequests`<u>에 Promise 그 자체를 넣는 것이 아니라, token(외부 변수)을 받아 Promise를 resolve하는 <b>함수</b>를 넣는 것이었다.</u>  
<small>정답을 찾기 전까진 영 이해가 안되는 것 투성이었는데,,, 찾고 나니 이제야 Promise를 제대로 이해하게 됐구나 싶어 뿌듯했다.</small>

그리고 그 Promise를 return 해 얘가 `failedRequests.forEach((f) => f(accessToken))`를 통해 resolve될 때 apiClient.request(originlConfig)로 실패했던 요청을 다시 실행하도록 해야 했다.  
> 기본적으로 Axios의 interceptors.response 핸들러 함수는 요청에 대한 응답을 처리하고 Promise를 반환한다. 이 Promise는 응답을 완료하고 해당 응답 객체를 반환하거나, 오류를 처리하고 다른 Promise를 반환하는 데 사용된다. 여기서 retryOriginalRequest는 이전에 실패한 요청을 재시도하기 위한 Promise이며 이를 반환함으로써, 현재 실패한 요청을 Axios에게 "다시 시도해야 한다"고 알려주는 것이다.

# 5. Fetch 말고 Axios 사용하기
위에서 구현한 걸 토대로 apiClient를 사용해 요청을 보내주기만 하면 된다.  

```jsx
const getData = () => {
  fetch(`${BASE_URL}/data`, {
    method: "GET",
    headers: {
      authorizationToken: `Bearer ${accessToken}`,
    },
  }).then((resp) => {
    if (resp.ok) {
      resp.json().then((json) => {
        setData(json.data)
    }
  })
}
```

이랬던 요청을

```jsx
const getData = () => {
  apiClient.get(`/data`).then((resp) => {
    if (resp.status === 200) {
      setData(resp.data)
  })
}
```

이렇게 바꿀 수 있다. 딱 봐도 아주 간단해졌다.  
* JSON 자동 파싱으로 resp.json().then((json)=>)의 과정이 필요없어졌으며,  
* method: "GET"이 아닌 apiClient.get()으로 get임을 명시할 수 있다.  
* baseURL과 token을 이제는 authProvider에서 관리하므로 컴포넌트마다 BASE_URL을 가져오고, accessToken을 가져올 필요가 없어졌다.  


이번엔 PUT 요청을 한 번 살펴보자.

```jsx
const updateData = (data) => {
  fetch(`${BASE_URL}/data`, {
    method: "PUT",
    headers: {
      authorizationToken: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      data: data,
    }),
  })
}
```

```jsx
const updateData = (data) => {
  apiClient.put(`/data`, {
    data: data,
  })
}
```

* body 보낼 때 JSON.stringify()도 필요없어졌다.  

이렇게 한 곳에서 이것저것 관리하고 각 컴포넌트에서 간단하게 요청보내는, <u>fetch를 axios로 대체하기</u> 끝 !