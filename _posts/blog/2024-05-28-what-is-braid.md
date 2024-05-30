---
layout: post
title: "데이터 동기화와 실시간 협업이 가능한 확장된 HTTP, Braid-HTTP"
category: blog
tags: book-review
image:
  path: /assets/img/blog/2024-05-28/thumb.webp
comments: true
---


[GN⁺: Braid: HTTP 동기화 기술](https://news.hada.io/topic?id=15026)를 보고 좀 더 적어본 글입니다.  
Braid 자체는 상호운용 가능한(즉, 협업 가능한) 상태 동기화를 위한 알고리즘, 애플리케이션, 도구 및 표준을 만드는 **오픈 작업 그룹**입니다.  
목표는 네트워크 컴퓨팅 시스템 전반에서 분산 상태를 로컬 변수처럼 쉽게 읽고 쓸 수 있도록 하는 것이라는데,  
말이 좀 어렵죠? 그래서 제가 더 찾아봤습니다.  

* toc
{:toc}

<br>
썸네일에 써 놓은 글에 대한 (제가 생각하는) 답부터 적어보자면  
네트워크 컴퓨팅 시스템에서 분산 상태를 로컬 변수처럼 쉽게 읽고 쓸 수 있도록 한다는 것은,  
분산 시스템<sup>*</sup>에서 <u>여러 컴퓨터나 장치에 분산된 데이터를 일관되고 **편리하게 관리**할 수 있는 방법</u>과 같은 느낌입니다.  
<sub>* 분산 시스템(Distributed System)은 여러 대의 컴퓨터나 장치가 네트워크를 통해 연결되어, 하나의 시스템처럼 동작하는 환경을 말합니다. AWS, GCP같은 클라우드 컴퓨팅도 그렇고, Slack이나 Google Docs같은 협업 도구들도 분산 시스템이라고 할 수 있죠. </sub>

분산 시스템에서는 데이터가 여러 노드에 분산되어 있으며, 이러한 데이터에 접근하려면 *네트워크를 통해* 특정 노드에 요청을 보내거나 데이터를 업데이트해야 합니다. 이 때문에 데이터의 일관성과 동기화가 중요한 문제가 됩니다.  
당장 여러 곳에 있는 데이터를 동시에 읽고 쓰고 실시간으로 반영하려면, 어떻게 해야하는지 떠오르나요? 


그러기 위해서는 생각보다 신경써야할 게 많습니다.  
예를 들면, 여러 명이 한 자원에 대해 동시에 수정하려고할 때 생기는 문제는 어떻게 방지할 것인지, 누가 수정했을 때 그걸 어떻게 실시간으로 반영할 것인지 등이 있죠.  


근데 이제 로컬변수를 한 번 써봅시다. 쉽게 지금 인터넷의 콘솔창(F12)을 켜봅시다. <small>PC라면.. </small>  
a = 1, 엔터, 그리고 다시 a, 엔터 그럼 1이 나오죠. 우리의 작고 소중한 로컬변수 a가 생겼습니다.  
얘를 다루는 일은 쉽죠. a*4 엔터치면 4도 보여줍니다.  
이렇게 쉽게 분산 상태를 조작 하는 걸 목표로 하고 있다는 말이라고 저는 이해했습니다.

글에서는 Braid 자체보단, Braid-HTTP를 살펴보려고합니다.  
실시간 동기화를 위해 기존에는 WebSocket 프로토콜(ws://)을 활용했다면, Braid-HTTP는 HTTP 프로토콜을 사용하면서 실시간 동기화를 할 수 있게 한다고 합니다.


# Braid-HTTP의 주요 개념 • 기능 • 장점
1. 패치 업데이트(Patch Updates):
* Braid HTTP는 전체 리소스를 다시 전송하는 대신, 변경된 부분만을 전송하는 기능을 지원합니다. 이를 통해 네트워크 사용량을 줄이고 성능을 향상시킬 수 있습니다. 이는 HTTP의 PATCH 메서드를 확장한 것으로, 클라이언트와 서버 간에 변경된 부분만 교환하여 효율적으로 데이터를 동기화합니다.

2. 버전 관리(Versioning):
* Braid HTTP는 리소스의 버전을 관리하여 충돌을 방지하고, 필요한 경우 이전 버전으로 롤백할 수 있는 기능을 제공합니다. 클라이언트와 서버는 각 리소스의 버전을 추적하고, 충돌이 발생하면 이를 해결하기 위한 전략을 사용할 수 있습니다.

3. 실시간 동기화(Real-Time Sync):
* Braid HTTP는 실시간으로 데이터를 동기화할 수 있는 기능을 제공합니다. 여러 클라이언트가 동시에 작업할 때, 각 클라이언트의 변경 사항이 즉시 서버와 다른 클라이언트에 반영됩니다. 이를 통해 협업 작업에서 실시간 협업이 가능해집니다.

4. 구독(Subscriptions):
* 클라이언트는 특정 리소스에 대한 변경 사항을 구독할 수 있습니다. 서버는 해당 리소스의 변경 사항이 발생할 때마다 구독자에게 알림을 보내어 최신 상태를 유지할 수 있도록 합니다. 이는 웹소켓과 유사한 방식으로 작동합니다.

5. 머지(Merge):
* 여러 클라이언트가 동일한 리소스에 대한 변경 사항을 제출할 때, Braid HTTP는 이를 병합하는 기능을 제공합니다. 서버는 각 클라이언트의 변경 사항을 병합하여 최종 리소스를 생성하고, 클라이언트에 이를 반영합니다. 이 과정에서 충돌이 발생하면 이를 해결하는 전략을 적용할 수 있습니다.

  
위 기능들에서 볼 수 있는 장점을 정리하면 이런 것 같습니다. 
* 효율성
  * 변경된 부분만 전송하기 때문에 네트워크 트래픽과 대역폭 사용량이 감소합니다.
* 실시간 협업
  * 여러 사용자가 동시에 작업할 때, 변경 사항이 즉시 반영되어 협업이 원활해집니다.
* 버전 관리
  * 리소스의 변경 이력을 관리하여 롤백 및 충돌 해결이 용이합니다.
* 확장성
  * 기존 HTTP 프로토콜을 확장하여 새로운 기능을 추가하므로, 기존 시스템과 호환성이 좋습니다.

기능들 하나하나가 그렇게 낯선 용어들은 아니라, 어떤 일들을 하는지는 대충 감이 오지만 어떻게 하겠다는 걸까요?  


# 이게 무슨 원리죠?
braid-http 라이브러리의 server 사이드 [코드](https://github.com/braid-org/braidjs/blob/master/braid-http/braid-http-server.js)를 살펴보면,
```javascript
function braidify (req, res, next) {
    // console.log('\n## Braidifying', req.method, req.url, req.headers.peer)

    // First, declare that we support Patches and JSON ranges.
    res.setHeader('Range-Request-Allow-Methods', 'PATCH, PUT')
    res.setHeader('Range-Request-Allow-Units', 'json')

    // Extract braid info from headers
    var version = ('version' in req.headers) && JSON.parse('['+req.headers.version+']'),
        parents = ('parents' in req.headers) && JSON.parse('['+req.headers.parents+']'),
        peer = req.headers['peer'],
        url = req.url.substr(1)

    // Parse the subscribe header
    var subscribe = req.headers.subscribe
    if (subscribe === 'true')
        subscribe = true

    // Define convenience variables
    req.version   = version
    req.parents   = parents
    req.subscribe = subscribe

    // Add the braidly request/response helper methods
    res.sendUpdate = (stuff) => send_update(res, stuff, req.url, peer)
    ...
```
이런 braidfy라는 미들웨어를 사용해서 HTTP의 요청, 응답을 확장합니다.  

``` javascript
var braidify = require('braid-http').http_server
// or:
import {http_server as braidify} from 'braid-http'

require('http').createServer(
    (req, res) => {
        // Add braid stuff to req and res
        braidify(req, res)

        // Now use it
        if (req.subscribe)
            res.startSubscription({ onClose: _=> null })
            // startSubscription automatically sets statusCode = 209
        else
            res.statusCode = 200

        // Send the current version
        res.sendUpdate({
            version: ['greg'],
            body: JSON.stringify({greg: 'greg'})
        })
    }
).listen(9935)
```

구독 요청이 들어오면, 구독을 시작하고 새로운 변경사항이 있을 때마다 sendUpdate해서 구독 중인 클라이언트에게 sendUpdate합니다.  

연결이 어떻게 지속되는가는,
* 기본적으로 HTTP의 Keep-alive(persistent connection)을 사용하고  
* req.socket.server.timeout = 0.0 설정을 통한 타임아웃 비활성으로 구독 연결이 끊기지 않게 하는듯..

그 외의 설정으로는 X-Accel-Buffering: no 헤더로 Nginx와 같은 프록시 서버에서 버퍼링을 비활성화하여 실시간 데이터를 빠르게 전송할 수 있게 하고 있습니다.

# WebSocket이랑 뭐가 다르지?
요약하자면, Braid HTTP는 HTTP의 확장으로서 RESTful API와의 통합이 용이하고, WebSocket은 빠르고 빈번한 양방향 통신을 필요로 하는 상황에서 강력한 성능을 발휘합니다.

## WebSocket
* 목적: 클라이언트와 서버 간의 양방향 통신을 위한 지속적인 연결을 유지합니다.
* 프로토콜: 독립적인 프로토콜로, 초기 핸드셰이크 후 HTTP 연결을 WebSocket 연결로 업그레이드합니다.
* 특징:
  * 양방향 통신: 클라이언트와 서버가 자유롭게 메시지를 주고받을 수 있습니다.
  * 지속적인 연결: 연결이 유지되는 동안 실시간으로 데이터 전송이 가능합니다.
  * 이벤트 기반: 메시지를 받으면 이벤트가 발생하여 즉시 처리할 수 있습니다.
* 장점:
  * 매우 낮은 지연 시간으로 실시간 통신이 가능합니다.
  * 게임, 채팅 애플리케이션 등 즉각적인 응답이 필요한 애플리케이션에 적합합니다.
* 단점:
  * 서버와 클라이언트 모두 지속적인 연결을 관리해야 합니다.
  * HTTP의 기존 인프라와 완전히 호환되지 않으므로, 별도의 설정과 관리가 필요합니다.

## Braid HTTP
* 목적: 기존 HTTP 프로토콜을 확장하여 효율적인 데이터 동기화와 협업을 지원합니다.
* 프로토콜: HTTP/1.1 또는 HTTP/2 기반으로 작동하며, 기존 HTTP 메서드와 호환됩니다.
* 특징:
  * 패치 업데이트: 리소스의 변경된 부분만 전송하여 네트워크 효율성을 높입니다.
  * 구독/알림: 클라이언트가 리소스의 변경 사항을 구독하고, 서버는 변경 시 알림을 보냅니다.
  * 버전 관리 및 병합: 리소스의 버전을 추적하고, 여러 변경 사항을 병합하여 일관성을 유지합니다.
* 장점:
  * 기존 HTTP 인프라와 완벽하게 호환됩니다.
  * 부분적인 업데이트 전송으로 네트워크 사용량을 줄입니다.
  * RESTful API와 함께 사용하기 쉬우며, 복잡한 실시간 기능을 간단히 구현할 수 있습니다.
* 단점:
  * 매우 높은 빈도의 실시간 통신에는 WebSocket보다 적합하지 않을 수 있습니다.
  * 클라이언트와 서버 간의 지속적인 연결을 요구하지 않지만, 실시간성을 유지하기 위해 폴링 또는 다른 메커니즘이 필요할 수 있습니다.

<br>
<br>


Braid에 관심이 생긴 사람들은 매 2주마다 ^오픈 미팅^ [ZOOM](https://us02web.zoom.us/j/6459283736?pwd=cW1OcnlZQndXS3pKQ1U3K01NRHJZQT09#success)을 통해 애플리케이션 및 시스템 요구사항을 논의하고, 공통점을 식별하며, 공유 프로토콜에 대한 합의를 찾는다고 하니, 한 번 Join 해보는 것도 ~?