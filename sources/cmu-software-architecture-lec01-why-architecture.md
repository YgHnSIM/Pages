---
title: "코딩 전에 무엇을 정해야 하는가 — CMU 소프트웨어 아키텍처 1강"
subtitle: "기능이 같아도 사업 요구가 다르면 구조가 달라진다. 품질 속성, 트레이드오프, 정적·동적·배치 구조, 그리고 \"어떻게보다 왜\""
slug: "cmu-software-architecture-lec01-why-architecture"
date: "2026-11-19"
tags:
  - 컴퓨터과학
  - 소프트웨어공학
  - 아키텍처
  - 해설
summary: "카네기멜런대학교(CMU) 17-635 「소프트웨어 아키텍처」 1강을 바탕으로, 코드를 짜기 전에 왜 아키텍처를 먼저 설계해야 하는지 기초부터 해설한다. 차량 호출 앱을 중심 예시로 삼아 기능 요구만 충족한 '쓸모 모를 코드 덩어리'와 사업 요구에 맞춘 구조의 차이를 짚고, LLM 서비스·아마존·노키아 사례로 품질 속성('-ilities')의 중요성을 살핀다. 이어 입국 심사 줄 비유와 장바구니 상태 관리를 통해 처리량·지연 시간·지속성과 비용 사이의 트레이드오프를 분석하며, 소프트웨어 아키텍처의 정식 정의, 정적·동적·배치 뷰, 패턴·프레임워크·프로토타입 검증, 아키텍처의 두 가지 법칙('모든 것은 트레이드오프다', '왜가 어떻게보다 중요하다'), 그리고 아키텍트의 여섯 가지 핵심 활동을 체계적으로 정리한다."
---

## 서문: 키보드를 두드리기 전에 멈춰 서야 하는 이유

소프트웨어를 만들어 본 사람이라면 누구나 새 아이디어를 듣자마자 곧장 키보드에 손을 올리고 싶은 충동을 느낀다. 요즘처럼 거대 언어 모델(LLM)에게 원하는 기능을 설명하면 몇 초 만에 코드 덩어리를 써 주는 시대에는 그 유혹이 한층 더 거세다. 이 강의는 바로 그 지점에서 질문을 던지며 시작한다. 지금 당장 코드를 치고 싶고 AI에게 코드를 생성하게 만들고 싶겠지만, **그것만으로는 좋은 소프트웨어가 나오지 않는다**는 것이다.

카네기멜런대학교(CMU)의 과목 번호 17-635 「소프트웨어 아키텍처(Software Architectures)」 1강(강사 Swarnalatha Ashok, Scott Pavetti)[^1]은 소프트웨어 아키텍처를 처음 배우는 사람에게 가장 근본적인 물음을 건넨다. 우리가 아키텍처를 배우는 동기는 무엇이며, 소프트웨어 아키텍처의 정식 정의는 무엇이고, 아키텍트가 실제로 수행하는 공통 활동은 무엇인가? 이 강의가 처음부터 못 박는 사실 하나는 분명하다. **아키텍처는 단순히 상자와 화살표로 다이어그램 몇 장 그리는 일이 아니다.**

물론 세상의 모든 프로그램에 거창한 아키텍처가 필요한 것은 아니다. 사칙연산을 수행하는 아주 작은 **계산기(calculator)** 프로그램 하나를 혼자서 만든다면 어떨까? 이런 아주 작은 단독 프로그램(standalone application)이라면 별도의 아키텍처 설계 없이 곧바로 코딩을 시작해도 꽤 괜찮은 결과물이 나온다. 하지만 이 강의는 곧바로 뼈 있는 한마디를 덧붙인다. **"오늘날엔 계산기조차 단독 프로그램이 아니다."** [해설] 계산기처럼 작은 프로그램도 이제는 다른 기기·서비스와 이어져 돌아가는 경우가 많다는 뜻으로 읽힌다. 하물며 수만 명 이상이 동시에 접속해 돈을 결제하고 움직이는 서비스라면, 첫 줄의 코드를 쓰기 전에 무엇을 결정해야 하는지가 소프트웨어의 운명을 가른다.

이 글은 소프트웨어 아키텍처를 전혀 모르는 독자도 한 걸음씩 따라올 수 있도록, 전문 기호나 어려운 용어를 앞세우지 않고 **우버(Uber) 같은 '차량 호출 앱'**이라는 일상적인 예시 하나를 중심 기둥으로 삼아 개념을 쌓아 올린다. 강의에 등장하는 다른 사례들—LLM 서비스들, 아마존, 노키아, 입국 심사 줄, 온라인 장바구니—도 빠짐없이 살피되, 각각의 교훈이 결국 차량 호출 앱에서는 어떤 설계 결정으로 이어지는지 다시 연결해 본다.

> **[해설] 이 글의 구성과 표기 원칙**  
> 이 글은 원 강의의 핵심 주장을 빠짐없이, 왜곡 없이 전달하는 데 최우선 목적이 있다. 강의 자체의 논지와 사례는 독립된 에세이 형식으로 정확히 옮겼고, 독자의 이해를 돕기 위해 덧붙인 배경 지식과 개념 보충은 **`[해설]`**로 구분해 표시했다. 아울러 인명·과목 번호 철자, 인용 문장의 원출처, 역사적·산업적 수치처럼 강의 밖 사실은 외부 자료로 확인해 각주에 출처를 달았고, 끝내 확인되지 않은 것만 **`(확인 필요)`**로 남겨 두었다. 강사가 한 말은 강의 그대로 전하고, 외부 사실과 다른 대목은 해설과 각주에서 따로 바로잡았다.

---

## 1. 이 과목이 겨냥하는 지도: 여섯 가지 목표와 전체 여정

무엇인가를 배우기 전에 전체 지도를 펼치면 길을 잃지 않는다. 소프트웨어 아키텍처라는 과목이 끝날 때 학습자가 손에 쥐어야 할 역량은 여섯 가지로 요약된다.

### 1.1 아키텍처 수업의 여섯 가지 목표

1. **소프트웨어 아키텍처를 정의할 수 있어야 한다.** "아키텍처가 뭐냐"고 물었을 때 막연한 느낌이나 "그림 그리는 것"이 아니라, 명확한 언어로 설명할 수 있어야 한다.
2. **만드는 시스템의 맥락(context) 안에서 아키텍처 요구사항과 그 우선순위를 정할 수 있어야 한다.** 모든 요구를 똑같이 다 만족시킬 수는 없으므로, 지금 우리가 만드는 시스템에서 무엇이 먼저이고 무엇이 나중인지 가려낼 수 있어야 한다.
3. **시스템 전체의 성질이 사업 요구(business needs)와 어떻게 연결되는지 이해해야 한다.** 소프트웨어가 어떤 기능(functionality)을 수행하는지도 물론 중요하지만, 기능을 넘어 이 소프트웨어가 왜 만들어졌는가라는 사업적 목적을 충족해야 한다. 강의는 이 연결 고리가 빠진 코드는 **"쓸모가 있을지 없을지 모르는 코드 덩어리(a piece of code, which may or may not be useful)"**에 불과하다고 단언한다.
4. **모든 아키텍처 동인(architectural drivers)을 만족하는 시스템을 설계할 수 있어야 한다.** 시스템을 특정 모양으로 밀어붙이는 핵심 입력 조건들을 모두 수용해 구조를 세워야 한다.
5. **검증된 설계와 아키텍처를 재사용할 수 있어야 한다.** 소프트웨어 공학의 오랜 원칙 가운데 하나는 **"바퀴를 다시 발명하지 않는다(don't reinvent the wheel)"**는 것이다. 특정 성질을 잘 이끌어 낸다고 이미 증명된 **아키텍처 패턴(architectural patterns)**과, 그보다 더 작은 단위에서 특정 성질을 달성하기 위한 모범 사례인 **전술(tactics)**을 적재적소에 가져다 쓸 줄 알아야 한다.
6. **아키텍처를 문서화하고 결정의 이유(rationale)를 남길 수 있어야 한다.** 문서를 쓰는 이유는 크게 두 가지다. 첫째, 실제로 코드를 작성하거나 세부 설계를 맡을 사람에게 지식을 온전히 넘겨주기 위해서다. 둘째, 시간이 흐른 뒤 **미래의 나 자신이** "왜 그때 이 패턴과 이 전술, 이 아키텍처 결정을 선택했는지" 잊지 않고 기억하기 위해서다.

### 1.2 품질 보증(QA)이 아닌 '품질 속성'이라는 개념

여기서 아키텍처에 입문하는 사람들이 가장 자주 헷갈리는 용어 하나를 시작부터 정확히 갈라 두어야 한다. 바로 시스템 전체의 성질(systemic properties)을 뜻하는 **품질 속성(quality attributes)**이다.

얼마나 빨리 응답하는가(**성능**, performance), 얼마나 안전하게 막아 내는가(**보안**, security), 얼마나 멈추지 않고 버티는가(**가용성**, availability), 나중에 기능을 고치거나 새 기능을 붙이기 얼마나 쉬운가(**수정 용이성**, modifiability), 사용자가 갑자기 불어나도 감당할 수 있는가(**확장성**, scalability) 같은 성질들을 가리킨다. 이 강의는 분명하게 선을 긋는다. **품질 속성은 우리가 흔히 말하는 QA(Quality Assurance, 품질 보증)와는 전혀 다른 개념이다.**

> **[해설] QA(품질 보증)와 품질 속성(Quality Attributes)의 차이**  
> 실무에서 QA는 보통 완성되거나 개발 중인 소프트웨어를 시험해 버그를 찾아내고, 요구된 기능이 오류 없이 동작하는지 검증하는 활동과 조직을 뜻한다. 반면 아키텍처에서 말하는 품질 속성은 테스트 절차나 조직 이름이 아니라, 시스템이 본래부터 갖추어야 할 작동 성질 그 자체다. 예컨대 "승객이 배차 버튼을 눌렀을 때 1초 안에 응답해야 한다"거나 "출퇴근 시간 사용자가 100배 늘어도 버텨야 한다"는 것은 QA 팀이 나중에 테스트해서 만들어 낼 수 있는 것이 아니라, 처음부터 시스템의 뼈대(구조)를 어떻게 짜느냐에 따라 결정되는 성질이다.

짧은 미니 학기(mini-semester)로 진행되는 이 강의에서는 수많은 품질 속성 가운데 특히 네 가지—**모듈성(modularity), 성능(performance), 가용성(availability), 확장성(scalability)**—에 집중하고, 나머지 속성들은 학습자가 스스로 확장해 공부하도록 안내한다.

### 1.3 앞으로 밟아 갈 아키텍처의 전체 주제와 두 권의 교재

강의가 예고하는 전체 여정은 아키텍처가 한 번의 영감으로 끝나는 일이 아니라 치밀한 단계의 연속임을 보여 준다.

