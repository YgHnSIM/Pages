---
title: "글을 쓰지 않고 생각을 건네는 법: 이종 언어모델 간 프리필 없는 KV 캐시 전이"
subtitle: "Swarm Telepathy: Prefill-Free KV-Cache Transfer Across Families (MIT CSAIL & MIT-IBM Computing Research Lab)"
slug: swarm-telepathy-cross-family-kv-cache-transfer
date: "2026-10-30"
tags:
  - AI
  - 언어모델
  - 에이전트
  - 논문리뷰
summary: "다중 에이전트 시스템에서 에이전트들이 텍스트 요약을 주고받는 대신 내부 활성화 기억인 KV 캐시를 직접 변환하여 전달하는 SwaT(Swarm Telepathy) 프레임워크를 심층 분석합니다. 모델 아키텍처와 토크나이저가 완전히 다른 이종 모델 간에도 프리필(prefill) 연산 없이 고속·고정밀 기억 전이가 가능함을 증명하고, 언어모델 간 텔레파시의 원리와 가능성, 그리고 안전성 과제를 짚어봅니다."
archive_url: "https://yghnsim.github.io/Archive/pages/2026-10-30-스웜텔레파시.html"
---

## 1. 들어가며: 에이전트들은 왜 아직 글로 대화하는가

인간은 머릿속 신경망의 활성화 패턴을 타인에게 직접 투사할 수 없다. 우리가 느끼고 생각하는 고차원의 연속적 인지 상태는 오직 성대의 진동이나 손끝의 문자로 압축되어야만 외부 세계로 전달된다. 이 불가피한 생물학적 한계 때문에 인류는 '자연어(Natural Language)'라는 놀라운 외적 상징 체계를 발명했다. 그러나 언어는 필연적으로 손실 압축이다. 아무리 유려한 문장도 한 인간의 뇌 속에서 번뜩인 전체 맥락을 온전히 실어나르지는 못한다.

역설적이게도, 오늘날 인공지능 연구자들이 구축하고 있는 거대언어모델(LLM) 기반의 다중 에이전트 시스템(Multi-Agent Systems, MAS) 역시 이 생물학적 인간의 소통 방식을 그대로 모방하고 있다 [p.1, §1]. 역할을 나눠 전문성을 모으는 시스템[21, 25, 27, 32]과 과학적 발견을 이끄는 시스템[9]까지, 단일 모델보다 꾸준히 나은 성과를 낸 에이전트 시스템들은[2, 3, 5, 7, 14, 16, 24, 29, 38] 거의 예외 없이 '텍스트'를 통해 서로 소통한다. 한 에이전트가 방대한 문서를 읽고 그 요약본을 글(문자열 토큰)로 출력하면, 다음 에이전트는 그 글을 받아 처음부터 다시 읽어들이는 방식이다.

그러나 디지털 컴퓨터 내부의 GPU 메모리 위에서 동작하는 인공신경망은 인간과 근본적으로 다르다. 신경망의 모든 지각과 추론, 기억 상태는 이미 정밀한 부동소수점 수치 벡터로 온전히 존재하고 있다. 왜 굳이 그 풍부한 내부 상태를 좁디좁은 이산적 텍스트 토큰의 열로 구겨 넣고, 그것을 전달받은 상대방 모델이 다시 막대한 전기를 써가며 해독하게 만들어야 하는가?

기존의 자연어 기반 에이전트 통신 프로토콜은 다음과 같은 세 가지 심각한 장벽을 마주하고 있다 [p.1, §1; p.3, §2.1; p.8, 표 6]:

1. **정보 병목(Information Bottleneck):** 송신자가 작성한 요약문은 작성자가 주관적으로 취사선택한 극히 일부의 정보에 국한되며, 수신자 역시 그 제한된 문자열로부터 원래 문맥을 온전히 재구성해낼 수 없다 [p.1, §1; p.3, §2.1].
2. **연산 중복과 극심한 지연(Redundant Compute & Latency):** 송신자는 요약문을 한 글자씩 느리게 자기회귀적으로 생성(decode)해야 하고, 수신자는 전달받은 요약문을 해석하기 위해 처음부터 다시 신경망 전체를 관통시키는 '프리필(prefill)' 연산을 수행해야 한다 [p.1, §1; p.8, 표 6].
3. **문맥 오염(Context Pollution):** 송신자가 쌓은 긴 중간 출력을 통째로 넘기면 계산이 감당하기 어려워지고, 수신자 과제와 무관한 내용이 섞여 성능을 떨어뜨릴 수 있다 [17, 23; p.3, §2.1]. 그래서 실제로는 요약을 넘기는데, 요약은 다시 1·2번 문제를 안고 있다.

이 비효율을 해결하기 위해 떠오르는 가장 자연스러운 통신 매개체가 바로 **키-값 캐시(Key-Value Cache, KV 캐시)**다 [p.1, §1]. KV 캐시는 모델이 문맥을 읽어 내려가면서 모든 레이어에서 모든 토큰을 관찰하고 계산해낸 결과물로, 에이전트가 다음 토큰을 생성하는 데 필요한 상태 전체를 담고 있다 [p.1, §1; p.2, §2]. 송신자가 이미 계산해 두었고 텍스트보다 밀도가 높다는 점에서, 논문은 이것을 '자연스러운 통신 채널'로 본다 [p.1, §1].

MIT CSAIL과 MIT-IBM Computing Research Lab의 연구진(Alabdulkareem et al., 2026)은 논문 *"Swarm Telepathy: Prefill-Free KV-Cache Transfer Across Families"*를 통해 이 장벽을 허무는 혁신적인 프레임워크인 **SwaT(Swarm Telepathy, 군집 텔레파시)**를 제시했다 [p.1, §1]. SwaT는 송신자·수신자 모델의 가중치를 미세조정(fine-tuning)하지 않고 동결(frozen)한 상태에서, 서로 아키텍처와 토크나이저가 완전히 다른 이종(cross-family) 모델 간에 KV 캐시를 직접 변환하여 넘겨준다. 저자들은 수신자가 원문을 다시 읽지(prefill) 않고 계열을 넘어 캐시를 전달하는 첫 방법이라고 주장한다 [p.1, 초록; p.2, 표 1].

말 대신 기억 상태를 건네는 이 방식을 저자들은 '텔레파시'라고 부른다 [p.2, §2].

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 1340" width="100%" style="max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#0f172a" rx="16"/>
<text x="210.0" y="46" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">다중 에이전트 소통 패러다임: 텍스트</text>
<text x="210.0" y="72" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">요약(T2T) vs 군집 텔레파시(SwaT+AM)</text>
<rect x="16" y="86" width="388" height="96" rx="10" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
<text x="210.0" y="118" fill="#94a3b8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">기존 방식: 텍스트 기반 소통</text>
<text x="210.0" y="142" fill="#94a3b8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">(Text-to-Text, T2T) — 좁고 비싸며</text>
<text x="210.0" y="166" fill="#94a3b8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">중복된 연산</text>
<rect x="16" y="190" width="388" height="92" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<text x="210.0" y="222" fill="#38bdf8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">송신자 에이전트</text>
<text x="210.0" y="244" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">문서 독해 (Prefill)</text>
<text x="210.0" y="266" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">내부 캐시 계산</text>
<text x="210.0" y="312" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="322" width="388" height="92" rx="10" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/>
<text x="210.0" y="354" fill="#fbbf24" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">요약문 순차 생성</text>
<text x="210.0" y="376" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">느린 디코딩 (Decode)</text>
<text x="210.0" y="398" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">막대한 GPU 지연</text>
<text x="210.0" y="444" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="454" width="388" height="70" rx="10" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
<text x="210.0" y="486" fill="#f43f5e" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">자연어 문자열</text>
<text x="210.0" y="508" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">정보 손실 병목</text>
<text x="210.0" y="554" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="564" width="388" height="92" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<text x="210.0" y="596" fill="#38bdf8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 에이전트</text>
<text x="210.0" y="618" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">요약문 재-프리필</text>
<text x="210.0" y="640" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">중복 연산 발생</text>
<rect x="16" y="664" width="388" height="72" rx="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
<text x="210.0" y="696" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">SwaT + AM: 캐시 직접 전이 — 그림 1</text>
<text x="210.0" y="720" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">캡션 기준 평균 40% 정확·약 4배 빠름</text>
<rect x="16" y="744" width="388" height="114" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<text x="210.0" y="776" fill="#38bdf8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">송신자 (동결)</text>
<text x="210.0" y="798" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">문서 독해 (1회)</text>
<text x="210.0" y="820" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">KV 캐시 추출</text>
<text x="210.0" y="842" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">생성 단계 없음</text>
<text x="210.0" y="888" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="898" width="388" height="114" rx="10" fill="#1e293b" stroke="#c084fc" stroke-width="2"/>
<text x="210.0" y="930" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">SwaT 매퍼</text>
<text x="210.0" y="952" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">경량 트랜스포머 변환</text>
<text x="210.0" y="974" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">이종 아키텍처 매핑</text>
<text x="210.0" y="996" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">문자 기반 위치 정렬</text>
<text x="210.0" y="1042" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="1052" width="388" height="114" rx="10" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/>
<text x="210.0" y="1084" fill="#fbbf24" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">AM 압축 모듈</text>
<text x="210.0" y="1106" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Attention Matching</text>
<text x="210.0" y="1128" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">영향력 유지 압축</text>
<text x="210.0" y="1150" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">동일 예산(U) 달성</text>
<text x="210.0" y="1196" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="1206" width="388" height="114" rx="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
<text x="210.0" y="1238" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 (동결)</text>
<text x="210.0" y="1260" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">프리필 생략!</text>
<text x="210.0" y="1282" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">전달받은 캐시로</text>
<text x="210.0" y="1304" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">즉각 질의 응답</text>
</svg>
</div>

---

## 2. 배경 지식: 비전공자를 위한 트랜스포머, 어텐션, KV 캐시, 그리고 모델 계열 [해설]

SwaT의 기술적 정교함을 온전히 이해하기 위해서는 거대언어모델 내부에서 연산이 실제로 어떻게 흘러가는지에 대한 기본 구조를 파악해야 한다. 쉬운 직관적 비유에서 출발하여 엄밀한 수학적 정의로 나아가보자.

### 2.1 트랜스포머와 어텐션 메커니즘 (Q, K, V)

[해설] 트랜스포머 신경망의 심장은 **주의 집중(Attention)** 메커니즘이다. 방대한 장서가 가득 찬 학술 도서관을 상상해보자. 당신이 "조선시대 온돌 구조의 열역학적 효율"이라는 질문을 품고 도서관을 찾았다.

- **쿼리(Query, 질의 $Q$):** 당신이 검색창에 입력한 질문 키워드다 ("조선시대 온돌 열효율").
- **키(Key, 표제어 $K$):** 도서관에 비치된 수백만 권의 책 표지와 서지 정보, 색인 라벨이다.
- **밸류(Value, 본문 내용 $V$):** 그 책들의 실제 본문 페이지에 적힌 구체적인 지식 내용이다.

도서관 시스템은 당신의 질문($Q$)과 책들의 색인($K$)을 대조하여 유사도(적합도) 점수를 매긴다. 완전히 엉뚱한 요리책은 0점에 가까운 점수를 받고, 건축학 및 한옥 구조 관련 전문 서적은 95점의 높은 점수를 받는다. 시스템은 이 유사도 점수를 비율화(Softmax)한 다음, 높은 점수를 받은 책들의 실제 내용($V$)을 그 중요도 비율만큼 진하게 조합하여 최종 요약 보고서를 만들어낸다.

이를 수식으로 표현하면 스케일드 닷 프로덕트 어텐션(Scaled Dot-Product Attention)이 된다:

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V$$

여기서 $d_k$는 키 벡터의 차원 수이며, 값이 너무 커져 소프트맥스의 기울기가 소실되는 것을 막기 위해 제곱근으로 나누어 정규화한다. 문장 내의 모든 단어 토큰은 자기 자신만의 $Q, K, V$ 벡터를 투영받아 다른 모든 토큰과의 관계를 동시다발적으로 계산한다.

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 706" width="100%" style="max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#0f172a" rx="16"/>
<text x="210.0" y="46" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">트랜스포머 어텐션 메커니즘: 도서관</text>
<text x="210.0" y="72" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">검색 비유와 Q·K·V 연산</text>
<rect x="16" y="86" width="388" height="92" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<text x="210.0" y="118" fill="#38bdf8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">쿼리 (Query, Q)</text>
<text x="210.0" y="140" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">&quot;지금 내가 찾고자 하는 것&quot;</text>
<text x="210.0" y="162" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">도서관 이용자의 검색 질문</text>
<rect x="16" y="186" width="388" height="92" rx="10" fill="#1e293b" stroke="#c084fc" stroke-width="2"/>
<text x="210.0" y="218" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">키 (Key, K)</text>
<text x="210.0" y="240" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">&quot;각 토큰이 품고 있는 색인&quot;</text>
<text x="210.0" y="262" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">도서관 서가 책들의 표제어</text>
<rect x="16" y="286" width="388" height="92" rx="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
<text x="210.0" y="318" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">밸류 (Value, V)</text>
<text x="210.0" y="340" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">&quot;실제 담겨 있는 지식 본문&quot;</text>
<text x="210.0" y="362" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">책 본문 페이지의 세부 정보</text>
<text x="210.0" y="408" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="418" width="388" height="114" rx="10" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/>
<text x="210.0" y="450" fill="#fbbf24" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">유사도 내적 및 소프트맥스</text>
<text x="210.0" y="472" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Score = Softmax( Q · K^T / √d_k )</text>
<text x="210.0" y="494" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">어떤 정보에 얼마나 집중할지</text>
<text x="210.0" y="516" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">어텐션 가중치 확률 분포 도출</text>
<text x="210.0" y="562" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="572" width="388" height="114" rx="10" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
<text x="210.0" y="604" fill="#f43f5e" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">가중합 최종 표현 출력</text>
<text x="210.0" y="626" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Output = Σ ( Attention_Weight × V )</text>
<text x="210.0" y="648" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">중요한 책들의 지식만 모아 압축된</text>
<text x="210.0" y="670" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">최종 문맥 은닉 상태(Hidden State)</text>
</svg>
</div>

### 2.2 KV 캐시가 왜 생기는가: 자기회귀 디코딩과 메모리 누적

[해설] 현대의 생성형 언어모델은 **자기회귀(Autoregressive)** 방식으로 글을 쓴다. 즉, 한 번에 수필 한 편을 쏟아내는 것이 아니라, 이전까지 적힌 모든 단어를 보고 '바로 다음 단어 딱 하나'를 예측하는 과정을 수백 번 반복한다.

만약 문장이 1,000단어에 도달했을 때, 1,001번째 단어를 생성하기 위해 앞선 1,000단어의 $Q, K, V$를 처음부터 다시 계산한다면 어떻게 될까? 입력 길이의 제곱에 비례하는 계산을 생성 토큰마다 반복하게 되어 전체 비용은 $\mathcal{O}(|T_{in}|^2 \cdot T_{out})$에 달하게 된다 [p.2, §2]. 여기서 $T_{in}$은 입력 토큰 수, $T_{out}$은 생성 토큰 수다.

하지만 자세히 관찰해보면, 이미 지나간 과거의 토큰들은 문맥 속에서 변하지 않는다. 50번째 단어의 Key 벡터와 Value 벡터는 1,000번째 단어를 만들 때나 2,000번째 단어를 만들 때나 완전히 동일하다. 

따라서 엔지니어들은 과거 토큰들의 Key와 Value 행렬을 GPU VRAM에 차곡차곡 저장해두고, 새로운 토큰이 들어올 때마다 그 토큰의 Key와 Value만 살짝 덧붙이는 기발한 최적화를 도입했다. 이 버퍼를 **KV 캐시(Key-Value Cache)**라고 부른다.

