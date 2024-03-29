---
layout: post
title: "웹 개발자도, 웹 디자이너도 읽어볼 만한 UI의 기초: Refactoring UI"
category: blog
tags: book-review
image:
  path: /assets/img/blog/2024-03-16/thumb.png
comments: true
---

우리 CTO님이 CPO님께 추천해주고, CPO님이 내게 추천해주신 책, [Refactoring UI](https://www.refactoringui.com/)를 읽어봤다.

UI는 예쁜게 다 아냐?라고 생각했는데, 그게 다가 아니더라.

* toc
{:toc}

물론 예쁜 디자인은 중요하다.

그러나 이 책에서는 단순히 미적 측면만을 위한 것이 아니라, 정보의 전달과 사용자의 경험을 극대화하는 기술이 'UI 디자인'이라고 말하고 있다. (다행이다. 미적인 건 정형화될 수 없으나, 그 외의 것은 정형화될 수 있으니..)

말하고자 하는 바들을 친절하게도 css 코드와 함께 BEFORE AFTER 사진들을 잔뜩 넣어주어 이해하기 쉽게 구성되어 있다.


책을 읽으면서 '아, 이래서!' 싶었던 부분들을 먼저 적어보려고 한다.

# Not All Elements Are Equal
디자인의 각 요소가 동일한 가치를 지니지 않는다는 것은, <u>시각적 계층</u>을 만들어 사용자의 주의를 요구하는 요소에 힘을 실어야 함을 의미한다. 

가끔 화면을 보다보면, 마치 흰 종이에 글만 있는 것처럼 덩그러니 두어진 것 같은, 아무것도 없는 것같은 느낌을 받을 때가 있다. 이런 경우가 그 어디에도 강조점을 두지 못했을 때인 것 같다.

Visual hierarchy를 신경쓰는 것이 '디자인'된 느낌을 주기에 효과적이라고 한다.

강조를 주려면 CSS를 어떻게 해야하고, 덜 하려면 어떻게 해야하는지는 우리가 (아마) 이미 알고 있다.

글씨의 크기나 굵기, 색을 변화시키는 거다. 여기다 이 책은 세세한 팁들을 더한다.

> 400이하의 font weight은 작은 폰트 크기에서는 영 읽기 어렵기 때문에, 좀 덜 중요함을 표현하기 위해서는 굵기를 조절하기보단 연한 색상 / 작은 크기를 이용하자.



# 웹에서의 가독성
나는 화면에 가득찬 디자인을 예쁘다고 생각하는 경향이 있다.

확실히 랜딩 페이지라면 풀스크린이 맞을 거고, 내가 봐온 예쁜 (힘을 실은) 디자인들이 주로 랜딩에 있었기 때문에, 그렇게 느꼈던 것 같다.

저희 상세페이지도 화면 좀 넓게 쓰면 안되나요? 했다가 기각당한 이유는 여기 있었다.


## Keep your line length in check
여기서 말하는 Line length는 한 줄에 몇 글자 정도 있느냐를 말한다.

최적의 읽기에 적합한 글자수는 한 줄에 45-75자 정도라는데, 이건 영어 기준이니까 한글로 따져보면 20-40자 정도가 적당한 것 같다. (본인은 필기를 워드에 주로 하는 편인데, 워드도 100% 기준으로 한 줄에 20자 조금 넘는다.)

물론 여기 나오는 내용들이 전부 다 일반적인 '권장'이지 절대적 지침은 아님은 늘 염두해 두고 읽기를 바란다.

가령 여기서 이 line length를 지키려면 제일 쉬운 방법이 뭔지 알아? em을 쓰렴! 하고 말하는 것처럼.

이외에도 가독성을 위해 따져야할 것들로는 줄간격, 정렬 등이 있다.

## Line-height is proportional
줄간격은 문장의 너비와 비례하게 늘어나야 한다는 뜻.

글을 담는 컨테이너가 좁다면 1.5 정도의 줄간격이 충분하더라도, 넓은 컨테이너에 담긴 글이라면 2정도는 써야 한다.

* 타이트한 줄간격은 읽던 곳이 어디였는지 헷갈리기 쉽다.
* 물론 글씨가 충분히 크다면, 줄간격이 좁아서 읽기 어려울 일은 없다.

## Align with readability in mind
* 2-3줄 정도의 글은 가운데 정렬해도 괜찮으나, 그 이상은 보통 왼쪽 정렬해야한다. 가운데 정렬하고 싶은데 하나가 유난히 튄다? 그럼 글을 좀 줄이세요^^

앗, 그리고 처음 들어본 css를 만났는데 영어에서 양쪽 정렬을 했을 때 단어가 잘리는 경우를 위해 hyphens라는 게 있다고 한다. hyphens:auto하면 자동으로 hyphenation해주는 게 있더라. 뭔가 새삼,, 나라별로 개발 문화도 좀 다르려나 싶은 느낌을 받았다.

# Don't overlook empty states
데이터를 표시해야하는 공간인데, 데이터가 없을 때 우린 어떻게 화면을 구성하는가?  
_데이터가 없습니다._ 라든지, _~가 없어요._ 정도로 빈 화면에 텍스트 정도 두지 않는가?  

이런 Empty states도 '디자인'되어야 하는데, 특히 우선순위인 상황들이 있다고 한다.
* 유저가 컨텐츠를 생성하는 곳
* 탭, 필터등 데이터를 보기 편리한 UI들이 잔뜩 자리잡은 곳

이유는 새로운 유저의 첫인상이기 때문.

복잡한 UI 및 ~가 없습니다. 라는 텍스트 대신 좀 더 유저가 관심을 가질만한 것들로 채우자는 것이 글의 요지.  
예를 들면 CTA<sup>*</sup>를 부각할 수 있다.  
<sub>*Call To Action, 배너﹒버튼﹒링크 등 사용자의 행위를 유도하는 요소</sub>


* 연락처가 없습니다. 만 표시하는 대신, 새로운 연락처를 추가하고, 대화를 시작해보세요. 에 버튼 추가하기.
* 컨텐츠가 있을 때와 없을 때의 UI를 달리하자.
  * 원래는 컨텐츠를 리스트업하고 필터링할 수 있는 공간이었다면, 일단 시작하는 버튼부터 부각하는 공간으로.

# Rebuild your favorite interfaces
마지막으로 책에서 권장하는 것은 '클론 디자인'이다.  
좋아하는 인터페이스를 처음부터 따라 만들어보고 내가 만들어낸 디자인과, 해당 인터페이스의 다른 부분을 찾다보면  
당신만의 ‘디자인 룰’을 세울 수 있을 것이라는 게 이유.

코딩도 그런 것처럼, 디자인도 처음부터 만들어보는 경험이 중요하구나 싶었다.


# Miscellaneous
기타 흥미로운 사실들은 아래에 냅다 나열하겠다.
* Detail comes later. 디자인 초기 단계에서 폰트, 아이콘, 브라우저 등은 중요한 게 아님. 영 무시할 수 없다면 종이에 그려라. Jira 같은 협업툴을 만드는 회사 Basecamp의 CEO 제이슨 프라이드도 이렇게 한단다.
* Action Button 디자인 원칙
  * Primary: 웹 배경색상과 강한 대비를 이루는 색상의 버튼
  * Secondary: outline정도면 충분
  * Tertiary: link처럼 디자인하면 충분
* 폰트 정하기
  * 어떤 폰트를 사용해야할까 하고 Google Fonts같은 데 들어가면, Number of styles로 필터링할 수 있다. 여기 해당되는 스타일에는 다양한 weight, 기울임 등을 포함한다. 최소한 5개 이상, 추천은 **10개 이상**인 폰트 중에서 선택하자.
  * 한글 폰트에는 적용이 안되는 것 같지만, 영문 폰트의 경우 제목에쓰는 폰트는 좀 더 타이트한 자간과 높이가 짧은 소문자를 사용한다고 한다. 그러므로, 이러한 폰트는 주로 쓰는 폰트가 될 수 없음.
    * Ex) 제목용 – FUTURA PT, 본문용 – Proxima Nova