1. **정의·활동·결정**: 소프트웨어 아키텍처란 무엇이며, 아키텍트는 어떤 결정을 내리고 어떤 활동을 하는가.
2. **컨텍스트 다이어그램(Context Diagram)으로 범위 잡기**: 내가 만드는 소프트웨어의 안과 밖을 가르는 지도다. 내가 직접 책임지고 만들어야 할 범위는 어디까지이고, 신경 쓰지 않아도 되거나 바깥에서 연동해야 할 대상은 무엇인지, 대상 사용자는 누구인지, 다른 시스템과 어떤 데이터를 주고받아야 하는지를 한눈에 파악한다.
3. **아키텍처 동인(Architectural Drivers)**: 아키텍처를 어떤 모양으로 빚어낼지 결정짓는 핵심 입력 조건들을 이해한다.
4. **품질 속성의 정식 분석과 '6부분 시나리오(Six-part Scenario)'**: 막연히 "시스템이 빨라야 한다"고 말하면 설계를 할 수 없다. **무엇이 자극을 주고, 그 결과가 무엇이며, 그것을 어떻게 측정할 것인가**를 따지는 정식 분석 틀로 품질 속성 요구사항을 구체화한다.
5. **뷰(Views)로 시스템 바라보기**: 아키텍처는 단순히 코드를 여러 폴더와 모듈로 쪼개는 작업으로 끝나지 않는다. 코드가 어떻게 나뉘어 있는지를 보는 **정적 뷰(static view)**, 프로그램이 실제로 실행되는 동안 모듈 인스턴스가 하나만 뜨는지 여러 개로 복제되어 병렬로 도는지를 보는 **동적 뷰(dynamic view)**, 그리고 그 코드 조각들이 내 주머니 속 스마트폰에 놓이는지, 내 몸에 걸친 웨어러블 기기에 놓이는지, 클라우드나 백엔드 서버에 놓이는지를 보는 **배치 뷰(deployment view)**까지 여러 시선으로 입체적으로 살펴야 한다.
6. **패턴과 전술, 그리고 속성 주도 설계**: 인기 있는 아키텍처 패턴과 세부 전술을 익힌 뒤, 응답 시간 같은 품질 속성 요구에서 출발해 아키텍처를 도출해 나가는 **속성 주도 과정(attribute-driven process / approach)**을 배운다.
7. **대상 독자별 문서화와 아키텍처 결정 기록(ADR)**: 개발자, 나중에 요구사항이 바뀌어 다시 문서를 열어 볼 미래의 아키텍트, 비용 관점에서 구조의 타당성을 보고 싶어 하는 경영진 등 **서로 다른 독자가 자기에게 필요한 대목을 쉽게 찾아볼 수 있도록** 문서를 구성한다. 특히 업계에서 매우 유용하다고 입증된 **아키텍처 결정 기록(Architectural Decision Records, ADR)**을 통해, 무엇을 왜 결정했는지, 우선순위는 무엇이었는지, 그 결정을 택하면서 무엇을 포기(compromise)했는지, 그 결정을 충분히 이해하고 문서화했는지, 회의에 누가 참석했는지까지 남긴다.
8. **LLM 기반 시스템과 애자일 환경**: 마지막 강의에서는 **LLM을 소프트웨어의 한 구성 요소로 쓰는 시스템**(예: 챗봇)을 어떻게 설계할지—소프트웨어가 어떤 부품들로 나뉘고 그 부품들이 LLM과 어떻게 상호작용해야 하는지—를 다루며, 여건이 허락하면 **애자일(Agile) 프로젝트** 안에서 아키텍처를 어떻게 수행할지도 다룬다.

이 여정의 길잡이로는 두 권의 교재가 제시된다. Len Bass 외 공저의 『Software Architecture in Practice』(최신 4판)와 『Documenting Software Architectures: Views and Beyond』(최신 2판)이며, 두 책 모두 CMU 도서관 온라인을 통해 열람할 수 있다[^2].

> **[해설] '6부분 시나리오'와 '속성 주도 설계(ADD)'의 정식 배경**  
> 강의에서는 6부분 시나리오의 세부 명칭을 "무엇이 자극하고, 결과가 무엇이며, 어떻게 측정하는가" 수준으로만 맛보기로 소개하고, 설계 과정도 "attribute-driven process / approach"라고 부른다. 소프트웨어 아키텍처 교재(Bass 등)의 표준 어휘에서 6부분 시나리오(Quality Attribute Scenario)는 보통 **① 자극의 근원(Source of Stimulus) ② 자극(Stimulus) ③ 대상(Artifact) ④ 환경(Environment) ⑤ 응답(Response) ⑥ 응답 측정(Response Measure)**의 여섯 요소로 구성된다. 속성 주도 과정의 정식 명칭은 SEI가 정리한 **속성 주도 설계(Attribute-Driven Design, ADD)**이며, 현재 주로 쓰이는 판은 ADD 3.0이다[^3].

이 모든 목차를 우리의 중심 예시인 **차량 호출 앱**에 얹어 보면 감이 단번에 온다. 승객용 앱, 운전자용 앱, 지도 서비스, 카드 결제망 중 어디까지가 우리가 짜야 할 시스템 안쪽이고 어디가 바깥쪽인지 가르는 것이 **컨텍스트 다이어그램**이고, "피크 타임에도 배차 응답이 2초 이내"라는 조건을 측정 가능한 문장으로 다듬는 것이 **6부분 시나리오**이며, 이 코드가 승객 폰에 들어갈지 클라우드 서버에 들어갈지 나누는 것이 **세 가지 뷰**다. 왜 이런 일들이 코딩보다 먼저 와야 하는지, 이제 차량 호출 앱을 처음부터 한 단계씩 지어 보며 직접 확인해 보자.

---

## 2. 기능만으로는 부족하다: 차량 호출 앱으로 보는 사업 요구와 설계의 분화

### 2.1 기능 목록에서 출발하는 익숙한 절차

우버(Uber)와 같은 **차량 호출 앱(car hailing application)**을 만든다고 상상해 보자. 소프트웨어 공학을 어느 정도 배운 사람이라면 가장 먼저 고객에게 찾아가 "이 앱이 무슨 일을 할 수 있어야 합니까?"라고 기능(functionality)부터 물어볼 것이다.

이 앱을 쓰는 사용자는 크게 두 부류다.
- **승객(commuter)**: 여러 차종 가운데 원하는 차량을 고르고, 출발지(pickup)와 목적지(destination)를 지정하며, 지금 차가 어디쯤 오고 있는지 운행 경로를 추적하고, 도착 뒤 요금을 결제할 수 있어야 한다.
- **운전자(driver)**: 본인 정보와 자기 차량을 공인 운전자로 등록할 수 있어야 한다. 만약 본인 차가 없다면 Enterprise 같은 렌터카 서비스(car hiring service)에서 차량을 빌려 공인 운전자로 등록하는 경우도 지원해야 한다. 또한 운전자가 쉬고 싶을 때는 운행 상태(ride)를 끄고("오늘은 도로에서 빠지겠다") 다시 일할 때 켤 수 있어야 하며, 들어온 호출을 수락(accept)하거나 취소(cancel)할 수 있어야 한다.

이렇게 사용자별 기능을 모으고 나면, 보통은 교과서적인 **요구사항 모델링과 분석** 단계로 넘어간다. 유스케이스(use case)나 사용자 스토리(user story)를 적고, 시스템에 어떤 개념적 덩어리(도메인 모델, domain model)와 모듈이 필요하며 서로 어떻게 연결되는지 그린다. 사용자에게 화면이 어떻게 보일지 분석하고, 예컨대 운전자 모듈과 직접 말을 주고받는 '드라이버 컨트롤러(driver controller)' 같은 분석 모델을 만든다.

여기서 한 걸음 더 나아가 시간 순서대로 상호작용을 그린 **시퀀스 다이어그램(sequence diagram)**도 작성할 수 있다. 예를 들어 '라이드 컨트롤러(ride controller)'가 현재 도로 위에 나와 있는 모든 차량 목록을 조회한 뒤, 각 차량에게 이 호출을 수락할 수 있는지 묻고, 수락이 돌아온 차량에게 운행을 배정하는 흐름을 그리는 식이다.

### 2.2 아키텍처 없이도 코드는 돌아간다 — 하지만 그다음은?

문제는 바로 이 시점에 찾아온다. 시퀀스 다이어그램까지 그려 놓고 나면 많은 개발자가 이렇게 선언한다. *"좋아, 분석도 다 했고 승객과 운전자 사이의 상호작용 흐름도 완벽히 이해했으니 이제 코딩을 시작하자!"*

실제로 아키텍처라는 것을 전혀 고민하지 않고도 이 기능 목록을 코드로 구현할 수는 있다. 가장 단순하게 생각해 보자. 휴대폰 안에서 혼자 돌아가는 **단독 모바일 앱(standalone mobile app)**을 하나 만들어 승객 폰과 운전자 폰에 깔고, 승객 앱이 도로 위의 모든 차와 직접 통신하게 짤 수도 있다. 아니면 **백엔드 서버 딱 하나를 둔 단순 웹 애플리케이션(web app)**으로 만들 수도 있다. 어쨌든 위에서 나열한 기능—출발지 지정, 호출 수락, 결제—은 모두 돌아간다. 구현 방법은 한두 가지가 아니다.

그러나 이 강의가 던지는 핵심 질문은 단 하나다. **그렇게 만든 프로그램이 '사업 요구(business needs)'와 맞는가?**

고객에게 기능 목록만 묻고 돌아오면 반쪽짜리 질문만 던진 셈이다. 아키텍처를 결정하려면 반드시 다음과 같은 **사업 질문**을 추가로 던져야 한다.
- 이 앱을 사용할 전체 사용자는 몇 명인가?
- **같은 시각에 동시에 접속하는 사용자(concurrent users)**는 몇 명을 목표로 하는가?
- 이 서비스는 피츠버그(Pittsburgh) 지역이나 대학가 안에서만 쓸 것인가, 아니면 전 세계 어느 곳에서나 쓸 수 있게 키울 계획인가?
- 나중에 사업을 확장해 차량 호출 외에 **택배(courier)나 음식 배달(food delivery)** 같은 다른 서비스까지 이 앱에 얹을 계획이 있는가?

### 2.3 사업의 답에 따라 설계도가 '뜯어고쳐지는' 순간

이 질문에 고객이 어떻게 답하느냐에 따라, 아까 그린 분석 모델은 전혀 다른 모양으로 갈라진다.

첫째, 고객이 **"나중에 택배나 음식 배달 서비스까지 확장할 계획이다"**라고 답했다고 하자. 그렇다면 소프트웨어 구조는 처음부터 **수정 용이성(modifiability)**과 **확장 가능성(extensibility)**을 품어야 한다. 나중에 새 기능을 끼워 넣을 때 기존 차량 호출 코드를 다 뜯어고치지 않고도 쉽게 붙일 수 있는 구조로 쪼개 두어야 한다.

둘째, **"동시 사용자가 10명 정도인가, 아니면 1만 명 이상인가?"**라는 질문의 답을 보자. 동시 접속자가 10명뿐인 소규모 앱이라면 구조가 단순해도 버틴다. 반면 1만 명 이상이 동시에 호출을 누른다면 시스템은 **확장성(scalability)**을 갖춰야 한다. 더 나아가 현실에서는 한밤중의 한산한 시간대와 출퇴근 러시아워(rush hours)처럼 동시 사용자 수가 극심하게 요동친다. 그렇다면 부하가 클 때는 자원을 늘리고(**scale up**) 한산할 때는 줄일(**scale down**) 수 있는 구조여야 하는지까지 고민해야 한다.

이 지점에 이르면 처음 떠올렸던 '모든 차와 직접 통신하는 단독 모바일 앱'은 더 이상 선택지가 될 수 없다. 확장성이 전혀 나오지 않기 때문이다. 결국 우리는 아까 만든 분석 단계의 설계를 **그대로 두지 못하고 "뜯어내야(rip apart)" 한다.**
- 화면 표시와 사용자 입력 같은 일부 기능은 **휴대폰(모바일 클라이언트)**에 남기고,
- 배차·매칭·데이터 처리 같은 핵심 부분은 **백엔드(back end)**로 옮겨 떼어 내며,
- 출퇴근 시간대에 맞춰 자원을 늘렸다 줄였다 해야 한다면 **클라우드(cloud)** 위에서 탄력적으로 돌도록 배치한다.
- **결제(payment)** 역시 사업 결정에 따라 구조가 갈린다. 회사가 자체 결제 시스템을 직접 구축할지, 아니면 이미 존재하는 외부 결제 서비스에 위임·연동(delegate / interface)할지에 따라 결제 모듈의 내부 구현과 인터페이스가 완전히 달라지기 때문이다.

이처럼 **"아키텍처는 사업 요구에 맞춰져야 한다(architecture has to be aligned to the business needs)."** 이어지는 학생 질문에 답하면서, 강의는 분석 모델과 설계 모델의 관계를 정리해 준다. **분석 모델(analysis model)**은 무엇이 필요한지 개념적으로 파악한 출발점일 뿐이다. 반면 **설계 모델(design model)**은 바로 그 분석 모델을, 사업 요구에서 도출된 아키텍처 요구에 맞게 쪼개고 재구성한 **다듬은 판(refinement)**이다.