KV 캐시가 존재하기 때문에 모델은 다음 단어를 뽑을 때 원본 텍스트 파일을 다시 읽지 않는다. 모델의 뇌리 속에는 오직 KV 캐시라는 거대한 텐서 덩어리만이 남아 있으며, 이 캐시가 곧 모델이 인지한 세계의 전부다 [p.1, §1; p.2, §2].

### 2.3 Prefill과 Decode의 정식화

수학적으로 언어모델의 추론 과정은 명확히 두 단계로 쪼개진다 [p.2, §2]. 에이전트 $\mathcal{A}^{(i)}$와 입력 텍스트 시퀀스 $x$에 대해:

1. **프리필(Prefill) 단계:** 입력 시퀀스 $x$ 전체를 한 번에 병렬로 읽어들여 에이전트 내부의 초기 KV 캐시 $C_x^{(i)}$를 연산하는 계산 집약적(compute-bound) 단계다.
2. **디코드(Decode) 단계:** 생성된 캐시 $C_x^{(i)}$를 바탕으로 다음 토큰을 하나씩 자기회귀적으로 샘플링하는 메모리 대역폭 집약적(memory-bound) 단계다.

$$C_x^{(i)} = \mathcal{A}_{\text{prefill}}^{(i)}(x), \quad y^{(i)} \sim \mathcal{A}_{\text{decode}}^{(i)}(C_x^{(i)}) \tag{1}$$

토큰이 하나씩 생성됨에 따라 캐시는 시퀀스 연결(concatenation, $\parallel$)을 통해 $C_{x \parallel y^{(i)}}^{(i)}$로 점진적으로 확장된다.

만약 전통적인 텍스트 기반 소통을 한다면, 송신자 $\mathcal{A}^{(i)}$는 생성된 텍스트 $x \parallel y^{(i)}$를 통신망을 통해 수신자 $\mathcal{A}^{(j)}$에게 쏘아 보낸다. 수신자는 이를 받아 자신의 신경망으로 처음부터 다시 프리필을 수행해야 한다:

$$C_{x \parallel y^{(i)}}^{(j)} = \mathcal{A}_{\text{prefill}}^{(j)}(x \parallel y^{(i)}), \quad y^{(j)} \sim \mathcal{A}_{\text{decode}}^{(j)}(C_{x \parallel y^{(i)}}^{(j)}) \tag{2}$$

이 과정에서 송신자의 텍스트 디코딩 시간과 수신자의 텍스트 재-프리필 시간이 이중으로 낭비된다.

반면, SwaT(Swarm Telepathy)는 수신자 $\mathcal{A}^{(j)}$에게 원문 텍스트 $x$를 전혀 주지 않는다. 대신 송신자의 캐시 $C_x^{(i)}$를 변환 매퍼 $\mathcal{M}_{i \to j}$에 통과시켜 수신자 고유의 캐시 근사치 $\widehat{C}_x^{(j)}$를 직접 생성한다 [p.2, §2]:

$$\widehat{C}_x^{(j)} = \mathcal{M}_{i \to j}(C_x^{(i)}), \quad y^{(j)} \sim \mathcal{A}_{\text{decode}}^{(j)}(\widehat{C}_x^{(j)}, q) \tag{3}$$

여기서 $q$는 수신자가 답해야 할 질문(Query)이며, 수신자는 오직 짧은 질문 $q$만을 프리필할 뿐, 원문 $x$는 받지 않은 채 답 $y^{(j)}$를 디코딩한다 [p.2, §2].

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 642" width="100%" style="max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#0f172a" rx="16"/>
<text x="210.0" y="46" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">언어모델 추론의 2단계 구조:</text>
<text x="210.0" y="72" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">프리필(Prefill)과 디코드(Decode)의</text>
<text x="210.0" y="98" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">분리</text>
<rect x="16" y="112" width="388" height="114" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<text x="210.0" y="144" fill="#38bdf8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">1단계: 프리필 (Prefill)</text>
<text x="210.0" y="166" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">입력 문서 (N개 토큰) 전체 동시 병렬 입력</text>
<text x="210.0" y="188" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">C_x = A_prefill( x )</text>
<text x="210.0" y="210" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">거대한 행렬 곱 연산 (Compute-Bound)</text>
<text x="210.0" y="256" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="266" width="388" height="70" rx="10" fill="#1e293b" stroke="#c084fc" stroke-width="2"/>
<text x="210.0" y="298" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">최초 KV 캐시 생성</text>
<text x="210.0" y="320" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">모든 층, 모든 헤드의 Key &amp; Value VRAM 적재</text>
<text x="210.0" y="366" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="376" width="388" height="136" rx="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
<text x="210.0" y="408" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">2단계: 디코드 (Decode)</text>
<text x="210.0" y="430" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">토큰을 한 번에 하나씩 순차 생성 (자기회귀)</text>
<text x="210.0" y="452" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">y_t ~ A_decode( C_{x || y_&lt;t} )</text>
<text x="210.0" y="474" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">메모리 대역폭 의존 (Memory-Bandwidth</text>
<text x="210.0" y="496" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Bound)</text>
<text x="210.0" y="542" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="552" width="388" height="70" rx="10" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/>
<text x="210.0" y="584" fill="#fbbf24" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">KV 캐시 점진적 확장 누적</text>
<text x="210.0" y="606" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">과거 토큰 재계산 없이 새 토큰 벡터만 병합</text>
</svg>
</div>

### 2.4 RoPE(회전 위치 부호화)와 토크나이저(Tokenizer)

[해설] 트랜스포머는 본질적으로 단어들의 순서를 알지 못하는 '집합(Set)' 연산 장치다. 단어들의 전후 관계를 신경망에 알려주기 위해 위치 부호화가 필수적이다.

- **RoPE(Rotary Position Embedding, 회전 위치 부호화):** 과거에는 단어 벡터에 고정된 위치 숫자를 단순히 더했으나(절대 위치 부호화), 최신 언어모델(Llama, Qwen, Gemma 등)은 복소평면에서의 회전 행렬을 적용한다. 두 토큰 사이의 상대적 거리 $m - n$이 쿼리와 키의 내적에 자연스러운 회전각 차이로 보존되게 만드는 우아한 수학적 기법이다.
- **토크나이저(Tokenizer)의 장벽:** 모델이 글을 읽으려면 텍스트를 고유한 어휘 조각(Token)으로 잘라야 한다. 문제는 모델 개발사마다 토크나이저 사전과 쪼개는 알고리즘(Byte-Pair Encoding, Unigram 등)이 제각각이라는 점이다. 예컨대 `Telepathy`라는 단어를 한 토크나이저는 `[Tele, pathy]` 2개로, 다른 토크나이저는 `[Telepathy]` 1개로 자를 수 있다(설명용 가상 예). 토큰의 개수와 물리적 경계가 완전히 불일치하므로, 한 모델의 KV 캐시를 다른 모델에 그대로 꽂아 넣는 것은 규격이 다른 부품을 억지로 결합하려는 것처럼 불가능했다.

### 2.5 모델 '계열(Family)'의 의미와 지식 증류

[해설] 인공지능 분야에서 **모델 계열(Family)**이란 동일한 연구소나 기업에서 동일한 설계 철학과 파이프라인으로 구축한 모델 군(群)을 의미한다 (예: Llama 3 계열, Qwen 3 계열, Gemma 2/3 계열).

논문은 같은 계열의 모델들(예: Qwen 3 4B, 8B, 14B, 32B)이 크기와 층 수는 달라도 같은 팀이 비슷한 파이프라인과 데이터로 만들고, 작은 모델은 흔히 큰 모델에서 **지식 증류(Knowledge Distillation)**된다는 점을 짚는다 [p.1, §1]. 지식 증류란 작은 학생 모델이 큰 교사 모델의 출력 분포를 흉내 내도록 학습하는 방법이다. [해설] 같은 계열은 보통 토크나이저도 공유하므로 토큰 경계 문제가 없다.

따라서 동일 계열 안에서 캐시를 주고받는 것은 "같은 학교에서 같은 교과서로 배운 선후배 간의 대화"처럼 내부 잠재 공간의 기하학적 형태가 매우 닮아 있어 상대적으로 쉬운 과제였다.

하지만 **이종 계열(Cross-Family)** 간의 통신은 완전히 다르다. Qwen과 Llama, Gemma는 만든 조직도 다르고, 사전학습 데이터도 다르며, [해설] 토크나이저, 층 수와 차원, 위치 부호화 설정도 대개 다르다. "모국어도 다르고 생각하는 방식도 완전히 다른 두 외계 종족"의 뇌를 직접 잇는 것과 같은 극도의 기술적 난제다.

### 2.6 다중 에이전트 시스템과 캐시 압축의 필요성

[해설] 아무리 캐시 전이가 훌륭하더라도, 수만 토큰에 달하는 전체 캐시를 여과 없이 주고받는 것은 통신 대역폭과 GPU 메모리 측면에서 부담스럽다. 게다가 에이전트 간 협업에서는 문제 해결에 불필요한 장황한 잡담이나 중간 시행착오가 캐시에 섞여 들어가 컨텍스트 오염을 일으킨다 [p.3, §2.1].

따라서 텍스트 소통에서 '요약(Summarization)'을 하듯, 캐시 통신에서도 '기억의 압축'이 필요하다. 최근 제안된 **어텐션 매칭(Attention Matching, AM)** [41]과 같은 최신 KV 캐시 압축 기술은 원래 캐시의 영향력을 유지하면서 더 작은 키·값 집합을 만드는 압축법이다 [p.3, §2.1]. 논문의 비교 실험에서 압축 배율은 약 3.3배에서 17.2배였다 [p.6, 표 3]. SwaT는 이 압축과 결합해 텍스트 요약과 같은 통신량으로 맞붙는다.


---

## 3. 문제의 지형: 같은 모델, 같은 계열, 다른 계열

기존 학계에서는 언어모델 간의 지식과 상태를 이전하기 위해 어떤 시도들이 이어져 왔을까? 세 가지 축으로 정리하면 SwaT가 노리는 빈자리가 보인다 [p.2, 표 1].

### 3.1 선행 연구의 3대 지형과 SwaT의 차별점

지금까지의 캐시 이전 연구들은 크게 세 부류로 나뉘었다 [p.1, §1; p.2, 표 1]:

1. **단일 모델 내부 소통(Single Backbone):** LatentMAS [40]나 잠재 연쇄적 사고(Latent Chain-of-Thought) [12]는 에이전트들이 텍스트 대신 은닉 상태나 캐시를 주고받을 때 토큰당 운반되는 정보량이 획기적으로 늘어난다는 점을 규명했다. 그러나 이는 완전히 동일한 단일 모델의 복제본들끼리만 주고받을 수 있는 폐쇄적 통신이었다.
2. **같은 계열 안의 전이(Intra-Family):** Closed Form [13], CacheBridge [26], KV Alignment [6], Dense Latent [4]는 같은 계열 안에서 크기와 층 수가 다른 모델 사이에 프리필 없이 캐시를 옮긴다. LCF-X [28]와 ICaRus [33]도 프리필을 생략하지만 크기가 다른 모델은 지원하지 않는다 [p.2, 표 1; p.8, §7]. 모두 같은 계열 안에 머문다.
3. **계열을 넘지만 프리필이 필요한 전이(Cross-Family with Prefill):** Cache-to-Cache [8]와 XKV [20]는 계열을 넘어 캐시를 옮기지만 **수신자가 텍스트를 프리필해야 한다** [p.2, 표 1]. 본문은 LCF [28]도 이 부류로 묶지만, 표 1에서 LCF와 LCF-X는 모두 계열 간 지원이 ✗다. LCF는 크기가 다른 모델은 잇되 프리필이 필요하고, LCF-X는 프리필을 건너뛰지만 크기가 같은 모델 사이에서만 작동한다. 따라서 LCF는 엄밀히 말해 계열을 넘는 방법이 아니다 [p.2, 표 1; p.8, §7]. 또 C2C의 토큰 정렬은 토크나이저가 어긋나는 토큰을 버린다 [p.5, §3.2].

아래 [표 1]은 선행 연구들과 SwaT의 기능을 비교한 것이다. 표의 날짜는 논문 표기를 따랐다. Cache-to-Cache는 표 1에 2025년 10월로 적혀 있지만 참고문헌 [8]은 ICLR 2026 수록으로 되어 있고, LCF와 LCF-X는 같은 문헌 [28]을 둘로 나눈 것이다 [p.2, 표 1; p.9]. 표의 날짜는 arXiv 공개 시점, 참고문헌은 학회 수록 정보를 따른 것으로 보인다.

**표 1: 모델 간 KV 캐시 전이 선행 연구 비교 지형도 [p.2, 표 1]**

| 연구명 | 표기 날짜 | 다른 크기 | 계열 간 | 프리필 생략 |
| :--- | :--- | :---: | :---: | :---: |
| **Closed Form** [13] | 2026년 8월 | ✓ | ✗ | ✓ |
| **CacheBridge** [26] | 2026년 9월 | ✓ | ✗ | ✓ |
| **KV Alignment** [6] | 2026년 1월 | ✓ | ✗ | ✓ |
| **Dense Latent** [4] | 2026년 6월 | ✓ | ✗ | ✓ |
| **LCF** [28] | 2026년 5월 | ✓ | ✗ | ✗ |
| **LCF-X** [28] | 2026년 5월 | ✗ | ✗ | ✓ |
| **ICaRus** [33] | 2026년 3월 | ✗ | ✗ | ✓ |
| **Cache-to-Cache** [8] | 2025년 10월 | ✓ | ✓ | ✗ |
| **XKV** [20] | 2026년 8월 | ✓ | ✓ | ✗ |
| **SwaT** | — | **✓** | **✓** | **✓** |

SwaT는 서로 다른 크기(Different Sizes), 이종 계열(Cross-Family), 그리고 수신자 프리필 생략(Skip Prefill)이라는 세 조건을 모두 만족하는 것은 표 1에서 SwaT뿐이다 [p.2, 표 1].

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 658" width="100%" style="max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#0f172a" rx="16"/>
<text x="210.0" y="46" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">선행 연구 지형도: 세 축의 교집합 (표</text>
<text x="210.0" y="72" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">1 재구성)</text>
<rect x="16" y="86" width="388" height="114" rx="10" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
<text x="210.0" y="118" fill="#94a3b8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">세 축</text>
<text x="210.0" y="140" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">다양한 크기 지원 (Different Sizes)</text>
<text x="210.0" y="162" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">이종 계열 간 지원 (Cross-Family)</text>
<text x="210.0" y="184" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 프리필 생략 (Skip Prefill)</text>
<rect x="16" y="208" width="388" height="70" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<text x="210.0" y="240" fill="#38bdf8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">다양한 크기 지원 (Different Sizes)</text>
<text x="210.0" y="262" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">LCF</text>
<rect x="16" y="286" width="388" height="70" rx="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
<text x="210.0" y="318" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 프리필 생략 (Skip Prefill)</text>
<text x="210.0" y="340" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">ICaRus, LCF-X</text>
<rect x="16" y="364" width="388" height="94" rx="10" fill="#1e293b" stroke="#c084fc" stroke-width="2"/>
<text x="210.0" y="396" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">다양한 크기 지원 (Different Sizes) +</text>
<text x="210.0" y="420" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">이종 계열 간 지원 (Cross-Family)</text>
<text x="210.0" y="442" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">C2C, XKV</text>
<rect x="16" y="466" width="388" height="94" rx="10" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/>
<text x="210.0" y="498" fill="#fbbf24" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">다양한 크기 지원 (Different Sizes) +</text>
<text x="210.0" y="522" fill="#fbbf24" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 프리필 생략 (Skip Prefill)</text>
<text x="210.0" y="544" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Closed Form 등 4편</text>
<rect x="16" y="568" width="388" height="70" rx="10" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
<text x="210.0" y="600" fill="#f43f5e" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">★ SwaT</text>
<text x="210.0" y="622" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">(세 축 모두)</text>
</svg>
</div>

