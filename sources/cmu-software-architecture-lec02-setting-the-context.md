---
title: "무엇을 만들고 무엇을 만들지 않을 것인가 — CMU 소프트웨어 아키텍처 2강"
subtitle: "컨텍스트 다이어그램 한 장으로 범위, 가치, 품질 속성, 제약을 끌어내는 법"
slug: "cmu-software-architecture-lec02-setting-the-context"
date: "2026-11-19"
tags:
  - 컴퓨터과학
  - 소프트웨어공학
  - 아키텍처
  - 해설
summary: "카네기멜런대학교(CMU) 17-635 「소프트웨어 아키텍처」 2강을 바탕으로, 설계와 코딩을 시작하기 전에 소프트웨어의 맥락(context)을 어떻게 설정하는지 기초부터 해설한다. 우버(Uber) 같은 차량 호출 플랫폼을 중심 예시로 삼아 컨텍스트 다이어그램의 개념과 UML·C4 표기법, 앱과 플랫폼의 차이, 행위자와 외부 실체 간 데이터 흐름을 단계별로 짚는다. 이어 한 장의 컨텍스트 다이어그램에서 행위자 너머의 사업 가치, 아키텍트와 업무 분석가가 함께 던지는 범위 질문(지도·외부 시스템 API·DB·분석·관리자), '얼마나 많이·자주·크게'로 도출하는 품질 속성, 기술·사업·레거시·자체 선택에서 오는 제약, 애자일 환경에서의 진화, 유스케이스·세 가지 이벤트 다이어그램, 그리고 V-모델 기반의 아키텍처 검증(통합·품질 속성 테스트)까지 아키텍처 초기 단계의 실무 흐름 전체를 정리한다."
archive_url: "https://yghnsim.github.io/Archive/pages/2026-11-19-CMU소프트웨어아키텍처2강.html"
---

## 서문: 코드를 쓰기 전, 왜 '맥락'의 선부터 그어야 하는가

소프트웨어 아키텍처가 무엇인지 이해하고 나면 곧바로 부딪히는 질문이 있다. 그렇다면 실제로 시스템을 설계하고, 아키텍처를 세우고, 코드를 작성하기 **전에** 가장 먼저 무엇을 해야 하는가? 이 강의가 내놓는 첫 번째 답은 분명하다. 소프트웨어가 어떤 **맥락(context)** 속에서 개발될 것인지, 그리고 그 안에서 **무엇을 만들고 무엇을 만들지 않을 것인지**—즉 범위 안(in scope)과 범위 밖(outside scope)—를 먼저 분명히 해야 한다는 것이다.

> **[해설] 1강에서 2강으로 이어지는 자리**  
> 1강(왜 아키텍처인가)에서 소프트웨어 아키텍처가 사업 요구와 품질 속성, 그리고 시스템의 큰 구조를 맞물려 결정하는 일이라는 점을 살펴보았다면, 2강은 그 흐름을 실제 업무에서 첫걸음으로 옮기는 **가장 첫 실무 도구**, 바로 **컨텍스트 다이어그램(context diagram)**을 다룬다.

이 강의의 목표는 두 가지다. 첫째, 소프트웨어를 만들 때 맥락을 설정하는 일이 왜 중요한지 이해하는 것이다. 둘째, 주어진 요구사항에서 그 맥락 정보를 뽑아내는 방법을 익히는 것이다. 여기서 말하는 맥락 정보란 **무엇이 범위 안이고 무엇이 범위 밖인지**, **누가 우리 소프트웨어를 사용하는지**, 그리고 **우리 소프트웨어가 상호작용해야 하는 외부 소프트웨어·하드웨어 실체는 무엇인지**를 아우른다. 말하자면 우리가 어떤 환경과 조건 속에서 이 소프트웨어를 짓고 있는지에 대한 **넓은 개관(broad overview)**이다.

앞으로 살펴볼 흐름은 다섯 단계로 이어진다. 먼저 **컨텍스트 다이어그램**을 그리는 법을 배우고, 그 그림을 바탕으로 **시스템 범위**를 도출한다. 이어서 같은 그림을 다시 들여다보며 시스템 전체의 관심사(systemic concerns), 곧 **품질 속성**을 끌어내고, 개발 과정에서 마음대로 바꿀 수 없는 **제약(constraints)**—도구, 환경, 사업 제약 등—을 짚는다. 마지막으로 이 초기 단계에서 함께 돌아가는 **관련 활동(유스케이스, 이벤트 다이어그램, 검증 테스트 계획)**을 살핀다.

여기서 한 가지 시선을 분명히 해 둘 필요가 있다. 이 모든 활동은 요구사항을 모으고 문서화하는 업무 분석가(business analyst)의 관점이 아니라 **아키텍트의 관점**에서 바라본다. 핵심 질문은 이것이다. **"나는 아키텍트로서 소프트웨어 개발의 초기 단계에 어떻게 참여하는가?"**

소프트웨어 설계란 결국 다이어그램을 그리는 일과 떼려야 뗄 수 없다. *"그림 한 장이 천 마디 말보다 낫다(a picture is better than a thousand words)"*는 말처럼 소프트웨어 아키텍처에도 온갖 다이어그램이 등장한다. 하지만 이 강의는 곧바로 중요한 단서를 붙인다. 아키텍처는 그림만으로 끝나지 않으며 **글로 충분히 보충해야 한다.** 아무리 잘 그린 그림이라도 담아내지 못하는 **"천한 번째 말(thousand and oneth word)"**이 반드시 존재하기 때문이다.

이 글은 소프트웨어 아키텍처를 처음 접하는 독자도 전문 기호에 압도되지 않고 따라올 수 있도록, 이 강의가 중심 예시로 삼는 **차량 호출 플랫폼(우버 같은 서비스)** 하나를 끝까지 붙잡고 개념을 한 칸씩 쌓아 올린다. 강의 속에 등장하는 다른 사례들—트위터 피드, 에어비앤비, 데이터베이스 적재 시스템, 오픈소스 프로젝트, 판매 시스템, 마이크로소프트 계열 환경, 스타트업, 돈 인출 시퀀스, 백업과 백신 프로그램—도 빠짐없이 살피되, 각각이 차량 호출 플랫폼에서는 어떤 모습으로 나타나는지 다시 연결해 볼 것이다.

---

## 1. 경계선 그리기: 컨텍스트 다이어그램의 기초와 두 가지 표기법

### 1.1 우리가 만들 것과 이미 바깥에 있는 것 사이의 선

소프트웨어 개발을 시작할 때 가장 먼저 해야 할 일은 "내가 책임지고 만들어야 할 안쪽"과 "이미 바깥에 있어서 연동만 하면 되는 바깥쪽" 사이에 선을 하나 긋는 일이다. 이처럼 우리가 만들 시스템(또는 큰 시스템의 일부만 개발한다면 바로 그 일부)과 **환경(environment)**—즉 우리 소프트웨어가 상호작용해야 하는 외부 실체들—사이의 **경계(boundary)**를 정하는 그림을 **컨텍스트 다이어그램(context diagram)**이라고 부른다.

컨텍스트 다이어그램을 그리는 순서는 생각보다 단순하고 명확하다.

1. **만들 시스템을 정한다.** 우리가 직접 개발해 내놓을 소프트웨어 대상을 가운데에 놓는다.
2. **사람 행위자(human actors)를 찾는다.** 누가 우리 소프트웨어를 직접 사용하는가?
3. **관여하는 다른 시스템을 찾는다.** 그들이 우리와 상호작용하거나, 우리가 그들과 상호작용해야 하는 외부 시스템은 무엇인가?
4. **행위자와 시스템이 어떻게 상호작용하는지 '높은 수준에서만' 그린다.** 세세한 화면 흐름이나 내부 처리 절차까지 들어가지 않고, 큰 줄기의 상호작용만 표시한다.
5. **상호작용을 바탕으로 가치를 도출한다.** 그림에 나타난 상호작용을 살펴보면, 우리 시스템이 바깥의 여러 실체들에게 어떤 가치(value)를 제공하는지 자연스럽게 드러난다.

여기서 아키텍트 초심자가 반드시 깨달아야 할 현실이 하나 있다. **세상의 소프트웨어를 완전히 백지상태에서 처음부터 새로 짓는(greenfield) 경우는 매우 드물다.** 현실에서는 이미 돌아가고 있는 커다란 시스템의 한 조각만 새로 붙이거나, 이미 설계되어 있는 데이터베이스를 그대로 써야 하거나, 회사 환경 안에 이미 구축되어 있는 인증 서버(authentication server)에 연동해야 하는 경우가 대부분이다. 그래서 바깥에 이미 존재하는 다른 시스템들을 처음부터 정확히 파악하는 일이 중요하다.

게다가 오늘날에는 사람이나 회사 내부 시스템만 바깥에 있는 것이 아니다. **외부 피드(external feeds)와 트리거(triggers)** 역시 결코 빼놓을 수 없다. 예컨대 하드웨어 센서에서 들어오는 데이터나, 트위터 피드(Twitter feeds)·페이스북 게시물(Facebook posts) 같은 다른 소프트웨어에서 흘러들어오는 데이터도 있다. 이것들은 우리가 직접 개발하는 대상이 아니지만 우리 시스템과 상호작용해야 하므로, 컨텍스트 다이어그램에서는 이 모든 것을 **행위자(actors)**로 취급한다. 정리하면 컨텍스트 다이어그램의 행위자는 **사람 행위자 + 다른 외부 시스템 + 외부 피드와 센서**를 모두 포괄한다.

> **[차량 호출 플랫폼으로 연결하면]**  
> 차량 호출 서비스를 만든다고 할 때, 스마트폰에 내장된 GPS 센서에서 들어오는 위치 신호나 외부 지도 서비스에서 받아 오는 실시간 도로 정보는 우리가 직접 만드는 소프트웨어가 아니다. 하지만 우리 플랫폼이 반드시 받아서 반응해야 하는 외부 입력이므로, 승객·운전자라는 사람 행위자만큼이나 중요한 '행위자'로 경계선 바깥에 자리 잡는다.

### 1.2 UML과 C4: 같은 내용, 다른 옷

컨텍스트 다이어그램을 그릴 때 쓰는 대표적인 표기법으로는 크게 두 가지가 제시된다. 하나는 **UML 컨텍스트 다이어그램(UML context diagram)**이고, 다른 하나는 **C4 컨텍스트 다이어그램(C4 context diagram)**이다.

- **UML 컨텍스트 다이어그램:** 그림 한가운데에 우리가 만들 소프트웨어를 두고, 그 둘레에 사람 행위자, 외부 피드, 외부 시스템을 배치한다. 그리고 바깥의 실체들과 우리 시스템 사이를 오가는 **데이터 흐름(data flows)**을 화살표로 표시한다.
- **C4 컨텍스트 다이어그램:** 담고 있는 핵심 내용은 UML 방식과 같지만 시각적 표현이 조금 다르다. 사람 행위자를 나타내는 고유한 기호, 외부 시스템을 나타내는 기호, 그리고 우리가 만들 시스템을 나타내는 기호를 구분해 그리고, 보통 그 사이를 잇는 선 위에 **상호작용(interactions)**이나 데이터 흐름을 문장으로 서술한다. 오늘날 실무에서 꽤 인기가 높으며, 공식 안내 사이트(`c4model.com`)에서 그림 예시와 규칙을 확인할 수 있다.