<svg viewBox="0 0 420 1218" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="cmu1_bg" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="#0f172a" />
<stop offset="100%" stop-color="#1e293b" />
</linearGradient>
<marker id="cmu1arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" /></marker>
<marker id="cmu1gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" /></marker>
</defs>
<rect x="0" y="0" width="420" height="1218" rx="14" fill="url(#cmu1_bg)"/>
<rect x="2" y="2" width="416" height="1214" rx="12" fill="none" stroke="#334155" stroke-width="1.5"/>
<text x="210" y="32" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">차량 호출 앱의 구조 분화</text>
<text x="210" y="54" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">기능 목록만 본 설계 vs</text>
<text x="210" y="76" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">사업 요구를 반영한 아키텍처</text>
<text x="210" y="102" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">같은 기능(출발지·배차·결제)이라도</text>
<text x="210" y="122" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">동시 사용자 수·확장 계획·결제 정책에 따라</text>
<text x="210" y="142" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">분석 모델을 '뜯어서' 재배치한다</text>
<rect x="16" y="160" width="388" height="366" rx="12" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
<rect x="16" y="160" width="388" height="56" rx="10" fill="#334155"/>
<rect x="16" y="188.0" width="388" height="28.0" fill="#334155"/>
<text x="210" y="184" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">① 기능만 보고 만든 구조</text>
<text x="210" y="204" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(단독 모바일 앱)</text>
<rect x="32" y="228" width="356" height="150" rx="10" fill="#0f172a" stroke="#94a3b8" stroke-width="1.2"/>
<text x="210" y="256" fill="#f8fafc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">휴대폰 앱 하나에 전부 탑재</text>
<text x="48" y="284" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 승객 화면 + 운전자 화면</text>
<text x="48" y="306" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 도로 위 모든 차량과 직접 통신</text>
<text x="48" y="328" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 배차 매칭 + 결제 로직 일체 포함</text>
<text x="48" y="352" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif">(또는 백엔드 1개짜리 단순 웹 앱)</text>
<rect x="32" y="388" width="356" height="122" rx="8" fill="#1c1917" stroke="#ef4444" stroke-width="1.2"/>
<text x="210" y="414" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">한계: 기능은 돌지만 사업에 안 맞음</text>
<text x="210" y="438" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">동시 사용자 1만 명↑ 시 확장 불가</text>
<text x="210" y="462" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">택배·음식 배달 확장 및</text>
<text x="210" y="484" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">부하 탄력 대응 불가</text>
<text x="210" y="552" fill="#7dd3fc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">사업 요구 반영해 쪼갬</text>
<line x1="210" y1="562" x2="210" y2="586" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#cmu1arr)"/>
<rect x="16" y="594" width="388" height="608" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8"/>
<rect x="16" y="594" width="388" height="56" rx="10" fill="#0c4a6e"/>
<rect x="16" y="622.0" width="388" height="28.0" fill="#0c4a6e"/>
<text x="210" y="618" fill="#e0f2fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">② 사업 요구를 반영한 설계 모델</text>
<text x="210" y="638" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(분산·확장 구조)</text>
<rect x="32" y="662" width="356" height="128" rx="10" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
<text x="210" y="688" fill="#7dd3fc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">휴대폰 앱</text>
<text x="210" y="712" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">승객·운전자 UI</text>
<text x="210" y="734" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">출발지·목적지 입력 · 운행 켜기/끄기</text>
<text x="210" y="758" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(클라이언트 경량화)</text>
<line x1="210" y1="790" x2="210" y2="818" stroke="#94a3b8" stroke-width="2" marker-end="url(#cmu1gray)"/>
<rect x="32" y="826" width="356" height="150" rx="10" fill="#0f172a" stroke="#10b981" stroke-width="1.5"/>
<text x="210" y="852" fill="#6ee7b7" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">백엔드 &amp; 클라우드</text>
<text x="210" y="876" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">배차·라이드 컨트롤러 · 차량 매칭</text>
<text x="210" y="898" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">출퇴근↑ / 심야↓ 탄력 확장</text>
<text x="210" y="920" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(Scale up/down)</text>
<text x="210" y="942" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">택배·음식 배달 추가 쉬운 모듈 분리</text>
<text x="210" y="964" fill="#34d399" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">(확장성·수정 용이성 확보)</text>
<line x1="210" y1="976" x2="210" y2="1004" stroke="#94a3b8" stroke-width="2" marker-end="url(#cmu1gray)"/>
<rect x="32" y="1012" width="356" height="152" rx="10" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5"/>
<text x="210" y="1038" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">결제 모듈 결정</text>
<text x="210" y="1060" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">자체 구현 vs</text>
<text x="210" y="1082" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">기존 외부 결제 서비스 연동(위임)</text>
<text x="210" y="1108" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">직접 결제를 구현할지, 외부 결제</text>
<text x="210" y="1130" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">게이트웨이에 위임하고 인터페이스만 둘지</text>
<text x="210" y="1154" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">사업 전략에 따라 내부 모듈 구조와</text>
<text x="210" y="1176" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">시스템 경계가 달라짐</text>
</svg>

---

## 3. 현실은 어떻게 구조를 갈랐는가: LLM, 아마존, 노키아, 그리고 '-ilities'

사업 요구가 구조를 가른다는 원리는 교과서 속 차량 호출 앱에서만 성립하는 이야기가 아니다. 이 강의는 현실 산업계의 세 가지 사례—LLM 서비스, 아마존, 노키아—를 통해 기능 바깥의 성질이 어떻게 기업의 승패와 제품의 구조를 갈랐는지 짚어 낸다.

### 3.1 같은 생성형 AI에서 갈라진 LLM 서비스들

오늘날 우리는 수많은 거대 언어 모델(LLM)과 그 위에서 동작하는 에이전트 도구들을 매일 쓴다. 겉으로 보면 이 서비스들은 모두 똑같은 일을 하는 것처럼 보인다. **생성형 AI(GenAI)**라는 동일한 개념을 사용해 사용자의 질문을 받고 답을 내놓기 때문이다.

하지만 실제로 각 서비스를 들여다보면 초점이 제각각이다. 어떤 도구는 **결과물의 정확도(accuracy)**를 끌어올리는 데 집중하고, 어떤 도구는 깔끔한 **텍스트 입출력**에 무게를 둔다. 또 어떤 도구는 **이미지와 영상까지 다루는 멀티모달(multimodal)** 역량에 집중하며, 코파일럿(Copilot) 같은 도구는 **코딩과 개발자 생산성**에 초점을 맞춘다(강의에서는 이 서비스별 초점 비교를 Copilot과 Gemini에게 물어 참고했다고 밝혔다).

왜 같은 LLM 개념에서 출발했는데 이토록 다른 제품들이 나왔을까? **사업 모델(business model)이 다르고, 사업 요구(business needs)가 다르며, 겨냥하는 대상 사용자와 활동이 다르기 때문**이다. 사업 요구에 맞추려다 보니 같은 생성형 AI 기술이라도 전혀 다른 아키텍처와 제품 구성을 갖게 된다.

> **차량 호출 앱으로 연결하면:** 똑같이 '지도에서 가까운 기사 연결'이라는 기술을 쓰더라도, 대학가 학생용 초저가 합승 앱, 기업 임원용 정시 보장 의전 앱, 30분 내 음식 배달 겸용 앱은 사업 모델과 대상 고객이 다르므로 서버 배치와 응답 우선순위를 전혀 다르게 설계해야 한다.

### 3.2 아마존(Amazon): '서점'이 아니라 '플랫폼'을 지었을 때

두 번째 현실 사례는 전자상거래의 판도를 바꾼 **아마존(Amazon)**이다. 아마존이 처음 사업을 시작했을 때 주력 상품은 책이었다. 당시 온라인에서 책을 판 곳은 아마존만이 아니었다. 강의는 반스앤노블(Barnes & Noble), books.com, 보더스(Borders) 같은 곳들도 온라인에서 책을 팔았다고 짚는다. [해설] 이 가운데 books.com(Book Stacks Unlimited 운영)은 아마존보다 먼저 문을 열었고, 반스앤노블(1997년경)과 보더스(1998년)의 본격 온라인 판매는 아마존(1995년)보다 늦었다[^10].

그런데 왜 아마존이 크게 이겼을까? 핵심은 **사업 모델과 사업 요구의 차이**였다. 아마존은 단순한 '온라인 전자상거래 웹사이트'가 아니라 **'플랫폼(platform)'**을 만들고자 했다.
1. 처음에는 책으로 시작했지만, 장기적으로는 책에서 시작해 세상의 거의 모든 상품으로 취급 범위를 넓히는 확장 구조를 원했다.
2. 강의가 강조한 또 하나의 축은 **통합(integration)**과 **적시 주문(just-in-time orders)**이었다. 기존 서점들이 자기 재고를 직접 보유하고 관리하는 데 집중한 것과 달리, 아마존이 제공한 핵심 사업 가치는 다양한 판매자(sellers)들을 연결해 통합하는 것이었다. 강의는 이를 이렇게 대비한다. 반스앤노블 같은 곳은 자기 책 재고를 두었지만, 아마존은 "재고도 창고도 없다(no warehouse, no inventory)"고, 잠시 보관하는 창고는 있을지 몰라도 물건을 쌓아 두지는 않는다고 했다. 이 발언은 실제 아마존의 운영과 다르다(아래 해설).

> **[해설] 아마존은 정말 재고와 창고가 없었나**  
> 이 대목에서 강의가 전하고자 하는 핵심 요점은 **'여러 외부 판매자를 잇는 플랫폼·통합 중심의 사업 모델'**이라는 점이다. 강의는 아마존에 재고도 창고도 없다고 했지만, 실제로는 그렇지 않다. 창업 직후(1995년 전후)에는 재고를 최소로 두고 Ingram 같은 도서 도매상에서 책을 받아 주문을 처리해 '재고 없음'에 가까웠다. 그러나 1995년 시애틀에 첫 작은 창고를 두었고, 1997년에는 델라웨어 등에 본격 유통센터를 열었다. 제3자 판매자를 들이는 마켓플레이스는 1999년 zShops로 시작해 2000년 Marketplace로 넓어졌다. 지금의 아마존은 수백 개의 대형 물류센터(Fulfillment Center)를 운영하며, 직접 사들인 재고(1P)와 제3자 판매(3P)를 함께 다룬다. 따라서 '재고·창고가 없다'는 말은 창업 초기의 아주 짧은 시기에만 가까운 설명이다. 그래도 강의의 요점, 곧 사업 모델이 재고 관리보다 판매자 통합을 중심에 두면 아키텍처의 중심도 바뀐다는 점은 그대로 유효하다[^4].

사업 요구가 다르면 코드의 중심축도 바뀐다. 반스앤노블이나 보더스용 시스템을 설계한다면 핵심 관심사는 **자체 데이터베이스와 자체 재고(inventory) 관리**가 된다. 반면 아마존 같은 플랫폼을 설계한다면 아키텍처의 중심축은 수많은 판매자 시스템과 매끄럽게 맞물리는 **통합(integration)**이 된다. 같은 '온라인 판매'라는 기능도 사업 요구에 따라 아키텍처가 근본적으로 달라지는 것이다.

더욱 결정적인 사실은, 아마존에서는 **기능 바깥의 요인이 곧바로 매출과 직결되었다**는 점이다.
- **성능과 매출**: 강의는 아마존에서 응답 시간을 **100밀리초(ms, 0.1초) 줄일 때마다 매출이 1%씩 늘었다**고 소개한다. '상품 검색과 결제'라는 기능 목록에는 응답 속도 0.1초가 적혀 있지 않지만, 사업 성과는 그 속도에 달려 있었다는 것이다. [해설] 이 수치의 원 출처는 전 아마존 엔지니어 Greg Linden이 2006년 블로그와 발표에서 전한 A/B 테스트이고, 원래 내용은 반대 방향이다. 페이지를 100ms 늦추자 매출이 약 1% 줄었다는 것이다. 아마존 공식 보고서나 학술 논문은 아니다. 어느 쪽으로 읽든 '응답 속도가 매출을 움직인다'는 강의의 요점은 같다[^5].
- **가용성과 장애**: 반대로 강의는 몇 년 전(대략 5~7년 전으로 기억한다고 했다) 아마존에 큰 서비스 장애(outage)가 있었고, 주된 원인은 **백업 실패와 네트워크 오류 처리(error handling)를 세밀하게 다루지 않은 것**이었다고 말한다. 큰 소동이 일었고 매출도 잃었을 것이라고 덧붙였다. [해설] 강의가 어느 사건을 가리켰는지는 확인되지 않았다(확인 필요). 시기상 가장 가까운 사건은 2021년 12월 7일 AWS us-east-1 대규모 장애인데, 공식 사후 보고서가 밝힌 원인은 백업 실패가 아니다. 내부 네트워크의 자동 용량 확장 작업이 연결 폭주를 일으켜 네트워크 장비를 압도했고, 재시도가 몰리며 악화된 네트워크 혼잡이었다. 아마존 쇼핑과 Alexa에도 영향이 갔다[^6].

**"우리 시스템은 99.999%의 시간 동안 멈추지 않고 쓸 수 있어야(available) 한다"**는 말은 기능 목록이 아니라 **사업 요구**다. 네트워크 오류가 나더라도 시스템이 무너지지 않고 버티게 만드는 설계는 아키텍처가 풀어야 할 숙제다.