* 색상
  * HSL vs HSB: HSL의 Lightness와 HSB의 Brightness는 다르다. 예를 들면, Lightness가 100%일 땐 늘 하얀색이지만, Brightness가 100%일 땐 Saturation이 0%여야 하얀색이다. 
    * HSB가 소프트웨어 디자인에선 더 흔하지만, 브라우저는 HSL만 이해한다. 그러므로 웹디자이너라면 **HSL**을 선택하라.
  * Define your shades up front: 가장 어두운 색조<sub>(대게 텍스트에 사용)</sub>와 가장 밝은 색조<sub>(대게 배경에 사용)</sub>를 고르고, 적어도 5개, 권장 9개로 해서 각 사이사이의 갭을 채워라. 꼭 중간지점의 색상이 아니어도 됨. 숫자가 아니라 당신의 눈을 믿어라.
  * Don’t rely on color alone: 색상은 보조적인 것이지, <u>그 자체로 어떤 의미를 지녀선 안된다.</u>
    * 예를 들면, 상승을 나타내기 위해 초록색 뱃지만을 달기보단 화살표를 추가하자.
    * 색상만으로 말해야하는 게 있다면, 아예 다른 색상들을 사용하기보단 한 색상의 밝고, 어두운 계열을 사용해 차이를 나타내자. 색맹이 인식하기 쉽다.
* 빛의 모방: 안으로 들어간 것처럼(inset) 보이려면 박스의 top을 어둡게, bottom을 밝게
* Text needs consistent contrast: 글씨가 이미지에 묻힌다?
  * 이미지의 contrast, brightness를 조정하자
  * 이미지의 색조를 빼고 blending mode: multiply를 이용해 새로운 색을 입힌다.
  * 글자에 그림자를 준다. Text-shadow
* Decorate your backgrounds: Use a repeating pattern. [Hero patterns](https://heropatterns.com/)에 많대. 

--- 

책을 읽으며, 디자인은 단지 눈을 즐겁게 하는 것이 아닌 <u>사용자의 경험을 형성하고, 메시지를 전달하는 매체</u>임을 새삼 깨달았다.  
(얼마전에 테무같은 애들이 디자인을 번잡하게 해두는 건, 그것만으로 제품이 저렴해보일 수 있기 때문이라는 글을 봤다.)  

좋은 디자인은 사용자가 내용을 쉽고 효과적으로 이해하도록 돕고, 그들의 행동을 유도한다.  
디지털 네이티브인데다가, 유독 컴퓨터 세상과 친밀하게 지내온 인간으로써 디자인에 있어 '쉬운 이해' 보단 '심미'에 좀 더 치중했던 것 같은데 좋은 디자인에 대한 재정의를 할 수 있었던 느낌.

-끝-