C4 모델은 **네 가지 다이어그램**을 그리게 하며, 오늘 우리가 다루는 **시스템 컨텍스트 다이어그램(system context diagram)**이 바로 그 첫 번째 그림이다. 나머지 다이어그램은 이 수업에서 아키텍처를 다루면서 이야기할 예정이다.

> **[해설] 'UML 컨텍스트 다이어그램'과 C4 모델의 네 단계**  
> 이 강의에서는 첫 번째 표기법을 "UML 컨텍스트 다이어그램"이라고 부르지만, 엄밀히 말하면 '컨텍스트 다이어그램'은 UML 표준(UML 2.5.1)이 정한 14가지 다이어그램 유형에 들어 있지 않다. 실무에서는 주로 유스케이스 다이어그램의 표기(시스템 경계 상자와 행위자)를 빌려 그리고, 클래스·컴포넌트 다이어그램 요소를 단순화해 쓰기도 한다. 컨텍스트 다이어그램이라는 그림의 뿌리는 구조적 분석의 데이터 흐름도(DFD) 레벨 0이다[^1]. 한편 C4 모델은 영국 저지(Jersey)를 기반으로 활동하는 아키텍트 사이먼 브라운(Simon Brown)이 만들었고, 네 가지 다이어그램은 **System Context(시스템 맥락) → Container(컨테이너) → Component(컴포넌트) → Code(코드)**의 네 단계다. 2006~2009년 무렵 뿌리가 생겼고 'C4'라는 이름은 2011년 초부터 쓰였다[^2]. 이 강의에서는 이 중 가장 바깥 층위인 첫 번째 '시스템 컨텍스트 다이어그램'만을 핵심으로 다룬다.

그렇다면 실무를 막 시작하는 사람이라면 한 가지 의문이 들 법하다. **"UML 컨텍스트 다이어그램과 C4 컨텍스트 다이어그램이 둘 다 필요한가요, 아니면 하나만 있으면 충분한가요?"** 답은 명쾌하다. **둘은 표기법(notation)만 다를 뿐이므로, 그중 하나를 골라 따르면 된다.** 중요한 것은 어느 표기법의 아이콘이 더 예쁜가가 아니라, 경계선 안팎과 오가는 흐름을 빠짐없이 포착하는 데 있다.

| 비교 항목 | UML 컨텍스트 다이어그램 | C4 컨텍스트 다이어그램 |
| :--- | :--- | :--- |
| **핵심 목적** | 만들 시스템과 외부 환경 사이의 경계 및 관계 파악 | 만들 시스템과 외부 환경 사이의 경계 및 관계 파악 (동일) |
| **시각적 구성** | 가운데에 만들 소프트웨어, 둘레에 사람 행위자·외부 피드·외부 시스템 배치 | 사람 행위자·외부 시스템·만들 시스템을 구별된 전용 기호로 배치 |
| **연결선 표현** | 외부 실체와 시스템 사이를 오가는 **데이터 흐름**을 화살표로 명시 | 두 실체 사이의 **상호작용**(또는 데이터 흐름)을 짧은 설명 문구로 서술 |
| **체계 내 위치** | 강의에서 별도의 다이어그램 체계는 언급되지 않음 | C4 모델이 제시하는 **4가지 다이어그램 중 첫 번째** (이후 단계로 확장) |
| **병행 사용 여부** | 둘 다 그릴 필요 없이 팀이나 상황에 맞는 **하나만 선택**해 사용 | 둘 다 그릴 필요 없이 팀이나 상황에 맞는 **하나만 선택**해 사용 |

---

## 2. 앱이 아니라 '플랫폼'이다: 차량 호출 서비스의 컨텍스트 다이어그램 그리기

### 2.1 왜 '차량 호출 앱'이 아니라 '차량 호출 플랫폼'인가

이제 본격적으로 중심 예시를 들여다보자. 이 강의는 일부러 '차량 호출 앱(app)'이라고 하지 않고 **차량 호출 플랫폼(ride-hailing platform)**이라는 이름을 쓴다. 그 이유는 단순한 말장난이 아니다. **플랫폼은 일반 애플리케이션과 설계되는 방식 자체가 다르기 때문이다.**

그렇다면 **플랫폼(platform)**이란 무엇인가? 강의의 정의에 따르면 플랫폼이란 사람들이 그 위로 자유롭게 올라타고(on board) 또 떠날 수 있는 소프트웨어다. 그리고 그 내부에는 **재사용 가능하며(reusable)**, **어떤 종류의 응용 프로그램이든 그 위에 세울 수 있을 만큼 충분히 일반적인(generic)** 소프트웨어 구성 요소(components), 자산(assets), 서비스(services)가 다수 들어 있다.

대표적인 사례가 **우버(Uber)**다. 우버는 단순히 웹 앱이나 모바일 앱 하나를 만든 회사가 아니라 플랫폼이다. 우버가 핵심 도메인 구성 요소—예를 들어 **운전자(drivers)**와 **운송(transport)**이라는 핵심 영역—를 처음부터 오직 '승객(commuters)을 태워 나르는 일' 하나만을 위해 좁게 설계하지 않았기 때문이다. 대신 우버는 그것을 훨씬 넓게 바라보았다. **"이것은 하나의 운송 메커니즘이자 운송 플랫폼이다. 사람부터 시작해 무엇이든 한 곳에서 다른 곳으로 옮길 수 있다."**

바로 이 설계 관점 덕분에 우버는 승객을 실어 나르는 본래 목적을 넘어 택배·배송 같은 **물품 운송 서비스(courier services)**나 **음식 배달 서비스(food services)**로 **빠르게** 사업을 넓힐 수 있었다. 핵심 자산이 이미 일반적으로 구축되어 있었기에, 그 위에 구체적인 개별 응용 서비스만 빠르게 올려 붙이면 되었기 때문이다. 이처럼 핵심 자산 위에서 여러 참여자가 만나고 응용이 뻗어 나가는 플랫폼의 사례는 주변에 많다. **에어비앤비(Airbnb)**나 **페이스북(Facebook)** 역시 같은 의미에서 플랫폼이다.

> **[해설] 우버의 서비스 확장에 대하여**  
> 이 강의는 우버가 핵심 운송·운전자 자산을 바탕으로 물품 배송과 음식 배달 서비스로 빠르게 확장했다는 설계 원리를 짚고, 뒤이어 품질 속성 대목에서도 "Eats나 택배(courier) 같은 서비스"를 언급한다. 구체적인 시기는 강의에 나오지 않는다. 외부 자료로 보면, 음식 배달은 2014년 8월 미국 산타모니카에서 UberFRESH라는 점심 배달 실험으로 시작해 2015년 4월 무렵 UberEATS로 이름을 바꿨다. 물품 배송은 UberRUSH(2014년 뉴욕 시범, 2018년 종료)를 거쳐 2020년 4월 무렵 개인 간 물품 배달인 Uber Connect로 이어졌고, 2024년 12월 Uber Courier로 이름이 바뀌었다[^3].

### 2.2 한 칸씩 그려 보는 차량 호출 플랫폼의 컨텍스트 다이어그램

이제 우리가 우버 같은 차량 호출 플랫폼을 직접 개발해야 한다고 가정하고, 백지 위에 컨텍스트 다이어그램을 한 칸씩 그려 보자.

**첫째, 가운데에 우리가 만들 시스템을 놓는다.** 이름은 '차량 호출 플랫폼(ride-hailing platform)'이다. 이 시스템을 둘러싼 붉은 원이 바로 우리가 책임지고 개발할 영역과 바깥세상을 가르는 경계선이다.

**둘째, 사람 행위자(human actors)를 찾는다.** 누가 이 플랫폼을 직접 쓰는가? 두 부류의 사람이 곧바로 떠오른다. 차를 부르는 **승객(commuter)**과 차를 몰고 손님을 태우는 **운전자(driver)**다.

**셋째, 사람 행위자와 시스템 사이를 오가는 데이터 흐름을 그린다.** 승객과 운전자 쪽에서 어떤 정보가 오가는지 하나씩 짚어 보면 다음과 같다.

- **승객(Commuter) ↔ 차량 호출 플랫폼:**
  - 먼저 승객은 서비스에 등록하기 위해 **개인 계정 정보(personal account information)**를 시스템으로 보낸다.
  - 차가 필요할 때는 **호출 요청(ride request)**을 보내고, 요금을 내기 위해 **결제 정보(payment information)**를 보낸다(환불 정보도 함께 오갈 수 있다).
  - 반대로 시스템은 승객에게 **호출 요청 상태 정보(ride request status information)**와 **확인 정보(confirmation information)**를 되돌려 준다.
- **운전자(Driver) ↔ 차량 호출 플랫폼:**
  - 운전자는 플랫폼에 등록하기 위해 **운전자 계정 정보(driver account information)**와 자신이 모는 **차량 정보(vehicle information)**를 시스템에 보낸다.
  - 호출이 들어왔을 때는 그 운행을 **수락하거나 거절하는 응답(accept or reject)**을 시스템으로 보낸다.

여기서 두 가지를 짚어 두자. 하나는 이 그림의 성격이고, 다른 하나는 이 강의가 직접 *"pay attention to the arrows"*(화살표에 주의하라)라고 당부한 점이다.

1. **이 그림은 '데이터 흐름'만 보여 줄 뿐, 시간 순서나 동작 절차를 보여 주지 않는다.** "승객이 등록한 다음 호출하고, 그다음 운전자가 수락하고, 그다음 결제가 일어난다"는 순서(interaction sequence)는 컨텍스트 다이어그램의 역할이 아니다. 이 단계에서는 어떤 데이터가 누구에게서 누구로 흘러가는지만 포착한다.
2. **화살표의 방향을 정확하게 그려야 한다.** 계정 정보·호출 요청·결제 정보는 승객에서 시스템으로 향하는 화살표이고, 요청 상태·확인 정보는 시스템에서 승객으로 향하는 화살표다. [해설] 방향이 뒤집히면 누가 무엇을 주고 누가 받는지가 거꾸로 읽힌다.

**넷째, 사람 행위자 말고 다른 외부 실체(external entities)를 찾는다.** 승객과 운전자만으로는 차를 부를 수 없다. 바깥에 이미 존재하는 어떤 시스템·센서·기관과 손잡아야 할까? 강의에서 나온 외부 실체는 네 가지다(아래 각 항목의 쓰임 설명은 [해설]).

- **GPS:** 승객과 운전자의 현재 위치를 파악하기 위한 위치 정보 체계.
- **은행(Banks):** 결제를 처리하는 은행 쪽 시스템.
- **지도(Maps):** 도로망과 경로, 출발지·목적지 좌표를 보여 줄 지도 시스템.
- **규제 기관(Regulatory bodies):** 연동해야 할 수도 있는 규제 기관. 어떤 기관과 무엇을 주고받을지는 고객에게 물어 확인할 대상이다.