> **차량 호출 앱으로 연결하면:** 승객이 '호출' 버튼을 눌렀을 때 배차 화면이 0.5초 늦게 뜰 때마다 승객은 다른 앱을 켜 버리고(성능 → 매출), 금요일 밤 비 오는 퇴근길에 네트워크 오류 한 번으로 서버가 멈추면(99.999% 가용성 실패) 신뢰와 하루 매출이 한꺼번에 무너진다.

### 3.3 노키아(Nokia): 전화는 걸렸지만 '고칠 수 없는 구조'에 발목 잡히다

세 번째 현실 사례는 한때 휴대전화 시장의 제왕이었던 **노키아(Nokia)**다. 노키아 폰은 그 시절 최고였고, 이후 애플(Apple) 등이 스마트폰이라는 새로운 패러다임을 들고 나오자 무너졌다. 그런데 노키아 폰이 전화 거는 기능 자체가 안 되어서 망했을까? 아니다. 노키아 폰도 전화를 걸고 받을 수 있었다.

이 강의는 노키아의 실패 원인을 기능 밖의 세 가지 요인으로 짚는다.
1. **사용성(usability)의 부재**: 애플과 경쟁할 만큼 직관적이고 편리한 사용자 경험을 만들지 못했다. 사용성은 '전화를 건다'는 기능 자체가 아니라, 그 기능을 얼마나 쓰기 좋게 제공하느냐의 문제다.
2. **수정 용이성(modifiability)의 결여**: 소프트웨어가 기능이 제한된 운영체제에 너무 단단히 묶여(tightly coupled) 있었다. 그 결과 시장 환경이 바뀌었을 때 소프트웨어를 재빨리 고쳐 새 요구를 반영할 수 없었다.
3. **안일함(complacency)**: "우리는 1등이고 앞으로도 계속 1등일 것"이라는 자만 속에서 사업 요구 변화에 맞게 소프트웨어를 제때 재정렬하지 못했고, 경직된(rigid) 소프트웨어 구조가 회사의 발목을 잡았다.

> **[해설] 노키아가 묶여 있던 운영체제 — 심비안(Symbian)**  
> 강의에서는 해당 운영체제의 이름을 직접 말하지 않고 "기능이 제한된 운영체제(this operating system which had limited capabilities)"라고만 언급했다. 배경 지식으로 보면, 2007년 아이폰이 나올 무렵 노키아 스마트폰의 주력 OS는 **심비안(Symbian, S60)**이었다. 터치 화면과 앱 생태계에 제때 대응하지 못한 것이 쇠퇴의 주요 원인으로 널리 지적되며, 2011년 당시 CEO 스티븐 엘롭(Stephen Elop)의 '불타는 플랫폼(Burning Platform)' 메모가 이를 인정한 대표 사례로 꼽힌다[^7].

> **차량 호출 앱으로 연결하면:** 만약 차량 호출 앱을 만들면서 초기 특정 지도 엔진이나 특정 단말 OS의 비표준 기능에 비즈니스 로직을 찰싹 붙여 짜 버리면, 몇 년 뒤 새 지도나 새 결제 수단, 음성 호출 인터페이스를 붙이려 할 때 앱 전체를 새로 짜야 하는 '노키아의 경직성'에 갇히게 된다.

### 3.4 '-ilities': "무엇을"이 아니라 "얼마나 잘"

지금까지 살펴본 성능, 가용성, 사용자 경험(사용성), 수정 용이성, 확장성, 보안, 정확도처럼 영어 단어 끝이 대체로 `-ility`로 끝나는 성질들을 아키텍처에서는 흔히 **`-ilities`**라고 묶어 부른다. 이것이 바로 **품질 속성(quality attributes)**이다.

기능 요구(functional requirements)와 품질 속성의 차이는 한 문장으로 정리된다. 기능은 시스템이 **"무엇을(what)"** 할 수 있는가이고, 품질 속성은 그 무엇을 **"얼마나 잘(how well)"** 수행하는가다.

| 비교 대상 | 본래 사업 모델 / 요구 | 핵심 품질 속성 ('-ilities') | 아키텍처에 생긴 결정적 차이 | 차량 호출 앱으로 치환하면? |
| :--- | :--- | :--- | :--- | :--- |
| **LLM 서비스들** | 같은 GenAI를 쓰되 정확도·텍스트·멀티모달·코딩 등 목표 고객과 과업이 다름 | 정확도, 응답 속도, 처리 형태 적합성 | 모델 서빙·입출력 파이프라인·도구 연동 구조가 서비스마다 갈림 | 같은 배차 기술이라도 통근자용·의전용·배달 겸용 앱의 구조가 다름 |
| **아마존 vs 기존 서점** | 자체 재고 서점(B&N·Borders) vs 모든 상품·판매자 잇는 **플랫폼** | 확장 가능성, **통합(integration)**, 성능(응답 속도→매출, 각주 5), **가용성(99.999%)** | 자체 재고 DB 중심 구조 ↔ 외부 판매자 통합·장애 복구 중심 구조 | 자체 차량만 굴리는 회사 앱 ↔ 외부 개인 기사·렌터카·외부 결제를 잇는 플랫폼 |
| **노키아 vs 애플** | 1등 안주·제한된 OS에 묶인 구조 vs 직관적 경험 중심 패러다임 전환 | **사용성(usability)**, **수정 용이성(modifiability)** | OS에 강결합된 경직된 구조 ↔ 새 기능·UI를 빠르게 바꾸는 유연한 구조 | 특정 단말·OS에 얽매여 택배 기능이나 새 UI를 못 붙이는 경직된 앱 |

---

## 4. 구조가 품질을 만든다: 입국 심사 줄로 이해하는 처리량, 지연 시간, 그리고 대가

품질 속성이 그렇게 중요하다는 것은 알겠다. 그렇다면 대체 무엇이 소프트웨어의 품질 속성을 결정할까? 좋은 알고리즘을 쓰는 것도 중요하고 빠른 CPU를 사는 것도 중요하지만, 이 강의가 강조하는 핵심은 **'구조(structure)'가 품질 속성에 엄청난 영향을 미친다**는 사실이다. 물론 구조가 유일한 요인은 아니지만, 시스템 전체 성질의 아주 큰 부분을 좌우한다.

여기서 말하는 구조란 구체적으로 다음과 같은 질문에 대한 답이다.
- 소프트웨어를 어떤 **모듈(modules)**로 쪼개고 나눌 것인가? (일단은 이것을 **분해(decomposition)**라고 생각해도 좋지만, 실제 구조는 분해 그 이상이다.)
- 어떤 모듈을 여러 개로 **복제(replicate)**해서 돌릴 수 있게 만들 것인가?
- 모듈들끼리 **어떤 방식으로 통신(communicate)**할 것인가?
- 모듈 사이에 **얼마나 많은 데이터를, 어떤 메커니즘으로** 주고받을 것인가?

이 질문들에 어떻게 답하느냐가 앞서 본 모든 `-ilities`에 영향을 준다. 요컨대 **"큰 구조(gross structure)가 시스템의 성질을 좌우한다."**

### 4.1 공항 입국 심사 줄의 비유: 처리량 늘리기

소프트웨어 바깥의 일상적인 공간으로 잠깐 걸어 들어가 보자. 해외여행을 다녀온 사람이라면 공항 **입국 심사(immigration)** 줄에 서서 답답함을 느껴 본 적이 있을 것이다. 줄은 구불구불 끝도 없이 길게 늘어섰는데, 앞을 보니 **심사관(officer)은 단 한 명**뿐이다.

여기서 소프트웨어의 첫 번째 핵심 지표가 자연스럽게 모습을 드러낸다. **처리량(throughput)**이다. 처리량이란 1초나 10분 같은 **정해진 시간 동안 총 몇 명의 사람을 처리해 통과시킬 수 있는가**를 뜻한다. 한 명만 서 있는 창구에서는 이 처리량이 턱없이 낮고, 기다리는 사람들은 불만이 쌓인다.

이 대기 시간을 줄이고 처리량을 끌어올리려면 어떻게 해야 할까? 강의 중 한 학생이 던진 한 단어의 답은 **"병렬화(parallelize)"**였다.
- 심사관을 여러 명 세우고, 대기 줄도 여러 개로 나눈다.
- 이렇게 나란히 동시에 처리하면 정해진 10분 동안 통과하는 사람 수(**처리량**)가 크게 늘어나고, 줄이 짧아져 기다리는 시간도 줄어든다.

### 4.2 지연 시간(Latency)을 줄이는 두 가지 길: 자원과 전문화

강의는 병렬화가 기다리는 시간, 곧 지연 시간도 줄여 준다고 말한 뒤 한 걸음 더 들어간다. 처리량은 "10분 동안 몇 명 처리"처럼 전체 묶음의 양을 말한다. 반면 **한 사람**을 심사하는 데 걸리는 시간—한 건당 응답 시간인 **지연 시간(latency)**—은 다른 방법으로도 줄일 수 있지 않을까? [해설] 심사관 한 명이 여권 한 권을 검사하는 데 2분이 걸린다면, 창구를 늘려도 그 2분 자체는 그대로일 수 있다. 그래서 한 건당 시간을 줄이는 방법이 따로 필요하다.

한 사람당 걸리는 **지연 시간**을 줄이려면 어떤 구조를 써야 할까? 강의가 정리한 해법은 두 가지다.

1. **더 많은 자원(resources) 투입**: 심사와 확인 작업에 자원을 더 투입해 한 건당 처리 속도를 끌어올린다.
2. **종류별로 줄 나누기 — 전문화(specialization)**: 모든 사람을 한 종류의 줄에 세우는 대신, **자국민(citizens) 전용 줄**과 **외국인 방문객(visitors) 전용 줄**처럼 처리 대상의 종류별로 줄을 분류(categorize)한다. 이렇게 하면 자국민 줄을 맡은 심사관은 자국민 여권에서 무엇을 확인해야 하는지에 훨씬 익숙해져서, 한 사람당 훨씬 빠르게 처리할 수 있다. 전문화가 개개인의 지연 시간을 깎아 주는 것이다.