### 3.2 이론적 동기: 플라톤적 표상 가설 [15]

그렇다면 완전히 다른 두 조직이 독립적으로 개발한 언어모델 사이에서 어떻게 프리필 없는 직접 캐시 이전이 가능한 것일까? 연구진은 그 근본적인 이론적 토대로 **플라톤적 표상 가설(Platonic Representation Hypothesis)** [15] (Huh et al., 2024)을 제시한다 [p.1~p.2, §1]. 논문은 이 가설을 '같은 세계로 학습한 모델은 같은 표상으로 수렴하며, 선택 압력 때문에 점점 더 정렬된다'는 주장으로 요약한다 [p.1, §1]. 원 논문(Huh et al., arXiv:2405.07987)도 목표·데이터·양식이 다른 신경망들이 현실의 공통 통계 모델로 수렴해 간다고 주장하므로, 이 요약은 원 가설과 어긋나지 않는다.

[해설] 직관은 이렇다. 초기화도 구조도 다른 신경망들이지만 배우는 대상은 같은 세계다. 그 세계의 통계적 규칙을 잘 모델링할수록 내부 표상도 서로 닮아 간다는 것이다.

이 가설이 참이라면, 서로 다른 조직이 만든 LLM들은 "세계에 대해 무엇(What)을 표상하는가"는 이미 깊은 수준에서 공유하고 있으며, 오직 "그것을 어떻게(How) 벡터 차원에 배열하고 표현하는가"라는 국소적인 방식에서만 차이를 보일 뿐이다 [p.1~p.2, §1].

따라서 이종 모델 간의 통신은 완전히 새로운 언어를 처음부터 발명하는 불가능한 과제가 아니다. 이미 동일한 개념을 담고 있는 두 고차원 잠재 공간 사이의 **매핑 함수 $\mathcal{M}_{i \to j}$를 학습하는 문제로 환원된다** [p.2, §1].

### 3.3 실무적 응용 시나리오 세 가지

SwaT가 제시하는 프리필 없는 이종 캐시 이전은 차세대 AI 파이프라인에서 논문은 세 가지 쓰임새를 든다 [p.2, §1]:

1. **계층적 다중 에이전트 시스템(Hierarchical Multi-Agent Systems):** 방대한 데이터를 검색하고 문서를 조사하는 자식 에이전트(Child Agent)가 수천 단어의 장문 요약 보고서를 작성하여 부모 에이전트(Parent Agent)에게 보내는 대신, 고도로 압축된 KV 캐시를 직접 전달한다. 양쪽 모두에서 텍스트 생성과 재-프리필 연산이 사라지며, 논문은 이쪽이 더 많은 정보를 싣는다고 본다.
2. **대화 도중 모델 동적 교체(Mid-Conversation Model Switching):** 대화 도중 다른 모델로 바꿀 때, 새 모델이 지금까지의 문맥 전체를 다시 프리필하는 대신 이전 모델의 캐시를 물려받는다. [해설] 예컨대 가벼운 모델로 대화하다가 어려운 문제에서 큰 모델로 넘기는 경우다.
3. **지능형 라우팅 시스템(Intelligent Router Systems):** 사용자의 질의를 받아 가장 적합하고 저렴한 전문 모델로 분기시켜 주는 라우터 모델 [39]이 이미 질의를 읽으며 계산한 KV 캐시를 선택된 대상 모델에 그대로 인계한다. 대상 모델이 질의를 중복해서 다시 읽는 낭비를 원천 차단한다.

---

## 4. 비교의 틀: 요약 전달(T2T)과 캐시 압축(AM)

SwaT의 진정한 성능을 객관적으로 입증하기 위해서는, 가장 흔한 통신 방식인 텍스트 요약과 같은 조건에서 비교해야 한다. 논문은 텍스트 요약 통신(T2T)과 SwaT+AM을 같은 예산에서 맞붙인다 [p.3, §2.1].

### 4.1 텍스트 요약 통신(T2T)의 4단계와 그 한계

실제 다중 에이전트 협업에서 원문 전체 $x \parallel y$를 그대로 넘기면 계산이 과도하고 문맥 오염이 생길 수 있으므로, 에이전트들은 주로 '요약(Summarization)'을 전달한다 [p.3, §2.1]. 텍스트 기반 통신(Text-to-Text, T2T)은 다음의 4단계를 거친다 [p.3, §2.1]:

1. **송신자 과제 수행(Sender Task):** 송신자 $\mathcal{A}^{(i)}$가 입력 $x$를 프리필하고 자기회귀적으로 결과 $y$를 생성한다:
   $$C_x^{(i)} = \mathcal{A}_{\text{prefill}}^{(i)}(x), \quad y \sim \mathcal{A}_{\text{decode}}^{(i)}(C_x^{(i)}) \tag{4}$$
   이 시점에서 송신자의 GPU 메모리에는 전체 문맥 캐시 $C_{x \parallel y}^{(i)}$가 누적된다 (실험에서는 데이터셋의 문서 $d$가 $x \parallel y$에 해당한다).
2. **요약문 생성(Summarization):** 송신자는 요약 지시 프롬프트 $p_{\text{sum}}$을 받아 자신의 캐시 $C_{x \parallel y}^{(i)}$를 바탕으로 요약문 $s$를 한 글자씩 디코딩하여 생성한다:
   $$s \sim \mathcal{A}_{\text{decode}}^{(i)}(C_{x \parallel y}^{(i)}, p_{\text{sum}}) \tag{5}$$
3. **수신자 프리필(Receiver Prefill):** 수신자 에이전트 $\mathcal{A}^{(j)}$는 전달받은 요약 텍스트 $s$를 입력받아 자신의 캐시 $C_s^{(j)}$를 처음부터 다시 계산한다:
   $$C_s^{(j)} = \mathcal{A}_{\text{prefill}}^{(j)}(s) \tag{6}$$
4. **수신자 과제 수행(Receiver Task):** 수신자는 후속 질문이나 입력 $x^{(j)}$를 받아, 요약문 캐시 위에서 최종 정답을 디코딩한다:
   $$y^{(j)} \sim \mathcal{A}_{\text{decode}}^{(j)}(C_s^{(j)}, x^{(j)}) \tag{7}$$

이 T2T 방식은 수신자가 읽어야 할 토큰 수를 줄여주지만, 송신자 쪽에 자기회귀 생성 단계(식 5)가 하나 더 붙는다. 또 수신자가 얻는 정보는 송신자가 $s$에 담은 만큼으로 제한된다 [p.3, §2.1].

### 4.2 어텐션 매칭(AM)과 결합한 SwaT+AM 파이프라인

이와 대조적으로 SwaT는 최신 캐시 압축 기술인 **어텐션 매칭(Attention Matching, AM)** [41]과 결합하여 **SwaT+AM** 파이프라인을 구축한다 [p.3, §2.1].

AM은 원래 캐시가 어텐션 연산에 미치는 수학적 영향력을 보존하면서 더 작은 키·값 집합을 만드는 압축법이다. 이때 남길 캐시의 크기 예산을 나타내는 하이퍼파라미터를 $U$라고 한다 [p.3, §2.1].

SwaT+AM은 다음 식으로 쓸 수 있다 [p.3, §2.1]:

$$\widetilde{C}_U^{(j)} = \text{AM}_U\left(\mathcal{M}_{i \to j}(C_{x \parallel y}^{(i)})\right), \quad y^{(j)} \sim \mathcal{A}_{\text{decode}}^{(j)}(\widetilde{C}_U^{(j)}, x^{(j)}) \tag{8}$$

송신자가 이미 보유하고 있는 풍부한 캐시 $C_{x \parallel y}^{(i)}$를 SwaT 매퍼 $\mathcal{M}_{i \to j}$가 수신자 표현 공간으로 즉각 번역하고, 이를 AM 모듈이 지정된 예산 $U$에 맞추어 압축($\widetilde{C}_U^{(j)}$)한다. 

수신자는 이 압축된 캐시를 그대로 주입받아 곧바로 과제 디코딩을 수행한다. **T2T의 식 (5) 요약 생성 단계와 식 (6) 수신자 프리필 단계가 사라진다.** [p.3, §2.1].

### 4.3 공정한 대결을 위한 동일 예산(Matched Budget) 설계

SwaT+AM이 더 우수하다는 주장이 신뢰를 얻으려면, 두 방식이 주고받는 통신량이 비슷해야 한다 [p.3, §2.1].

그래서 '동일 예산(Matched Budget)' 설계를 쓴다. T2T에서 송신자에게 서로 다른 요약 프롬프트 5가지를 주어 [p.6, 표 3] 다양한 길이의 요약문 $s$를 생성하게 했다. 그리고 그 요약문을 수신자 모델의 토크나이저로 잘랐을 때 나오는 **수신자 토큰 수**를 실측했다 [p.3, §2.1].

그런 다음, SwaT+AM의 예산 $U$를 이 요약 길이에 맞췄다. 즉 통신량을 비슷하게 맞춘 상태에서 작업 정확도와 처리 속도를 비교한 것이다 [p.3, §2.1].

**표: 텍스트 요약(T2T) vs SwaT+AM 프로토콜 메커니즘 비교**

| 비교 항목 | 텍스트 기반 소통 (T2T) | 군집 텔레파시 (SwaT + AM) |
| :--- | :--- | :--- |
| **통신 매개체** | 이산적 자연어 텍스트 토큰 ($s$) | 연속적 잠재 KV 캐시 텐서 ($\widetilde{C}_U^{(j)}$) |
| **송신자 연산** | 본문 독해 + 요약문 순차 생성 (느린 Decode) | 본문 독해 1회 (추가 텍스트 디코드 없음) |
| **매퍼 변환** | 없음 (자연어를 그대로 전송) | 300M 경량 트랜스포머 매퍼 $\mathcal{M}_{i \to j}$ |
| **압축 방식** | 언어적 요약 (프롬프트 기반) | 어텐션 매칭 (AM, 수학적 영향력 유지 압축) |
| **수신자 연산** | 요약문과 질문 프리필 + 과제 디코드 | **문서 프리필 생략**(질문 $q$만 프리필) + 과제 디코드 |
| **전달되는 정보** | 송신자가 요약에 담은 만큼 | 번역·압축된 캐시(텍스트에 없는 정보도 실릴 수 있음) |

---

## 5. SwaT의 구조적 설계: 층 그룹, 교차주의 블록, 출력 보정, 슬라이딩 윈도

완전히 다른 두 언어모델 사이에서 어떻게 동결 상태를 유지하며 캐시를 정밀하게 변환해낼 수 있을까? 매퍼의 설계를 차례로 보자 [p.3~p.4, §3].

### 5.1 전체 아키텍처 및 동결 원칙

SwaT 프레임워크의 가장 중요한 원칙 중 하나는 **송신자(S)와 수신자(R)를 동결(frozen)한 채 둔다**는 점이다 [p.3, §3]. [해설] 큰 모델을 미세조정하면 비용이 들고 원래 능력이 흔들릴 수 있으므로, 동결은 실용적으로 큰 장점이다.

오직 두 거대모델 사이에 끼워 넣는 **경량 트랜스포머 매퍼 $\mathcal{M}_{i \to j}$**만을 학습시킨다. SwaT 매퍼는 다음과 같은 핵심 하이퍼파라미터로 구성된다 [p.3~p.4, §3; p.5~p.6, §4.1]:
- 블록 수: $B \in \{7, 8, 9\}$
- 은닉 상태 차원: $D = 1024$
- 어텐션 헤드 수: $H = 16$ (헤드당 차원 $D/H = 64$)
- 피드포워드(FFN) 중간 차원: $F = 4096$
- 전체 학습 파라미터 수: 약 3억 개(300M)

수십억~수백억 파라미터에 달하는 본체 모델들에 비하면 300M 매퍼는 매우 가볍고 날렵한 브리지 역할을 수행한다.

### 5.2 층 그룹(Layer Groups) 분할 메커니즘

언어모델들은 층 수가 제각각이다. 서로 다른 층 수를 어떻게 대응시킬 것인가?

연구진은 송신자와 수신자의 전체 KV 레이어를 각각 $B$개의 연속적인 층 그룹(Layer Groups)으로 분할하는 수식을 고안했다 [p.4, §3]:

$$\mathcal{U}_b = \left\{ \ell : \left\lfloor \frac{b L_{\mathcal{U}}}{B} \right\rfloor \le \ell < \left\lfloor \frac{(b+1) L_{\mathcal{U}}}{B} \right\rfloor \right\}, \quad \mathcal{U} \in \{\mathcal{S}, \mathcal{R}\} \tag{9}$$

여기서 $L_{\mathcal{U}}$는 에이전트 $\mathcal{U}$의 KV 층 수이고 $B$는 매퍼의 블록 수다 ($B \ll \min(L_{\text{S}}, L_{\text{R}})$) [p.3, §3]. 바닥 함수 덕분에 그룹들은 겹치지 않고 $0$부터 $L_{\mathcal{U}}-1$까지를 빠짐없이 덮는다. [해설] 예컨대 $L=36$, $B=8$이면 경계는 $\lfloor 36b/8 \rfloor = 0, 4, 9, 13, 18, 22, 27, 31, 36$이고, 그룹 크기는 4와 5가 번갈아 나온다(가상 수치).

매퍼의 $b$번째 블록은 송신자의 $b$번째 층 그룹 $\mathcal{S}_b$에 속한 모든 층의 캐시를 한꺼번에 읽어들여(Cross-Attend), 수신자의 $b$번째 층 그룹 $\mathcal{R}_b$에 속한 모든 층의 캐시를 동시에 예측한다. 이 구조 덕분에 수신자의 한 개 레이어가 송신자의 여러 레이어에 걸친 복합적인 문맥 정보를 풍부하게 참조할 수 있게 된다 [p.4, §3].

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 640" width="100%" style="max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#0f172a" rx="16"/>
<text x="210.0" y="46" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">SwaT 층 그룹(Layer Groups) 분할</text>
<text x="210.0" y="72" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">매핑 구조 (식 9)</text>
<rect x="16" y="86" width="388" height="114" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<text x="210.0" y="118" fill="#38bdf8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">송신자 레이어 (L_S개)</text>
<text x="210.0" y="140" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">송신자 그룹 S_0</text>
<text x="210.0" y="162" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">송신자 그룹 S_b</text>
<text x="210.0" y="184" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">송신자 그룹 S_{B-1}</text>
<text x="210.0" y="230" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="240" width="388" height="48" rx="10" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
<text x="210.0" y="272" fill="#94a3b8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">읽기</text>
<rect x="16" y="296" width="388" height="114" rx="10" fill="#1e293b" stroke="#c084fc" stroke-width="2"/>
<text x="210.0" y="328" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">SwaT 매퍼 (B개 블록)</text>
<text x="210.0" y="350" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">매퍼 블록 0</text>
<text x="210.0" y="372" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">매퍼 블록 b</text>
<text x="210.0" y="394" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">매퍼 블록 B-1</text>
<text x="210.0" y="440" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="450" width="388" height="48" rx="10" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
<text x="210.0" y="482" fill="#94a3b8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">예측</text>
<rect x="16" y="506" width="388" height="114" rx="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
<text x="210.0" y="538" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 레이어 (L_R개)</text>
<text x="210.0" y="560" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 그룹 R_0</text>
<text x="210.0" y="582" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 그룹 R_b</text>
<text x="210.0" y="604" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 그룹 R_{B-1}</text>
</svg>
</div>

### 5.3 입력 은닉 상태 초기화와 메모리 프로젝션

SwaT 매퍼의 시작과 끝은 철저하게 **수신자 모델의 좌표계**를 기준으로 설계되었다 [p.4, §3]:

1. **초기 은닉 상태($h_0$) 생성:** 원문 문서 $d$를 수신자의 토크나이저로 잘라 수신자 토큰 시퀀스 $T_{\text{R}} = (r_0, \dots, r_{R-1})$을 얻는다. 그런 다음 동결된 수신자 모델의 단어 임베딩 테이블 $E_{\text{R}}$에서 벡터를 꺼내 선형 투영 $W^{\text{in}}$을 곱해 $h_0 \in \mathbb{R}^{D \times R}$을 만든다. 수신자의 임베딩 테이블 룩업은 단순히 메모리에서 값을 읽어오는 작업이므로 **0 FLOPs(연산량 0)**이다 [p.4, §3].
2. **송신자 메모리($m_b$) 구성:** 송신자 측에서는 블록 $b$에 해당하는 층 그룹 $\mathcal{S}_b$의 캐시된 키 벡터들에서 **송신자 RoPE 회전을 먼저 수학적으로 역회전시켜 제거**한다. 그런 다음 각 송신자 토큰 위치에서 그룹 내 모든 층과 헤드의 키·값 벡터를 길게 이어 붙이고(concatenate), 선형 투영 행렬 $W_b^{\text{mem}}$을 통과시켜 교차주의용 메모리 $m_b \in \mathbb{R}^{D \times S}$를 형성한다 [p.4, §3].

### 5.4 SwaT 블록 내부의 서브레이어 연산

각 SwaT 블록 $b$는 이전 은닉 상태 $h_b$를 받아 다음 은닉 상태 $h_{b+1}$로 변환하며, 내부적으로 세 개의 서브레이어를 순차적으로 통과한다 [p.3, 그림 2; p.4, §3]:

1. **인과적 자기주의(Causal Self-Attention):** 수신자 토큰들 간의 인과적 관계를 스스로 학습한다. 위치 정보는 정수(integer) 수신자 위치를 사용한다.
2. **인과적 교차주의(Causal Cross-Attention):** 수신자 토큰 표현 $h$가 쿼리($Q$)가 되고, 송신자 캐시 메모리 $m_b$가 키($K$)와 값($V$)이 되어 송신자의 기억을 능동적으로 탐색한다. 이때 위치와 마스크는 뒤이어 설명할 문자 구간(character span) 기반 정렬 공식(식 12)을 엄격히 적용한다.
3. **피드포워드 신경망(FFN):** GELU 활성화 함수를 사용하는 2층 신경망($W_b^{(1)} \in \mathbb{R}^{F \times D}, W_b^{(2)} \in \mathbb{R}^{D \times F}$)을 통해 고차원 비선형 변환을 완결한다.

세 서브레이어는 각자 레이어 정규화(LN)와 잔차 연결을 갖는다. 두 어텐션은 각각 별도의 $W_b^Q, W_b^K, W_b^V, W_b^O \in \mathbb{R}^{D \times D}$를 학습하고, 헤드는 $H$개, 헤드 차원은 $D/H$다 [p.4, §3].

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 940" width="100%" style="max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#0f172a" rx="16"/>
<text x="210.0" y="46" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">SwaT 블록 내부 아키텍처 상세도 (그림</text>
<text x="210.0" y="72" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">2 재구성)</text>
<rect x="16" y="86" width="388" height="114" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<text x="210.0" y="118" fill="#38bdf8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">송신자 캐시 메모리 생성</text>
<text x="210.0" y="140" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">송신자 층 그룹 S_b의 KV 캐시 추출</text>
<text x="210.0" y="162" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">1) 송신자 RoPE 제거 (역회전)</text>
<text x="210.0" y="184" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">2) 선형 투영 W_b^mem → 메모리 m_b</text>
<text x="210.0" y="230" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="240" width="388" height="48" rx="10" fill="#1e293b" stroke="#c084fc" stroke-width="2"/>
<text x="210.0" y="272" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">SwaT 블록 b (h_b → h_{b+1})</text>
<rect x="16" y="296" width="388" height="94" rx="10" fill="#1e293b" stroke="#c084fc" stroke-width="2"/>
<text x="210.0" y="328" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">인과적 자기주의 (Causal</text>
<text x="210.0" y="352" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Self-Attention)</text>
<text x="210.0" y="374" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 정수 위치 사용 + LN &amp; 잔차 연결</text>
<text x="210.0" y="420" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="430" width="388" height="116" rx="10" fill="#1e293b" stroke="#c084fc" stroke-width="2"/>
<text x="210.0" y="462" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">인과적 교차주의 (Causal</text>
<text x="210.0" y="486" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Cross-Attention)</text>
<text x="210.0" y="508" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">송신자 캐시 메모리 m_b를 Key/Value로 참조</text>
<text x="210.0" y="530" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">문자 구간 기반 RoPE 위치 + 인과 마스크 적용</text>
<text x="210.0" y="576" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="586" width="388" height="92" rx="10" fill="#1e293b" stroke="#c084fc" stroke-width="2"/>
<text x="210.0" y="618" fill="#c084fc" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">피드포워드 신경망 (FFN, GELU)</text>
<text x="210.0" y="640" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">중간 차원 F = 4096 비선형 투영 + LN &amp; 잔차</text>
<text x="210.0" y="662" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">연결</text>
<text x="210.0" y="708" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="718" width="388" height="48" rx="10" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/>
<text x="210.0" y="750" fill="#fbbf24" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">출력: 업데이트된 은닉 상태 h_{b+1}</text>
<text x="210.0" y="796" fill="#94a3b8" font-size="22px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↓</text>
<rect x="16" y="806" width="388" height="114" rx="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
<text x="210.0" y="838" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 캐시 예측 및 보정</text>
<text x="210.0" y="860" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">1) 투영 행렬 W_b^out 적용</text>
<text x="210.0" y="882" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">2) 층·헤드별 RMS 통계치 리스케일링</text>
<text x="210.0" y="904" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">3) 수신자 정수 위치 RoPE 적용 완성</text>
</svg>
</div>

### 5.5 캐시 출력 프로젝션과 통계적 RMS 보정

각 블록 $b$를 빠져나온 은닉 상태 $h_{b+1}$은 수신자의 실제 KV 캐시로 탈바꿈하기 위해 세밀한 후처리 단계를 거친다 [p.4, §3]:

1. **선형 출력 투영:** 출력 투영 가중치 $W_b^{\text{out}} \in \mathbb{R}^{(2|\mathcal{R}_b| H_{\text{R}} \delta_{\text{R}}) \times D}$를 곱해 수신자 그룹 $\mathcal{R}_b$의 모든 층과 헤드에 필요한 Key와 Value 차원을 일거에 예측한다.
2. **층·헤드별 RMS 통계적 리스케일링:** 각 신경망은 레이어와 헤드마다 고유한 활성화 값의 크기(Scale)와 분산을 갖는다. 예측된 키와 값 벡터를 학습 문맥에서 수신자 캐시로 미리 보정해 둔 고정 RMS 통계에 맞도록 층·헤드별로 따로 재조정한다 [p.4, §3].
3. **수신자 RoPE 부여:** 스케일이 맞춰진 키(Key) 벡터에 마침내 수신자 모델 고유의 RoPE(회전 위치 부호화)를 수신자의 정수 토큰 위치에 맞춰 적용한다.

이 모든 블록의 출력을 취합하면, 수신자의 모든 KV 층에 수신자 토큰마다 항목이 하나씩 있는 캐시 $\widehat{C}_d^{(j)}$가 된다 [p.4, §3].

### 5.6 슬라이딩 윈도(Sliding-Window) 층에 대한 대칭적 처리

Gemma 2/3 같은 모델은 최근 토큰만 보고 그 캐시만 저장하는 **슬라이딩 윈도 어텐션(Sliding-Window Attention)** 층을 혼합하여 사용한다. SwaT는 이 층을 양쪽에서 다음과 같이 다룬다 [p.4, §3]:

- **송신자가 슬라이딩 윈도 층을 가질 때:** 송신자 모델의 해당 레이어가 평소처럼 윈도 밖의 과거 캐시를 버리지 못하도록 강제한다. 즉, 어텐션 계산 자체는 윈도 내에서 수행하되, 발생한 모든 과거 KV 캐시를 메모리에 온전히 기록해두었다가 SwaT의 교차주의 메모리 입력으로 제공한다.
- **수신자가 슬라이딩 윈도 층을 가질 때:** SwaT는 수신자의 해당 레이어가 슬라이딩 윈도인지 신경 쓰지 않고, 문서의 '모든 토큰 위치'에 대한 KV 캐시를 완전하게 예측하여 넘겨준다. 캐시를 건네받은 수신자 모델은 추론을 시작한 직후, 자신의 원래 설계 알고리즘대로 윈도 밖의 불필요한 과거 캐시를 자체적으로 폐기한다.

어느 쪽이든 해당 층의 어텐션 식 자체는 바꾸지 않는다 [p.4, §3].


---

## 6. 어떻게 가르치나: 두 손실과 학습 규모, 어블레이션

매퍼는 두 목표로 차례로 학습된다 [p.4, §3.1].

### 6.1 기하학적 복원 손실과 생성 적응 손실의 결합

각 학습 데이터 샘플은 원본 문서 $d$, 작업 프롬프트 $q$, 그리고 모델이 생성해야 할 목표 연속 텍스트 $y$(정답 또는 논리적 추론 과정)의 쌍으로 구성된다 [p.4, §3.1]. 문서 $d$에 대한 송신자의 캐시를 $C_d^{\text{S}}$, 수신자의 고유 캐시를 $C_d^{\text{R}}$이라 할 때, SwaT는 다음 두 가지 손실을 순차적으로 학습한다 [p.4, §3.1]:

#### (1) RMS 정규화 MSE 손실 ($\mathcal{L}_{\text{KV}}$, 1단계)
첫 번째 목표는 SwaT 매퍼가 예측한 캐시가 수신자 모델이 원문을 직접 읽었을 때 만들어내는 '수신자 고유의 캐시 공간 기하학'을 최대한 정밀하게 복원하도록 만드는 것이다:

$$\mathcal{L}_{\text{KV}} = \text{MSE}\left( \frac{\mathcal{M}_{i \to j}(C_d^{\text{S}}, T_{\text{R}})}{\sigma}, \frac{C_d^{\text{R}}}{\sigma} \right) \tag{10}$$

여기서 $\sigma$는 수신자의 원본 캐시 $C_d^{\text{R}}$에서 각 레이어와 헤드별로 계산된 키와 값 벡터의 RMS(Root Mean Square) 크기다. 레이어마다 천차만별인 활성화 크기 편향을 제거하기 위해 RMS로 정규화한 뒤 평균제곱오차(MSE)를 구한다. **키는 RoPE를 적용하기 전 상태로 비교한다** [p.4, §3.1].

#### (2) 하류 생성 적응을 위한 음의 로그 우도 손실 ($\mathcal{L}_{\text{NLL}}$, 2단계)
단순히 수치적 캐시 값을 비슷하게 흉내 내는 것만으로는 부족하다. 캐시의 궁극적 목적은 '다음 단어를 올바르게 맞추는 것'이기 때문이다. 두 번째 단계에서는 SwaT가 변환한 캐시를 동결된 수신자 모델에 실제로 주입하고, 수신자가 정답 시퀀스 $y$를 생성할 때 발생하는 다음 토큰 예측 손실을 최소화한다:

$$\mathcal{L}_{\text{NLL}} = -\frac{1}{|y|} \sum_{t=1}^{|y|} \log p_{\text{R}}\left(y_t \mid \mathcal{M}_{i \to j}(C_d^{\text{S}}, T_{\text{R}}), q, y_{<t}\right) \tag{11}$$

기울기는 동결된 수신자를 거쳐 흐르지만 갱신되는 것은 매퍼 $\mathcal{M}_{i \to j}$뿐이다 [p.4, §3.1].

### 6.2 학습 데이터셋과 최적화 스케줄

- **모델 쌍 구성:** 연구진은 Qwen 3 [36], Llama 3 [11], Gemma 2/3 [30, 31], Ministral 3 [19], Granite 3 [10], SmolLM3 [1] 등 6개 주요 모델 계열에서 3B부터 32B에 이르는 다양한 크기의 모델을 선정했다. 가능한 모든 조합 중 모델 계열을 교차하는 **10개 이종 모델 쌍**(작은 모델 $\to$ 큰 모델 7쌍, 큰 모델 $\to$ 작은 모델 3쌍)을 구축하여 집중적으로 평가했다 [p.5~p.6, §4.1].
- **학습 데이터의 양:** 1단계 MSE 학습에는 PG-19, WikiText-103, 그리고 QASPER, QuALITY, HotpotQA, MuSiQue의 훈련 분할이 사용되었다. 2단계 NLL 학습에는 ARC-Challenge, HellaSwag, WinoGrande, MMLU(보조), GSM8K(추론 추적 생성물 포함)의 훈련 분할이 추가되었다. 학습 데이터는 모두 영어 텍스트이고 **고유 토큰 4,400만 개(44M)**다 [p.5, §4.1]. 초록의 '5,000만 토큰 미만'과는 맞지만, 반복 학습을 포함한 총 학습 토큰 수는 따로 적혀 있지 않다 [p.1, 초록; p.5, §4.1].
- **최적화 파라미터:** AdamW 옵티마이저를 사용하였으며, 가중치 감쇠(weight decay)는 $10^{-3}$, 그래디언트 클리핑 임계값은 1.0, 전체 훈련은 bfloat16 혼합 정밀도로 진행되었다. 1단계 MSE 손실(식 10)은 코사인 스케줄러(최고 학습률 $3 \times 10^{-4}$)를 적용하여 5,000 스텝 동안 훈련되었고, 2단계 NLL 손실(식 11)은 고정 학습률 $3 \times 10^{-6}$으로 24,000 스텝 동안 미세 튜닝되었다 [p.5~p.6, §4.1]. 초록은 학습 비용을 'GPU 1일 미만'이라고 하지만, 본문과 부록에는 GPU 종류나 실제 학습 시간이 없다 [p.1, 초록; p.5~p.6, §4.1]. 그래서 'GPU 1일 미만'은 저자들의 주장으로만 읽어 두는 편이 안전하다.

### 6.3 어블레이션: 두 손실은 서로를 대신하지 못한다

SwaT의 설계 요소들은 실제로 얼마나 기여하고 있을까? 부록 E의 [표 18]은 Qwen3-4B $\to$ Llama-3-8B 쌍에 대해 SwaT의 구성 요소를 하나씩 제거하거나 변경했을 때 13개 벤치마크 평균 성능이 어떻게 변화하는지 보여주는 어블레이션(Ablation) 결과를 담고 있다 [p.23, 표 18]. 주 평가는 17개 벤치마크인데 어블레이션은 13개이고, 어느 13개인지는 적혀 있지 않다 [p.23, 표 18].

**표 18: SwaT 아키텍처 및 훈련 기법 어블레이션 결과 (Qwen3-4B $\to$ Llama-3-8B, 13개 벤치마크 평균 점수 차이, %p) [p.23, 표 18]**

| 어블레이션 조건 | 기준 대비 변화 ($\Delta$, %p) |
| :--- | :---: |
| **SwaT (독립 학습한 2개 모델의 평균, 기준)** | **0** |
| **C2C [8] 방식의 토큰 정렬 적용** | **−3.20** |
| **헤드별 독립 MLP (Headwise MLP)** | **−14.71** |
| **1단계(MSE)만 단독 학습 (Phase 1 only)** | **−36.97** |
| **2단계(NLL)만 단독 학습 (Phase 2 only)** | **−36.96** |
| **Dense loss만 사용** | **−55.11** |

'Dense loss'와 'Headwise MLP'가 정확히 무엇인지는 본문에 따로 정의되어 있지 않다. 이름으로 미루어 보면, 전자는 밀집 손실 하나만으로 학습한 경우, 후자는 변환기를 헤드별 MLP로 바꾼 경우로 짐작된다 [p.23, 표 18, 부록 E].