물론 이것이 전부는 아니다. 더 많은 외부 실체가 있을 수 있다. 중요한 것은 처음부터 완벽한 목록을 점치려 애쓰기보다 **일단 눈에 보이는 것부터 그려 넣고**, 그 그림을 들고 고객(발주처)을 찾아가 묻는 것이다. *"혹시 우리가 연동해야 할 규제 기관이 또 있나요?"* 이렇게 질문을 던지고 답을 들으며 그림을 **반복해서 다듬어(iterating)** 나가는 것이 정석이다.

참고로 교육용으로 그린 그림은 단순해 보이지만, 실무에서는 행위자와 상호작용을 필요에 따라 더 촘촘하게 추가할 수 있다. 다만 이때도 반드시 지켜야 할 원칙이 있다. **그림은 작고, 높은 수준(high level)으로 유지해야 한다는 점**이다. 너무 잘게 쪼개지 않고 큰 윤곽을 유지한 상태에서 이제 진짜 중요한 일—**"이 빨간 경계 원 안에 정확히 무엇이 들어갈 것인가?"**를 묻는 질문 공세—로 넘어간다.

<svg viewBox="0 0 420 770" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="차량 호출 플랫폼 컨텍스트 다이어그램">
<defs>
<marker id="cmu2a_blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" /></marker>
<marker id="cmu2a_amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" /></marker>
<marker id="cmu2a_slate" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" /></marker>
<marker id="cmu2a_slate_s" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 10 1 L 0 5 L 10 9 z" fill="#94a3b8" /></marker>
</defs>
<rect x="0" y="0" width="420" height="770" rx="12" fill="#0f172a"/>
<text x="210" y="28" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">차량 호출 플랫폼</text>
<text x="210" y="50" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">컨텍스트 다이어그램</text>
<text x="210" y="72" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">(데이터 흐름 중심)</text>
<text x="210" y="98" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">빨간 원 = 우리가 개발할 시스템 경계</text>
<text x="210" y="118" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">화살표 = 데이터 흐름의 방향</text>
<rect x="16" y="138" width="186" height="74" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
<text x="109" y="164" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">GPS</text>
<text x="109" y="186" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">외부 센서 · 피드</text>
<rect x="218" y="138" width="186" height="74" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
<text x="311" y="164" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">지도 (Maps)</text>
<text x="311" y="186" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">외부 지도 시스템</text>
<rect x="16" y="331.0" width="108" height="118" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<circle cx="70" cy="359.0" r="12" fill="#0284c7"/>
<text x="70" y="387.0" fill="#e0f2fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">승객</text>
<text x="70" y="407.0" fill="#e0f2fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">(Commuter)</text>
<text x="70" y="429.0" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">사람 행위자</text>
<rect x="296" y="331.0" width="108" height="118" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<circle cx="350" cy="359.0" r="12" fill="#0284c7"/>
<text x="350" y="387.0" fill="#e0f2fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">운전자</text>
<text x="350" y="407.0" fill="#e0f2fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">(Driver)</text>
<text x="350" y="429.0" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">사람 행위자</text>
<circle cx="210" cy="390" r="70" fill="#1e293b" stroke="#ef4444" stroke-width="3"/>
<text x="210" y="376" fill="#fef2f2" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">차량 호출 플랫폼</text>
<text x="210" y="398" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(Ride-Hailing</text>
<text x="210" y="418" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">Platform)</text>
<text x="210" y="440" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">범위 안</text>
<line x1="124" y1="362" x2="138" y2="362" stroke="#38bdf8" stroke-width="2" marker-end="url(#cmu2a_blue)"/>
<text x="70" y="253" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">개인 계정 정보</text>
<text x="70" y="273" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">호출 요청</text>
<text x="70" y="293" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">결제 정보</text>
<line x1="138" y1="418" x2="124" y2="418" stroke="#fbbf24" stroke-width="2" marker-end="url(#cmu2a_amber)"/>
<text x="70" y="465" fill="#fde68a" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">호출 요청</text>
<text x="70" y="485" fill="#fde68a" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">상태 정보</text>
<text x="70" y="505" fill="#fde68a" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">확인 정보</text>
<line x1="296" y1="390" x2="282" y2="390" stroke="#38bdf8" stroke-width="2" marker-end="url(#cmu2a_blue)"/>
<text x="350" y="253" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">운전자 계정 정보</text>
<text x="350" y="273" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">차량 정보</text>
<text x="350" y="293" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">호출 수락</text>
<text x="350" y="313" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">또는 거절</text>
<line x1="109" y1="212" x2="170" y2="330" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#cmu2a_slate)" marker-start="url(#cmu2a_slate_s)"/>
<line x1="311" y1="212" x2="250" y2="330" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#cmu2a_slate)" marker-start="url(#cmu2a_slate_s)"/>
<rect x="16" y="548" width="186" height="100" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
<text x="109" y="576" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">은행 (Banks)</text>
<text x="109" y="598" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">외부 결제 시스템</text>
<rect x="218" y="548" width="186" height="100" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
<text x="311" y="572" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">규제 기관</text>
<text x="311" y="594" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">(Regulatory)</text>
<text x="311" y="618" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">외부 규제 · 행정 실체</text>
<line x1="170" y1="450" x2="109" y2="548" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#cmu2a_slate)" marker-start="url(#cmu2a_slate_s)"/>
<line x1="250" y1="450" x2="311" y2="548" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#cmu2a_slate)" marker-start="url(#cmu2a_slate_s)"/>
<text x="210" y="684" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">※ 데이터 흐름만 표시(상호작용 순서 아님).</text>
<text x="210" y="706" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">[해설] 외부 4개 실체와의 구체적 데이터</text>
<text x="210" y="728" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">방향·라벨은 강의에서 지정하지 않아</text>
<text x="210" y="750" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">양방향 연결로 표시함.</text>
</svg>

---

## 3. 이 그림은 누구를 이롭게 하는가: 행위자 너머의 사업 가치 찾기

컨텍스트 다이어그램을 한 번 그려 놓고 나면, 곧바로 짚고 넘어가야 할 질문이 있다. **"우리가 만들 이 시스템은 대체 누구에게 가치(value)를 주는가?"**

소프트웨어를 개발한다는 것은 남에게 가치를 주는 시스템을 만드는 일이다. 만약 누구에게도 가치를 주지 못하는 앱을 만든다면, 만든 사람 자신도 만족스럽지 못할 것이다. 그래서 아키텍트는 반드시 **사업 가치(business value)**가 무엇이며, **누가 이 시스템 덕분에 득을 보는지** 알아야 한다.

누가 혜택을 보느냐고 물으면 흔히 **"모든 행위자(all the actors)"**라는 답이 먼저 떠오르지만, 이 강의는 거기서 한 걸음 더 나아간다. **"모든 행위자, 그리고 그 이상(All the actors, and more)."**

다만 이어진 질문에 답하면서 이 강의는 한 가지 섬세한 예외도 분명히 짚는다. **시스템이 주는 가치가 언제나 그림에 그려진 '행위자 자신'에게 직접 돌아가는 것은 아닐 수 있다**는 점이다. 두 가지 사례를 보자.

- **데이터베이스에 정보를 보내기만 하는 시스템:** 우리가 만드는 소프트웨어가 그저 어떤 데이터베이스(DB) 안으로 데이터를 밀어 넣기만 하는 역할이라고 해 보자. 그렇다면 이 시스템 덕분에 득을 보는 존재는 DB 그 자체일까? 아니다. 정작 가치를 얻는 것은 **그 데이터베이스에 쌓인 정보를 꺼내 쓰는 다른 애플리케이션들**이다. 결국 어떤 가치로 이어지기는 하지만, 그 수혜자가 다이어그램에 직접 맞닿아 있는 행위자 자신은 아닐 수 있다.
  > **[차량 호출 플랫폼으로 연결하면]**  
  > 차량 호출 플랫폼 내부의 운행 기록 수집 모듈이 모든 탑승 이력을 사내 데이터 저장소로 보내기만 한다면, 그 저장소 자체가 기뻐하는 것이 아니다. 그 데이터를 읽어 승객·운전자 정산을 처리하거나 수요 예측을 돌리는 다른 사내 시스템과 부서들이 비로소 가치를 얻는다.
- **오픈소스 프로젝트(open-source project):** 누가 이 소프트웨어를 가져다 쓸지 미리 다 알 수 없는 오픈소스 프로젝트에서도 상황은 비슷하다. 특정 수혜자 이름을 일일이 지목할 수는 없더라도, **"이 프로젝트가 어떤 이득을 주는가"**만큼은 분명하게 기술할 수 있어야 한다. 애초에 어딘가에 가치가 있다고 믿기 때문에 만드는 것이기 때문이다.
  > **[차량 호출 플랫폼으로 연결하면]**  
  > 만약 차량 호출 플랫폼 팀이 경로 탐색 보조 도구나 위치 좌표 변환 유틸리티를 오픈소스로 공개한다면, 전 세계 어떤 앱 개발자가 그것을 가져다 쓸지 미리 알지 못해도 "개발자들이 중복 구현을 줄이고 위치 처리 정확도를 높일 수 있다"는 가치 자체는 설명할 수 있어야 한다.

이제 우리의 중심 예시인 **차량 호출 플랫폼**으로 돌아와, 컨텍스트 다이어그램 속 각 실체와 그 너머의 수혜자가 얻는 가치를 하나씩 짚어 보자.

1. **행위자들이 얻는 가치:**
   - **승객(Commuter):** 한 장소에서 다른 장소로 이동하는 **편의(convenience)**를 얻는다.
   - **운전자(Driver):** 승객을 연결받아 **더 많은 수입(more income)**을 올린다.
   - **은행(Banks):** 플랫폼에서 일어나는 수많은 결제 덕분에 **더 많은 거래와 사업 기회(more business)**를 얻는다.
   - **지도(Maps — 만약 구글 맵이라면):** 플랫폼이 오가는 이동 과정에서 **데이터와 실시간 교통 상황 정보(traffic data)**를 추가로 얻을 수 있다.
   - **플랫폼 회사 자신(우리 회사):** 승객과 운전자를 이어 준 대가로 일정 **몫(a cut)**을 얻는다.
2. **행위자 너머의 수혜자 ("그리고 그 이상"):**
   - **지역 상점(Local businesses):** 사람들이 이동 수단을 더 쉽게 얻어 훨씬 빠르게 찾아올 수 있고, 이용 가능한 교통편이 늘어나면서 손님이 더 많이 방문하게 된다.
   - **도시(Cities):** 시민들에게 이동 수단의 대안이 생기므로, 시 정부가 공영 버스 등을 무작정 더 많이 증차하지 않아도 되는 부담 완화 효과를 얻는다.
   - **교통 생태계(Transport ecosystem):** 여러 교통수단이 어우러지는 **멀티모달 통합(multimodal integration)**을 갖춘 교통 생태계도 이득을 본다.

이처럼 컨텍스트 다이어그램 한 장을 그려 놓고 각 연결선과 바깥세상을 찬찬히 따라가 보면, 이 소프트웨어가 사회와 시장에 만들어 내는 사업 가치를 상당 부분 자연스럽게 끌어낼 수 있다.

---

## 4. 그림이 끌어내는 범위의 질문들: 아키텍트는 왜 요구사항 단계에 들어가는가

### 4.1 업무 분석가와 아키텍트가 함께 그림을 그리는 이유

보통 고객이 새 소프트웨어를 만들어 달라고 찾아오면, 개발 팀 안에는 고객으로부터 요구사항을 이끌어 내고(elicit) 문서로 정리하는 전문가—흔히 **업무 분석가(business analyst)** 등—가 있다. 그런데 이들의 시선은 주로 **"시스템이 무슨 기능을 해야 하는가"**라는 **기능 요구사항(functional requirements)**에 머문다. 시스템이 얼마나 빨라야 하고 얼마나 안전해야 하는지 같은 **품질 속성(quality attributes)**이나 바꿀 수 없는 **제약(constraints)**에 대해서는 깊이 알지 못하는 경우가 많다.

그래서 **소프트웨어 아키텍트 역시 요구사항 단계에 직접 참여해야 한다.** 기능 요구만 듣고 마는 것이 아니라, 기능 이외에 이 소프트웨어가 감당해야 할 **사업 요구(business needs)**까지 아우른 **완전한 그림(complete picture)**을 얻기 위해서다. 아키텍트와 업무 분석가가 머리를 맞대고 **가장 먼저 함께 그리는 그림**이 바로 이 **컨텍스트 다이어그램**이다.

설령 완전히 새로운 거대 시스템을 만드는 일이 아니라, **이미 돌아가는 기존 시스템에 기능 몇 개를 더 붙이는 개선 작업**이라 하더라도 마찬가지다. 내가 손대어 만들어야 할 범위가 어디까지인지, 그리고 그 작은 기능이 상호작용해야 할 외부 실체는 무엇인지를 먼저 이해해야 하기 때문이다.

### 4.2 경계선과 연결선에서 쏟아지는 다섯 갈래 범위 질문

컨텍스트 다이어그램의 진가는 그림을 다 그린 순간부터 발휘된다. 그 그림을 들여다보면, 단순히 *"차량 호출 앱을 하나 만들어 달라"*는 말만 들었을 때는 좀처럼 떠오르지 않았을 핵심 질문들이 줄줄이 튀어나오기 때문이다.

**① 지도: 바깥에서 빌려 쓸 것인가, 직접 만들 것인가?**  
컨텍스트 다이어그램을 보자마자 아키텍트의 머리에 떠오르는 첫 번째 질문은 이것이다. **"지도를 우리가 직접 개발할 것인가, 아니면 구글 맵(Google Maps) 같은 외부 지도를 쓸 것인가?"** 즉, 지도가 우리 시스템의 **범위 안(in scope)**인가 **범위 밖(outside scope)**인가를 묻는 것이다.

만약 고객이 *"아뇨, 우리는 우리만의 독자적인 지도 시스템을 만들고 싶습니다"*라고 답한다면 어떤 일이 벌어질까? 컨텍스트 다이어그램 바깥에 있던 '지도' 상자는 지워지고, **지도 기능 전체가 빨간 경계선 원 안쪽으로 들어온다.** 지도를 우리가 직접 개발해야 하므로 그만큼의 일이 우리 범위로 들어온다. 반대로 외부 지도를 쓰기로 했다면 질문은 한 걸음 더 들어간다. **구글 맵 하나만 쓸 것인가, 다른 지도 시스템도 함께 쓸 것인가?** 예컨대 **어떤 나라에서는 구글 맵을 사용할 수 없을 수도 있는데**, 우리 서비스가 그런 지역까지 지원해야 하는가? 이 질문들의 답을 하나씩 얻어 갈수록 시스템의 진짜 범위가 또렷해진다.

> **[해설] 구글 맵 제한 지역에 대하여**  
> 이 강의에서는 특정 국가 이름을 들지 않고 "어쩌면 어떤 나라에서는 구글 맵을 쓸 수 없을지 모른다"라고만 언급했다. 진출 지역의 규제나 지도 서비스 가용 여부에 따라 외부 실체 목록 자체가 달라질 수 있다는 점을 환기하는 취지다.

<svg viewBox="0 0 420 676" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="경계가 움직이면 범위가 바뀐다">
<defs>
</defs>
<rect x="0" y="0" width="420" height="676" rx="12" fill="#0f172a"/>
<text x="210" y="30" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">경계선 하나가 범위와</text>
<text x="210" y="52" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">일의 양을 바꾼다</text>
<text x="210" y="74" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">'지도'의 위치</text>
<rect x="16" y="96" width="388" height="250" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
<text x="210" y="124" fill="#38bdf8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">경우 A: 외부 지도 사용</text>
<text x="210" y="146" fill="#38bdf8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">(범위 밖)</text>
<circle cx="130" cy="236" r="70" fill="#0f172a" stroke="#ef4444" stroke-width="2.5"/>
<text x="130" y="230" fill="#f8fafc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">차량 호출 플랫폼</text>
<text x="130" y="252" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">직접 개발 영역</text>
<rect x="250" y="206" width="130" height="64" rx="8" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/>
<text x="315" y="232" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">외부 지도</text>
<text x="315" y="254" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(구글 맵 등)</text>
<line x1="200" y1="236" x2="250" y2="236" stroke="#94a3b8" stroke-width="2"/>
<text x="210" y="310" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">→ API 연동만 설계</text>
<text x="210" y="332" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">지도 자체는 개발하지 않음</text>
<text x="210" y="374" fill="#fbbf24" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">▼</text>
<rect x="16" y="390" width="388" height="270" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
<text x="210" y="418" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">경우 B: 자체 지도 개발</text>
<text x="210" y="440" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">(범위 안으로 편입)</text>
<circle cx="210" cy="540" r="88" fill="#0f172a" stroke="#ef4444" stroke-width="2.5"/>
<text x="210" y="502" fill="#f8fafc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">차량 호출 플랫폼</text>
<rect x="140" y="518" width="140" height="64" rx="6" fill="#7f1d1d" stroke="#f87171" stroke-width="1.5"/>
<text x="210" y="544" fill="#fef2f2" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">+ 지도 시스템</text>
<text x="210" y="566" fill="#fecaca" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(직접 개발 범위)</text>
<text x="210" y="620" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">→ 외부 실체에서 사라지고</text>
<text x="210" y="642" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">우리가 직접 구축해야 함</text>
</svg>

**② 빠뜨린 기존 외부 시스템과 API 방식**  
두 번째 질문은 외부 시스템과의 연결 방식을 파고든다. 먼저 고객이 미처 말하지 않아 그림에서 빠진 기존 시스템은 없는지 묻는다. 예컨대 회사에 이미 **판매 시스템(sales system)** 같은 것이 있어서, 오늘 우리 플랫폼에 호출 요청이 몇 건 들어왔고 그중 몇 건을 처리했는지 알려 주어야 하는 상황은 없는가?

만약 그런 시스템이 있다고 답이 돌아오면, 곧바로 다음 질문이 이어진다. **"어떻게 상호작용할 것인가?"** 세 가지 길이 열려 있다.
- 우리가 데이터를 그냥 공유 데이터베이스에 써 넣기만 할 것인가?
- 판매 시스템 쪽이 열어 둔(exposed) API를 우리가 호출해 보낼 것인가?
- 반대로 우리가 판매 시스템 쪽에 API를 만들어 제공해야 하는가?

은행 같은 외부 결제 기관과도 마찬가지로, 어떤 API를 통해 어떻게 주고받을지를 처음부터 물어야 한다.

**③ 데이터베이스(DB)의 유무와 저장할 정보의 크기·종류**  
승객과 운전자의 개인 정보, 과거 이용 이력 등을 저장하고 조회하려면 데이터베이스가 반드시 필요하다. 여기서 아키텍트는 묻는다. **"운전자와 승객 정보를 담을 데이터베이스가 이미 존재하는가?"** 만약 없다면, 데이터베이스를 설계하고 아키텍처를 세우는 일—테이블을 만들고 스키마(schema)를 정의하며, 우리가 다룰 거래(transactions)와 상호작용 유형에 맞춰 SQL 데이터베이스를 쓸지 NoSQL 데이터베이스를 쓸지 종류를 고르는 일—까지 모두 우리 범위 안으로 들어온다.

함께 물어야 할 질문이 더 있다. **"어떤 종류의 정보를, 얼마나 많이 저장해야 하는가?"** 단순히 이름과 연락처만 저장하는 경우와 그보다 훨씬 방대하고 다양한 정보를 저장하는 경우는 데이터베이스 설계 자체가 완전히 달라지기 때문이다.

**④ 분석(Analytics) 기능과 타 팀과의 병렬 개발**  
이런 시스템에는 분석이 반드시 필요하다. 특히 **플랫폼 소프트웨어**에서 **분석(analytics)**은 핵심 요소 가운데 하나다. 플랫폼이 쌓은 데이터를 분석해 그 결과를 다시 플랫폼으로 되먹임(feedback)으로써 서비스를 개선해야 하기 때문이다. 강의는 이 분석에 대개 *"machine language"* 같은 것이 들어간다고 말한다.

> **[해설]** 분석을 되먹여 플랫폼을 개선한다는 앞뒤 맥락으로 보면 머신러닝(machine learning)을 뜻했을 가능성이 크다. 다만 이것은 글쓴이의 해석이며, 강의에서 실제로 쓴 말은 "machine language"다.

아키텍트는 여기서 두 가지를 묻는다. **"이 분석 기능을 우리가 직접 개발해야 하는가, 아니면 다른 팀이 개발하는가?"** 만약 다른 팀이 맡는다면, 어떻게 상호작용할 것인지가 관건이 된다. 특히 **그 팀이 우리와 동시에(in parallel) 개발을 진행하고 있다면**, 정기적으로 회의를 열어 API와 주고받을 정보 형식을 함께 설계해 나가야 하므로 협업·상호작용 방식 자체가 달라진다.

**⑤ 관리자(Admin) 기능**  
마지막으로 놓치기 쉬운 행위자가 하나 더 있다. **"플랫폼을 관리하고 운영할 관리자 기능이 필요한가? 그렇다면 컨텍스트 다이어그램에 '관리자(admin)'라는 행위자를 하나 더 넣어야 하는가?"**

단 한 장의 컨텍스트 다이어그램을 앞에 두고 던진 질문만으로도 이처럼 수많은 쟁점이 쏟아져 나온다. 처음에 그저 *"차량 호출 앱 하나 만들어 주세요"*라는 한 마디만 들었다면, 지도 제작 여부, 사내 판매 시스템 연동 API, DB 스키마 설계 책임, 병렬 개발 중인 분석 팀과의 조율, 관리자 행위자의 존재 같은 핵심 질문들에 도달하지 못했을 수도 있다.

---

## 5. '얼마나 잘'을 캐묻는 질문들: 품질 속성과 제약, 그리고 애자일 환경

### 5.1 '얼마나 많이, 얼마나 자주, 얼마나 크게'로 뽑아내는 품질 속성

컨텍스트 다이어그램으로 시스템의 경계와 범위를 짚어 냈다면, 이제 같은 그림을 **다시 한 번** 들여다볼 차례다. 이번 목적은 기능 목록이 아니라 이 시스템의 **아키텍처적 함의와 요구사항(architectural implications and requirements)**—즉 성능(performance), 보안(security), 트래픽 패턴(traffic patterns), 처리량(throughput), 확장성(scalability) 같은 시스템 전체의 성질(**품질 속성**, quality attributes)—을 끌어내는 것이다.

품질 속성을 이끌어 내기 위해 아키텍트가 던지는 질문에는 공통된 형태가 있다. 바로 **"얼마나 많이(how many)", "얼마나 자주(how often)", "얼마나 크게(how large)"**다. 사용자가 몇 명인지, 오가는 메시지의 크기는 얼마나 되는지, 저장해야 할 레코드가 몇 건인지 숫자와 규모를 캐묻는 질문들이다.

이 강의에서 나온 질문들을 차량 호출 플랫폼의 컨텍스트 다이어그램에 얹어 보면, 평범한 질문 하나하나가 어떻게 구체적인 품질 속성으로 번역되는지 한눈에 보인다.

- **응답 대기 시간(타임아웃)과 응답 속도:** 승객이 호출을 눌렀을 때 요청이 무효(invalid)가 되기 전까지 얼마나 기다리게 할 것인가? 또 시스템은 얼마나 빠르게 응답해야 하는가? → 응답 시간 요구와 요청의 유효 시간.
- **동시 사용자 수 대 전체 사용자 수:** 지금 당장 동시에 접속해 움직이는 운전자와 승객은 몇 명이고, 전체 누적 가입자는 몇 명인가? 이 둘은 **모두 중요**하다. 동시 사용자 수는 시스템이 실행되는 동안(runtime) 감당해야 할 부하에 영향을 주고, 전체 사용자 수는 저장소(storage) 설계에 영향을 주기 때문이다. 또한 "지금은 수천 명 수준이라 해도 앞으로 얼마나 성장할 것으로 보는가?"를 물어야 영속 저장(persistency) 설계의 **확장성(scalability)**을 잡을 수 있다.
- **피크 시간(Peak times)과 가용성(Availability):** 출퇴근 시간처럼 요청이 몰리는 피크 시간은 언제이며 부하를 어떻게 관리할 것인가? 이 서비스는 항상 켜져 있어야 하는가, 아니면 약간의 중단 시간(downtime)을 허용할 수 있다면 어느 수준까지 감내할 수 있는가? → **가용성**과 부하 관리.
- **정보 저장량:** 승객과 운전자에 관해 얼마나 많은 양의 정보를 저장하는가? → 저장소 **확장성**.
- **위치 정확도:** GPS와 지도로 잡는 승객·운전자의 위치는 얼마나 정밀해야 하는가? → **정확도(accuracy)**라는 품질 속성.
- **정보 공개 범위와 결제 안전:** 승객의 개인 정보를 운전자에게 전부 보여 줄 것인가, 일부만 보여 줄 것인가? → **프라이버시(privacy)**. 결제 정보와 은행 거래는 얼마나 안전하게 보호해야 하는가? → **보안(security)**.
- **지원 플랫폼, 결제 수단, 미래 서비스 확장:** 어떤 종류의 모바일·웹 플랫폼을 지원할 것인가? 어떤 결제 수단들을 붙일 것인가? 그리고 나중에 **음식 배달(Eats)이나 택배(courier) 같은 새로운 역량**을 플랫폼 위에 더할 계획이 있는가? → **수정 용이성(modifiability)**과 **확장성(extensibility)**.

> **[해설] '나중에 무엇을 더할 것인가'와 플랫폼 사고**  
> 2장에서 우버가 핵심 운송 자산을 일반적으로 설계해 음식 배달과 택배로 빠르게 확장했음을 살펴보았다. 아키텍트가 초기 단계에 "나중에 어떤 역량을 추가할 것으로 예상하는가?"라고 묻는 순간, 그 미래 계획은 단순한 희망 사항이 아니라 지금 당장 시스템 뼈대에 심어야 할 **수정 용이성과 확장성 요구**로 바뀐다.

물론 위의 질문들은 수많은 질문 가운데 일부일 뿐이다. 핵심은 아키텍트가 언제나 **품질 속성의 관점**에서 질문을 던져야 한다는 데 있다. 이 질문들의 답이야말로 실제로 시스템이 어떻게 설계되고 어떤 아키텍처를 갖출지에 **거대한 영향**을 미치기 때문이다. 이 대목에서 강의는 공동 강사(Scott Pavetti)와 조교들에게 보탤 것이 있는지 묻고, "보탠다는 건 내가 말한 것을 지우거나 고치는 것도 포함한다"고 덧붙인다.

여기서 이 강의가 **절대 혼동하지 말라("Don't make that mistake ever")**고 못 박는 핵심 구분이 하나 있다. **품질 속성(quality attributes)과 시스템 관심사(systemic concerns)는 같은 뜻이지만, 품질 보증(Quality Assurance, QA)과는 전혀 다른 개념이다.**

| 질문 (차량 호출 플랫폼 예시) | 연결되는 품질 속성 / 시스템 관심사 | 설계에 미치는 아키텍처적 함의 |
| :--- | :--- | :--- |
| 총 운전자·승객 수, 향후 성장 예상, 저장 정보량은? | **확장성 (Scalability)** | 영속 저장소(DB) 구조와 장기 데이터 증가 감당 설계 |
| 동시 접속 운전자·승객 수와 피크 시간 부하는? | **성능 (Performance)** | 실행 중(runtime) 부하 처리와 자원 배분 |
| 응답 시간 요구와 요청 무효화 전 대기 시간(타임아웃)은? | 응답 시간·요청 유효 시간 ([해설] 흔히 **성능**으로 묶음) | 지연 시간 제한, 응답 유효 시간 관리 |
| 항상 켜져 있어야 하나, 다운타임 허용 수준은? | **가용성 (Availability)** | 장애 허용과 무중단 운영 수준 결정 |
| 위치 정보를 얼마나 정밀하게 맞추어야 하나? | **정확도 (Accuracy)** | GPS·지도 위치 처리 정밀도 확보 |
| 승객 정보를 운전자에게 어디까지 보여 주나? | **프라이버시 (Privacy)** | 행위자 간 노출 정보 통제와 마스킹 |
| 결제 정보와 은행 거래는 어떻게 보호하나? | **보안 (Security)** | 금융 거래와 민감 정보 보호 메커니즘 |
| 어떤 모바일·웹 플랫폼과 결제 수단을 지원하나? | **수정 용이성 · 확장성 (Modifiability · Extensibility)** | 프론트엔드·결제 모듈 교체와 추가가 쉬운 구조 |
| 나중에 Eats·택배 같은 새 서비스를 더할 계획인가? | [해설] **수정 용이성 · 확장성** | 특정 앱에 묶이지 않는 범용 플랫폼 핵심 자산 설계 |

[해설] 셋째 열(설계에 미치는 함의)과 피크 시간·응답 시간·미래 서비스 행의 속성 연결은 강의가 이름을 직접 붙이지 않은 부분을 정리한 것이다. 강의가 속성 이름을 직접 붙인 것은 총수·저장량(확장성), 동시 사용자 수(성능), 가용성, 위치 정확도(정확도), 공유 범위(프라이버시), 결제·은행 거래(보안), 지원 플랫폼(수정 용이성), 결제 수단(확장성·수정 용이성)이다.

| 구분 | 품질 속성 (Quality Attributes = 시스템 관심사) | 품질 보증 (Quality Assurance, QA) |
| :--- | :--- | :--- |
| **핵심 질문** | 시스템이 본래 갖추어야 할 **성질**은 무엇인가? | 만들어진 시스템이 요구대로 동작하는지 **어떻게 검증**할 것인가? |
| **다루는 내용** | 성능, 보안, 가용성, 확장성, 수정 용이성, 정확도, 프라이버시 등 | 시스템 테스트, 통합 테스트, 부하·성능·보안·사용성 테스트 등 검증 활동 |
| **다루는 시점** | 요구·맥락 파악 단계부터 끌어내어 **아키텍처 설계의 입력**으로 사용 | 아키텍처 문서와 **병행해 테스트 계획·케이스**를 작성하고 **구현 후 실행** |
| **주의사항** | QA와 절대 같은 뜻으로 섞어 쓰지 말 것 | (6장에서 다루는 V-모델 검증 활동이 바로 이 QA 영역에 해당) |

### 5.2 바꿀 수 없는 조건들: 여러 방향에서 오는 제약

컨텍스트 다이어그램 단계에서 아키텍트가 반드시 함께 캐내야 할 또 하나의 축은 **제약(constraints)**이다. 제약 역시 우리가 시스템을 개발하는 방식에 직접적인 영향을 미치기 때문이다.

제약은 크게 **기술 제약(technical constraints)**과 **사업 제약(business constraints)**으로 나뉜다.

- **기술 제약:** 예를 들어 프로젝트를 후원하는 회사나 고객이 전형적인 마이크로소프트 계열 회사(Microsoft shop)라고 해 보자. 그 회사는 개발자가 GCP(구글 클라우드 플랫폼)를 들고 오면 결코 반기지 않을 것이고, 모든 것을 **Azure 클라우드와 .NET, C#** 같은 기술 스택 위에서 개발하길 원할 것이다. 차량 호출 플랫폼을 만든다 해도 고객사가 이 환경 위에 있다면 클라우드와 언어 선택지는 처음부터 고정된다.
- **사업 제약:** 고객이 *"이 차량 호출 플랫폼은 반드시 우리 회사의 보안 표준과 내부 정책을 따라야 합니다"*라고 못 박는 경우를 생각해 보자. 이것은 특정 프로그래밍 언어나 클라우드를 강제하는 기술 제약이 아니라, 회사의 규정과 거버넌스에서 나오는 **사업 제약**이다.

이처럼 **제약은 아키텍트의 선택지를 제한한다.** 그리고 현실의 소프트웨어 개발에서는 제약이 없을 수가 없다. 앞서 1장에서도 짚었듯 완전히 백지상태에서 새로 짓는(greenfield) 소프트웨어를 만나는 일은 매우 드물고, 대부분 기존 시스템의 연장선 위에서 개발하기 때문이다.

1. **레거시 시스템(Legacy systems):** 기존 소프트웨어의 일부가 이미 만들어져 돌아가고 있고, 우리가 새로 만드는 소프트웨어는 반드시 **그 환경 안에 들어가 공존**해야 한다.
2. **오픈소스(Open-source)와 기성품(Off-the-shelf) 소프트웨어:** 이미 공개된 오픈소스나 시판 기성품 소프트웨어를 쓰기로 결정하면, 그 선택 자체가 곧 제약이 된다. 그 소프트웨어들은 이미 정해진 방식대로 만들어져 있기 때문에, 우리가 그것을 고른 이상 그 방식에 맞추어 따라가야 한다.
3. **자유가 주어졌을 때의 '자기 선택':** 심지어 아무런 외부 제한이 없는 자유가 주어졌을 때도 우리 스스로 제약이 만들어진다. 예를 들어 개발 팀이 **React** 프레임워크에 가장 익숙해서 프론트엔드를 React로 개발하기로 선택했다면, 그 순간부터 React는 **이번 프로젝트는 물론 향후 이어질 프로젝트들까지 묶는 제약**이 된다.

이처럼 제약은 고객의 기술 스택, 회사의 보안 정책, 기존 레거시 환경, 도입한 오픈소스·기성품, 그리고 우리 팀의 기술 선택까지 **매우 다양한 각도**에서 날아온다. 그러므로 아키텍트는 초기 요구사항을 모으는 바로 이 시점에 제약 조건들 역시 빠짐없이 함께 수집해 두어야 한다.

| 제약의 출처 | 구분 (기술·사업 외 칸은 [해설]) | 강의 속 사례 | 차량 호출 플랫폼에서의 모습 (예시) |
| :--- | :--- | :--- | :--- |
| **후원사·고객 기술 환경** | 기술 제약 | 마이크로소프트 계열 회사 → GCP 대신 Azure, .NET, C# 사용 요구 | 플랫폼 백엔드·인프라를 지정된 클라우드와 언어 스택 위에만 구축해야 함 |
| **회사 규정·정책** | 사업 제약 | *"이 플랫폼은 우리 회사의 보안 표준과 정책을 따라야 한다"* | 개인·결제 데이터 암호화, 접근 통제 등을 사내 보안 규정 틀 안에서 설계 |
| **기존 레거시 환경** | 환경 제약 | 이미 만들어진 레거시 시스템의 환경 안에 우리 소프트웨어가 존재해야 함 | 기존 사내 회원 DB나 회계·판매 시스템의 데이터 형식을 거스르지 못함 |
| **오픈소스·기성품 도입** | 도구 제약 | 오픈소스·기성품(off-the-shelf) 채택 시 그 도구가 짜인 방식을 따라야 함 | 외부 결제 게이트웨이나 지도 SDK가 정한 호출 규약과 제한에 맞추어야 함 |
| **팀의 자율적 선택** | 내부 제약 | 팀이 익숙한 React를 프론트엔드로 선택 → 이번·다음 프로젝트의 제약이 됨 | 승객·운전자 웹 포털을 React로 잡으면 이후 유지보수와 확장도 그 위에 묶임 |

<svg viewBox="0 0 420 784" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="한 장의 그림에서 나오는 네 가지">
<defs>
<marker id="cmu2c_arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" /></marker>
</defs>
<rect x="0" y="0" width="420" height="784" rx="12" fill="#0f172a"/>
<text x="210" y="30" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">컨텍스트 다이어그램</text>
<text x="210" y="52" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">한 장에서 끌어내는 네 가지</text>
<rect x="16" y="74" width="388" height="126" rx="12" fill="#1e293b" stroke="#ef4444" stroke-width="2.5"/>
<text x="210" y="106" fill="#fef2f2" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">컨텍스트 다이어그램</text>
<text x="210" y="130" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">시스템 경계 · 행위자</text>
<text x="210" y="152" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">외부 실체 · 데이터 흐름</text>
<text x="210" y="178" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(초기 아키텍트 참여 출발점)</text>
<line x1="210" y1="200" x2="210" y2="228" stroke="#38bdf8" stroke-width="2" marker-end="url(#cmu2c_arr)"/>
<rect x="16" y="236" width="388" height="118" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
<text x="32" y="262" fill="#38bdf8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700">1. 범위 질문 (Scope)</text>
<text x="32" y="286" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">지도 직접 개발 여부 · 기존 외부</text>
<text x="32" y="308" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">시스템과 API · DB 유무와 저장량</text>
<text x="32" y="330" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">· 분석 · 관리자</text>
<line x1="210" y1="354" x2="210" y2="370" stroke="#38bdf8" stroke-width="2" marker-end="url(#cmu2c_arr)"/>
<rect x="16" y="374" width="388" height="118" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
<text x="32" y="400" fill="#34d399" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700">2. 사업 가치 (Value)</text>
<text x="32" y="424" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">행위자(승객·운전자·은행·지도</text>
<text x="32" y="446" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">·플랫폼) + 행위자 너머</text>
<text x="32" y="468" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">(지역 상점·도시·교통 생태계)</text>
<line x1="210" y1="492" x2="210" y2="508" stroke="#38bdf8" stroke-width="2" marker-end="url(#cmu2c_arr)"/>
<rect x="16" y="512" width="388" height="118" rx="8" fill="#1e293b" stroke="#fbbf24" stroke-width="1.5"/>
<text x="32" y="538" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700">3. 품질 속성 (Quality Attributes)</text>
<text x="32" y="562" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">"얼마나 많이·자주·크게"</text>
<text x="32" y="584" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">→ 성능·확장성·가용성·정확도</text>
<text x="32" y="606" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">·프라이버시·보안·수정 용이성</text>
<line x1="210" y1="630" x2="210" y2="646" stroke="#38bdf8" stroke-width="2" marker-end="url(#cmu2c_arr)"/>
<rect x="16" y="650" width="388" height="118" rx="8" fill="#1e293b" stroke="#a78bfa" stroke-width="1.5"/>
<text x="32" y="676" fill="#c4b5fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700">4. 제약 (Constraints)</text>
<text x="32" y="700" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">기술 제약(Azure·.NET 등)</text>
<text x="32" y="722" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">사업 제약(보안 표준) · 레거시</text>
<text x="32" y="744" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">오픈소스/기성품 · 팀의 선택</text>
</svg>

### 5.3 요구가 매일 바뀌는 애자일·스타트업 환경에서는 어떻게 하나

이 강의에서도 바로 이런 질문이 나왔다.

> *"요구사항이 불확실하거나 계속 바뀌는 경우에도 이 순차적인 과정을 전부 다 따라야 하나요? 특히 사업 규칙이 끊임없이 바뀌는 빠른 속도의 스타트업에서는 컨텍스트 다이어그램과 설계가 그런 변화를 어떻게 수용하도록 만드나요?"*

대답은 명쾌하다. **요구사항이 불확실할 때는 폭포수(waterfall) 방식처럼 개발 프로세스의 처음부터 끝까지("nine yards")를 한 번에 일직선으로 따를 수는 없다.** 그런 상황에서는 **애자일(agile) 방법론**을 따라야 하며, 따라서 **아키텍처 역시 애자일해야 한다.**

핵심 원칙은 두 가지다.

1. **컨텍스트 다이어그램은 결코 한 번 그리고 끝나는 확정 문서가 아니다.** 이 그림은 프로젝트가 진행되면서 **계속 진화(keeps evolving)**한다. 아키텍처를 포함한 모든 산출물을 수시로 다시 꺼내 보고 고쳐 나가는 것이 애자일 환경에서의 작업 방식이다.
2. **그럼에도 아키텍처는 소프트웨어의 토대(foundation)이므로 나중에 바꾸기가 만만치 않다.** 바로 이 지점에서 아키텍트의 숙련된 전문성이 요구된다. 좋은 **설계 패턴(design patterns)**과 **원칙(principles)**을 써서 아키텍처를 유연하게 만들어야 하며, 특히 **수정 용이성(modifiability)** 속성이 결정적으로 중요해진다. 요구가 요동치는 환경에서는 많은 품질 속성 자체가 바뀔 수 있으므로, 아키텍트는 처음부터 기술이나 설계를 비교적 쉽게 갈아끼우고 바꿀 수 있도록 구조를 짜야 한다. 물론 결코 쉬운 일이 아니다. (참고로 강의는 애자일 아키텍처를 다루는 수업이 있을 수 있지만 거기서도 논리 아키텍처(logical architecture) 부분에만 초점을 둔다고 덧붙인다.)

> **[차량 호출 플랫폼으로 연결하면]**  
> 막 창업한 차량 호출 스타트업이 처음에는 승객 호출만 처리하려다가 몇 달 만에 음식 배달이나 사내 정산 연동을 붙이고 지도 공급업체까지 바꾸어야 한다면, 컨텍스트 다이어그램의 외부 실체와 경계선은 계속 다시 그려진다. 이때 플랫폼의 핵심 운송 로직이 특정 지도 업체나 특정 결제 방식에 꽉 묶여 있지 않고 수정 용이성을 갖도록 설계해 두어야만 바뀐 맥락을 버텨 낼 수 있다.

---

## 6. 컨텍스트 너머의 다음 걸음: 유스케이스·이벤트 모델링과 V-모델 검증

컨텍스트 다이어그램은 어디까지나 **높은 수준의 개관(high-level overview)**이다. 그 목적은 시스템의 **범위(scope)를 정의**하고 소프트웨어가 놓일 **환경(environment)을 이해**하는 데 있다. 그렇다면 맥락을 잡은 다음에는 무엇으로 넘어가야 할까? 이 초기 단계에서 함께 이루어지는 두 가지 핵심 활동이 **요구사항 모델링(유스케이스·이벤트 다이어그램)**과 **품질 보증(테스트 계획)**이다.

### 6.1 유스케이스와 세 가지 이벤트: 누가 시스템을 깨우는가

컨텍스트 다이어그램 바깥의 큰 윤곽이 잡히면, 구체적인 요구사항을 모델링하기 위해 **유스케이스(use cases)**(또는 **사용자 스토리**, user stories)와 시퀀스 다이어그램 같은 **이벤트 다이어그램(event diagrams)**을 사용한다.

- **유스케이스 / 사용자 스토리:** 행위자와 우리 시스템 사이에 실제로 어떤 상호작용이 일어나는지를 포착한다. 필요에 따라 형식 기술 언어(formal description languages)를 사용해 적기도 한다.
- **이벤트 다이어그램:** 한 걸음 더 들어가 **"무엇이, 또는 누가 이 유스케이스를 촉발(trigger)하는가?"**를 묻는다. 이 강의는 시스템을 깨우는 **이벤트(events)를 세 가지 종류**로 나눈다.
  1. **업무 이벤트(Business events):** 기능적인 측면에서 가장 핵심이 되는 이벤트다. 예컨대 *"판매가 발생했을 때(when a sale is made)"*나 *"보고서가 요청되었을 때(a report is requested)"*가 여기에 속한다. 차량 호출 플랫폼이라면 **"승객이 호출 버튼을 누를 때"**나 **"결제 요청이 들어올 때"**에 해당한다.
  2. **시간 이벤트(Temporal / time-based events):** 사람이 버튼을 눌러서 생기는 것이 아니라 **시계(clock)가 촉발**하는 이벤트다. 예를 들어 정해진 시각마다 돌아가는 **백업(backups)**이나 **백신 프로그램(antivirus software)**의 주기적 검사가 대표적이다. 차량 호출 플랫폼이라면 **매일 밤 자정에 실행되는 운전자 정산 배치나 일일 DB 백업**이 이에 해당한다.
  3. **신호(Signals):** 하드웨어 **센서(sensors), 스위치(switches), 각종 장치(devices)**, 혹은 **운영체제 신호(operating system signals)**가 촉발하는 이벤트다. 차량 호출 플랫폼이라면 **운전자 스마트폰 GPS 센서가 보내는 주기적 위치 신호**나 **앱이 백그라운드로 내려가거나 네트워크가 끊길 때 운영체제가 보내는 신호**가 대표적이다.

보통 개발자나 분석가는 승객·운전자 같은 **사람 행위자(human actors)**가 시스템을 어떻게 쓰는지에만 집중하기 쉽다. 하지만 강의는 **이런 입력들을 잊지 말라("Don't forget all these inputs")**고, 다른 트리거와 이벤트도 모델링하라고 당부한다. 시간 이벤트와 장치·OS 신호까지 모델링해야만, 우리 시스템이 온갖 외부 자극에 어떻게 반응해야 하는지 온전히 이해할 수 있기 때문이다.

> **[해설] 세 가지 이벤트 분류의 배경**  
> 강의는 이 세 갈래 구분의 출처를 밝히지 않았다. 업무 이벤트(business event)·신호 이벤트(signal event)·시간 이벤트(temporal event)를 이 이름으로 묶어 제시하는 가장 가까운 문헌은 칼 위거스(Karl Wiegers)와 조이 비티(Joy Beatty)의 『Software Requirements』 3판(2013)이다. 그보다 앞선 구조적 분석에서는 맥메너민(McMenamin)과 팔머(Palmer)의 『Essential Systems Analysis』(1984)가 이벤트 분할(event partitioning)에서 외부 이벤트와 시간 이벤트를 구분했지만, '신호'를 세 번째 종류로 두지는 않았다[^4].

이렇게 포착한 이벤트가 실제로 시스템 안에서 어떻게 실현되는지는 **시퀀스 다이어그램(sequence diagram)** 같은 이벤트 다이어그램으로 그린다. 강의는 **"고객이 돈을 인출한다(customer withdraws money)"**는 예시를 든다. 이것은 전형적인 **업무 이벤트** 기반의 유스케이스다. 고객이라는 행위자가 '돈 인출' 이벤트를 촉발하면, 이 유스케이스에 참여하는 시스템 실체들이 어떤 **순서(sequence)**와 **타이밍(timings)**으로 메시지를 주고받으며 기능을 실현하는지 한눈에 그려 낸다. 다만 요구사항 초기 단계에서 그리는 시퀀스 다이어그램 역시 상세 구현 코드가 아니라 **아주 높은 수준(very high level)**으로 유지한다. 차량 호출 플랫폼에 대입하면, 승객이 '호출 요청' 이벤트를 촉발했을 때 플랫폼·지도·운전자 앱·결제 게이트웨이가 어떤 순서와 타이밍으로 배차를 성사시키는지 큰 뼈대를 그려 보는 작업에 해당한다.

<svg viewBox="0 0 420 806" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="세 가지 이벤트와 유스케이스 촉발">
<defs>
<marker id="cmu2d_arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" /></marker>
</defs>
<rect x="0" y="0" width="420" height="806" rx="12" fill="#0f172a"/>
<text x="210" y="30" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">시스템의 유스케이스를</text>
<text x="210" y="52" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">촉발하는 세 가지 이벤트</text>
<rect x="16" y="74" width="388" height="110" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
<text x="32" y="100" fill="#38bdf8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700">1. 업무 이벤트 (Business Events)</text>
<text x="32" y="126" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">기능 핵심 · 예: 판매 발생, 보고서 요청</text>
<text x="32" y="148" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif">차량 호출: 승객의 호출 요청, 결제 요청</text>
<rect x="16" y="200" width="388" height="110" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
<text x="32" y="226" fill="#34d399" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700">2. 시간 이벤트 (Temporal Events)</text>
<text x="32" y="252" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">시계 촉발 · 예: 정기 백업, 백신 프로그램 검사</text>
<text x="32" y="274" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif">차량 호출: 일일 정산 배치, 정기 DB 백업</text>
<rect x="16" y="326" width="388" height="110" rx="8" fill="#1e293b" stroke="#a78bfa" stroke-width="1.5"/>
<text x="32" y="352" fill="#c4b5fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700">3. 신호 (Signals)</text>
<text x="32" y="378" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">장치·센서·스위치·운영체제(OS) 신호 촉발</text>
<text x="32" y="400" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif">차량 호출: GPS 위치 센서, 앱 종료 OS 신호</text>
<line x1="210" y1="444" x2="210" y2="472" stroke="#fbbf24" stroke-width="2" marker-end="url(#cmu2d_arr)"/>
<rect x="16" y="480" width="388" height="126" rx="10" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
<text x="210" y="512" fill="#fef2f2" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">우리 시스템</text>
<text x="210" y="536" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">유스케이스 실행</text>
<text x="210" y="562" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">사람 행위자 외의 트리거도</text>
<text x="210" y="584" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">반응 모델링</text>
<line x1="210" y1="606" x2="210" y2="634" stroke="#fbbf24" stroke-width="2" marker-end="url(#cmu2d_arr)"/>
<rect x="16" y="642" width="388" height="148" rx="10" fill="#1e293b" stroke="#fbbf24" stroke-width="1.5"/>
<text x="210" y="674" fill="#fde68a" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">시퀀스 다이어그램</text>
<text x="210" y="700" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">참여 실체들 사이의</text>
<text x="210" y="722" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">순서(sequence)와</text>
<text x="210" y="744" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">타이밍(timing) 표현</text>
<text x="210" y="768" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(이 단계는 높은 수준)</text>
</svg>

### 6.2 아키텍처는 어떤 테스트로 검증하는가 — V-모델

이제 마지막 퍼즐 조각을 맞출 차례다. 팀은 여기서 **품질 보증(quality assurance, QA)**—이번에는 품질 속성이 아니라, 말 그대로 **"우리가 만든 것을 어떻게 검증(validate)할 것인가"**—도 함께 생각해야 한다.

개발의 흐름을 왼쪽에서 오른쪽으로 따라가 보면, 먼저 **기능 요구사항(functional requirements)**이 있고, 그다음 시스템의 큰 뼈대인 **아키텍처 설계(architectural design)**가 나오며, 그 아래에 구체적인 **상세(저수준) 설계(detailed / low-level design)**가 뒤따른다. 그러면 각 층위는 어떤 테스트로 검증할까?

1. **기능 요구사항 ↔ 시스템 테스트(System tests):**  
   시스템 테스트는 주로 **기능 요구사항**—즉, 이 소프트웨어가 존재하는 가장 근본적인 이유—을 검증하기 위해 작성한다. 차량 호출 플랫폼에서 "승객이 출발지·도착지를 입력하고 호출을 누르면 배차가 이루어지고 결제가 된다"는 기능 자체가 제대로 돌아가는지 확인하는 테스트다.
2. **아키텍처 ↔ 통합 테스트(Integration tests) + 품질 속성 테스트(Quality attribute tests):**  
   그렇다면 아키텍처는 무엇인가? 기능은 "무엇을 하는가"이고, 아키텍처는 그것을 **"얼마나 잘(how well)" 수행하는가**이다. 아키텍처란 전체 기능 실체들을 여러 **조각(pieces)으로 쪼개어 서로 다른 곳에 배치하고, 다양한 메커니즘으로 상호작용하게 만든 구조**다. 따라서 아키텍처를 검증하는 테스트는 크게 두 가지다.
   - **통합 테스트(Integration tests):** 여러 곳에 나뉘어 있는 조각들을 하나로 통합할 때, 이 조각들이 서로 제대로 말을 주고받는지(통신), 그리고 이벤트의 순서를 올바르게 조율(coordinate)하는지를 검증한다. 이것이 바로 아키텍처를 검증하는 첫 번째 테스트다.
   - **품질 속성 테스트:** 또 하나, 아키텍처를 정의하는 핵심이 무엇인가? (수업에서는 *"문서화(Documentation)"*라는 답이 나왔다. 강의는 문서화가 아키텍처를 기록하는 일이라고 받은 뒤, 문서에 담기는 것 가운데 조각들의 배치는 통합 테스트로 검증한다고 정리하고, 아키텍처의 다른 속성으로 시선을 돌린다.) 바로 **품질 속성**이다. **부하(load), 성능(performance), 보안(security), 가용성(availability)** 같은 속성들을 직접 시험하는 테스트 역시 아키텍처를 검증하는 핵심 수단이다.

여기서 아주 실무적인 질문 하나가 이어진다.
> *"실제 구현을 만들기 전에 성능·보안·스트레스·사용성을 검증해야 하나요?"*

답은 명확하다. **"아니다(No). 하지만 테스트 케이스는 만든다(develop the test cases)."**

팀은 **아키텍처 문서를 작성하는 바로 그 시점에 테스트 문서를 병행해(in parallel) 작성한다.** 아키텍처 문서를 바탕으로 **무엇을 시험할지, 어떻게 시험할지, 어떤 테스트 환경이 필요한지** 계획을 세우고, 구체적인 **테스트 케이스 문서(test case documents)**까지 미리 써 두는 것이다. 그리고 모든 설계와 코딩이 끝나 코드가 나오면, 이제 거꾸로 올라가며 테스트를 실행한다.

- **코드 완성** → **단위 테스트(unit testing)** → **통합 테스트(integration testing)** → **시스템 테스트(system testing)** → **성능·부하·스트레스·보안·사용성 테스트**

이처럼 왼쪽으로 내려가며 요구·설계·테스트 문서를 만들고, 바닥에서 코딩을 마친 뒤 오른쪽으로 올라가며 단계별 테스트를 실행하는 흐름이 바로 **V-모델(V-model)**이다.

> **[해설] V-모델의 표준 대응 관계**  
> 이 강의 본문은 기능 요구사항이 시스템 테스트에, 아키텍처가 통합 테스트와 품질 속성 테스트에 대응한다는 점을 분명히 설명하고, 마지막 요약에서 단위 테스트→통합 테스트→시스템 테스트→품질 속성 테스트의 실행 순서를 짚는다. 일반적인 V-모델 설명은 왼쪽과 오른쪽을 **요구사항 ↔ 시스템 테스트·인수 테스트**(사용자 요구는 인수 테스트, 시스템 요구는 시스템 테스트), **아키텍처(상위) 설계 ↔ 통합 테스트**, **상세(모듈) 설계 ↔ 단위 테스트**로 짝짓는다. ISTQB도 단위(컴포넌트)·통합·시스템·인수의 네 테스트 수준을 이렇게 대응시킨다. 판본(예: 독일 V-Modell XT)에 따라 단계 이름과 세분화는 조금씩 다르지만 기본 구조는 같다[^5]. 아래 그림과 표에서는 강의가 직접 밝힌 대응과 표준 V-모델 배경에서 보충한 대응을 구분해 표시했다.

<svg viewBox="0 0 420 542" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="아키텍처 검증과 V-모델">
<defs>
<marker id="cmu2e_v" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" /></marker>
<marker id="cmu2e_dash" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" /></marker>
</defs>
<rect x="0" y="0" width="420" height="542" rx="12" fill="#0f172a"/>
<text x="210" y="28" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">설계와 테스트 계획의 병행</text>
<text x="210" y="50" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">V-모델과 아키텍처 검증</text>
<text x="210" y="76" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">실선 = 강의가 명시한 검증 대응</text>
<text x="210" y="96" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">점선 = [해설] 표준 V-모델 대응</text>
<rect x="16" y="118" width="154" height="50" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
<text x="93.0" y="150" fill="#e0f2fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">1. 기능 요구사항</text>
<rect x="250" y="118" width="154" height="50" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
<text x="327.0" y="150" fill="#e0f2fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">7. 시스템 테스트</text>
<line x1="170" y1="143" x2="250" y2="143" stroke="#38bdf8" stroke-width="2" marker-end="url(#cmu2e_v)"/>
<text x="210" y="190" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">기능 요구 검증</text>
<text x="210" y="210" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(시스템 테스트)</text>
<rect x="28" y="224" width="154" height="86" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
<text x="105.0" y="252" fill="#fef2f2" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">2. 아키텍처 설계</text>
<text x="105.0" y="274" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">문서화와 병행해</text>
<text x="105.0" y="294" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">테스트 계획 작성</text>
<rect x="238" y="224" width="154" height="96" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
<text x="315.0" y="248" fill="#fef2f2" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">6. 통합 테스트</text>
<text x="315.0" y="268" fill="#fef2f2" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">품질 속성 테스트</text>
<text x="315.0" y="290" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">통신·조율 + 성능·부하</text>
<text x="315.0" y="308" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">보안·가용성·사용성</text>
<line x1="182" y1="264" x2="238" y2="264" stroke="#38bdf8" stroke-width="2" marker-end="url(#cmu2e_v)"/>
<text x="210" y="332" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">아키텍처 검증</text>
<text x="210" y="352" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">(통합 + 품질 속성 테스트)</text>
<rect x="44" y="366" width="154" height="70" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
<text x="121.0" y="394" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">3. 상세(저수준)</text>
<text x="121.0" y="416" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">설계</text>
<rect x="222" y="366" width="154" height="70" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
<text x="299.0" y="406" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">5. 단위 테스트</text>
<line x1="198" y1="401" x2="222" y2="401" stroke="#fbbf24" stroke-width="1.5" marker-end="url(#cmu2e_dash)" stroke-dasharray="5,4"/>
<text x="210" y="458" fill="#fde68a" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">[해설] 상세 설계 검증</text>
<rect x="110" y="476" width="200" height="50" rx="8" fill="#0f172a" stroke="#fbbf24" stroke-width="2"/>
<text x="210" y="508" fill="#fde68a" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">4. 코딩 (구현)</text>
<line x1="93.0" y1="168" x2="105.0" y2="224" stroke="#475569" stroke-width="1.5"/>
<line x1="105.0" y1="310" x2="121.0" y2="366" stroke="#475569" stroke-width="1.5"/>
<line x1="121.0" y1="436" x2="210" y2="476" stroke="#475569" stroke-width="1.5"/>
<line x1="210" y1="476" x2="299.0" y2="436" stroke="#475569" stroke-width="1.5"/>
<line x1="299.0" y1="366" x2="315.0" y2="310" stroke="#475569" stroke-width="1.5"/>
<line x1="315.0" y1="224" x2="327.0" y2="168" stroke="#475569" stroke-width="1.5"/>
</svg>

| 테스트 종류 | 무엇을 검증하는가 | 차량 호출 플랫폼에서의 검증 예시 |
| :--- | :--- | :--- |
| **시스템 테스트 (System Tests)** | **기능 요구사항** (소프트웨어가 존재하는 근본 목적) | 승객의 회원가입, 호출 요청, 배차 완료, 요금 결제 등 핵심 기능이 요구대로 동작하는지 |
| **통합 테스트 (Integration Tests)** | **아키텍처 (구조와 통신)** — 여러 곳에 흩어진 조각들이 서로 통신하고 이벤트 순서를 제대로 조율하는지 | 배차 서비스·지도 연동 모듈·결제 게이트웨이가 정해진 순서와 인터페이스로 오류 없이 연동되는지 |
| **품질 속성 테스트 (부하·성능·보안·가용성·스트레스·사용성)** | **아키텍처 (품질 속성)** — 기능을 "얼마나 잘" 수행하는지 | 피크 시간 동시 접속 시 응답 시간, 결제 정보 보안, 장애 시 가용성 유지, 앱 사용성 등 |
| **단위 테스트 (Unit Tests)** | `[해설]` 코드 단위·상세(모듈) 설계가 의도대로 동작하는지 (표준 V-모델 대응, 각주 5) | 요금 계산 함수나 위치 거리 계산 모듈 등 개별 코드 단위가 정확한 값을 반환하는지 |

---

## 맺음말: 컨텍스트 다이어그램 한 장이 여는 것들

이 강의를 관통해 보면, **"맥락을 정한다(Setting the context)"**는 말이 결코 단순한 입문용 겉치레가 아니라는 사실이 선명해진다. 우리가 손에 쥔 **컨텍스트 다이어그램**은 그저 보고서 첫 장에 끼워 넣는 그림이 아니라, 1강에서 본 **"사업 요구 → 품질 속성 → 구조"**의 흐름을 실무에서 처음 시작하는 도구다.

전체 내용을 여섯 가지 핵심 통찰로 다시 묶어 정리해 보자.

1. **컨텍스트 다이어그램의 진짜 쓸모는 그림 자체가 아니라 '그림이 끌어내는 질문'이다.** 단순히 *"차량 호출 앱을 만들어 달라"*는 말만 듣고서는 지도 제작 여부, 기존 DB 유무, 분석 팀과의 병렬 협업, 관리자 행위자, 사내 판매 시스템 연동 같은 질문에 도달하지 못할 수 있다.
2. **경계선 하나가 범위와 일의 양을 결정한다.** '지도'를 빨간 원 바깥의 외부 실체로 두느냐, 원 안으로 끌어들이느냐에 따라 우리가 만들어야 할 소프트웨어의 규모가 완전히 달라진다. **무엇을 만들지 않을지 정하는 일 역시 핵심 아키텍처 결정이다.**
3. **한 장의 그림에서 기능·가치·품질 속성·제약이 차례로 흘러나온다.** 데이터 흐름(기능)에서 출발해 행위자와 지역 상점·도시·교통 생태계로 번지는 사업 가치를 찾고, 다시 "얼마나 많이·자주·크게"를 물어 품질 속성을 끌어내며, 기술·사업 제약을 함께 거둔다. 그래서 기능 요구만 보는 요구 수집 단계에 반드시 아키텍트가 함께 들어가야 한다.
4. **플랫폼 사고는 미래의 확장을 오늘의 품질 속성으로 바꾼다.** 운전자와 운송이라는 핵심 자산을 특정 용도 하나에 묶지 않고 일반적으로 설계하면 음식 배달이나 택배 같은 새 서비스로 빠르게 넓힐 수 있다. 그러므로 *"나중에 무엇을 더할 것인가"*라는 질문은 곧 수정 용이성과 확장성 설계가 된다.
5. **제약은 고객에게서만 오지 않으며, 맥락은 한 번 그리고 끝나지 않는다.** 회사의 기술 스택과 보안 정책뿐 아니라 레거시, 선택한 오픈소스·기성품, 심지어 팀이 익숙해서 고른 React 같은 도구까지도 제약이 된다. 그리고 요구가 계속 바뀌는 애자일·스타트업 환경에서는 컨텍스트 다이어그램을 끊임없이 다시 그리게 되므로, 유연한 수정 용이성이 설계의 중심에 서야 한다.
6. **검증 역시 맥락과 아키텍처 문서에서 시작한다.** 기능은 시스템 테스트로 확인하지만, 기능을 여러 조각으로 나누어 배치한 아키텍처 자체는 조각 간 통신·순서를 확인하는 **통합 테스트**와 **품질 속성 테스트**로 검증한다. 실행은 코딩이 끝난 뒤에 하더라도, 무엇을 어떻게 시험할지 담는 **테스트 계획과 테스트 케이스는 아키텍처 문서와 병행해 먼저 만든다(V-모델).**

결국 코딩을 시작하기 전에 그리는 이 작은 경계선 한 장이, 우리가 무엇을 만들지, 왜 만드는지, 얼마나 잘 만들어야 하는지, 무엇을 바꿀 수 없는지, 그리고 나중에 무엇을 시험해야 하는지까지 처음 묻게 하는 출발점이 된다.

---

[3강 →](cmu-software-architecture-lec03-architectural-drivers.html)

---

[^1]: **UML 컨텍스트 다이어그램의 표준 여부:** UML 2.5.1의 다이어그램 14종(Class, Object, Package, Composite Structure, Component, Deployment, Profile, Use Case, Activity, State Machine, Sequence, Communication, Timing, Interaction Overview)에 context diagram은 없다. 기원은 구조적 분석의 DFD 레벨 0(Gane–Sarson 등)이다. 출처: OMG UML 2.5.1 명세 https://www.omg.org/spec/UML/2.5.1/ , https://www.uml-diagrams.org/uml-25-diagrams.html , https://www.modernanalyst.com/Resources/Articles/tabid/115/ID/2012/Putting-Systems-Analysis-Into-Context-using-the-Context-Diagram.aspx
[^2]: **C4 모델의 네 가지 다이어그램과 창안자:** 네 다이어그램은 System Context, Container, Component, Code다(초기에는 Code 대신 Classes였고 2015~2016년 무렵 바뀜). 창안자는 Simon Brown이며, 다이어그램 유형 이름은 2010년 초, 'C4'라는 이름은 2011년 초에 처음 쓰였다. 출처: https://c4model.com/ , https://c4model.com/faq
[^3]: **우버의 서비스 확장 시기:** UberFRESH 2014년 8월 시작 → 2015년 4월 무렵 UberEATS로 이름 변경. UberRUSH는 2014년 4월 뉴욕 시범, 2015년 10월 정식 서비스, 2018년 종료. Uber Connect는 2020년 4월 무렵 시작, 2024년 12월 Uber Courier로 이름 변경. 출처: https://www.uber.com/us/en/newsroom/uberfresh-is-now-ubereats/ , https://en.wikipedia.org/wiki/Uber_Eats , https://techcrunch.com/2018/03/30/uberrush-is-shutting-down/ , https://www.engadget.com/transportation/uber-rebrands-its-courier-service-and-expands-on-demand-car-seats-to-four-more-cities-130040912.html
[^4]: **세 가지 이벤트 분류의 출처:** business·signal·temporal 세 분류는 Karl Wiegers & Joy Beatty, 『Software Requirements』 3rd ed.(Microsoft Press, 2013)에 나온다. McMenamin & Palmer(1984)의 event partitioning은 외부 이벤트와 시간 이벤트를 구분했다. 출처: https://www.modernanalyst.com/Resources/Articles/tabid/115/ID/2932/Modeling-System-Events.aspx , https://en.wikipedia.org/wiki/Event_partitioning
[^5]: **V-모델의 표준 대응 관계:** 요구사항 ↔ 인수·시스템 테스트, 아키텍처(상위) 설계 ↔ 통합 테스트, 상세(모듈) 설계 ↔ 단위 테스트가 일반적인 대응이며, 판본마다 단계 이름과 세분화가 조금 다르다. 출처: https://istqbfoundation.wordpress.com/2017/09/18/v-model-sequential-development-model/ , https://www.browserstack.com/guide/v-model-testing