<svg viewBox="0 0 420 1180" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="cmu2_bg" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="#0f172a" />
<stop offset="100%" stop-color="#1e293b" />
</linearGradient>
<marker id="cmu2arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" /></marker>
</defs>
<rect x="0" y="0" width="420" height="1180" rx="14" fill="url(#cmu2_bg)"/>
<rect x="2" y="2" width="416" height="1176" rx="12" fill="none" stroke="#334155" stroke-width="1.5"/>
<text x="210" y="32" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">입국 심사 줄로 보는 구조와 품질 속성</text>
<text x="210" y="54" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">병렬화 · 전문화 · 비용 트레이드오프</text>
<text x="210" y="80" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">구조(창구 수와 줄 분류)가</text>
<text x="210" y="100" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">처리량(Throughput)과</text>
<text x="210" y="120" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">지연 시간(Latency)을 바꾼다</text>
<text x="210" y="140" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">그러나 공짜는 없다</text>
<rect x="16" y="158" width="388" height="220" rx="10" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
<rect x="16" y="158" width="388" height="40" rx="10" fill="#334155"/>
<rect x="16" y="178.0" width="388" height="20.0" fill="#334155"/>
<text x="210" y="184" fill="#f8fafc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">1. 단일 창구 (병목)</text>
<text x="210" y="224" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">긴 줄 1개 → 심사관 1명</text>
<rect x="32" y="238" width="200" height="32" rx="5" fill="#0f172a" stroke="#475569" stroke-width="1"/>
<text x="132" y="260" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">대기자 · · · · · ·</text>
<line x1="236" y1="254" x2="268" y2="254" stroke="#94a3b8" stroke-width="2" marker-end="url(#cmu2arr)"/>
<rect x="276" y="238" width="112" height="32" rx="5" fill="#7f1d1d" stroke="#ef4444" stroke-width="1"/>
<text x="332" y="260" fill="#fecaca" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">심사관 1</text>
<text x="32" y="298" fill="#f87171" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600">• 처리량(Throughput): 매우 낮음</text>
<text x="32" y="322" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 대기 시간 폭증, 답답함</text>
<text x="32" y="346" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 비용: 최소 (심사관 1명분)</text>
<line x1="210" y1="378" x2="210" y2="406" stroke="#94a3b8" stroke-width="2" marker-end="url(#cmu2arr)"/>
<rect x="16" y="414" width="388" height="244" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
<rect x="16" y="414" width="388" height="40" rx="10" fill="#0c4a6e"/>
<rect x="16" y="434.0" width="388" height="20.0" fill="#0c4a6e"/>
<text x="210" y="440" fill="#f8fafc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">2. 병렬 창구 (병렬화)</text>
<text x="210" y="480" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">줄 여러 개 + 심사관 여러 명</text>
<rect x="32" y="494" width="356" height="32" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1"/>
<text x="210" y="516" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">줄 A  ──▶  심사관 A</text>
<rect x="32" y="532" width="356" height="32" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1"/>
<text x="210" y="554" fill="#bae6fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">줄 B  ──▶  심사관 B</text>
<text x="32" y="590" fill="#38bdf8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600">• 처리량(Throughput): 크게 향상</text>
<text x="32" y="614" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 정해진 10분 내 다수 동시 처리</text>
<text x="32" y="638" fill="#fbbf24" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 대가: 인력·자원 비용 증가</text>
<line x1="210" y1="658" x2="210" y2="686" stroke="#94a3b8" stroke-width="2" marker-end="url(#cmu2arr)"/>
<rect x="16" y="694" width="388" height="244" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
<rect x="16" y="694" width="388" height="40" rx="10" fill="#064e3b"/>
<rect x="16" y="714.0" width="388" height="20.0" fill="#064e3b"/>
<text x="210" y="720" fill="#f8fafc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">3. 줄 분류 (전문화 + 자원)</text>
<text x="210" y="760" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">대상별 전용 큐로 숙련도·속도↑</text>
<rect x="32" y="774" width="356" height="32" rx="4" fill="#0f172a" stroke="#10b981" stroke-width="1"/>
<text x="210" y="796" fill="#6ee7b7" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">자국민 줄  ──▶  전담 심사관</text>
<rect x="32" y="812" width="356" height="32" rx="4" fill="#0f172a" stroke="#a78bfa" stroke-width="1"/>
<text x="210" y="834" fill="#ddd6fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">방문객 줄  ──▶  전담 심사관</text>
<text x="32" y="870" fill="#34d399" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600">• 지연 시간(Latency): 1인당 단축</text>
<text x="32" y="894" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 익숙한 절차로 처리 효율 극대화</text>
<text x="32" y="918" fill="#fbbf24" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 대가: 전용 자원·분류 비용 추가</text>
<rect x="16" y="954" width="388" height="210" rx="8" fill="#0b1220" stroke="#f59e0b" stroke-width="1.3"/>
<text x="210" y="980" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">핵심 대가 (Trade-off)</text>
<text x="210" y="1004" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">"공짜는 없다. 트레이드오프 없는</text>
<text x="210" y="1026" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">품질 속성은 없다."</text>
<text x="210" y="1056" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">소프트웨어에서도 API 서비스</text>
<text x="210" y="1078" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">인스턴스를 늘리거나 요청별 전용 큐를</text>
<text x="210" y="1100" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">두면 처리량·지연은 좋아지지만,</text>
<text x="210" y="1122" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">CPU·전력·운영 비용이 늘어난다.</text>
</svg>

### 4.3 스콧 파베티의 지적: 공짜는 없다

입국 심사 비유가 한창 무르익을 때, 공동 강사인 스콧 파베티(Scott Pavetti)가 한 마디를 보탠다.
> "트레이드오프를 잊지 마세요. 줄을 하나 더 만들려면, 처리 자원도 하나 더 투입해야 합니다."

맞다. 이것이 소프트웨어 아키텍처를 관통하는 핵심 진실, **트레이드오프(trade-off)**다. **"공짜는 없다(Nothing comes for free). 트레이드오프 없는 품질 속성은 없다."** 처리량과 지연 시간을 얻으려면 더 많은 심사관을 배치하는 **비용(cost)**을 치러야 한다.

이제 이 비유를 그대로 소프트웨어와 우리의 차량 호출 앱으로 옮겨 보자.
- 우리가 웹 서비스나 API를 만든다고 할 때, 외부에서 수많은 요청(requests)이 동시에 쏟아져 들어온다.
- 이 요청들을 **어떻게 줄 세울(queue) 것인가?**
- 서비스의 실행 복제본(인스턴스, instances)을 여러 개 띄우면 처리량이 좋아지지만, 그만큼 더 많은 **CPU 시간, 전력 같은 시스템 자원**, 곧 비용이 들어간다. 바로 트레이드오프다.
- 입국 심사에서 자국민 줄과 방문객 줄을 나누었듯, 소프트웨어에서도 **요청의 종류별로 서로 다른 큐(queue)**를 둘 수 있다.

> **차량 호출 앱으로 연결하면:** 출퇴근 시간대에 승객 수만 명이 동시에 '차량 호출' 버튼을 누르고 운전자 수만 대가 3초마다 GPS 좌표를 쏘아 올린다면, 배차 서비스 인스턴스를 여러 개 띄워(병렬화) 처리량을 늘려야 한다. 하지만 인스턴스를 무작정 100개 띄우면 클라우드 요금(비용)이 폭증한다. 또한 운전자의 주기적 위치 보고와 승객의 즉각적인 호출 요청을 같은 줄에 세우지 않고 전용 큐로 분리하면(전문화), 급한 배차 요청의 지연 시간을 줄일 수 있다.

---

## 5. 상태는 어디에 두어야 하는가: 장바구니와 트레이드오프의 기술

### 5.1 아키텍트가 내려야 하는 구조 결정들

구조를 설계한다는 것은 구체적으로 어떤 선택들을 내리는 일일까? 강의는 네 가지 대표적인 구조 결정을 예로 든다.
1. **병렬·동시 실행 단위가 필요한가?** 한 번에 하나씩 차례대로 처리할 것인가, 여러 작업 단위를 동시에 띄울 것인가?
2. **어떤 기능을 어떤 프로세스(process)에 맡길 것인가?** 실행 단위들 사이에 일감을 어떻게 배분할 것인가?
3. **기능을 어떤 코드 모듈(code modules)에 배정할 것인가?** 소스 코드 수준에서 역할의 경계를 어떻게 그을 것인가?
4. **상태 관리(state management)**: 사용자마다 달라지고 계속 변하는 데이터를 어디에 보관할 것인가?

### 5.2 장바구니 딜레마: 클라이언트(브라우저) vs 서버(백엔드)

네 번째인 **상태 관리**를 이해하기 위해 강의는 온라인 쇼핑의 **장바구니(shopping cart)**를 예로 든다.

먼저 '상태(state)'라는 말부터 쉽게 풀어 보자. 쇼핑몰에 접속해 물건을 구경할 때, 내가 장바구니에 치약을 담고 수건을 뺐다가 다시 운동화를 넣는 그 목록은 모든 사용자에게 똑같은 공용 데이터가 아니다. **오직 나 개인에게 묶여 있고, 시간이 지나며 계속 바뀌는 데이터**다. 이것이 애플리케이션의 **상태(application state)**다.

그렇다면 이 장바구니 상태를 **어디에 저장하고 유지(maintain)**해야 할까? 선택지는 크게 두 곳이며, 양쪽 모두 뚜렷한 장단점을 안고 있다.

| 저장 위치 | 얻는 것 (장점) | 잃는 것 (단점) | 핵심 트레이드오프 |
| :--- | :--- | :--- | :--- |
| **브라우저(클라이언트) 쪽** | 사용자 바로 옆에 있으므로 **성능(빠른 반응 속도)**이 좋고, 로컬에 캐시(cached)되어 있어 서버 통신이 잠시 흔들려도 **가용성(availability)**이 높다. | 브라우저가 강제 종료되거나(crash) 다른 기기에서 다시 접속하면 **상태를 완전히 잃어버린다(지속성 상실).** | 속도·가용성 ↑ / 지속성 ↓ |
| **서버(백엔드) 쪽** | 브라우저가 꺼지거나 기기를 바꿔도 장바구니가 그대로 남아 있는 **지속성(persistency)**을 확보한다. | 물건을 하나 담거나 뺄 때마다 네트워크를 건너 서버에 다녀와야 하므로 **응답 시간(지연 시간, latency)이 길어진다.** | 지속성 ↑ / 지연 시간 ↑ (더 느림) |

여기서 초보자가 가장 자주 묻는 질문이 나온다. *"그럼 둘 중에 어느 쪽이 더 좋은 아키텍처인가요?"*

답은 단호하다. **절대적인 정답은 없으며, 오직 "사업 요구에 달렸다(It depends on the business needs)!"**
- 만약 고객이 장바구니에 물건을 담아 두었다가 몇 시간 뒤나 다음 날 다시 들어와 결제까지 이어지는 것이 매출에 치명적인 쇼핑몰이라면, 응답이 아주 조금 느려지더라도 **지속성(persistency)**이 우선이므로 서버 쪽에 두는 설계가 맞다.
- 반대로 어떤 다른 종류의 앱에서는 데이터를 영구히 기억하는 것(지속성)보다 네트워크가 불안정한 환경에서도 화면이 즉시 반응하는 **가용성과 짧은 지연 시간**이 훨씬 더 중요할 수 있다. 그렇다면 클라이언트 쪽에 두는 편이 낫다.

> **차량 호출 앱으로 연결하면:** 차량 호출 앱 안에도 성격이 다른 여러 '상태'가 섞여 있다. 승객이 지도를 이리저리 확대·축소하며 출발지 핀을 조금씩 옮기는 중의 임시 화면 상태는 휴대폰(클라이언트)에 두어야 0.1초 안에 부드럽게 움직인다. 설령 앱이 꺼져도 다시 켜서 찍으면 그만이다. 반면 승객과 운전자가 매칭되어 **"배차 확정, 현재 탑승 중, 누적 요금 14,000원"**이 된 운행 상태는 승객의 휴대폰 배터리가 꺼지더라도 절대 사라지면 안 되므로, 지연 시간을 일부 감수하더라도 반드시 백엔드 서버에 지속성 있게 저장해야 한다.

### 5.3 품질 속성은 설계의 '결과물'이 아니라 '입력값'이다

장바구니 예시가 보여 주는 교훈은 분명하다. 시스템의 구조가 지연 시간, 처리량, 가용성, 지속성 같은 품질 속성을 좌우하기 때문에, **품질 속성은 나중에 측정해 보는 부수적 결과가 아니라 아키텍처와 설계의 '입력(input)'이 되어야 한다.**

그리고 그 입력값은 개발자의 머릿속이 아니라 **사용자와 고객에게서 나온다.** 따라서 아키텍트는 기능 요구사항("무엇을 할 수 있어야 하나요?")을 수집하러 갈 때, 반드시 **아키텍처 요구사항, 즉 품질 속성("얼마나 빨라야 하고, 끊겨도 데이터를 보존해야 하며, 동시 몇 명을 버텨야 하나요?")**을 함께 수집해 와야 한다. 그래야 비로소 아키텍처를 설계할 수 있다.

---

## 6. 소프트웨어 아키텍처의 정의와 시스템을 바라보는 세 가지 눈

앞에서 다룬 동기, 사업 요구, 품질 속성, 구조를 한데 모으면 드디어 소프트웨어 아키텍처가 무엇인지 명확하게 정의할 수 있다.

### 6.1 강의식 정의와 정식 정의

이 강의가 제시하는 직관적 정의부터 보자.
> **소프트웨어 아키텍처란 품질 속성에 영향을 주는 설계 결정이며, 품질 속성에 영향을 미치도록 시스템을 구조화(structuring)하는 것이다.**

그리고 한 걸음 더 나아간 **정식 정의(formal definition)**로 다음 영어 문장을 인용한다.
> **"The software architecture of a system is the set of structures needed to reason about the system."**  
> ("한 시스템의 소프트웨어 아키텍처란, 그 시스템에 대해 추론하는 데 필요한 구조들의 집합이다.")

여기서 **"시스템에 대해 추론한다(reason about the system)"**는 말은 무슨 뜻일까? 코드를 다 짜서 실행해 보기 전에도, 또는 시스템을 고치기 전에도 이 구조들을 들여다보며 **"이 시스템이 얼마나 빠를지(성능), 얼마나 안전할지(보안), 얼마나 커질 수 있을지(확장성) 따져 보고 논리적으로 판단할 수 있다"**는 뜻이다. 바로 그 판단을 가능하게 해 주는 구조들의 묶음이 아키텍처다.

> **[해설] 정식 정의의 원출처와 전체 문장**  
> 강의에서는 이 정의의 앞부분 핵심 문장만 인용하고 저자를 따로 호명하지 않았으나, 이 문구는 본 과목의 첫 번째 교재인 Len Bass·Paul Clements·Rick Kazman 공저 『Software Architecture in Practice』에 실린 정의의 앞부분이다. 이 형태는 3판에서 자리 잡아 4판에도 그대로 실렸고, 바로 뒤에 **"These structures comprise software elements, relations among them, and properties of both."**(이 구조들은 소프트웨어 요소들과, 요소들 사이의 관계, 그리고 그 둘의 속성으로 이루어진다)라는 문장이 이어진다[^8].