핵심은 **두 손실이 서로를 대신하지 못한다**는 점이다. 1단계(MSE)만 쓰면 36.97점, 2단계(NLL)만 쓰면 36.96점이 떨어진다 [p.23, 표 18]. [해설] 1단계가 수신자 캐시의 모양을 대략 맞춰 출발점을 잡고, 2단계가 그 캐시를 실제 답 생성에 맞게 다듬는다고 읽을 수 있다. 다만 논문은 원인을 따로 분석하지 않는다.

---

## 7. 다른 말을 쓰는 두 모델을 문자로 정렬하기

계열을 넘는 캐시 전달에서 가장 구체적인 장벽은 **토크나이저의 불일치**다 [p.4~p.5, §3.2].

### 7.1 이종 토크나이저의 경계 불일치 문제

[해설] 계열이 다른 두 모델에게 같은 문장을 읽히면 토큰 개수도, 각 토큰이 덮는 문자 경계도 어긋난다.

Cache-to-Cache(C2C) [8]의 정렬은 토크나이저가 어긋나면 남는 토큰을 버리게 되어, 중요한 정보를 잃을 수 있다 [p.5, §3.2]. 실제로 SwaT에 C2C 정렬을 넣으면 3.20점이 떨어진다 [p.23, 표 18].

### 7.2 문자 구간(Character Span)을 공통 좌표계로 활용하는 정렬법

SwaT는 두 토크나이저를 그대로 두고, 두 모델이 읽는 **문자열은 같다**는 점을 이용한다 [p.5, §3.2].

길이 $D$개의 문자로 이루어진 문서 $d = (c_1, \dots, c_D)$가 주어졌을 때:
- 송신자 토큰 시퀀스: $T_{\text{S}} = (s_0, \dots, s_{S-1})$
- 수신자 토큰 시퀀스: $T_{\text{R}} = (r_0, \dots, r_{R-1})$

각 송신자 토큰 $s_i$와 수신자 토큰 $r_j$가 원문 문자열에서 차지하는 반열린 구간(Half-open interval)을 각각 $[a_i^{\text{S}}, b_i^{\text{S}})$와 $[a_j^{\text{R}}, b_j^{\text{R}})$로 정의한다. 이 문자 위치가 두 모델이 공유하는 좌표계가 된다 [p.5, §3.2].

### 7.3 연속적 RoPE 위치 보간 공식 (식 12)

이제 송신자의 토큰 $s_i$가 수신자의 교차주의 레이어로 들어올 때, 어떤 위치 부호화(RoPE)를 부여해야 할까? 수신자의 토큰들은 정수 위치($0, 1, 2, \dots$)를 갖지만, 송신자의 토큰은 수신자 토큰 경계의 중간 어딘가에 걸쳐 있을 수 있다.

먼저 송신자 토큰 $s_i$의 문자 중심점 $m_i$를 구한다 [p.5, §3.2]:

$$m_i = \frac{a_i^{\text{S}} + b_i^{\text{S}}}{2}$$

그리고 $a_j^{\text{R}} \le m_i$인 가장 큰 $j$를 고른다(없으면 $j=0$). 교차주의에서 $s_i$에 줄 RoPE 위치는 다음과 같다 [p.5, §3.2]:

$$p_i = \max\left(0, \, j + \text{clip}_{[0,1]}\left(\frac{m_i - a_j^{\text{R}}}{b_j^{\text{R}} - a_j^{\text{R}}}\right) - \frac{1}{2}\right) \tag{12}$$

괄호 안의 분수는 $m_i$가 수신자 토큰 $r_j$의 구간 안에서 어디쯤 있는지를 0~1 비율로 나타낸다. 여기서 $\tfrac12$을 빼므로, 중심점이 $r_j$의 한가운데에 있으면 위치는 정확히 $j$가 되고, 앞쪽이면 $j$보다 조금 작고 뒤쪽이면 조금 크다. 바깥의 $\max(0,\cdot)$은 위치가 음수가 되지 않게 막는다. 두 토크나이저가 같으면 $j=i$이고 $m_i$가 $r_i$ 구간의 정중앙이므로 비율이 $\tfrac12$이 되어, 식 (12)는 $p_i = i$로 돌아간다 [p.5, §3.2]. 수신자 토큰은 정수 위치를 그대로 쓴다.

이렇게 하면 어떤 토큰도 버리지 않고 위치를 맞출 수 있다.

### 7.4 엄격한 인과 마스크 정의 ($b_i^S \le b_j^R$)

[해설] 인과적 언어모델은 아직 읽지 않은 뒤쪽 내용을 미리 보면 안 된다. 토큰 경계가 다를 때 이를 어떻게 지킬까?

SwaT는 교차주의 마스크를 이렇게 정한다 [p.5, §3.2]:

$$b_i^{\text{S}} \le b_j^{\text{R}}$$

수신자 토큰 $r_j$는 **자신의 문자 끝 지점($b_j^{\text{R}}$)보다 먼저 끝나거나 정확히 일치하는 송신자 토큰($b_i^{\text{S}}$)에만 어텐션을 허용**한다. 즉 $r_j$가 볼 수 있는 송신자 캐시는 $r_j$에서 끝나는 문자열 앞부분에 해당하는 것뿐이다 [p.5, §3.2].

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 632" width="100%" style="max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#0f172a" rx="16"/>
<text x="210.0" y="46" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">문자 구간 기반 토크나이저 정렬 및 인과</text>
<text x="210.0" y="72" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">마스크 메커니즘 (식 12)</text>
<rect x="16" y="86" width="388" height="70" rx="10" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
<text x="210.0" y="118" fill="#94a3b8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">공통 문자 좌표계 (Characters):</text>
<text x="210.0" y="140" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">S w a r m   T e l e p a t h y !</text>
<rect x="16" y="164" width="388" height="114" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<text x="210.0" y="196" fill="#38bdf8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">송신자 토크나이저 분할 (T_S)</text>
<text x="210.0" y="218" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">s_0: [Swarm]</text>
<text x="210.0" y="240" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">s_1: [Telepathy!]</text>
<text x="210.0" y="262" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">토큰 중심점 m_i 계산 → 연속 위치 p_i 보간</text>
<rect x="16" y="286" width="388" height="136" rx="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
<text x="210.0" y="318" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 토크나이저 분할 (T_R)</text>
<text x="210.0" y="340" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">r_0: [Swarm]</text>
<text x="210.0" y="362" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">r_1: [Tele]</text>
<text x="210.0" y="384" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">r_2: [pathy!]</text>
<text x="210.0" y="406" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">정수 위치(0, 1, 2) 기준 RoPE 좌표계 유지</text>
<rect x="16" y="430" width="388" height="182" rx="10" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
<text x="210.0" y="462" fill="#f43f5e" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">인과 마스크 원칙 (Causal Masking):</text>
<text x="210.0" y="486" fill="#f43f5e" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">b_i^S ≤ b_j^R</text>
<text x="210.0" y="508" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">수신자 토큰 r_j는 자신의 문자 끝 경계보다</text>
<text x="210.0" y="530" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">뒤에 위치한 송신자 토큰에 절대 접근할 수</text>
<text x="210.0" y="552" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">없음</text>
<text x="210.0" y="574" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">→ 뒤쪽 정보는 차단, 불일치 토큰도 버리지</text>
<text x="210.0" y="596" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">않음 (토큰 분할은 설명용 가상 예)</text>
</svg>
</div>

---

## 8. 결과 ① 보존율: 원문을 직접 읽은 것과 대등하거나 더 나은 기억

SwaT 매퍼가 넘겨준 캐시 위에서 수신자 모델이 추론할 때, 원본 텍스트를 직접 읽었을 때와 비교하여 얼마나 능력이 보존되는가? 이를 **보존율(Retention)**로 잰다 [p.4, 표 2; p.7, §4.2]:

$$\text{Retention (\%)} = \frac{\text{Score}_{\text{SwaT}}}{\text{Score}_{\text{Receiver}}} \times 100$$

분모는 수신자 모델이 원문 문서 $d$와 질문 $q$를 직접 모두 읽고(prefill) 풀었을 때의 점수이며, 분자는 송신자가 $d$를 읽고 SwaT 매퍼를 통해 전달한 캐시 위에서 수신자가 오직 $q$만 읽고 답을 도출했을 때의 점수다 [p.7, §4.2].

### 8.1 10개 모델 쌍과 17개 벤치마크 평가

평가는 모델이 학습 중에 보았던 9개의 도메인 내(In-domain) 데이터셋과, 한 번도 보지 못한 8개의 도메인 외(Out-of-domain, OOD) 데이터셋을 총망라한 **17개 벤치마크**에서 수행되었다 [p.5~p.6, §4.1]. 아래 [표 2]는 10개 모델 쌍의 종합 보존율을 요약한 것이다 [p.4, 표 2].

**표 2: 17개 벤치마크에 걸친 제로샷 보존율(Retention, %) [p.4, 표 2]**

| 송신 모델 (Sender) | 수신 모델 (Receiver) | In-Domain (단문 Acc) | In-Domain (장문 Acc) | In-Domain (장문 F1) | OOD (단문 Acc) | OOD (장문 Acc) | OOD (장문 F1) | **전체 평균 (Mean)** |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **작은 모델 $\to$ 큰 모델** | | | | | | | | |
| Qwen 3 4B | Llama 3 8B | 100.6% | 100.2% | 110.9% | 88.7% | 91.6% | 98.7% | **98.5%** |
| Llama 3 8B | Qwen 3 14B | 89.6% | 98.2% | 116.1% | 86.5% | 98.9% | 103.5% | **97.5%** |
| Ministral 3 8B | Llama 3.2 11B | 104.2% | 97.5% | 108.5% | 89.7% | 92.8% | 99.0% | **99.4%** |
| Gemma 3 4B | Granite 3.3 8B | 95.4% | 93.6% | 159.8% | 82.0% | 95.0% | 131.4% | **108.5%** |
| Qwen 3 4B | Gemma 2 9B | 94.0% | 92.4% | 104.2% | 83.4% | 94.5% | 96.3% | **94.2%** |
| Gemma 2 9B | Ministral 3 14B | 101.9% | 95.4% | 110.0% | 104.2% | 95.3% | 106.9% | **102.8%** |
| Gemma 3 4B | Llama 3 8B | 90.2% | 101.6% | 106.9% | 73.3% | 91.9% | 99.0% | **92.2%** |
| **큰 모델 $\to$ 작은 모델** | | | | | | | | |
| Gemma 3 12B | Qwen 3 4B | 104.0% | 100.1% | 120.5% | 97.1% | 97.7% | 105.8% | **104.6%** |
| Qwen 3 32B | Llama 3 8B | 112.9% | 104.0% | 98.4% | 102.5% | 95.4% | 97.1% | **103.0%** |
| Granite 3.3 8B | SmolLM3 3B | 112.4% | 103.9% | 253.6% | 113.4% | 114.7% | 162.1% | **143.2%** |

표에서 읽을 점은 다음과 같다 [p.4, 표 2]:
- **작은 모델에서 큰 모델로 보낼 때:** 더 작은 모델이 읽은 캐시를 받아 큰 모델이 문제를 풀었음에도, 7개 모델 쌍 전반에서 **최저 평균 보존율이 92.2%**에 달했다. 나머지 쌍은 94.2%~108.5%로, 원문을 직접 읽은 것과 대등했다.
- **큰 모델에서 작은 모델로 보낼 때:** 3개 쌍 모두 **평균 보존율이 100%를 넘었다(103.0%~143.2%)** [p.4, 표 2].

### 8.2 100% 초과 보존율의 메커니즘과 기저 효과

원문을 직접 읽지 않았는데 점수가 더 높을 수 있을까? 논문의 설명은 수신자가 자기 캐시 대신 더 큰 모델의 캐시로 문제를 푼다는 것이다 [p.7, §4.2].

[해설] 작은 수신자는 큰 송신자의 '읽기 결과'를 빌려 쓰는 셈이다. 다만 비율 지표는 분모가 작으면 크게 부풀므로, 100% 초과는 기준선이 약한 수신자 때문일 수도 있다.

부록 C의 [표 8]을 보면 이 현상의 극단적 사례가 나타난다. Granite 3.3 8B에서 SmolLM3 3B로 보낼 때 MuSiQue 보존율은 **377.8%**다 [p.12, 표 8].

**표 8 일부: In-domain 세부 데이터셋 보존율 발췌 (MuSiQue F1 등) [p.12, 표 8]**

| 모델 쌍 | 평가 행 | ARC-C (Acc) | MMLU (Acc) | GSM8K (Acc) | QuALITY (Acc) | HotpotQA (F1) | **MuSiQue (F1)** |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Qwen 3 4B $\to$ Llama 3 8B** | Receiver 단독 | 80.6 | 62.2 | 75.2 | 64.1 | 67.4 | 34.6 |
| | SwaT 전이 | 85.2 | 62.0 | 67.6 | 64.2 | 70.6 | 42.6 |
| | *보존율 (%)* | *105.7%* | *99.7%* | *89.9%* | *100.2%* | *104.8%* | ***123.4%*** |
| **Granite 3.3 8B $\to$ SmolLM3 3B** | Receiver 단독 | 78.2 | 53.6 | 73.8 | 60.9 | 30.7 | **11.5** |
| | SwaT 전이 | 82.8 | 59.2 | 74.6 | 63.3 | 65.9 | **43.3** |
| | *보존율 (%)* | *105.9%* | *110.4%* | *101.1%* | *103.9%* | *214.6%* | ***377.8%*** |

이 숫자는 액면 그대로 읽으면 안 된다. SmolLM3 3B가 MuSiQue를 혼자 풀 때 F1은 **11.5점**뿐이다 [p.12, 표 8]. 기준선이 바닥에 가까워서, 43.3점으로 오른 것이 비율로는 약 3.8배로 크게 부풀었다 [p.7, §4.2; p.12, 표 8].

### 8.3 분포 외(OOD) 태스크와 MATH-500의 한계 분석

약한 지점도 있다. 부록 C의 [표 9]에 수록된 8개 OOD 데이터셋 결과를 살펴보면 중요한 한계 지점이 드러난다 [p.13, 표 9].

**표 9 일부: OOD 세부 데이터셋 보존율 발췌 (MATH-500의 극심한 저하) [p.13, 표 9]**

| 모델 쌍 | 평가 행 | MedQA (Acc) | OpenBookQA (Acc) | **MATH-500 (Acc)** | BoolQ (Acc) | SQuAD (F1) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Qwen 3 4B $\to$ Llama 3 8B** | Receiver 단독 | 60.0 | 76.0 | **28.4** | 83.7 | 88.9 |
| | SwaT 전이 | 54.8 | 79.2 | **20.0** | 79.8 | 87.5 |
| | *보존율 (%)* | *91.3%* | *104.2%* | ***70.4%*** | *95.3%* | *98.4%* |
| **Gemma 3 4B $\to$ Llama 3 8B** | Receiver 단독 | 60.0 | 76.0 | **28.4** | 83.7 | 88.9 |
| | SwaT 전이 | 43.0 | 69.8 | **16.0** | 80.0 | 87.8 |
| | *보존율 (%)* | *71.7%* | *91.8%* | ***56.3%*** | *95.6%* | *98.7%* |
| **Qwen 3 32B $\to$ Llama 3 8B** | Receiver 단독 | 60.0 | 76.0 | **28.4** | 83.7 | 88.9 |
| | SwaT 전이 | 71.0 | 92.4 | **19.2** | 81.9 | 86.8 |
| | *보존율 (%)* | *118.3%* | *121.6%* | ***67.6%*** | *97.8%* | *97.7%* |

BoolQ, RACE, SQuAD 같은 OOD 과제는 대체로 90%를 넘지만, **MATH-500**은 쌍에 따라 56.3%~122.5%로 흔들리고 대부분 70% 안팎이다 [p.11, 부록 C; p.13, 표 9].

논문은 그 배경으로, MATH-500은 답을 LaTeX 식으로 써야 하는 강한 분포 외 과제인 반면 학습 데이터의 GSM8K는 최종 답이 숫자라는 점을 든다. 보존율이 낮은 정확한 원인은 따로 분석하지 않았다 [p.11, 부록 C; p.13, 표 9].