### 6.2 하나의 시스템을 세 가지 눈으로 보기: 정적·동적·배치 구조

정의에서 눈여겨볼 대목은 '구조(structure)'가 단수가 아니라 **'구조들의 집합(the set of structures)'**이라는 복수형이라는 점이다. 같은 차량 호출 앱도 코드가 어떻게 나뉘었는지, 실행 중에 무엇이 몇 개 도는지, 휴대폰과 서버 중 어디에 놓이는지를 따로 봐야 전체를 따질 수 있다. 이렇게 **세 가지 서로 다른 시선(뷰, views)**으로 나누어 본다.

1. **정적 구조 (Static Structure / Static View): "코드를 어떻게 나누어 놓았나?"**  
   프로그램이 아직 실행되기 전, 소스 코드 파일들이 어떤 모듈(modules), 서브시스템(subsystems), 계층(layers)으로 나뉘어 설계되어 있는가를 본다. 코드를 나누는 방식에는 여러 갈래가 있다.
   - **가로(계층)로 나누기**: 데이터를 저장·조회하는 **데이터 접근 계층(data access layer)**, 규칙을 계산하는 **업무 처리 계층(business processing layer)**, 화면을 보여 주고 입력을 받는 **사용자 상호작용 계층(user interaction layer)**으로 층을 쌓아 분리하는 방식이다.
   - **세로(기능·도메인)로 자르기**: 재무 기능(financial), 재고 기능(inventory), 고객관리 기능(customer relation)처럼 업무 영역별로 수직 기둥을 세워 쪼개는 방식이다.
   - 어느 방식을 택하든 기준은 같다. **사업 요구에서 도출된 품질 속성에 가장 잘 맞아야 한다.**

2. **동적 구조 (Dynamic Structure / Dynamic View): "실행 중에 몇 개가 어떻게 돌아가나?"**  
   이제 프로그램을 실제로 실행(runtime)해 보자. 코드가 디스크에 얌전히 놓여 있을 때와 달리, 실행 중에는 어떤 일들이 **병렬(parallel) 또는 동시(concurrent)**로 일어나야 하는지, 특정 모듈의 실행 복제본(인스턴스)을 딱 하나만 띄울지 아니면 여러 개를 동시에 띄워 돌릴지를 정해야 한다.

3. **배치 구조 (Deployment Structure / Deployment View): "조각들이 물리적으로 어디에 놓이나?"**  
   강의는 슬라이드에 이 세 번째 관점이 빠져 있다고 짚고 덧붙인다. 쪼개 놓은 코드 모듈들이 실제로 어느 하드웨어와 환경 위에 올라가는가 하는 문제다. 과목 소개의 표현을 빌리면, **"내 주머니 속(스마트폰)? 내 몸(웨어러블 기기)? 백엔드 서버? 아니면 클라우드?"** 중 어디에 배치할지 결정해야 한다.

### 6.3 쪼개는 순간 따라오는 두 가지 숙제: 통신 방식과 횡단 관심사

모듈을 여러 개로 쪼개고 여러 곳에 배치하는 순간, 아키텍트는 피할 수 없는 두 가지 후속 질문과 마주한다.

첫째, **서로 어떻게 통신(interact)할 것인가?**  
조각들을 분리해 놓았으니 이제 그 사이를 건너 데이터를 주고받아야 한다. 호출을 보낸 쪽이 답이 올 때까지 멈춰서 기다리는 **동기 호출(synchronous call)**로 할 것인가, 요청만 던져 놓고 자기 할 일을 계속하는 **비동기 호출(asynchronous call)**로 할 것인가, 아니면 같은 메모리 공간을 함께 읽고 쓰는 **공유 메모리(shared memory)** 방식으로 대화할 것인가를 정해야 한다.

둘째, **횡단 관심사(cross-cutting concerns)를 어떻게 다룰 것인가?**  
시스템의 어느 한 조각에만 속하지 않고 모든 곳을 가로지르는 공통 기능이 있다. 강의는 **감사 로그(audit log)**—시스템 안에서 일어나는 모든 활동을 빠짐없이 기록하는 기능—를 예로 든다. 로깅은 사용자 화면 계층에서만 찍고 끝날 일이 아니라 데이터 계층, 업무 계층, 결제 계층까지 시스템 전체를 관통하며(cross-cutting) 일어나야 한다. 이때 아키텍트는 선택해야 한다. 이 감사 로그 기능을 모든 계층과 컴포넌트 안에 일일이 집어넣을(embed) 것인가, 아니면 **따로 떼어 내어 독립 모듈로 만든 뒤 모든 계층에서 필요할 때마다 호출(invoke)할 수 있게** 설계할 것인가?

<svg viewBox="0 0 420 1418" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="cmu3_bg" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="#0f172a" />
<stop offset="100%" stop-color="#1e293b" />
</linearGradient>
<marker id="cmu3arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" /></marker>
</defs>
<rect x="0" y="0" width="420" height="1418" rx="14" fill="url(#cmu3_bg)"/>
<rect x="2" y="2" width="416" height="1414" rx="12" fill="none" stroke="#334155" stroke-width="1.5"/>
<text x="210" y="32" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">소프트웨어 아키텍처를 바라보는</text>
<text x="210" y="54" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">세 가지 눈</text>
<text x="210" y="76" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">Static · Dynamic · Deployment</text>
<text x="210" y="102" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">하나의 차량 호출 앱도</text>
<text x="210" y="122" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">정적 분할, 실행 중 인스턴스,</text>
<text x="210" y="142" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">물리적 배치, 통신 방식,</text>
<text x="210" y="162" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">횡단 관심사를 함께 결정해야 한다</text>
<rect x="16" y="180" width="388" height="248" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
<rect x="16" y="180" width="388" height="40" rx="10" fill="#0c4a6e"/>
<rect x="16" y="200.0" width="388" height="20.0" fill="#0c4a6e"/>
<text x="210" y="206" fill="#f8fafc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">1. 정적 구조 (Static View)</text>
<text x="210" y="242" fill="#7dd3fc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">"코드를 어떻게 나누어 두나?"</text>
<rect x="32" y="258" width="356" height="62" rx="6" fill="#0f172a" stroke="#475569" stroke-width="1"/>
<text x="210" y="284" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">가로 나누기 (계층화)</text>
<text x="210" y="306" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">화면 UI / 업무 처리 / 데이터 접근</text>
<rect x="32" y="328" width="356" height="84" rx="6" fill="#0f172a" stroke="#475569" stroke-width="1"/>
<text x="210" y="354" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">세로 나누기 (도메인·기능별)</text>
<text x="210" y="376" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">재무·재고·고객</text>
<text x="210" y="398" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(예: 승객·운전자·배차·결제)</text>
<rect x="16" y="444" width="388" height="248" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
<rect x="16" y="444" width="388" height="40" rx="10" fill="#064e3b"/>
<rect x="16" y="464.0" width="388" height="20.0" fill="#064e3b"/>
<text x="210" y="470" fill="#f8fafc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">2. 동적 구조 (Dynamic View)</text>
<text x="210" y="506" fill="#6ee7b7" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">"실행 중 몇 개가 어떻게 도나?"</text>
<rect x="32" y="522" width="356" height="84" rx="6" fill="#0f172a" stroke="#475569" stroke-width="1"/>
<text x="210" y="548" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">인스턴스 수 &amp; 병렬·동시 실행</text>
<text x="210" y="570" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">배차 엔진 N개 병렬 vs</text>
<text x="210" y="592" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">단일 제어기 1개</text>
<rect x="32" y="614" width="356" height="62" rx="6" fill="#0f172a" stroke="#475569" stroke-width="1"/>
<text x="210" y="640" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">실행 시점 상호작용</text>
<text x="210" y="662" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">러시아워 인스턴스 증설·심야 축소</text>
<rect x="16" y="708" width="388" height="270" rx="10" fill="#1e293b" stroke="#a78bfa" stroke-width="1.5"/>
<rect x="16" y="708" width="388" height="40" rx="10" fill="#4c1d95"/>
<rect x="16" y="728.0" width="388" height="20.0" fill="#4c1d95"/>
<text x="210" y="734" fill="#f8fafc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">3. 배치 구조 (Deployment View)</text>
<text x="210" y="770" fill="#ddd6fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">"조각들이 어디에 놓이나?"</text>
<rect x="32" y="786" width="356" height="84" rx="6" fill="#0f172a" stroke="#475569" stroke-width="1"/>
<text x="210" y="812" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">물리적·가상 실행 위치</text>
<text x="210" y="834" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">내 주머니(폰) · 내 몸(웨어러블)</text>
<text x="210" y="856" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">· 서버 · 클라우드</text>
<rect x="32" y="878" width="356" height="84" rx="6" fill="#0f172a" stroke="#475569" stroke-width="1"/>
<text x="210" y="904" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">차량 호출 앱 배치 예</text>
<text x="210" y="926" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">UI(휴대폰) + 배차(클라우드)</text>
<text x="210" y="948" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">+ 결제(외부망)</text>
<rect x="16" y="994" width="388" height="196" rx="10" fill="#0b1220" stroke="#f59e0b" stroke-width="1.4"/>
<text x="32" y="1020" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700">나누는 순간 정해야 하는 것 ①</text>
<text x="32" y="1042" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700">조각 간 통신 방식</text>
<text x="32" y="1070" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 동기 호출 (Synchronous):</text>
<text x="48" y="1090" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">답이 올 때까지 대기 (예: 결제 승인)</text>
<text x="32" y="1112" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 비동기 호출 (Asynchronous):</text>
<text x="48" y="1132" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">던지고 진행 (예: 위치 보고·알림)</text>
<text x="32" y="1154" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 공유 메모리 (Shared Memory):</text>
<text x="48" y="1174" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">같은 기계 내 빠른 메모리 공유</text>
<rect x="16" y="1206" width="388" height="196" rx="10" fill="#0b1220" stroke="#ef4444" stroke-width="1.4"/>
<text x="32" y="1232" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700">나누는 순간 정해야 하는 것 ②</text>
<text x="32" y="1254" fill="#fca5a5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700">횡단 관심사 (Cross-cutting)</text>
<text x="32" y="1282" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 예: 모든 활동을 남기는</text>
<text x="48" y="1302" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif">감사 로그 (Audit Log)</text>
<text x="32" y="1324" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• UI 계층만 아니라 모든 계층·</text>
<text x="48" y="1344" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">컴포넌트에 두루 걸치는 성질</text>
<text x="32" y="1366" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 각 계층에 직접 심을지, 따로 떼어</text>
<text x="48" y="1386" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">어디서든 호출하게 할지 결정</text>
</svg>

---

## 7. 바퀴를 다시 발명하지 않는 법: 패턴, 프레임워크, 프로토타입, 그리고 두 가지 법칙

아키텍처를 매번 백지상태에서 창조할 필요는 없다. 소프트웨어가 수십 년 동안 발전해 오면서 수많은 개발자가 비슷한 문제를 반복해 풀었고, 그 경험이 검증된 도구들로 축적되어 있기 때문이다.

### 7.1 아키텍처 패턴과 프레임워크: 검증된 뼈대 빌려 쓰기

첫 번째 도구는 **아키텍처 패턴(architectural patterns)**이다. 어떤 구조가 특정 요구사항과 특정 품질 속성에 특히 잘 맞는다는 사실이 오랜 기간 증명되면 하나의 패턴으로 정립된다. 우리는 바퀴를 다시 발명하지 않고, 이런 패턴들을 익혀 두었다가 자기 애플리케이션의 맥락에 알맞은 것을 골라 쓰면 된다.

두 번째 도구는 **참조 아키텍처(reference architectures)**와 **프레임워크(frameworks)**다. 모든 기반 코드를 바닥부터 직접 짤 필요가 없다. 집을 지을 때 수도와 전기 배관 같은 기초 공사를 뜻하는 말처럼, 소프트웨어에서도 반복되는 지루한 기반 작업(**plumbing work**)은 이미 프레임워크 안에 다 만들어져 있다. 강의 중 한 학생이 웹 개발과 배포를 위한 프레임워크로 **라라벨(Laravel)**을 예로 들자, 강의는 프레임워크의 본질을 정확히 짚어 낸다.
> **"프레임워크는 아키텍처를 제공한다. 우리는 정해진 자리에 애플리케이션 고유의 코드만 끼워 넣음으로써 그 아키텍처를 따르게 된다."**

> **차량 호출 앱으로 연결하면:** 차량 호출 앱의 백엔드 웹 API를 처음부터 TCP 소켓이나 HTTP 파서부터 직접 짜는 사람은 거의 없다. 검증된 웹 프레임워크가 제공하는 요청 처리와 데이터베이스 연결 '배관' 위에, 우리는 승객 매칭과 요금 계산이라는 고유 컴포넌트만 정해진 위치에 끼워 넣어 배포하면 된다.

### 7.2 모를 때는 실험하라: 프로토타입과 끝에서 끝까지 이어지는 뼈대

물론 패턴과 프레임워크를 다 알아도 아키텍처 앞에는 여전히 짙은 안개가 낀 **위험과 미지수(risks and unknowns)**가 남는다. 강의는 두 가지 생생한 예를 든다.
- **어떤 LLM이 내 앱에 최적인가?** 챗봇이나 AI 에이전트 서비스를 만들고 싶은데, 내 앱의 요구에 어느 LLM이 가장 잘 맞는지 사전에 문서만 보고는 확신하기 어렵다.
- **계층형(layered) vs 마이크로서비스(microservice) 중 무엇이 나은가?** 두 가지 큰 구조 후보 사이에서 어느 쪽이 우리가 원하는 품질 속성(성능, 수정 용이성 등)에 더 맞는지 불확실하다.

이럴 때 아키텍트가 해야 할 일은 머릿속으로만 논쟁하거나 감으로 찍는 것이 아니라 **프로토타입(prototypes)과 실험(experiments)**을 해 보는 것이다. 특히 시스템의 맨 앞단부터 맨 뒷단까지 **끝에서 끝까지 이어지는 얇은 뼈대(end-to-end skeleton)**를 먼저 프로토타입으로 만들어 실제로 돌려 보고 측정·평가해 보아야 한다. 이것이 바로 **아키텍처 검증(validating the architecture)**이다.

> **차량 호출 앱으로 연결하면:** "피크 타임 동시 호출 1만 건을 버티려면 단순 계층형 서버로 충분할까, 아니면 배차·결제·알림을 마이크로서비스로 쪼개야 할까?"가 불확실하다면, 전체 기능을 다 만들기 전에 승객 요청 → 배차 모의 처리 → 응답까지 끝에서 끝까지 이어지는 얇은 뼈대를 두 방식으로 각각 프로토타입해 부하를 걸어 보고 선택을 검증해야 한다.

### 7.3 소프트웨어 아키텍처의 두 가지 법칙

강의는 지금까지의 논의를 관통하는 **소프트웨어 아키텍처의 두 가지 법칙**으로 개념의 못을 박는다.

1. **제1법칙: 소프트웨어 아키텍처의 모든 것은 트레이드오프다 (Everything in software architecture is a trade-off).**  
   앞서 입국 심사 줄에서 스콧 파베티가 짚은 원칙이자, 장바구니 상태 관리에서 본 가용성 대 지연 시간의 맞교환이다. 어느 한 품질 속성을 끌어올리면 다른 품질 속성이나 비용 중 무언가는 반드시 내어주어야 한다. 공짜로 얻어지는 품질 속성은 없다.
2. **제2법칙: '어떻게'보다 '왜'가 더 중요하다 (Why is more important than how).**  
   똑같은 기능이라도 서로 다른 여러 아키텍처('어떻게')로 구현해 낼 수 있다. 단독 모바일 앱으로도, 단일 웹 백엔드로도, 클라우드 분산 구조로도 차량 호출은 돌아간다. 그러므로 진짜 중요한 것은 구현 방식 자체가 아니라 **"왜 수많은 대안 중 하필 이 아키텍처를 골랐는가"**를 품질 속성과 트레이드오프에 비추어 논리적으로 설명할 수 있는 능력이다. 그리고 모든 선택이 트레이드오프인 만큼, 그 결정이 **사업 요구와 정확히 맞물려 있는지** 끝까지 확인해야 한다.