---

## 9. 결과 ② 텍스트보다 빠르고 정확한 통신: 동일 예산 비교

다중 에이전트 환경에서 "자연어 요약문(T2T)"과 "압축된 텔레파시 캐시(SwaT+AM)"가 동일한 통신 대역폭 예산에서 맞붙었을 때 승자는 누구인가? 비교는 3개 모델 쌍, 5가지 예산, 7개 장문 데이터셋에서 이루어졌다 [p.5~p.6, §4.3; p.21, 표 17]. 그림 3과 4는 데이터셋별 개별 결과를 점으로 찍은 그래프인데, 여기서는 그 값을 쓰지 않고 표 3과 표 17의 수치만 쓴다 [p.5, 그림 3; p.22, 그림 4]. 그림 속 점의 정확한 값은 글로 읽어 낼 수 없어서, 그림은 경향을 보는 데만 쓴다.

### 9.1 모든 지표에서 앞서다

아래 [표 3]은 7개 데이터셋(QuALITY, QASPER, HotpotQA, MuSiQue, SQuAD, NarrativeQA, LongHealth)에 걸쳐 측정한 성능을 예산별로 종합한 결과다 [p.6, 표 3].

**표 3: T2T 대 SwaT+AM의 3개 모델 쌍, 5개 예산, 7개 데이터셋 평균 성능 비교 [p.6, 표 3]**

| 평가 지표 | 통신 예산 (Budget) | Qwen3-4B $\to$ Llama3-8B (T2T / SwaT / 변화) | Llama3-8B $\to$ Qwen3-14B (T2T / SwaT / 변화) | Gemma3-12B $\to$ Qwen3-4B (T2T / SwaT / 변화) |
| :--- | :--- | :---: | :---: | :---: |
| | **최저 예산 (Lowest)** | *(약 16.2배 압축)* | *(약 12.7배 압축)* | *(약 17.2배 압축)* |
| 과제 점수 (Score) | | 34.2 / **53.1** (+18.9±4.6) | 37.2 / **58.6** (+21.4±4.5) | 29.8 / **49.0** (+19.3±5.5) |
| 통신 토큰 (Tokens) | | 117 / 113 (−3.1%) | 161 / 149 (−7.4%) | 114 / 110 (−3.8%) |
| 송신자 GPU (ms) | | 3,608 / **1,527** ($\times$2.4 빠름) | 3,675 / **1,897** ($\times$1.9 빠름) | 7,329 / **2,094** ($\times$3.5 빠름) |
| 수신자 TTFT (ms) | | 9.2 / **3.8** ($\times$2.4 빠름) | 21.8 / **7.3** ($\times$3.0 빠름) | 6.7 / **3.2** ($\times$2.1 빠름) |
| | **낮은 예산 (Lower)** | *(약 11.0배 압축)* | *(약 9.7배 압축)* | *(약 12.5배 압축)* |
| 과제 점수 (Score) | | 38.1 / **55.1** (+17.0±3.7) | 39.9 / **60.7** (+20.8±3.7) | 31.7 / **52.1** (+20.4±5.0) |
| 통신 토큰 (Tokens) | | 181 / 166 (−8.2%) | 211 / 196 (−7.2%) | 159 / 152 (−4.3%) |
| 송신자 GPU (ms) | | 5,387 / **1,661** ($\times$3.2 빠름) | 4,637 / **2,049** ($\times$2.3 빠름) | 10,229 / **2,158** ($\times$4.7 빠름) |
| 수신자 TTFT (ms) | | 12.2 / **3.9** ($\times$3.1 빠름) | 25.4 / **7.4** ($\times$3.4 빠름) | 8.4 / **3.2** ($\times$2.6 빠름) |
| | **중간-하 예산 (Low)** | *(약 7.5배 압축)* | *(약 7.9배 압축)* | *(약 6.9배 압축)* |
| 과제 점수 (Score) | | 42.7 / **57.7** (+14.9±2.6) | 42.9 / **61.8** (+18.9±3.4) | 37.4 / **56.9** (+19.6±4.6) |
| 통신 토큰 (Tokens) | | 271 / 246 (−9.1%) | 261 / 241 (−7.9%) | 297 / 274 (−7.7%) |
| 송신자 GPU (ms) | | 7,826 / **1,909** ($\times$4.1 빠름) | 6,214 / **2,265** ($\times$2.7 빠름) | 19,402 / **2,664** ($\times$7.3 빠름) |
| 수신자 TTFT (ms) | | 16.1 / **4.0** ($\times$4.1 빠름) | 31.6 / **7.4** ($\times$4.2 빠름) | 13.2 / **3.4** ($\times$3.9 빠름) |
| | **중간-상 예산 (Med-low)**| *(약 4.1배 압축)* | *(약 5.5배 압축)* | *(약 3.5배 압축)* |
| 과제 점수 (Score) | | 48.6 / **61.4** (+12.8±2.1) | 46.9 / **63.9** (+16.9±2.6) | 48.0 / **61.4** (+13.4±3.1) |
| 통신 토큰 (Tokens) | | 571 / 448 (−21.5%) | 386 / 341 (−11.6%) | 676 / 535 (−20.8%) |
| 송신자 GPU (ms) | | 17,170 / **2,912** ($\times$5.9 빠름) | 8,873 / **2,874** ($\times$3.1 빠름) | 42,526 / **4,019** ($\times$10.6 빠름) |
| 수신자 TTFT (ms) | | 30.3 / **4.1** ($\times$7.4 빠름) | 41.5 / **7.6** ($\times$5.5 빠름) | 25.9 / **3.6** ($\times$7.2 빠름) |
| | **중간 예산 (Medium)** | *(약 3.6배 압축)* | *(약 5.4배 압축)* | *(약 3.3배 압축)* |
| 과제 점수 (Score) | | 51.1 / **61.8** (+10.7±1.6) | 47.4 / **64.3** (+16.9±2.9) | 43.3 / **61.6** (+18.3±5.4) |
| 통신 토큰 (Tokens) | | 656 / 511 (−22.1%) | 412 / 353 (−14.2%) | 779 / 572 (−26.5%) |
| 송신자 GPU (ms) | | 19,665 / **3,258** ($\times$6.0 빠름) | 9,734 / **2,895** ($\times$3.4 빠름) | 48,709 / **4,155** ($\times$11.7 빠름) |
| 수신자 TTFT (ms) | | 34.0 / **4.2** ($\times$8.1 빠름) | 45.0 / **7.6** ($\times$5.9 빠름) | 29.4 / **3.6** ($\times$8.1 빠름) |
| | **전체 평균 (Overall)** | | | |
| 과제 점수 (Score) | | 42.9 / **57.8** (+14.9±2.5) | 42.9 / **61.9** (+19.0±3.1) | 38.0 / **56.2** (+18.2±4.6) |
| 통신 토큰 (Tokens) | | 293 / 254 (−13.1%) | 269 / 243 (−9.7%) | 309 / 269 (−13.1%) |
| 송신자 GPU (ms) | | 8,752 / **2,150** ($\times$4.1 빠름) | 6,198 / **2,360** ($\times$2.6 빠름) | 19,761 / **2,888** ($\times$6.8 빠름) |
| 수신자 TTFT (ms) | | 18.0 / **4.0** ($\times$4.5 빠름) | 31.8 / **7.5** ($\times$4.3 빠름) | 14.1 / **3.4** ($\times$4.2 빠름) |

부록 D의 [표 17]은 3개 쌍, 7개 데이터셋, 5개 예산 전체를 기하평균(점수 차는 산술평균)으로 묶는다 [p.21, 표 17].

**표 17: SwaT 대 T2T 전체 종합 성능 비교 (기하평균 및 점수 차이) [p.21, 표 17]**

| 평가 지표 (Metric) | Qwen3-4B $\to$ Llama3-8B | Llama3-8B $\to$ Qwen3-14B | Gemma3-12B $\to$ Qwen3-4B | **전체 모델 쌍 종합 (All pairs)** |
| :--- | :---: | :---: | :---: | :---: |
| 과제 점수 (기하평균 비) | 38.8 $\to$ 54.8 (**+41.2%**) | 39.2 $\to$ 59.1 (**+50.6%**) | 34.1 $\to$ 52.8 (**+54.9%**) | 37.3 $\to$ 55.5 (**+48.8%**) |
| **과제 점수 차이 (산술평균 Δ)** | **+14.9점** | **+19.0점** | **+18.2점** | **+17.4점** (41.3 $\to$ 58.6) |
| 통신 토큰 수 (Tokens) | 293 $\to$ 254 (−13.1%) | 269 $\to$ 243 (−9.7%) | 309 $\to$ 269 (−13.1%) | 290 $\to$ 255 (**−12.0%**) |
| 송신자 GPU 소요 시간 | 8,752 $\to$ 2,150ms (**$\times$4.1 빠름**) | 6,198 $\to$ 2,360ms (**$\times$2.6 빠름**) | 19,761 $\to$ 2,888ms (**$\times$6.8 빠름**) | 10,234 $\to$ 2,447ms (**$\times$4.2 빠름**) |
| 수신자 첫 토큰 도출(TTFT) | 18.0 $\to$ 4.0ms (**$\times$4.5 빠름**) | 31.8 $\to$ 7.5ms (**$\times$4.3 빠름**) | 14.1 $\to$ 3.4ms (**$\times$4.2 빠름**) | 20.1 $\to$ 4.7ms (**$\times$4.3 빠름**) |

여기서 수치 해석에 각별한 주의가 필요하다:
- 논문 초록과 서론에서 언급된 **"평균 40% 높은 정확도(mean 40% higher accuracy)"** [p.1, 초록]라는 표현과, 표 17의 **전체 쌍 기하평균 상대 향상률 "+48.8%" 및 산술평균 점수 차이 "+17.4점"** [p.21, 표 17]은 서로 다른 집계 방식이다. 초록의 40%가 어떤 평균인지는 적혀 있지 않다. 초록의 '평균 4배 빠름'도 표 17의 송신자 GPU ×4.2, 수신자 TTFT ×4.3 가운데 무엇을 가리키는지 분명하지 않다 [p.1, 초록·그림 1; p.21, 표 17]. 표 17의 값들보다 조금 낮게 잡은 반올림 표현으로 보는 것이 자연스럽다.
- 송신자 GPU 시간은 전체 **×4.2** 줄었고, Gemma 3 12B $\to$ Qwen 3 4B 쌍에서는 **×6.8**이다 [p.21, 표 17].
- 수신자의 첫 토큰까지 시간(TTFT)도 전체 **×4.3** 줄었다.
- 예산을 맞췄는데도 SwaT+AM이 실제로 보낸 토큰은 T2T보다 **12.0% 적었다**. 더 적게 보내고 17.4점 높았다 [p.21, 표 17].

### 9.2 예산이 작을수록 커지는 격차

표 3에서 가장 극적인 통찰을 제공하는 대목은 바로 '예산 수준에 따른 격차의 변화'다 [p.6, 표 3]:

- **초고압축 환경(Lowest Budget, 12~17배 압축):** 요약을 아주 짧게 써야 할 때 T2T는 29.8~37.2점, SwaT+AM은 49.0~58.6점으로 **+18.9~+21.4점** 차이가 난다. 가장 큰 예산(Medium)에서는 차이가 +10.7~+18.3점으로 줄어든다 [p.6, 표 3].
- **T2T 송신자의 시간 폭증:** T2T에서 요약문 길이를 늘려 정보량을 확보하려 하면(Medium Budget), 송신자의 생성 시간이 빠르게 늘어난다. Gemma 3 12B 송신자는 최저 예산 7,329ms에서 Medium 예산 **48,709ms**로 약 6.6배가 된다. 반면 SwaT+AM은 텍스트 생성이 없으므로 2,094ms에서 4,155ms로 완만하게 증가할 뿐이다 [p.6, 표 3].

정리하면 생성 단계가 없는 캐시 압축이 같은 통신량의 요약보다 낫고, 예산이 빠듯할수록 차이가 크다 [p.6, 표 3].

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 662" width="100%" style="max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#0f172a" rx="16"/>
<text x="210.0" y="46" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">통신 예산별 과제 정확도 추이 곡선 (표</text>
<text x="210.0" y="72" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">3 실측 수치 재구성)</text>
<text x="210.0" y="94" fill="#94a3b8" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">두 쌍 표시. 최저 예산에서 Llama→Qwen 쌍의</text>
<text x="210.0" y="116" fill="#94a3b8" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">차이가 21.4점으로 가장 큼</text>
<rect x="16" y="130" width="388" height="48" rx="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
<text x="210.0" y="162" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Llama→Qwen SwaT / Llama→Qwen T2T</text>
<text x="16" y="204" fill="#f8fafc" font-size="18px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">Lowest (최저)</text>
<rect x="16" y="214" width="214.6" height="20" rx="3" fill="#34d399"/>
<text x="236.56615384615387" y="230" fill="#34d399" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">58.6 SwaT</text>
<rect x="16" y="240" width="136.2" height="20" rx="3" fill="#a7f3d0"/>
<text x="158.20923076923077" y="256" fill="#a7f3d0" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">37.2 T2T</text>
<text x="16" y="292" fill="#f8fafc" font-size="18px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">Medium (중간)</text>
<rect x="16" y="302" width="235.4" height="20" rx="3" fill="#34d399"/>
<text x="257.4369230769231" y="318" fill="#34d399" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">64.3 SwaT</text>
<rect x="16" y="328" width="173.6" height="20" rx="3" fill="#a7f3d0"/>
<text x="195.55692307692306" y="344" fill="#a7f3d0" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">47.4 T2T</text>
<rect x="16" y="362" width="388" height="48" rx="10" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
<text x="210.0" y="394" fill="#f43f5e" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">+21.4점</text>
<rect x="16" y="418" width="388" height="48" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
<text x="210.0" y="450" fill="#38bdf8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Qwen→Llama SwaT / Qwen→Llama T2T</text>
<text x="16" y="492" fill="#f8fafc" font-size="18px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">Lowest (최저)</text>
<rect x="16" y="502" width="194.4" height="20" rx="3" fill="#38bdf8"/>
<text x="216.42769230769233" y="518" fill="#38bdf8" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">53.1 SwaT</text>
<rect x="16" y="528" width="125.2" height="20" rx="3" fill="#bae6fd"/>
<text x="147.2246153846154" y="544" fill="#bae6fd" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">34.2 T2T</text>
<text x="16" y="580" fill="#f8fafc" font-size="18px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">Medium (중간)</text>
<rect x="16" y="590" width="226.3" height="20" rx="3" fill="#38bdf8"/>
<text x="248.28307692307692" y="606" fill="#38bdf8" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">61.8 SwaT</text>
<rect x="16" y="616" width="187.1" height="20" rx="3" fill="#bae6fd"/>
<text x="209.1046153846154" y="632" fill="#bae6fd" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">51.1 T2T</text>
</svg>
</div>

---

## 10. 결과 ③ 가르치지 않은 능력: 시각, 중국어, 긴 문맥

SwaT 매퍼는 **오직 순수 영어 텍스트(44M 토큰)만으로 학습**되었다 [p.5, §4.1]. 그렇다면 학습 과정에서 단 한 번도 보지 못한 시각(Vision) 모달리티나 외국어(중국어) 지식, 그리고 수신자의 물리적 컨텍스트 한계를 넘어서는 초장문 정보도 이전될 수 있을까? 논문은 세 가지 사례를 보여 준다 [p.7, §4.4].

### 10.1 시각 능력의 제로샷 전이: VLM 캐시에서 텍스트 LLM으로

시각 능력이 아예 없는 순수 텍스트 전용 LLM(Llama 3 8B, Granite 3.3 8B, Qwen 3 4B)에게 눈을 달아줄 수 있을까? 연구진은 송신자로 멀티모달 시각언어모델인 **Gemma 3 VLM**을 배치했다 [p.7, §4.4.1].

- **T2T 방식:** 송신자 VLM이 이미지를 보고 짧은 캡션 텍스트 $P$를 작성하여 수신자 텍스트 모델에 전달하고, 수신자가 그 텍스트를 읽고 질문 $q$에 답한다.
- **SwaT 방식:** 송신자 VLM이 이미지와 캡션 $I \parallel P$를 함께 프리필한다. 이때 VLM의 내부 어텐션 연산에 의해 캡션 토큰들의 KV 캐시는 이미지의 풍부한 시각적 특징으로 깊게 물들여진다(enrich). SwaT는 이 캡션 토큰들의 캐시를 수신자 텍스트 모델의 공간으로 직접 변환한다.

아래 [표 4]는 5개 대표적 시각 질의응답(VQA) 벤치마크(VQAv2, TallyQA, OK-VQA, GQA, VizWiz)에서 측정한 결과다 [p.7, 표 4].

**표 4: 5개 VQA 벤치마크에서의 시각 능력 전이 테스트 정확도(%) [p.7, 표 4]**

| 모델 구성 (Sender $\to$ Receiver) | 평가 방식 | VQAv2 | TallyQA | OK-VQA | GQA | VizWiz | **5개 평균 (Avg)** |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Gemma 3 4B (VLM) $\to$ Granite 3.3 8B (Text)** | 송신자 VLM 단독 | 45.3\* | 53.4\* | 22.0\* | 31.4\* | 19.0 | **34.2±0.4\*** |
| | T2T (캡션 텍스트 전달) | 33.8\* | 32.0\* | 15.7\* | 16.3\* | 7.7\* | **21.1±0.4\*** |
| | **SwaT (캐시 직접 전이)** | **59.5** | **61.8** | **28.7** | **39.5** | **18.3** | **41.6±0.4** |
| **Gemma 3 4B (VLM) $\to$ Llama 3 8B (Text)** | 송신자 VLM 단독 | 45.3\* | 53.4\* | 22.0\* | 31.4\* | 19.0 | **34.2±0.4\*** |
| | T2T (캡션 텍스트 전달) | 16.4\* | 12.3\* | 18.3\* | 10.9\* | 8.4\* | **13.3±0.3\*** |
| | **SwaT (캐시 직접 전이)** | **57.5** | **56.4** | **29.7** | **35.5** | **18.7** | **39.6±0.4** |
| **Gemma 3 12B (VLM) $\to$ Qwen 3 4B (Text)** | 송신자 VLM 단독 | 44.5\* | 22.4\* | 24.4 | 28.3\* | 20.0 | **27.9±0.4\*** |
| | T2T (캡션 텍스트 전달) | 47.0\* | 37.6\* | 19.1\* | 29.7\* | 12.2\* | **29.1±0.4\*** |
| | **SwaT (캐시 직접 전이)** | **51.7** | **49.4** | **21.8** | **33.0** | **15.1** | **34.2±0.4** |

결과는 다음과 같다:
- 텍스트 전용 모델인 Granite 8B는 SwaT를 통해 캐시를 건네받았을 때 41.6점을 기록하여, 캡션을 넘기는 T2T(21.1점)의 약 2배였고, **이미지를 직접 본 송신자 VLM(34.2점)보다도 7.4점 높았다**. [p.7, 표 4].
- 부록 G의 [표 20]에 수록된 자기 자신 전이 대조군(Gemma 3 4B $\to$ Gemma 3 4B)의 37.4점과 비교해도 Granite 8B와의 결합(41.6점)이 더 높았다 [p.25, 표 20]. 논문은 이 대조군이 학습 데이터 자체의 효과를 재는 것이라고 설명한다 [p.24, 부록 G]. 대조군도 송신자 단독보다 높지만 Granite 쌍만큼은 아니다. [해설] 수신자 쪽 언어 능력 차이가 영향을 주었을 수 있지만 논문이 검증한 내용은 아니다.

### 10.2 시각 전이의 한계

부록 G의 [표 21]은 한계를 보여 준다 [p.24, 부록 G; p.25, 표 21].

**표 21: 세밀한 시각 처리를 요구하는 DocVQA 및 InfoVQA 테스트 정확도(%) [p.25, 표 21]**

| 모델 구성 (Sender $\to$ Receiver) | 평가 방식 | DocVQA (문서 VQA) | InfoVQA (인포그래픽) | **평균 정확도 (Avg)** |
| :--- | :--- | :---: | :---: | :---: |
| **Gemma 3 4B $\to$ Gemma 3 4B (대조군)** | 송신자 VLM 단독 | **73.3** | **41.6** | **57.4±0.8** |
| | SwaT 캐시 전이 | 40.9 | 26.8 | 33.8±0.8 |
| **Gemma 3 4B $\to$ Granite 3.3 8B** | 송신자 VLM 단독 | **73.3** | **41.6** | **57.4±0.8** |
| | T2T (텍스트 캡션) | 39.3\* | 25.5\* | 32.4±0.8\* |
| | SwaT 캐시 전이 | 43.4 | 31.5 | 37.5±0.8 |
| **Gemma 3 4B $\to$ Llama 3 8B** | 송신자 VLM 단독 | **73.3** | **41.6** | **57.4±0.8** |
| | T2T (텍스트 캡션) | 38.4\* | 26.6\* | 32.5±0.8\* |
| | SwaT 캐시 전이 | 43.3 | 28.6 | 36.0±0.8 |
| **Gemma 3 12B $\to$ Qwen 3 4B** | 송신자 VLM 단독 | **78.1** | **46.3** | **62.2±0.8** |
| | T2T (텍스트 캡션) | **48.1** | **29.3** | **38.7±0.8** |
| | SwaT 캐시 전이 | 35.1 | 23.0 | **29.0±0.7** |

빽빽한 글자와 세부를 읽어야 하는 문서(DocVQA)와 인포그래픽(InfoVQA)에서는 **송신자 VLM 단독(57.4~62.2점)이 SwaT(29.0~37.5점)보다 훨씬 높다** [p.25, 표 21].

Gemma 3 12B $\to$ Qwen 3 4B 쌍에서는 SwaT(29.0점)가 T2T(38.7점)보다도 낮다 [p.25, 표 21]. 본문 §4.4.1은 T2T 대비 우위가 더 많은 벤치마크에서 유지된다고 쓰는데, 이 쌍은 그와 맞지 않는다 [p.7, §4.4.1; p.25, 표 21]. 문서 VQA에서는 '우위 유지'가 모든 쌍에 성립하지 않는다.

논문의 결론은 제로샷 전이가 시각 능력 전체를 옮기는 것은 아니며, 특히 무거운 시각 처리가 필요한 과제에서 그렇다는 것이다. [해설] 짧은 캡션의 캐시에 실을 수 있는 시각 정보에 한계가 있다고 보면 자연스럽다 [p.24, 부록 G].

### 10.3 특수 지식(중국어)의 제로샷 전이

두 번째 사례는 수신자에게 없는 특수 지식, 여기서는 중국어다 [p.7, §4.4.2].

Qwen 3 4B는 중국어 벤치마크 CMMLU 67개 과목 전체에서 69.7점, Llama 3 8B는 51.2점이다. 중국어 토큰은 SwaT의 영어 학습 데이터에 없다 [p.7, §4.4.2]. 아래 [표 5]가 그 해답을 보여준다 [p.7, 표 5].

**표 5: Qwen 3 4B에서 Llama 3 8B로의 CMMLU 중국어 지식 제로샷 전이 결과 (%) [p.7, 표 5]**

| CMMLU 세부 과목 분야 | Qwen 3 4B (송신자) | Llama 3 8B (수신자) | SwaT 전이 정확도 (Q $\to$ L) | Llama 기준 성능 향상률 |
| :--- | :---: | :---: | :---: | :---: |
| 예술학 (Arts) | 90.0 | 55.6 | **88.8** | **+59.6%** |
| 안보 연구 (Security study) | 83.7 | 55.6 | **77.0** | **+38.7%** |
| 개념 물리학 (Concept. physics) | 83.7 | 45.6 | **73.5** | **+61.2%** |
| 전문 심리학 (Prof. psychology) | 82.8 | 56.0 | **77.6** | **+38.5%** |
| **67개 전 과목 종합 평균** | **69.7** | **51.2** | **65.1** | **+27.1%** |

SwaT를 통해 Qwen의 캐시를 전달받은 Llama 3 8B의 중국어 점수는 51.2점에서 **65.1점(+27.1%)**이 되었다. 18.5점 격차 중 13.9점, 곧 **약 4분의 3을 메웠다**. 본문은 격차를 '약 20점'으로 적는다 [p.7, §4.4.2].

매퍼가 영어 텍스트만 보았음에도 중국어 지식이 전이된다는 것은, 매퍼가 표면 텍스트가 아니라 표상을 옮긴다는 방증으로 읽힌다. [해설] 이것은 해석이며, 논문이 표상 수준의 분석을 한 것은 아니다 [p.1~p.2, §1; p.7, §4.4.2].

### 10.4 수신자의 문맥 창보다 긴 문서

부록 F는 수신자의 문맥 창보다 긴 문서를 다루는 사례를 보여 준다 [p.24, 부록 F].

논문은 Qwen 3가 32K 문맥을 지원하고 수신자는 8K만 지원한다고 적는다 [p.24, 부록 F]. 이는 공개된 모델 사양과도 맞는다. Llama 3 8B의 기본 문맥은 8K, Qwen 3의 기본 문맥은 32K다.

송신자(Qwen 3 4B)에게 다른 문서의 방해 정보(distractor)를 가득 채워 **28,000(28K) 토큰**으로 부풀린 초장문 HotpotQA 문서를 읽혔다. 그리고 생성된 방대한 KV 캐시를 8K 크기의 청크(chunk)들로 분할한 뒤, 각 청크를 SwaT+AM으로 압축하여 8K 한계를 지닌 수신자(Llama 3 8B)에게 전달했다 [p.24, 부록 F].

**표 19: 초장문(28K 토큰) Interleaved HotpotQA 500개 질의 평가 결과 (%) [p.24, 표 19]**

| 평가 대상 기법 및 모델 | 입력 시퀀스 길이 | 완전 일치율 (EM) | 부분 일치 점수 (F1) |
| :--- | :---: | :---: | :---: |
| **기준선 (Baselines)** | | | |
| Qwen 3 4B 단독 (원문 직접 독해) | 28K 토큰 | 20.4% | 36.75% |
| Llama 3 8B 텍스트 절단 (Truncate 8K) | 8K 토큰 | 5.4% | 13.32% |
| Llama 3 8B 단독 AM20 압축 | 5.6K 토큰 | 21.2% | 34.95% |
| **SwaT 프레임워크** | | | |
| **Qwen $\to$ AM20 $\to$ Llama 3 8B** | **5.6K 토큰** | **24.8%** | **41.87%** |

8K 한계인 Llama 3 8B는 문서를 잘라 읽으면 F1이 13.32에 그친다. 그러나 Qwen이 28K 전체를 한 번에 읽고 계산해둔 청크 캐시를 SwaT+AM으로 건네받아 5.6K로 압축 수용했을 때, **EM 24.8%, F1 41.87%를 기록했다** [p.24, 표 19].

28K를 직접 읽은 Qwen 3 4B(EM 20.4, F1 36.75)와 Llama 자체 AM20 압축(EM 21.2, F1 34.95)보다 높다 [p.24, 표 19]. 논문은 청크로 나누기 전에 송신자가 문서 전체를 프리필했으므로 각 청크에 청크 사이의 의존 관계가 담긴다는 점을 차이로 든다 [p.24, 부록 F].


---

## 11. 비용 구조와 경쟁 방법: 왜 계열 간 이질성에서 빛나는가

아무리 뛰어난 정확도를 지녔더라도, 캐시를 변환하는 데 드는 연산 비용이 수신자가 텍스트를 처음부터 다시 읽는 비용보다 크다면 실전 배치가 불가능하다. 비용과 경쟁 방법을 차례로 보자 [p.8, §5].

### 11.1 재-프리필 대비 연산량 및 지연시간 비교

아래 [표 6]은 64개 토큰의 극단적 단문부터 64,000(64K) 토큰의 초장문에 이르기까지, 수신자 모델이 원문을 처음부터 다시 프리필(Re-prefill)할 때와 SwaT 매퍼를 통과시킬 때의 실제 FLOPs 연산량과 소요 지연시간(Latency, ms)을 측정한 결과다 [p.8, 표 6].

**표 6: 수신자 재-프리필 대 SwaT 매퍼의 연산량(TFLOPs) 및 추론 지연시간(ms) 실측 비교 [p.8, 표 6]**

| 시퀀스 길이 (Seq Len) | Qwen 3 4B $\to$ Llama 3 8B (재-프리필 / SwaT) | FLOPs 절감비 | Q $\to$ L 지연시간 (재-프리필 / SwaT) | 속도 향상비 | Llama 3 8B $\to$ Qwen 3 14B (재-프리필 / SwaT) | FLOPs 절감비 | L $\to$ Q 지연시간 (재-프리필 / SwaT) | 속도 향상비 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **64 토큰** | 0.89 / **0.04** TFLOPs | **$\times$24.7** | 26.0 / **2.1** ms | **$\times$12.3** | 1.69 / **0.04** TFLOPs | **$\times$45.3** | 43.5 / **2.2** ms | **$\times$20.2** |
| **256 토큰** | 3.59 / **0.15** TFLOPs | **$\times$24.4** | 31.7 / **2.6** ms | **$\times$12.0** | 6.79 / **0.15** TFLOPs | **$\times$44.7** | 47.8 / **2.7** ms | **$\times$18.0** |
| **1K 토큰 (1,024)** | 14.57 / **0.63** TFLOPs | **$\times$23.2** | 52.9 / **5.7** ms | **$\times$9.3** | 27.49 / **0.65** TFLOPs | **$\times$42.5** | 95.8 / **5.7** ms | **$\times$16.7** |
| **4K 토큰 (4,096)** | 61.57 / **3.13** TFLOPs | **$\times$19.7** | 209.9 / **21.7** ms | **$\times$9.7** | 115.11 / **3.20** TFLOPs | **$\times$35.9** | 394.1 / **22.3** ms | **$\times$17.7** |
| **16K 토큰** | 299.07 / **22.40** TFLOPs | **$\times$13.3** | 1,054.5 / **131.4** ms | **$\times$8.0** | 542.89 / **22.71** TFLOPs | **$\times$23.9** | 1,912.0 / **134.9** ms | **$\times$14.2** |
| **32K 토큰** | 738.88 / **71.19** TFLOPs | **$\times$10.4** | 2,763.2 / **391.6** ms | **$\times$7.1** | 1,305.68 / **71.81** TFLOPs | **$\times$18.2** | 4,799.9 / **399.0** ms | **$\times$12.0** |
| **64K 토큰** | 2,040.71 / **247.94** TFLOPs | **$\times$8.2** | 7,966.4 / **1,296.3** ms | **$\times$6.1** | 3,490.98 / **249.18** TFLOPs | **$\times$14.0** | 13,465.7 / **1,314.9** ms | **$\times$10.2** |

이 실측 수치는 두 가지 중요한 사실을 입증한다 [p.8, §5]:
1. **연산 절감:** 가장 불리한 64K에서도 FLOPs는 재-프리필보다 두 쌍에서 각각 **×8.2, ×14.0** 적고, 지연은 **×6.1, ×10.2** 빠르다. 본문 §5는 1K 미만에서 지연이 약 ×10, ×16 빠르다고 쓰지만, 표 6의 64·256 토큰 값은 ×12.3·×12.0과 ×20.2·×18.0이고 1K는 ×9.3, ×16.7이어서 대략만 맞는다 [p.8, 표 6, §5]. 배수는 쌍과 길이에 따라 달라진다.
2. **비용의 비대칭:** 수신자 모델이 Llama 3 8B에서 Qwen 3 14B로 커질 때, 수신자의 자체 재-프리필 연산량은 64K 기준 2,040 TFLOPs에서 3,490 TFLOPs로, 지연시간은 7.9초에서 13.5초로 급증한다. **SwaT 비용은 247.94에서 249.18 TFLOPs, 지연은 1.30초에서 1.31초로 거의 같다** [p.8, 표 6, §5].