> **[해설] 소프트웨어 아키텍처의 두 법칙 원출처**  
> 강의에서는 이 두 법칙의 책이나 저자 출처를 따로 말하지 않고 핵심 명제로 제시했다. 소프트웨어 아키텍처 분야에서 이 두 문장은 Mark Richards와 Neal Ford의 『Fundamentals of Software Architecture』(O'Reilly, 2020)가 '소프트웨어 아키텍처의 제1법칙(Everything in software architecture is a trade-off)'과 '제2법칙(Why is more important than how)'으로 제시한 명제다. 2025년 2판에서는 제3법칙(대부분의 아키텍처 결정은 둘 중 하나가 아니라 스펙트럼 위에 있다)이 더해졌다[^9].

---

## 8. 아키텍트는 코딩 전에 무엇을 하는가: 여섯 가지 핵심 활동과 총정리

그렇다면 이 모든 이론을 손에 쥔 아키텍트는 실제 프로젝트에서 무엇을 하며 하루를 보낼까? 강의의 마지막 장은 아키텍트의 공통 활동을 여섯 가지로 명확하게 정리한다.

### 8.1 아키텍트의 여섯 가지 핵심 활동

1. **요구사항 도출(requirements elicitation)에 참여하기**  
   아키텍트는 기능 목록이 다 정해진 뒤에야 불려 들어오는 사람이 아니다. 처음 요구사항을 모으는 자리부터 함께 들어가 **아키텍처 요구사항**, 즉 성능·보안·사용성 같은 품질 속성을 파악해야 한다. 동시에 피해 갈 수 없는 **제약(constraints)**도 정확히 알아내야 한다. 예컨대 발주처나 스폰서가 ".NET 프레임워크만 써야 하고, 클라우드는 AWS가 아니라 반드시 Azure만 써야 한다"고 못 박는다면, 아키텍트는 아무리 다른 도구가 좋아 보여도 그 제약을 따르는 범위 안에서 설계해야 한다.

2. **우선순위(priorities) 파악하기**  
   제1법칙에 따라 품질 속성들은 서로 트레이드오프 관계에 놓여 충돌한다. 속도를 높이면 비용이 오르고, 지속성을 챙기면 지연 시간이 길어진다. 따라서 사업 입장에서 **무엇이 가장 중요하고 무엇을 양보할 수 있는지** 우선순위를 파악해야 진짜 중요한 품질 속성에 자원을 집중할 수 있다.

3. **범위(scope) 파악하기**  
   우리가 직접 설계하고 만들어야 할 시스템 **안쪽**은 어디까지이고, 우리가 만들지 않고 바깥에 두되 데이터를 주고받거나 기능을 빌려 써야 할 **외부 시스템**은 무엇인지 경계를 긋는다. 직접 만들지 않는 외부 대상이라 하더라도, 그와 **어떻게 상호작용(interact)할지**는 반드시 설계해야 하기 때문이다.

4. **정적·동적·배치 관점(perspectives) 개발하기**  
   코드를 어떤 모듈로 나눌지(정적 뷰), 실행 중에 인스턴스를 몇 개나 병렬로 돌릴지(동적 뷰), 그 조각들을 스마트폰·서버·클라우드 중 어디에 올려놓을지(배치 뷰)와 그 사이의 통신 방식을 구체적으로 설계한다.

5. **기술 위험 완화(technical risks mitigation)**  
   플랫폼, 프레임워크, 소프트웨어 컴포넌트, 알고리즘, 아키텍처 뷰에 이르기까지 눈앞의 여러 선택지 가운데 무엇이 최선인지 평가한다. 아키텍트의 핵심 역량 중 하나는 **"우리 상황에 가장 잘 맞는 최선의 선택지가 무엇인지 평가하는 기술"**이다. 이를 위해 타당성 조사(feasibility studies)를 수행하고, 실험을 돌리며, 프로토타입을 만든다.

6. **아키텍처와 결정의 이유 문서화(documenting decisions)하기**  
   기술 위험을 줄이든, 우선순위를 잡아 세 가지 뷰를 선택하든, 그 모든 결정을 문서로 남겨야 한다. 제2법칙이 말하듯 **'어떻게'보다 '왜'가 더 중요하기 때문**이다.
   - **왜** 이 대안을 선택했는가?
   - 검토했던 **다른 대안들**은 무엇이었는가?
   - 그중 하나를 고르기 전에 **어떤 분석과 검증**을 거쳤는가?
   - 아울러 실제로 구현할 아키텍처 자체도 **정적·동적·배치 뷰**로 정리해 문서화한다.

<svg viewBox="0 0 420 1318" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="cmu4_bg" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="#0f172a" />
<stop offset="100%" stop-color="#1e293b" />
</linearGradient>
<marker id="cmu4arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" /></marker>
<marker id="cmu4arrL" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 10 1 L 0 5 L 10 9 z" fill="#38bdf8" /></marker>
</defs>
<rect x="0" y="0" width="420" height="1318" rx="14" fill="url(#cmu4_bg)"/>
<rect x="2" y="2" width="416" height="1314" rx="12" fill="none" stroke="#334155" stroke-width="1.5"/>
<text x="210" y="32" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">코딩 전 아키텍처의 전체 흐름</text>
<text x="210" y="54" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">사업 요구에서 '왜(Rationale)'의</text>
<text x="210" y="76" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">문서화까지</text>
<text x="210" y="102" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">기능만 구현하면 코드 덩어리에 그친다</text>
<text x="210" y="122" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">사업 맥락과 품질 속성이 맞물려야</text>
<text x="210" y="142" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">구조 결정이 완성된다</text>
<rect x="16" y="162" width="388" height="196" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
<rect x="16" y="162" width="388" height="40" rx="10" fill="#0c4a6e"/>
<rect x="16" y="182.0" width="388" height="20.0" fill="#0c4a6e"/>
<text x="210" y="188" fill="#e0f2fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">1. 사업 요구 · 제약</text>
<text x="36" y="228" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 사용자·동시 접속 규모</text>
<text x="36" y="250" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 사업 확장 계획(택배 등)</text>
<text x="36" y="272" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 안팎 범위 (컨텍스트)</text>
<text x="36" y="294" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 기술 제약 (.NET·Azure)</text>
<text x="36" y="324" fill="#7dd3fc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600">→ 기능 너머의 맥락 수집</text>
<line x1="210" y1="358" x2="210" y2="386" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#cmu4arr)"/>
<rect x="16" y="394" width="388" height="196" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
<rect x="16" y="394" width="388" height="40" rx="10" fill="#064e3b"/>
<rect x="16" y="414.0" width="388" height="20.0" fill="#064e3b"/>
<text x="210" y="420" fill="#d1fae5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">2. 품질 속성 · 우선순위</text>
<text x="36" y="460" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 모듈성 · 성능 · 가용성</text>
<text x="36" y="482" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 확장성 · 수정 용이성</text>
<text x="36" y="504" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 6부분 시나리오 정식화</text>
<text x="36" y="526" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 사업 중요도별 우선순위</text>
<text x="36" y="556" fill="#6ee7b7" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600">→ '얼마나 잘'의 입력 확정</text>
<line x1="210" y1="590" x2="210" y2="618" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#cmu4arr)"/>
<rect x="16" y="626" width="388" height="196" rx="10" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
<rect x="16" y="626" width="388" height="40" rx="10" fill="#78350f"/>
<rect x="16" y="646.0" width="388" height="20.0" fill="#78350f"/>
<text x="210" y="652" fill="#fef3c7" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">3. 구조 결정 · 검증</text>
<text x="36" y="692" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 정적 · 동적 · 배치 뷰 설계</text>
<text x="36" y="714" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 패턴·프레임워크 재사용</text>
<text x="36" y="736" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 트레이드오프 균형 잡기</text>
<text x="36" y="758" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 프로토타입·뼈대 실험</text>
<text x="36" y="788" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600">→ 제1법칙(트레이드오프) 다루기</text>
<line x1="210" y1="822" x2="210" y2="850" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#cmu4arr)"/>
<rect x="16" y="858" width="388" height="196" rx="10" fill="#1e293b" stroke="#a78bfa" stroke-width="1.5"/>
<rect x="16" y="858" width="388" height="40" rx="10" fill="#4c1d95"/>
<rect x="16" y="878.0" width="388" height="20.0" fill="#4c1d95"/>
<text x="210" y="884" fill="#ede9fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">4. 문서화 (왜 · 뷰)</text>
<text x="36" y="924" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 대안과 분석 기록 (ADR)</text>
<text x="36" y="946" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 포기한 것과 근거 남김</text>
<text x="36" y="968" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 정적·동적·배치 뷰 명세</text>
<text x="36" y="990" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 개발자·경영진·미래의 나</text>
<text x="36" y="1020" fill="#ddd6fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="600">→ 제2법칙(왜 &gt; 어떻게)</text>
<rect x="16" y="1074" width="388" height="228" rx="8" fill="#0b1220" stroke="#475569" stroke-width="1.2"/>
<text x="210" y="1100" fill="#38bdf8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">최종 요약: 상호 지원 · 정합</text>
<text x="210" y="1122" fill="#38bdf8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">(Alignment)</text>
<rect x="28" y="1138" width="150" height="70" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
<text x="103" y="1168" fill="#e0f2fe" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">사업 맥락</text>
<text x="103" y="1190" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">Business Context</text>
<rect x="242" y="1138" width="150" height="70" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
<text x="317" y="1168" fill="#d1fae5" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">품질 속성</text>
<text x="317" y="1190" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">Quality Attributes</text>
<line x1="186" y1="1166" x2="234" y2="1166" stroke="#38bdf8" stroke-width="2.2" marker-end="url(#cmu4arr)"/>
<line x1="234" y1="1182" x2="186" y2="1182" stroke="#38bdf8" stroke-width="2.2" marker-end="url(#cmu4arrL)"/>
<text x="210" y="1240" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">이 둘의 맞물림이 시스템의 큰 구조를</text>
<text x="210" y="1262" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">빚어내는 근본적인 아키텍처 결정이며,</text>
<text x="210" y="1284" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">그 바탕 위에서 비로소 코딩을 시작한다.</text>
</svg>

### 8.2 코딩 전에 할 일이 이렇게 많다 — 다섯 가지 관통 통찰

강의는 놀라움 섞인 질문으로 마무리된다. *"아키텍트가 이렇게 많은 일을 한다고 생각했는가? 그저 코딩만 하는 줄 알았는가? 실제로 코딩을 시작하기 전에 해야 할 일이 이렇게나 많다."* 그리고 한 문장으로 전체를 요약한다. **사업 맥락(business context)과 시스템 성질(품질 속성)은 서로 맞물려 지원되어야 하며, 바로 이 둘이 시스템의 구조를 만드는 근본적인 아키텍처 결정이다.**

이 1강 전체를 하나로 꿰뚫어 보면, 소프트웨어 아키텍처를 처음 배우는 사람이라도 반드시 기억해야 할 **다섯 가지 핵심 통찰**과 **아키텍트 활동 요약**이 선명하게 남는다.

| 아키텍트의 6대 활동 | 무엇을 하는가 (원문 기준) | 차량 호출 앱에서의 구체적 질문 |
| :--- | :--- | :--- |
| **1. 요구사항 도출 참여** | 기능 외의 품질 속성(성능·보안·사용성)과 기술 제약(.NET, Azure 등)을 수집 | "동시 접속 1만 명 기준 배차 응답은 몇 초 안이어야 하며, 회사가 강제한 클라우드·결제 규격은 무엇인가?" |
| **2. 우선순위 파악** | 품질 속성 사이의 트레이드오프 앞에서 사업상 무엇이 더 중요한지 결정 | "배차 속도(짧은 지연)와 운행 기록 보존(지속성) 중 어느 쪽을 우선할 것인가?" |
| **3. 범위 파악** | 직접 구현할 안쪽과 연동해 쓸 외부 영역의 경계(컨텍스트) 설정 | "지도·문자 인증·결제 승인 중 외부 API에 맡길 것과 직접 짤 것은 무엇인가?" |
| **4. 세 가지 관점 개발** | 정적(코드 분할)·동적(실행 인스턴스·병렬성)·배치(폰·서버·클라우드)와 통신 설계 | "모바일 앱에는 UI만 남기고 배차 컨트롤러는 클라우드에서 병렬 실행하며, 운행 로그는 비동기 횡단 모듈로 뺄까?" |
| **5. 기술 위험 완화** | 플랫폼·프레임워크·컴포넌트·알고리즘·뷰를 평가하고 타당성 조사·실험·프로토타입 수행 | "계층형과 마이크로서비스 중 어느 구조가 피크 부하를 버티는지 끝에서 끝까지 뼈대 프로토타입으로 실험해 보자." |
| **6. 결정과 구조 문서화** | 고른 대안, 검토한 다른 대안, 분석 내용('왜') 및 정적·동적·배치 뷰 문서화 | "왜 결제를 직접 짜지 않고 외부 서비스에 위임했는지, 그때 무엇을 포기했는지를 ADR로 남겨 후임과 미래의 내가 보게 하자." |

1. **기능이 같아도 사업 요구가 다르면 '좋은 구조'가 달라진다.** 차량 호출 앱, LLM 서비스, 아마존 대 기존 서점 사례가 증명하듯, 무엇을 하느냐가 같아도 누구를 위해 어떻게 사업하느냐에 따라 알맞은 아키텍처는 완전히 달라진다.
2. **품질 속성은 "무엇을"이 아니라 "얼마나 잘"이며, 그것을 조절하는 가장 큰 손잡이가 구조다.** 입국 심사 줄의 병렬화와 전문화처럼, 모듈을 어떻게 나누고 복제하고 통신하게 하느냐가 처리량·지연·가용성·수정 용이성을 결정한다.
3. **공짜 품질 속성은 없으며, 모든 선택은 거래(트레이드오프)다.** 그렇기 때문에 사업이 무엇을 더 중요하게 여기는지(**우선순위**)를 알아야 올바른 결정을 내릴 수 있다.
4. **그래서 문서에는 '어떻게'보다 '왜'(검토한 대안, 분석, 포기한 것)를 남겨야 한다.** 코드는 '어떻게'를 보여 주지만, 나중에 시스템을 고치거나 넘겨줄 때 정말 필요한 것은 '왜' 그렇게 정했는지에 대한 맥락이다.
5. **LLM이 코드를 써 주는 시대일수록, 코드를 쓰기 전의 결정이 소프트웨어의 운명을 가른다.** 키보드를 두드리기 전에 사업 맥락과 품질 속성을 맞물려 세운 큰 구조가 없다면, 아무리 빠르게 생성된 코드라도 쓸모 있을지 모를 코드 덩어리에 머물 뿐이다.

---

[^1]: **과목과 강사:** CMU 17-635 「Software Architectures」(2026년 봄). Swarnalatha Ashok은 Associate Teaching Professor(Software and Societal Systems Department, MSE 부디렉터), Scott Pavetti는 Assistant Teaching Professor로, 두 사람 모두 이 과목 강사(Instructor)로 등재되어 있다. 출처: [CMU 2026 실러버스](https://mse.s3d.cmu.edu/0_documents/syllabi/17635-software-architectures-2026-syllabus-v1.01.pdf), [Ashok 소개](http://isri.cmu.edu/people/core-faculty/ashok-swarnalatha.html), [Pavetti 소개](http://isri.cmu.edu/people/core-faculty/pavetti-scott.html)
[^2]: **교재:** 『Software Architecture in Practice』 4판(Addison-Wesley, 2021/©2022), Len Bass·Paul Clements·Rick Kazman. 『Documenting Software Architectures: Views and Beyond』 2판(Addison-Wesley, 2010), Paul Clements·Felix Bachmann·Len Bass·David Garlan·James Ivers·Reed Little·Paulo Merson·Robert Nord·Judith Stafford. 강의는 첫 책을 "Len Bass and all"로, 둘째 책은 제목만 소개했다. 출처: [Pearson 4판](https://www.pearson.com/en-us/subject-catalog/p/Bass-Software-Architecture-in-Practice-4th-Edition/P200000000111), [SEI 2판](https://www.sei.cmu.edu/library/documenting-software-architectures-views-and-beyond-second-edition/)
[^3]: **6부분 시나리오와 ADD:** 강의는 6부분 시나리오를 "무엇이 자극하고, 결과가 무엇이며, 어떻게 측정하는가" 정도로만 소개하고 설계 방법은 "attribute-driven process/approach"라고 불렀다. 여섯 요소 이름(Source of Stimulus, Stimulus, Artifact, Environment, Response, Response Measure)은 『Software Architecture in Practice』 3·4판과 SEI 자료에서 같다. ADD 3.0은 Cervantes·Kazman의 『Designing Software Architectures』(2016) 등에서 정리되었다. 출처: [SEI ADD 2.0](https://www.sei.cmu.edu/library/attribute-driven-design-add-version-20/), [SEI ADD 3.0](https://www.sei.cmu.edu/library/add-30-rethinking-drivers-and-decisions-in-the-design-process/)
[^4]: **아마존의 재고와 창고:** 강의 발언은 "Amazon has no warehouse, no inventory"(잠시 보관하는 창고는 있을 수 있음)였다. 실제로는 1995년 시애틀 첫 창고, 1997년 델라웨어 등 유통센터를 열었고, 지금은 수백 개의 물류센터에서 1P 재고와 3P 판매를 함께 운영한다. Ingram 등 도매상 활용과 1999년 zShops → 2000년 Marketplace 확대도 확인되었다. 출처: [n+1 "The Everything Warehouse"](https://www.nplusonemag.com/online-only/online-only/the-everything-warehouse/), [CNN 아마존 연표](https://www.cnn.com/interactive/2018/10/business/amazon-history-timeline/), [About Amazon 시설](https://www.aboutamazon.com/workplace/facilities), [Publishers Weekly](https://www.publishersweekly.com/pw/by-topic/industry-news/bookselling/article/67986-20-years-of-amazon-com-bookselling.html)
[^5]: **100ms와 매출 1%:** 강의 표현은 "every 100 millisecond decrease in the response time actually increased their sales by 1%"였다. 원 출처는 Greg Linden의 2006년 블로그(Geeking with Greg)와 스탠퍼드 발표 "Make Data Useful"로, 페이지를 100ms 늦추는 A/B 테스트에서 매출이 약 1% 줄었다는 경험담이다. 출처: [Conductor 정리](https://www.conductor.com/academy/page-speed-resources/faq/amazon-page-speed-study/), [latencycost.com](https://latencycost.com/)
[^6]: **아마존 장애:** 강의가 말한 사건이 어느 것인지는 확인되지 않았다(확인 필요). 시기가 가장 가까운 2021년 12월 7일 AWS us-east-1 장애(약 7~11시간)의 공식 원인은 네트워크 혼잡과 재시도 폭주였고 백업 실패는 아니었다. 2017년 S3 장애 등 다른 사건과도 다르다. 출처: [AWS 공식 사후 요약](https://aws.amazon.com/message/12721/), [InfoQ](https://www.infoq.com/news/2021/12/aws-outage-postmortem/)
[^7]: **노키아와 심비안:** 강의는 OS 이름을 말하지 않고 "기능이 제한된 운영체제"라고만 했다. 출처: [SlashGear, 엘롭 메모](https://www.slashgear.com/nokia-our-platform-is-burning-elop-memo-reportedly-leaks-in-full-admits-ecosystem-war-09131936/), [AppleInsider](https://appleinsider.com/articles/13/10/10/how-apples-iphone-rapidly-destroyed-nokias-world-leading-symbian-platform)
[^8]: **정식 정의:** 강의는 첫 문장만 인용했다. 4판 기준 전체 정의는 "The software architecture of a system is the set of structures needed to reason about the system. These structures comprise software elements, relations among them, and properties of both."이다. 2판의 정의는 "the structure or structures of the system, which comprise software elements, the externally visible properties of those elements, and the relationships among them"으로 조금 달랐다. 출처: [SEI, 4판 소개](https://www.sei.cmu.edu/library/software-architecture-in-practice-fourth-edition/)
[^9]: **두 법칙의 출처:** Mark Richards·Neal Ford, 『Fundamentals of Software Architecture』(O'Reilly, 2020). 강의는 출처를 말하지 않았다. 출처: [O'Reilly 2판](https://www.oreilly.com/library/view/fundamentals-of-software/9781098175504/ch27.html), [DevIQ](https://deviq.com/laws/laws-software-architecture)
[^10]: **초기 온라인 서점:** books.com은 Charles M. Stack이 세운 Book Stacks Unlimited가 운영했다(1992년 BBS, 1994년 웹사이트). 이후 Cendant를 거쳐 Barnes & Noble이 인수했다. bn.com은 1997년경, Borders Online은 1998년에 시작했다. 출처: [Wikipedia, Book Stacks Unlimited](https://en.wikipedia.org/wiki/Book_Stacks_Unlimited), [CNET 1997](https://www.cnet.com/tech/services-and-software/book-site-wars-bring-price-cuts/), [Reuters, Borders 연표](https://www.reuters.com/article/business/timeline-a-short-history-of-borders-group-bookstores-idUSTRE71F3AT/)