[해설] 이 추세가 이어진다면 수신자가 클수록 절감 폭도 커질 것이다. 다만 논문이 잰 것은 8B와 14B 두 수신자뿐이다.

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 836" width="100%" style="max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#0f172a" rx="16"/>
<text x="210.0" y="46" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">시퀀스 길이별 FLOPs 절감 배수와 지연</text>
<text x="210.0" y="72" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">단축 배수 (표 6)</text>
<text x="210.0" y="94" fill="#94a3b8" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Llama 3 8B → Qwen 3 14B 쌍, 막대 길이는</text>
<text x="210.0" y="116" fill="#94a3b8" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">배수에 비례</text>
<rect x="16" y="130" width="388" height="70" rx="10" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
<text x="210.0" y="162" fill="#94a3b8" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">파랑: FLOPs 비율 (재-프리필 ÷ SwaT)</text>
<text x="210.0" y="184" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">초록: 지연 단축 배수 (Speedup)</text>
<text x="16" y="226" fill="#f8fafc" font-size="18px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">64</text>
<rect x="16" y="236" width="234.4" height="20" rx="3" fill="#38bdf8"/>
<text x="256.3782608695652" y="252" fill="#38bdf8" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">45.3배</text>
<rect x="16" y="262" width="104.5" height="20" rx="3" fill="#34d399"/>
<text x="126.51304347826085" y="278" fill="#34d399" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">20.2배</text>
<text x="16" y="314" fill="#f8fafc" font-size="18px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">256</text>
<rect x="16" y="324" width="231.3" height="20" rx="3" fill="#38bdf8"/>
<text x="253.27391304347827" y="340" fill="#38bdf8" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">44.7배</text>
<rect x="16" y="350" width="93.1" height="20" rx="3" fill="#34d399"/>
<text x="115.1304347826087" y="366" fill="#34d399" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">18.0배</text>
<text x="16" y="402" fill="#f8fafc" font-size="18px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">1K</text>
<rect x="16" y="412" width="219.9" height="20" rx="3" fill="#38bdf8"/>
<text x="241.8913043478261" y="428" fill="#38bdf8" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">42.5배</text>
<rect x="16" y="438" width="86.4" height="20" rx="3" fill="#34d399"/>
<text x="108.40434782608695" y="454" fill="#34d399" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">16.7배</text>
<text x="16" y="490" fill="#f8fafc" font-size="18px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">4K</text>
<rect x="16" y="500" width="185.7" height="20" rx="3" fill="#38bdf8"/>
<text x="207.74347826086955" y="516" fill="#38bdf8" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">35.9배</text>
<rect x="16" y="526" width="91.6" height="20" rx="3" fill="#34d399"/>
<text x="113.5782608695652" y="542" fill="#34d399" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">17.7배</text>
<text x="16" y="578" fill="#f8fafc" font-size="18px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">16K</text>
<rect x="16" y="588" width="123.7" height="20" rx="3" fill="#38bdf8"/>
<text x="145.65652173913043" y="604" fill="#38bdf8" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">23.9배</text>
<rect x="16" y="614" width="73.5" height="20" rx="3" fill="#34d399"/>
<text x="95.4695652173913" y="630" fill="#34d399" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">14.2배</text>
<text x="16" y="666" fill="#f8fafc" font-size="18px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">32K</text>
<rect x="16" y="676" width="94.2" height="20" rx="3" fill="#38bdf8"/>
<text x="116.16521739130434" y="692" fill="#38bdf8" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">18.2배</text>
<rect x="16" y="702" width="62.1" height="20" rx="3" fill="#34d399"/>
<text x="84.08695652173913" y="718" fill="#34d399" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">12.0배</text>
<text x="16" y="754" fill="#f8fafc" font-size="18px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">64K</text>
<rect x="16" y="764" width="72.4" height="20" rx="3" fill="#38bdf8"/>
<text x="94.43478260869566" y="780" fill="#38bdf8" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">14.0배</text>
<rect x="16" y="790" width="52.8" height="20" rx="3" fill="#34d399"/>
<text x="74.77391304347826" y="806" fill="#34d399" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">10.2배</text>
</svg>
</div>

### 11.2 기존 전이 방법과의 비교

저자들은 Closed Form [13]과 Dense Latent [4]를 직접 구현하고, 계열을 넘을 수 있도록 토크나이저 정렬 기능을 덧붙여 17개 벤치마크에서 비교했다 [p.8, §5]. 아래 [표 7]은 세 가지 서로 다른 전이 시나리오에서의 결과를 정리한 것이다 [p.8, 표 7]. 초록의 '12개 LLM, 6개 계열'은 표 2의 12개 모델과 일치하지만, 표 7의 Qwen 3 8B와 Qwen 2 7B는 그 밖의 모델이라 집계 기준이 분명하지 않다 [p.1, 초록; p.4, 표 2; p.8, 표 7].

**표 7: 17개 벤치마크 평균 성능(%, F1) 비교 (3회 독립 시드 반복 ± 표준오차) [p.8, 표 7]**

| 전이 시나리오 (Sender $\to$ Receiver) | 전이 모드 (Mode) | Closed Form [13] | Dense Latent [4] | **SwaT (본 논문)** | SwaT 우위 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Qwen 3 4B $\to$ Qwen 3 8B** | **동일 계열 (Same Family)** | 59.9 ± 0.2 | **73.5 ± 0.1** | 72.3 ± 0.2 | −1.2 (대등) |
| **Qwen 3 4B $\to$ Qwen 2 7B** | **세대 간 (Cross-Generation)** | 41.0 ± 0.5 | 47.3 ± 0.2 | **68.1 ± 0.1** | **+20.8점 앞섬** |
| **Qwen 3 4B $\to$ Llama 3 8B** | **이종 계열 간 (Cross-Family)** | 30.5 ± 2.2 | 43.5 ± 0.3 | **63.5 ± 0.1** | **+20.0점 앞섬** |

읽을 점은 두 가지다:
- **동일 계열 안에서는 SwaT의 우위가 사라진다:** Qwen 3 4B에서 8B로 보낼 때는 Dense Latent가 73.5점으로 오히려 SwaT(72.3점)보다 소폭 앞서거나 대등하다 [p.8, 표 7]. [해설] 같은 계열끼리는 캐시 기하가 닮아 기존 방법으로도 충분히 옮겨지는 것으로 보인다.
- **가치는 이질성에서 나온다:** 그러나 세대가 바뀌거나(Qwen 3 $\to$ Qwen 2), 완전히 다른 조직의 모델(Qwen 3 $\to$ Llama 3)로 넘어가는 순간, 두 기존 방법의 최고점은 47.3점과 43.5점이고 SwaT는 68.1점과 63.5점으로 **20점 이상 앞선다** [p.8, 표 7]. 

SwaT의 가치는 이질적인 모델이 섞인 환경에서 나온다.

---

## 12. 한계·윤리·열린 질문: 확장성의 벽과 잠재공간의 미래

논문이 직접 밝힌 한계와 윤리적 고려는 다음과 같다 [p.8, §6].

### 12.1 조합 폭발의 벽: $n(n-1)$ 매퍼 문제와 공통 잠재공간

첫째 한계는 **특정 송신자-수신자 쌍마다 전용 매퍼 $\mathcal{M}_{i \to j}$를 각각 훈련시켜야 한다**는 점이다 [p.8, §6].

만약 다중 에이전트 생태계에 $n$개의 서로 다른 모델 계열이 존재한다면, 방향이 있는 쌍마다 매퍼가 필요하므로 **$n(n - 1)$개**가 된다:
- 3개 모델: $3 \times 2 = 6$개 매퍼
- 6개 모델: $6 \times 5 = 30$개 매퍼
- 10개 모델: $10 \times 9 = 90$개 매퍼
- 20개 모델: $20 \times 19 = 380$개 매퍼

매퍼 수는 $n$의 제곱에 가깝게 늘어나므로 논문은 이것이 금세 감당하기 어려워진다고 본다.

저자들이 제안하는 향후 과제는 **공유 잠재 공간(Shared Latent Space)**이다 [p.8, §6]. 에이전트마다 공유 공간으로 들어가는 매퍼와 나오는 매퍼를 하나씩 두면 모두 **$2n$개**면 된다. [해설] $n=6$이면 30개 대신 12개다 [p.8, §6].

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 478" width="100%" style="max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#0f172a" rx="16"/>
<text x="210.0" y="46" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">매퍼 확장성의 한계와 돌파구: n(n-1)</text>
<text x="210.0" y="72" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">일대일 연결 vs 2n 공통 잠재공간</text>
<rect x="16" y="86" width="388" height="182" rx="10" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
<text x="210.0" y="118" fill="#f43f5e" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">현재 방식: 일대일 전용 매퍼</text>
<text x="210.0" y="142" fill="#f43f5e" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">(Point-to-Point)</text>
<text x="210.0" y="164" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">필요 매퍼 수: n(n - 1)개 (방향 있는 쌍마다</text>
<text x="210.0" y="186" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">1개)</text>
<text x="210.0" y="208" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">M1 · M2 · M3 · M4 · M5</text>
<text x="210.0" y="230" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">6개 모델 시 30개 매퍼 / 10개 모델 시 90개</text>
<text x="210.0" y="252" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">매퍼</text>
<rect x="16" y="276" width="388" height="182" rx="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
<text x="210.0" y="308" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">미래 방향: 공통 잠재 공간</text>
<text x="210.0" y="332" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">(Hub-and-Spoke)</text>
<text x="210.0" y="354" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">필요 매퍼 수: 오직 2n개 (In n개 + Out n개)</text>
<text x="210.0" y="376" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">M1 · M2 · M3 · M4 ↔ 공통 잠재공간 (Shared</text>
<text x="210.0" y="398" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Space)</text>
<text x="210.0" y="420" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">6개 모델 시 12개 매퍼 / 10개 모델 시 20개</text>
<text x="210.0" y="442" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">매퍼</text>
</svg>
</div>

### 12.2 단일 메시지 한계와 캐시 합성(Composition)의 난제

둘째 한계는 **한 번의 메시지 전달만 다룬다**는 점이다 [p.8, §6].

반복 전달이나 여러 메시지를 합치는 일은 다루지 않았는데, 논문은 KV 캐시가 열화되고 텍스트만큼 합성하기 쉽지 않다는 점을 이유로 든다 [p.8, §6]. [해설] 텍스트는 두 보고서를 이어 붙이면 그만이지만, 캐시는 전달을 거듭할수록 변환 오차가 쌓일 수 있다.

저자들은 KVLink [37] 같은 캐시 합성 기법과의 결합을 향후 과제로 든다 [p.8, §6; p.10, 참고문헌 37].

**표: SwaT 프레임워크의 현재 한계 및 미래 극복 과제 종합 정리**

| 구분 | 현재 SwaT의 한계 (Limitations) | 미래 연구 및 극복 방향 (Future Work) |
| :--- | :--- | :--- |
| **확장성** | $n$개 계열 간 $n(n-1)$개의 일대일 쌍별 매퍼 학습 필요 | $2n$개의 입출력 매퍼를 갖는 **공통 잠재 공간(Shared Latent Space)** 구축 |
| **합성성** | 한 번의 전달만 다룸. 캐시는 열화되고 합성이 어렵다 | **KVLink [37]** 등 캐시 합성 기법과 결합 |
| **시각 전이** | 문서·인포그래픽 과제에서 송신자 VLM 단독보다 크게 낮음 [p.25, 표 21] | 논문에 제시 없음 |
| **안전성** | 캐시에 텍스트보다 많은 정보가 담길 수 있음 | 캐시 전달의 **감사 가능성(Auditability)과 안전성** 연구 |

### 12.3 윤리적 함의: 텍스트로 볼 수 없는 통신

이 방식은 AI 안전 연구에 질문을 던진다 [p.8, §6].

논문에 따르면 현재 구현은 송신자의 텍스트가 있어야 하므로 텍스트 기반 감시가 가능하다. 그러나 전달된 캐시에는 텍스트에 드러난 것 이상의 정보가 담길 수 있다 [p.8, §6].

시각 전이 실험이 그 예다. 캡션 텍스트에는 없던 시각 정보가 캐시를 통해 전달되었다 [p.7, §4.4.1; p.8, §6].

[해설] 통신 기록이 사람이 읽을 수 없는 숫자 덩어리가 되면, 그 안에 무엇이 오갔는지 텍스트만 보고는 알 수 없다.

그래서 저자들은 캐시 전달의 **감사 가능성과 안전성**에 대한 후속 연구가 중요하다고 강조한다 [p.8, §6].

### 12.4 서지와 코드 공개

논문은 arXiv:2610.15095v1로 표기되어 있고, 부록 A는 코드 저장소로 github.com/Ar-Kareem/SwaT를 든다 [p.1; p.11, 부록 A]. 두 곳 모두 공개되어 있다.

---

## 13. 맺음: 생각을 건네는 텔레파시의 미래

SwaT에서 가져갈 생각을 아홉 가지로 정리하면 다음과 같다.

1. **말이 아닌 기억 상태의 이전:** 에이전트 간 통신을 말이 아니라 이미 계산된 상태, 곧 KV 캐시의 이전으로 볼 수 있다. '텔레파시'라는 이름의 뜻이다.
2. **문자라는 공통 좌표계:** 계열 간 장벽의 구체적인 모습은 토크나이저 경계와 위치 부호화의 차이이며, 공유하는 원시 문자(Character Span)를 기준으로 연속적 위치(식 12)를 보간함으로써 단 1개의 토큰도 버리지 않고 정렬할 수 있다.
3. **거인의 눈을 빌리는 효과:** 수신자가 송신자보다 약하면 보존율이 100%를 넘는다. 더 큰 모델의 읽기 결과를 빌리는 효과이며, 기준선이 낮으면 비율이 크게 부풀 수 있다.
4. **압축이 요약보다 낫다:** 생성 단계 없는 캐시 압축(AM)이 같은 예산의 요약을 이기고, 예산이 빠듯할수록 차이가 커서 최대 21.4점이다.
5. **비용의 비대칭:** 재-프리필 비용은 수신자가 커질수록 늘지만 SwaT 비용은 거의 일정하다.
6. **텍스트 너머의 정보와 감사 가능성:** 캐시는 텍스트에 없는 정보(시각)까지 싣는다. 바로 그 점이 감사 가능성 문제를 만든다.
7. **두 손실은 서로를 대신하지 못한다:** MSE와 NLL 두 손실은 서로를 대신하지 못하며, 한쪽만 쓰면 약 37점이 떨어진다.
8. **다음 과제는 공유 잠재 공간:** 쌍마다 매퍼가 필요한 $n(n-1)$ 문제는 $2n$개면 되는 공유 잠재 공간이라는 다음 연구 방향을 가리킨다.
9. **이질성에서 빛나는 가치:** 같은 계열에서는 SwaT와 Dense Latent가 비슷하고, 세대나 계열을 넘을 때 20점 이상 앞선다. SwaT의 가치는 이질성에서 나온다.

사람은 뇌를 직접 이을 수 없어서 언어를 만들었다. 언어모델은 처지가 다르다. 상태가 이미 숫자로 존재하므로, 그것을 번역해 건넬 수 있다. SwaT는 서로 다른 계열 사이에서도 그 번역이 가능하고 요약보다 빠르고 정확할 수 있음을 보였다. 동시에 쌍마다 매퍼가 필요하고, 한 번의 전달만 다루며, 사람이 읽을 수 없는 통신이라는 숙제도 남겼다.
