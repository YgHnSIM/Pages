---
title: "문맥은 인프라다: 검색 하네스 시대를 위한 지식 컴파일과 에이전트 네이티브 데이터베이스"
subtitle: "RAGFlow가 제시하는 벡터 없는 검색, 증거 치환의 토큰 경제학, 그리고 통제 가능한 공급 계층"
slug: context-as-infrastructure-ragflow
date: "2026-11-06"
tags:
  - AI
  - 에이전트
  - 논문리뷰
summary: "검색 증강 생성(RAG)이 자율적 검색 하네스 루프로 진화함에 따라 정확도 병목은 해소되었으나 극심한 토큰 낭비와 문맥 비효율이 노출되었습니다. InfiniFlow 연구진은 벡터 인덱스를 전면 배제하고 BM25와 grep 기반 하네스 위에 '지식 컴파일' 공급 계층을 결합하여, 클레임-증거 쌍 치환을 통해 질의 토큰을 평균 38% 절감하고 결정 게이트로 지연 시간을 140초에서 30초로 단축하는 에이전트 네이티브 데이터베이스 아키텍처를 제시합니다."
archive_url: "https://yghnsim.github.io/Archive/pages/2026-11-06-문맥인프라RAGFlow.html"
---

## 1. 패러다임의 전복: 검색 증강에서 에이전틱 하네스로

검색 증강 생성(Retrieval-Augmented Generation, RAG)은 거대언어모델(LLM)을 외부 지식에 안착(grounding)시키기 위한 핵심 아키텍처로 출발했다 [17]. 그러나 최근 자율 에이전트 기술이 비약적으로 발전하면서 검색 계층의 무게중심은 근본적으로 이동했다. 과거의 RAG가 단 한 번의 "단일 질의 $\to$ 벡터 임베딩 생성 $\to$ 유사도 계산" 파이프라인에 의존했다면, 현대의 에이전틱 시스템에서 검색은 언어모델이 스스로 어휘적 질의어를 작성하고, 검색 스니펫을 읽고, 질의를 재구성하며, 수집된 증거가 충분한지 능동적으로 판단하여 종료 시점을 결정하는 연속적인 폐루프(closed-loop)로 진화했다 [18, 29, 32].

이 자율적 검색 루프를 소유하고 제어하는 주체를 **검색 하네스(Search Harness)**라고 부른다. 검색 하네스의 등장은 정보 검색 계층의 존재 이유 자체를 재정의한다. 에이전트가 코퍼스를 능동적으로 탐색(grep)하고 찾아낸 문서를 독해할 수 있게 된 순간, 전통적 정보 검색이 수십 년간 매달려 온 고전적 목표들—더 정교한 청킹 전략, 더 우수한 임베딩 모델 학습, 높은 Recall@$k$ 달성—은 더 이상 전체 시스템의 성능을 옭아매는 구속 병목(binding constraint)이 되지 못한다.

```
"The first claim of this paper is easy to state and hard to internalize:
retrieval is a harness problem before it is an index problem.
The index determines what can be found;
the harness determines whether finding becomes an answer." [p. 2]
```

정확도는 인덱스의 문제가 되기 전에 하네스의 문제다. 인덱스는 무엇이 '발견될 수 있는가(what can be found)'를 결정할 뿐이지만, 하네스는 그 발견이 '정답으로 변환될 수 있는가(whether finding becomes an answer)'를 결정한다. 아무리 완벽하고 방대한 인덱스를 구축해 두더라도, 나쁜 질의어를 버리지 못하고 예산 통제 없이 무한정 읽기만 하거나, 단지 가져오는 데 비용이 많이 들었다는 이유로 불필요한 문단을 컨텍스트 창에 주렁주렁 매달아 두는 검색 루프의 결함을 인덱스 단에서 결코 치료할 수 없다.

### 1.1 벡터/밀집 검색의 의도적 배제: 왜 밀집 검색 레그를 버렸는가

놀랍게도 RAGFlow의 전체 아키텍처에는 벡터 인덱스(Vector Index)나 밀집 검색 경로(Dense-retrieval leg)가 전혀 포함되어 있지 않다. 이는 어떤 미학적 취향이나 극단적인 경량화 욕심 때문이 아니라 철저한 실증적 관찰에 따른 결정이다. 저자들의 자체 실험(our runs)에서 검색 하네스에 밀집 검색 레그를 추가했을 때 오히려 정답 정확도가 하락했으며, 이는 Section 2에서 인용한 보고들[5, 9, 18]과 같은 방향이다.

[해설] 이 현상은 직관적으로 언뜻 모순처럼 보이지만, 에이전트 하네스의 본질을 뜯어보면 매우 명쾌하다. 전통적인 단발성 RAG에서는 사용자의 모호한 자연어 질문과 문서 사이의 의미적 어간을 메우기 위해 고차원 벡터 임베딩 기반의 밀집 검색이 필수적이었다. 그러나 에이전틱 하네스 안에서는 언어모델 자신이 이미 매 턴마다 검색어를 능동적으로 재구성하고, 검색 결과를 읽으며 아직 무엇이 누락되었는지를 스스로 파악하는 고차원의 '의미적 단계(semantic step)'를 완벽하게 수행하고 있다. 

이러한 루프 환경에서 밀집 검색 레그를 추가하는 것은 에이전트에게 새로운 정보를 더해주는 것이 아니다. 오히려 에이전트가 이미 확고하게 신뢰하고 있는 어휘적 닻(lexical anchor, 즉 정확한 키워드와 구문)과 상충하는 불필요한 제2의 랭킹 점수를 주입하여 혼란을 초래할 뿐이다. 게다가 벡터 인덱스는 데이터가 변경될 때마다 임베딩을 다시 계산하고 색인을 갱신해야 하는 막대한 연산 비용을 수반한다. 결과적으로 검색 하네스에 진정으로 필요한 도구는 복잡한 벡터 데이터베이스가 아니라, 가장 기본적이고 투명한 **BM25**와 **grep**이다.

### 1.2 베이스라인의 위력과 비교 불가한 두 벤치마크

어휘적 도구만으로 무장한 하네스의 위력은 실증 벤치마크에서 강력하게 입증된다. 어떠한 컴파일된 색인이나 벡터 인덱스도 없이, 오직 **BM25**, **grep**, 그리고 답변 모델로서 **MiniMax M3**만을 장착한 미컴파일 베이스라인 하네스는 다음과 같은 놀라운 성능을 기록했다 [p. 1, p. 2, p. 10]:

- **BrowseComp-Plus 벤치마크:** 85.0% 정답률 달성 (질문당 약 $3.0 \times 10^6$ 토큰 소모)
- **FRAMES 멀티홉 벤치마크:** 91.0% 정답률 달성 (질문당 평균 324,479 토큰 소모, 46.7초 소요)

여기서 매우 중요한 학술적 주의점이 있다. **BrowseComp-Plus의 85%와 FRAMES의 91%는 서로 직접 비교할 수 없는(not comparable) 수치다** [^1].

BrowseComp-Plus는 단일 질문을 해결하기 위해 웹과 문서 전반을 집요하게 탐색하는 환경으로, 질문 하나를 해결하는 데 무려 300만 토큰에 달하는 방대한 연산을 소모하며 에이전트의 포화 능력을 검증하는 벤치마크다. 반면 FRAMES는 여러 개의 위키피디아 문서에 흩어진 엔티티 연계 증거들을 조합해야 하는 복합 추론(multi-hop) 벤치마크이며, 질문당 약 32.5만 토큰 수준에서 평가가 이루어진다. 두 벤치마크의 수치는 상호 비교를 위한 것이 아니라, 각각의 고유한 평가 환경에서 "어휘적 검색 도구를 쥔 유능한 하네스만으로도 이미 최상위권 정확도 포화(saturation)에 도달한다"는 사실을 독립적으로 입증하는 척도다.

### 1.3 정확도 포화가 폭로한 '맥락 문제(Context Problem)'

하네스가 정확도 문제를 사실상 해결했다면, 이제 무엇이 문제인가? 하네스는 '정답을 찾아내는 능력'을 입증했지만, '답변에 도달하는 과정(process of answering)'의 효율성까지 보장하지는 못한다.

에이전틱 루프의 실체는 내부에 언어모델을 품고 있는 휴리스틱 탐색 알고리즘이다. 명확한 규율과 통제가 결여된 에이전틱 루프는 필연적으로 맹목적인 탐색으로 퇴행한다. 동일한 키워드를 조금씩 바꿔가며 헛돌고, 이미 확인한 문서를 반복해서 다시 읽으며, 질문과 직접적인 관련이 없는 한계적(marginal) 문단 수십 개를 무분별하게 컨텍스트 창에 쌓아 올린다. 그리고 마침내 거대해진 컨텍스트 창 속에서 언어모델이 인내심을 발휘하여 정답을 집어내기를 요행처럼 기대하게 된다.

이러한 무규율 루프는 심각한 비용을 치른다. 에이전트가 턴을 거듭할 때마다 천문학적인 추론 토큰 비용이 발생하며, 컨텍스트 창에 밀어 넣은 무수한 무관한 문단들은 정작 중요한 핵심 증거 문단과 어텐션(attention) 자원을 놓고 치열하게 경쟁하며 모델의 인지적 판단을 흐린다(Lost in the middle 현상) [19]. 에이전트는 엄청난 토큰을 불태우며 연산을 수행했지만, 그 과정은 끝내 우아한 정답으로 수렴하지 못한다.

결국 에이전틱 시대의 진짜 병목은 "어떻게 더 정확하게 찾을 것인가"가 아니라, **"찾아낸 방대한 정보 중 무엇을 언어모델의 컨텍스트 창에 입력할 것인가"**라는 **맥락 공급의 문제(Context Problem)**로 귀결된다. 그리고 이 결손된 고리를 채우기 위해 제안된 해법이 바로 **지식 컴파일(Knowledge Compilation)**이다.

---

## 2. 인프라로서의 문맥: 지식 컴파일 아키텍처

### 2.1 지식 컴파일의 정의: $\kappa: \mathcal{D} \to \mathcal{A}$

지식 컴파일(Knowledge Compilation)은 질의 독립적(query-independent)으로 원천 코퍼스를 정형화된 맥락 아티팩트로 변환하는 수집 계층의 변환 함수로 공식 정의된다 [p. 3, Eq. 1]:

$$\kappa: \mathcal{D} \longrightarrow \mathcal{A} = \{a_1, \dots, a_m\}$$

여기서 $\mathcal{D}$는 시스템이 다루어야 할 원천 문서들의 집합(Raw Corpus)이며, 생성된 각 아티팩트 $a_j$는 원천 문서에서 파생된 엄격한 타입(typed)과 버전(versioned)을 지닌 함수적 결과물이다. 

이 변환의 가장 핵심적인 불변량은 **원천 문서 내부에서 자신이 유도되어 나온 정확한 텍스트 스팬(span) 및 오프셋과의 계통 링크(lineage link)를 영구히 보존한다**는 점이다.

'지식 컴파일'이라는 용어는 과거 복잡한 논리 지식 베이스를 질의 처리가 용이한 타겟 언어로 사전 변환하던 고전적 지식 표현론의 전통[3]과 궤를 달리하며, 카파시(Karpathy)가 주창한 LLM-위키 패턴[13]—즉, 거대 코퍼스를 모델이 읽기 좋은 형태로 사전 구축하여 지속 유지하는 개념—을 포괄적으로 확장한 것이다 [^2]. 지식 컴파일은 파싱이나 청킹 같은 결정론적(deterministic) 처리와 클레임 추출, 엔티티 인식, 요약, 온톨로지 라벨링 같은 모델 기반(model-based) 처리를 모두 아우른다.

### 2.2 3계층 아키텍처: 공급, 제어, 계약

지식 컴파일이 작동하는 전체 시스템은 명확히 분리된 세 개의 수직 계층으로 구조화된다. 공급 계층(Supply), 제어 계층(Control), 그리고 이 둘을 매개하는 계약 인터페이스(Contract)다.

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 620" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fbbf24"/></marker></defs><rect width="420" height="620" fill="#0b1120" rx="14"/><text x="210" y="34" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">3계층 아키텍처</text><rect x="20" y="56" width="380" height="130" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><text x="210" y="84" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">제어: 검색 하네스 (질의 시점)</text><text x="210" y="114" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">도구 게이팅 · 증거 프리페치</text><text x="210" y="138" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">증거 게이트 · 도구 루프</text><text x="210" y="162" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">인용 바인딩 / 폴백</text><line x1="150" y1="234" x2="150" y2="192" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><line x1="270" y1="192" x2="270" y2="234" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><rect x="20" y="236" width="380" height="130" rx="10" fill="#111827" stroke="#fbbf24" stroke-width="2"/><text x="210" y="264" fill="#fbbf24" font-size="17px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">계약: 도구 인터페이스</text><text x="210" y="294" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">정규식 위치 식별 · 클레임 검색</text><text x="210" y="318" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">드릴다운 · 메타데이터 스코프</text><text x="210" y="342" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">앵커 독해 · 제로 히트 진단</text><line x1="150" y1="414" x2="150" y2="372" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><line x1="270" y1="372" x2="270" y2="414" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><rect x="20" y="416" width="380" height="130" rx="10" fill="#111827" stroke="#34d399" stroke-width="2"/><text x="210" y="444" fill="#34d399" font-size="17px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">공급: 지식 컴파일 (인덱스 시점)</text><text x="210" y="474" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">네비게이션 트리 · 엔티티 그래프</text><text x="210" y="498" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">온톨로지 · 타임라인 / 마인드맵</text><text x="210" y="522" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">LLM 위키 / 세션 메모리</text><text x="210" y="604" fill="#94a3b8" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">↑ 읽기 전용 아티팩트 · ↓ 도구 호출</text></svg>
</div>

위 구조에서 각 계층의 역할 분담은 엄격하다:

1. **공급(Supply - 지식 컴파일):** 질의가 들어오기 전 인덱스 타임에 한 번만 실행된다. LLM을 활용하여 원천 문서의 비구조화된 텍스트를 정밀한 클레임-증거 쌍, 엔티티 그래프, 온톨로지, 타임라인 등의 정형화된 타입 아티팩트로 컴파일한다.
2. **제어(Control - 검색 하네스):** 런타임 질의 처리 시점에 작동한다. 어떤 아티팩트를 컨텍스트 창에 들여보낼지, 추가적인 정밀 독해가 필요한지, 루프를 언제 종료할지를 전적으로 결정한다.
3. **계약(Contract - 도구 인터페이스):** 공급 계층이 생산한 읽기 전용 아티팩트를 하네스가 안전하게 소비할 수 있도록 규정된 API 집합이다. 도구는 검색 후보군과 증거를 전달할 뿐, 독단적인 결론을 하네스에 강제하지 않는다.

[해설] 이 아키텍처는 고전적인 전통 소프트웨어 엔지니어링의 컴파일러-런타임 분리 철학과 완벽히 맞닿아 있다. C 언어나 Rust 컴파일러가 소스 코드의 문법을 분석하고 최적화하여 바이너리를 사전 구축하듯, 지식 컴파일러는 방대한 자연어 코퍼스를 사전 정제하여 "기계(에이전트)가 읽기 가장 최적화된 상태"의 바이너리 객체(아티팩트)로 구워낸다. 런타임 하네스는 원천 텍스트를 처음부터 헤매며 해석할 필요 없이, 이미 검증되고 정렬된 컴파일 객체를 초고속으로 메모리에 로드(치환)하여 사용한다.

### 2.3 청킹의 위상: 의미의 단위가 아니라 재현율의 단위

전통적인 나이브(naive) RAG에서 청킹(Chunking)은 시스템의 성패를 가르는 절대적 요인으로 취급되었다. 단 한 번의 벡터 유사도 검색으로 정답을 담고 있는 단락을 건져 올려야 했기 때문에, 청크의 물리적 경계선이 무엇을 찾을 수 있는지를 결정하는 생사여탈권을 쥐고 있었다. 이로 인해 수많은 엔지니어들이 문서 도메인마다 최적의 청크 크기(256토큰? 512토큰? 슬라이딩 윈도우?)를 찾기 위해 끝없는 튜닝 지옥에 빠져들었다.

그러나 유능한 에이전틱 하네스가 도입되는 순간, 이 불가능한 튜닝 문제는 완전히 소멸한다. 하네스는 단일 청크에 갇히지 않고 grep과 키워드 검색을 통해 문서 전반을 유연하게 훑을 수 있기 때문이다. 

지식 컴파일 파이프라인에서 청크는 '의미의 단위(unit of meaning)'가 아니라, 단지 검색 시점에 후보를 건져 올리기 위한 **'재현율의 단위(unit of recall)'**에 불과하다. 컴파일 계층은 청크라는 거친 물리적 단위 위에 올라앉아, 청크 자체에는 단독으로 존재하지 않는 문서 전체 맥락과 원자적 증거를 풍부하게 덧입힌다. 따라서 본 시스템의 모든 실증 비교는 베이스라인과 컴파일 시스템 간에 동일한 기본 청커를 완전히 고정한 상태에서 수행되었으며, 특정 청킹 휴리스틱에 의존하지 않는다.

### 2.4 채널 분리와 원천 불변성

지식 컴파일 시스템이 기업용 및 규제 환경에서 신뢰를 얻기 위한 필수 전제조건은 **채널의 엄격한 분리(Channel Separation)**다.

- **원천 채널(Raw Channel):** 불변(immutable)의 읽기 전용 원본 데이터다.
- **파생 채널(Derived Channel):** 컴파일러에 의해 생성된 클레임, 요약, 온톨로지 라벨 등의 아티팩트다.

파생 채널의 아티팩트는 **결코 원천 코퍼스에 역기록(write-back)되지 않는다.** 언어모델이 생성한 요약문이나 클레임이 원본 데이터베이스에 다시 섞여 들어가면, 다음 세대의 언어모델이 자신이 환각(hallucination)으로 뱉어낸 요약문을 다시 원본 '진실'로 착각하여 읽어 들이는 치명적인 모델 붕괴와 지식 오염이 발생한다. 

파생 아티팩트는 독립된 저장소에 엄격한 계통 링크(원천 문서 ID, 정확한 문자 시작/끝 오프셋, 추출기 버전, 검증 상태)와 함께 기록된다. 이를 통해 에이전트는 컴파일된 클레임을 읽다가도 언제든지 원본 원천 텍스트로 즉시 되돌아갈(fallback) 수 있으며, 규제 감사업체는 특정 클레임이 실제 원본 문서의 몇 페이지 몇째 줄에서 유도되었는지를 100% 투명하게 추적할 수 있다.

---

## 3. 6단계 컴파일 파이프라인과 아티팩트 생태계

지식 컴파일은 교체 가능한 모듈들로 구성된 6단계 인제스천 파이프라인을 통해 실행된다 [p. 3, §3.2].

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 640" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fbbf24"/></marker></defs><rect width="420" height="640" fill="#0b1120" rx="14"/><text x="210" y="34" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">6단계 컴파일 파이프라인</text><rect x="30" y="52" width="360" height="54" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><circle cx="58" cy="79" r="16" fill="#38bdf8"/><text x="58" y="85" fill="#0b1120" font-size="16px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">1</text><text x="86" y="74" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">Parse</text><text x="86" y="97" fill="#e2e8f0" font-size="16px" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">정규화 · 구조·앵커 보존</text><line x1="210" y1="106" x2="210" y2="124" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><rect x="30" y="128" width="360" height="54" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><circle cx="58" cy="155" r="16" fill="#38bdf8"/><text x="58" y="161" fill="#0b1120" font-size="16px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">2</text><text x="86" y="150" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">Chunk</text><text x="86" y="173" fill="#e2e8f0" font-size="16px" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">재현율 단위 · 동일 청커 고정</text><line x1="210" y1="182" x2="210" y2="200" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><rect x="30" y="204" width="360" height="54" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><circle cx="58" cy="231" r="16" fill="#38bdf8"/><text x="58" y="237" fill="#0b1120" font-size="16px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">3</text><text x="86" y="226" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">Enrich</text><text x="86" y="249" fill="#e2e8f0" font-size="16px" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">경량 모델 · 클레임·증거 추출</text><line x1="210" y1="258" x2="210" y2="276" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><rect x="30" y="280" width="360" height="54" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><circle cx="58" cy="307" r="16" fill="#38bdf8"/><text x="58" y="313" fill="#0b1120" font-size="16px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">4</text><text x="86" y="302" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">Validate</text><text x="86" y="325" fill="#e2e8f0" font-size="16px" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">원문 정확 대조 · 불일치 폐기</text><line x1="210" y1="334" x2="210" y2="352" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><rect x="30" y="356" width="360" height="54" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><circle cx="58" cy="383" r="16" fill="#38bdf8"/><text x="58" y="389" fill="#0b1120" font-size="16px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">5</text><text x="86" y="378" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">Assemble</text><text x="86" y="401" fill="#e2e8f0" font-size="16px" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">트리·그래프·타임라인 조립</text><line x1="210" y1="410" x2="210" y2="428" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><rect x="30" y="432" width="360" height="54" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><circle cx="58" cy="459" r="16" fill="#38bdf8"/><text x="58" y="465" fill="#0b1120" font-size="16px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">6</text><text x="86" y="454" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">Register</text><text x="86" y="477" fill="#e2e8f0" font-size="16px" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">불변 원장 · 오프셋·버전·ACL</text><text x="210" y="522" fill="#34d399" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">산출 아티팩트</text><rect x="30" y="536" width="84" height="36" rx="8" fill="#064e3b" stroke="#34d399"/><text x="72" y="560" fill="#a7f3d0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Tree</text><rect x="122" y="536" width="84" height="36" rx="8" fill="#064e3b" stroke="#34d399"/><text x="164" y="560" fill="#a7f3d0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Graph</text><rect x="214" y="536" width="84" height="36" rx="8" fill="#064e3b" stroke="#34d399"/><text x="256" y="560" fill="#a7f3d0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Ontology</text><rect x="306" y="536" width="84" height="36" rx="8" fill="#064e3b" stroke="#34d399"/><text x="348" y="560" fill="#a7f3d0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Wiki</text><rect x="30" y="582" width="84" height="36" rx="8" fill="#064e3b" stroke="#34d399"/><text x="72" y="606" fill="#a7f3d0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Timeline</text><rect x="122" y="582" width="84" height="36" rx="8" fill="#064e3b" stroke="#34d399"/><text x="164" y="606" fill="#a7f3d0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Mind-map</text><rect x="214" y="582" width="84" height="36" rx="8" fill="#064e3b" stroke="#34d399"/><text x="256" y="606" fill="#a7f3d0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Memory</text></svg>
</div>

### 3.1 6단계 파이프라인의 메커니즘

1. **Parse (파싱):** PDF, 오피스 문서, HTML, 마크다운, 데이터베이스 테이블, 시스템 로그 등 다양한 이종 포맷을 파싱하여 제목 계층, 목록, 테이블 구조, 페이지 앵커가 온전히 보존된 표준 정규 표현으로 변환한다.
2. **Chunk (청킹):** 문맥의 자연스러운 경계선(문단, 섹션 등)을 기준으로 텍스트를 청크로 분할한다. 앞서 강조했듯 이 단계는 베이스라인 검색과 완전히 공유되는 재현율 확보 단계다.
3. **Enrich (보강):** 언어모델이 문서 맥락 내에서 각 청크를 정밀하게 독해하고, 템플릿 요구에 맞춰 원자적 클레임과 증거, 요약 라벨, 엔티티와 관계, 사건과 날짜 등을 추출한다. 이 과정에서 사용되는 추출 모델은 거대한 프론티어 모델이 아닌 가볍고 저렴한 **`glm-4-flash`**다.
4. **Validate (검증):** 추출된 증거 스팬이 원천 문서에 문자 그대로(exact string) 존재하는지 기계적으로 대조 검증한다. 엔티티 타입은 온톨로지와 대조하고, 날짜는 문서 본문과 대조한다. 
   **여기서 가장 엄격한 규칙은 유효하지 않은 추출 단위는 즉시 폐기(drop)하며, 언어모델을 다시 호출해 수리를 시도하지 않는다**는 점이다 [^3]. 모델에게 수리를 맡기는 순간 또 다른 환각이 끼어들기 때문이다.
5. **Assemble (조립):** 검증을 통과한 클레임들을 임베딩 기반으로 계층적 캐리어 트리에 클러스터링하거나, 엔티티를 지식 그래프로 해소(resolve)하고, 사건들을 타임라인 순서로 엮어낸다.
6. **Register (등록):** 완성된 각 아티팩트를 원천 문서의 버전 해시, 정확한 문자 오프셋, 추출 모델 버전, 검증 상태, 접근 제어 라벨(ACL)과 함께 불변 저장소에 등록한다. 이 메타데이터가 완비되어야만 감사, 역추적 인용, 부분 업데이트가 가능해진다.

### 3.2 "모델이 제안하고, 원천이 처분한다": 소형 추출 모델의 역설

[해설] 지식 컴파일 파이프라인의 경제성을 지탱하는 가장 우아한 통찰은 추출 단계에서 최고 성능의 비싼 모델(GPT-4o 등)을 쓸 필요가 전혀 없다는 점이다. RAGFlow는 매우 저렴한 `glm-4-flash`를 추출기로 채택했다. 

어떻게 소형 모델로 금융·법률 수준의 정밀한 지식 인프라를 구축할 수 있는가? 그 해답은 바로 **4단계 검증(Validate) 모듈과의 역할 분담**에 있다:
$$\text{"The model may propose, but the source disposes." (모델이 제안할 수는 있으나, 처분은 원천이 내린다.) [p. 5]}$$

언어모델은 단지 원천 텍스트에서 클레임과 증거 후보를 탐색하여 던져주는 경량 탐색기 역할만 수행한다. 그 후보가 참인지, 실제로 원문에 축자적으로 존재하는 문장인지는 정규화된 문자열 대조 알고리즘이 1바이트의 오차도 없이 냉정하게 검증한다. 원문에 정확히 일치하는 스팬이 발견되지 않으면 그 클레임은 가차 없이 쓰레기통으로 버려진다. 모델 크기가 아니라 결정론적 검증 파이프라인이 전체 지식 인프라의 무결성을 수호하는 것이다.

### 3.3 Listing 1: Tree 템플릿의 실제 구현 명세

아래 코드는 FRAMES 벤치마크 실험에 전면 적용된 RAGFlow의 실제 Tree 템플릿 설정 명세(Listing 1)다. 파서와 청커는 비컴파일 베이스라인이 보는 기본값을 그대로 사용하며, 오직 추출, 검증, 조립만이 컴파일 계층에서 추가된다:

```yaml
# Listing 1: FRAMES 실험에 사용된 Tree 템플릿 설정 명세
template: tree
parser: default
chunker: default
extract:
  unit: claim_evidence
  model: glm-4-flash
  require_verbatim_span: true
validate: span_match
tree:
  leaves: evidence_units
  internal_nodes: embedding_clusters
  summary_nodes: false
serve:
  default: evidence_substitution
  fallback: raw_chunk
  gate: qwen-decision-model-preview
```

이 명세에서 주목해야 할 핵심 설정은 네 가지다:
1. `require_verbatim_span: true`: 증거 문장은 반드시 원본 텍스트에서 1글자도 틀리지 않고 복사되어야 한다.
2. `validate: span_match`: 축자 일치 검증을 통과하지 못한 클레임은 등록이 원천 차단된다.
3. `summary_nodes: false`: 내부 트리에 모호한 추상적 요약 노드를 일절 만들지 않는다. 트리의 내부 노드는 단지 어휘 임베딩 클러스터링 라벨일 뿐이며, 유일한 지식 페이로드는 잎사귀(leaves)에 매달린 클레임-증거 쌍이다.
4. `gate: qwen-decision-model-preview`: 질의 실행 시점에 증거가 충분한지 판정하는 전용 경량 결정 모델로 Qwen Decision Model을 지정한다.

### 3.4 아티팩트 분류 체계와 평가의 이중 원장 (Table 1)

시스템에 구현된 7가지 아티팩트 패밀리는 수집 시점에 추가되는 맥락의 성격, 런타임 질의 활용 방식, 그리고 벤치마크와 실제 배포 운영에서 각각 평가받는 기준이 완전히 다르다 [p. 4, Table 1].

| 컴파일 아티팩트 (Artifact) | 수집 시 추가되는 맥락 (Added at Ingestion) | 런타임 질의 활용 (Query-time Use) | FRAMES 벤치마크 결과 (FRAMES Result) | 실제 배포 운영 가치 (Deployment Value) |
| :--- | :--- | :--- | :--- | :--- |
| **네비게이션 트리 (클레임-증거 잎사귀)** | 원자적 클레임 및 축자적 원문 스팬을 잎사귀로 탑재; 상위에 클러스터 라벨 배치 | 잎사귀 선제 프리페치; 증거 치환; 심층 드릴다운 | 정확도 동등(Neutral); 질의 토큰 평균 −38% 절감 | 극적인 토큰 비용 절감; 감사 추적성 보장; 코퍼스 체계적 구조화 |
| **네비게이션 트리, RAPTOR식 요약 노드 (클레임 제거)** | 재귀적 요약 노드 구축; 클레임-증거 잎사귀는 의도적 제거 | 코퍼스 정향성 파악; 거친 수준에서 세부 수준으로 브라우징 | 정확도 동등(Neutral) | 코퍼스 전체 개요 파악; 점진적 유지보수; 순수 조직화 가치 (증거 가치 없음) |
| **네비게이션 트리, PageIndex식 목차 아웃라인 (클레임 제거)** | 문서 제목 및 섹션 계층 구조; 클레임-증거 잎사귀는 의도적 제거 | 특정 문서 또는 단락으로 질의 라우팅; 드릴다운 | 정확도 동등 내지 부정적 (Neutral to Negative) | 인간을 위한 문서 탐색; 단일 문서 질의응답; 순수 조직화 가치 (증거 가치 없음) |
| **엔티티-관계 그래프 (Knowledge Graph)** | 엔티티, 동의어(별칭), 상호 관계 추출 (커뮤니티 보고서는 제외) | 청크 PageRank 스코어링; 연관 청크의 클레임-증거 우선 반환 | 정확도 동등(Neutral) | 연관 원천 소스 발견; 규제 준수(Compliance) 검증 |
| **온톨로지 (Ontology)** | 클래스, 속성, 제약 조건, 원천 어휘 간 매핑 규칙 | 타입 기반 검색; 관계 인식 질의 확장; 유효하지 않은 관계 답변 검증 | 벤치마크 미계측 (Not measured) | 도메인 어휘 제어; 이종 소스 데이터 통합; 타입별 접근 제어 거버넌스 |
| **LLM 위키 (Synthesized Wiki)** | 코퍼스 전체를 합성하고 상호 링크된 종합 기사망 | 배경 지식 사전 독해; 종합적 요약 제공 | 정확도 동등(Neutral) | 신규 사용자 온보딩; 도메인 지식 문서화 |
| **타임라인 (Timeline)** | 사건(Events)과 발생 날짜를 시계열 맥락으로 정렬 | 시간적 정향성 파악 (Chronology) | 벤치마크 미계측 (Not measured) | 감사 추적선(Audit trails); 브리핑; 시간 기반 탐색 |
| **마인드맵 (Mind-map)** | 문서 내 엔티티들을 네비게이션 그래프 형태로 레이아웃 | 개념적 정향성 파악; 직관적 브라우징 | 벤치마크 미계측 (Not measured) | 고속 개념 브리핑; 시각적 탐색 지원 |
| **세션 메모리 (Session Memory)** | 세션 로그로부터 영속적 사실(선호, 결정, 약속) 추출 | 개인화 및 세션 간 연속 기억 회상 | 벤치마크 미계측 (Not measured) | 에이전트 상호작용 연속성; 지속 고객 지원 |

여기서 2행과 3행(클레임 잎사귀가 제거된 순수 캐리어 트리)에 대해서는 엄중한 경고가 필요하다. 이 두 아티팩트는 **증거 페이로드가 실려 있지 않은 빈 껍데기 운반체(carriers without payload)**에 불과하다. 관리자가 코퍼스의 변경 범위를 한눈에 조망하거나 사람이 문서를 브라우징하는 데는 도움이 될지언정, 검색 루프 자체에는 단 1바이트의 새로운 증거도 제공하지 못하므로 벤치마크 정확도 향상을 기대하고 도입해서는 결코 안 된다.

---

## 4. 실측 메커니즘: 클레임-증거 쌍과 3가지 서빙 모드

### 4.1 기본 단위: 클레임-증거 4중 튜플

지식 컴파일이 어떤 새로운 사실을 임의로 창작할 수 없다면, 결코 원문을 자기 멋대로 패러프레이징(paraphrase)해서는 안 된다. 시스템이 컴파일하는 가장 근본적인 최소 지식 단위는 다음과 같은 4중 튜플로 정의되는 **클레임-증거 쌍(Claim–Evidence Pair)**이다 [p. 3, Eq. 2]:

$$u = \langle c, e, s, \tau \rangle$$

- $c$ (Claim): 문맥에서 분리되어 단독으로 이해 가능한 원자적으로 정규화된 주장(Normalized Claim)
- $e$ (Evidence): 해당 주장 $c$를 뒷받침하는, 원천 텍스트에서 그대로 복사해 온 **축자적 증거 스팬(Verbatim Evidence Span)**
- $s$ (Source): 원천 청크 식별자 및 원문 내 정확한 문자 단위 시작/끝 오프셋(Offsets)
- $\tau$ (Validity Metadata): 문서 작성 일자, 버전 정보, 유효 기간 등 증거의 효력을 규정하는 메타데이터

이 구조는 산문(prose)으로서는 거친 요약보다 많은 정보가 생략된 '손실 압축(lossy in prose)'이지만, 출처와 계통(provenance)에 있어서는 원본 텍스트의 오프셋을 100% 보존하는 **'무손실 압축(lossless in provenance)'**이다. 

수백 토큰에 달하는 원본 청크에서 불필요한 미사여구와 배경 설명을 걷어내고 이 핵심 튜플들만 추출하면 전체 텍스트 부피는 극적으로 줄어들며, 이것이 후술할 거대한 토큰 절감의 원천이 된다.

### 4.2 3가지 서빙 모드 (E1, E2, E3)

컴파일된 지식 아티팩트를 런타임 하네스가 어떻게 소비하는가에 따라 RAGFlow는 세 가지 서빙 모드를 지원한다 [p. 5, §4.3]:

#### E1: 증거 우선 검색 (Evidence-First Retrieval)
하네스가 원본 텍스트 청크를 거치지 않고, 컴파일된 클레임 텍스트 인덱스를 직접 어휘 검색(BM25)하여 곧바로 증거 단위 $u$들을 후보로 획득하는 모드다.
실험 결과, E1 모드는 "먼저 문서를 검색한 후 그 문서의 트리를 타고 내려가는 방식(Document-then-tree)"보다 나았다(방향성 ablation; 점 추정치는 보고하지 않음). 문서를 찾는 단계는 대개 성공하지만, 정작 복잡한 문서 내부 트리에서 올바른 단락을 찾아 내려가는 단계는 신뢰성이 낮았고 불필요한 턴만 소모했기 때문이다. 트리는 정리를 위한 캐리어일 뿐, 검색 자체는 평평한 어휘 검색이 가장 빠르고 정확하다.

재현에 채택된 회수 설정은 앵커 깊이 $\mathrm{topN}=20$, 클레임 검색 $k=100$, 청크 앵커 레그와 클레임 텍스트 레그의 **합집합**이며, 개수 기반 페이지 절단은 쓰지 않는다 [p. 10 §8.4].

#### E2: 증거 치환 (Evidence Substitution — RAGFlow 기본 모드)
하네스는 비컴파일 시스템과 완전히 동일하게 평소대로 원문 텍스트 청크를 검색한다. 그러나 검색 엔진이 특정 청크를 발견하여 컨텍스트 창에 밀어 넣으려는 찰나, 프로젝터(projector)가 가로채어 **해당 청크를 그 청크에서 사전에 추출해 둔 클레임-증거 쌍들로 교체(치환)하여 컨텍스트 창에 주입**한다.
이 방식은 이미 검증된 강력한 원문 검색 동작을 100% 보존하면서 오직 언어모델이 읽어야 하는 텍스트 부피(독해 비용)만을 획기적으로 압축한다. RAGFlow의 기본 서빙 모드다.

#### E3: 결정 게이트 독해 (Decision-Gated Reading)
경량 결정 모델(Decision Model)이 검색된 청크와 사용자 질문을 신속히 비교하여, 원본 청크를 깊이 있게 끝까지 읽는 심층 독해(Deep Read)가 정말로 필요한지 판정하는 모드다.
이 결정 모델은 문서의 순위를 매기는 리랭커(reranker)가 아니며, 후보의 순서를 바꾸지 않고 오직 **'독해 깊이(Reading Depth)'**만을 온/오프(on/off)로 통제한다. 증거 컴파일 아티팩트가 읽는 '내용의 양'을 줄여준다면, 결정 게이트는 심층 독해가 일어나는 '빈도' 자체를 줄여준다.

### 4.3 판정 모델의 성능 격차: Qwen vs StartLux

결정 게이트를 담당할 전용 경량 모델로 연구진은 알리바바의 Qwen Decision Model(`qwen-decision-model-preview`)[24]과 StartLux Decision Model[26]을 실측 비교했다 [p. 8, §7]:

| 결정 모델 후보 | 실패 그룹 수 (Failed Groups) | 총 소요 시간 (Latency) | 신뢰성 평가 |
| :--- | :---: | :---: | :--- |
| **Qwen Decision Model** | **0건 (실패 그룹 없음)** | **30.5초 (총합)** | 채택 (기본값) — 더 안정적이고 빠름 |
| **StartLux Decision Model** | 18건 실패 | 560.1초 | 탈락 — 극심한 지연 및 불안정성 |

실측 결과, Qwen 결정 모델은 단 한 번의 판정 실패도 없이 30.5초 만에 모든 평가를 안정적으로 완료하여 기본 판정 엔진으로 공식 채택되었다.

---

## 5. 치환의 토큰 경제학과 지연 시간의 트레이드오프

증거 치환(E2)은 RAGFlow의 전체 비용 구조를 혁신하는 핵심 엔진이다. 이 메커니즘의 경제성은 엄밀한 수식으로 증명된다.

### 5.1 손익분기 충분율 유도 ($p_h^* \approx 2.0\%$)

컴파일되지 않은 순수 하네스가 질문 하나를 처리하는 데 소모하는 토큰 비용을 $T_0$라 하자. 그리고 게이트가 투영된 증거만으로 충분하다고 수락하는 비율(Sufficiency Acceptance Rate)을 $p_h$라 하자.

FRAMES 벤치마크 실측에서 관측된 두 가지 조건부 토큰 비용 변화율은 다음과 같다 [p. 5, Eq. 3]:

$$\Delta_{\mathrm{hit}} = -0.91 \quad (-91\% \text{ 절감}), \qquad \Delta_{\mathrm{miss}} = +0.019 \quad (+1.9\% \text{ 페널티})$$

- **적중 시 ($\Delta_{\mathrm{hit}} = -91\%$):** 게이트가 투영된 증거를 충분하다고 판정하면, 전체 청크 대신 클레임-증거 문장 몇 줄만 읽게 되어 질문당 전체 토큰 소모량이 91% 감소한다(정확도는 베이스라인 대비 신뢰할 만한 변화가 없음).
- **미적중 시 ($\Delta_{\mathrm{miss}} = +1.9\%$):** 증거 문장을 먼저 확인했으나 불충분하다고 판단되어 원본 청크를 다시 읽어 들이므로, 증거를 한 번 조회하는 데 든 약 $1.9\%$의 경미한 오버헤드 토큰만 추가된다.

따라서 임의의 질문에 대한 기대 토큰 변화율 $\mathbb{E}[\Delta]$는 다음과 같다 [Eq. 4]:

$$\mathbb{E}[\Delta] = p_h(-0.91) + (1 - p_h)(0.019) = 0.019 - 0.929p_h$$

컴파일 도입이 토큰 측면에서 순이익을 내기 위한 조건($\mathbb{E}[\Delta] < 0$)을 풀면, **최소 손익분기 충분율(Break-even sufficiency rate) $p_h^*$**가 유도된다 [Eq. 5]:

$$p_h > p_h^* = \frac{0.019}{0.91 + 0.019} = \frac{0.019}{0.929} \approx 2.04\% \approx 2.0\%$$

이 수치는 대단히 충격적인 경제적 결론을 내포한다. **질문 100개 중 단 2개(2%)에서만 증거 치환이 성공하더라도, 나머지 98개 질문에서 발생하는 미적중 페널티를 전부 상쇄하고 전체 시스템 토큰 비용이 절감되기 시작한다**는 뜻이다.

그리고 실제 FRAMES 멀티홉 벤치마크에서 측정된 평균 토큰 절감률은 **$-38\%$**였다. 이를 역산하면 실제 동작 환경에서의 유효 충분율 $\hat{p}_h$는 약 **43%**에 달한다 [Eq. 6]:

$$\hat{p}_h = \frac{0.38 + 0.019}{0.929} \approx 42.95\% \approx 43\%$$

여러 문서를 넘나들어야 하는 고난도 멀티홉 질의 환경에서도 약 43%의 적중률이 함의되며, 이는 2% 손익분기율을 크게 웃도는 토큰 마진에 해당한다.

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 420" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fbbf24"/></marker></defs><rect width="420" height="420" fill="#0b1120" rx="14"/><text x="210" y="34" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">치환의 토큰·지연 효과</text><text x="210" y="64" fill="#94a3b8" font-size="17px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">질의 토큰 변화 (%)</text><line x1="210" y1="78" x2="210" y2="230" stroke="#64748b" stroke-width="2"/><rect x="37.099999999999994" y="88" width="172.9" height="30" rx="4" fill="#34d399"/><text x="218" y="109" fill="#f8fafc" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">적중 -91%</text><rect x="210" y="136" width="4" height="30" rx="4" fill="#f87171"/><text x="222" y="157" fill="#f8fafc" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">미적중 +1.9%</text><rect x="137.8" y="184" width="72.2" height="30" rx="4" fill="#38bdf8"/><text x="218" y="205" fill="#f8fafc" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">FRAMES 평균 -38%</text><text x="210" y="270" fill="#94a3b8" font-size="17px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">지연 시간 (초)</text><text x="30" y="300" fill="#e2e8f0" font-size="16px" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">게이트 미적용</text><rect x="30" y="308" width="336.0" height="28" rx="4" fill="#f87171"/><text x="374.0" y="328" fill="#f8fafc" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">140초</text><text x="30" y="362" fill="#e2e8f0" font-size="16px" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">결정 게이트(Qwen)</text><rect x="30" y="370" width="72.0" height="28" rx="4" fill="#34d399"/><text x="110.0" y="390" fill="#f8fafc" font-size="16px" font-weight="bold" text-anchor="start" font-family="system-ui, -apple-system, sans-serif">30초</text></svg>
</div>

### 5.2 민감도 분석: 왜 미적중 페널티 측정이 핵심인가?

손익분기점 공식 $p_h^* = \frac{\Delta_{\mathrm{miss}}}{|\Delta_{\mathrm{hit}}| + \Delta_{\mathrm{miss}}}$을 면밀히 분석하면 매우 중대한 운영적 함의가 드러난다 [^4].

손익분기율 $p_h^*$의 변동성은 적중 시 절감량($\Delta_{\mathrm{hit}}$)보다 **미적중 시의 페널티($\Delta_{\mathrm{miss}}$)의 불확실성에 훨씬 더 민감하다.** 그 이유는 페널티의 절대 수치가 0.019로 매우 작은 숫자이기 때문이다:

- 만약 적중 절감량에 $\pm 1.5\%$의 오차가 생겨 $89.5\% \sim 92.5\%$로 흔들리더라도, 손익분기율 $p_h^*$는 $2.0\% \sim 2.1\%$ 사이에서 거의 미동도 하지 않는다.
- 반면 미적중 페널티에 동일한 $\pm 1.5\%$ 포인트의 오차가 발생하여 $0.4\% \sim 3.4\%$로 변동하면, $p_h^*$는 **$0.4\%$에서 $3.6\%$까지 무려 9배나 출렁인다.**

[해설] 이 민감도 분석은 실무 배포를 준비하는 엔지니어링 팀에게 결정적인 나침반을 제공한다. 현업 팀이 집중적으로 계측하고 통제해야 할 대상은 "증거 치환이 성공했을 때 토큰을 얼마나 많이 깎아주는가"가 아니다. 그 절감폭은 이미 충분히 거대하다. 엔지니어가 사활을 걸고 모니터링해야 하는 지표는 **"증거 프로젝션이 실패하여 원본 청크로 폴백될 때 발생하는 오버헤드와 실패 빈도"**다. 미적중 시 발생하는 지연과 오버헤드를 얼마나 극소화하느냐가 시스템의 경제적 수명을 결정한다.

### 5.3 상각 규칙과 유한 지평선의 함정 (The No-Compile Boundary)

코퍼스 전체를 사전에 컴파일하는 데 들어간 총비용을 질의 등가 비용 단위로 $C = c T_0$라 하자 ($c$는 단일 질의 비용의 몇 배인가를 나타내는 계수).
총 $N$개의 질의가 유입될 때 순수하게 절감되는 토큰량은 $N \mathbb{E}[\Delta] T_0 - c T_0$이며, 컴파일 투자 비용을 완전히 회수하는 **손익분기 질의 수 $N^*$**는 다음과 같다 [Eq. 7]:

$$N^* = \frac{c}{0.929p_h - 0.019}$$

FRAMES 실측치인 $p_h \approx 0.43$을 대입하면 분모는 약 $0.38$이 되므로, $N^* \approx 2.6c$라는 매우 단순하고 아름다운 상각 규칙이 도출된다. 
예컨대 어떤 문서 코퍼스를 컴파일하는 데 단일 검색 질의 10회 분량의 토큰($c = 10$)이 소모되었다면, **이 코퍼스에 단 26개의 질문($N^* \approx 26$)만 유입되면 컴파일 비용이 전액 회수된다.** 이것이 바로 앞서 살펴본 초경량 추출 모델(`glm-4-flash`)을 써서 초기 컴파일 계수 $c$를 한 자릿수 낮춰야 하는 이유다. $c$가 작아질수록 투자 회수 시점은 번개처럼 앞당겨진다.

#### 유한 질의 지평선 공식 (Eq. 9)
하지만 점근적(asymptotic) 2% 손익분기율 공식은 무한한 질의가 쏟아지는 환경을 가정한 것이다. 이를 잘못 해석하여 "모든 코퍼스를 무조건 컴파일하는 것이 이득"이라고 단정해서는 안 된다. 
질의 수가 총 $Q$개로 제한된 유한한 배포 환경에서 순수 이익 $B(Q, c, p_h)$은 다음과 같다 [Eq. 8]:

$$B(Q, c, p_h) = Q(0.929p_h - 0.019) - c$$

따라서 유한한 환경에서 컴파일이 손해를 보지 않기 위한 **최소 요구 충분율 $p_h^{\min}(Q, c)$**은 엄격히 상승한다 [Eq. 9]:

$$p_h > p_h^{\min}(Q, c) = \frac{0.019Q + c}{0.929Q} = 2.0\% + \frac{c}{0.929Q}$$

우변의 두 번째 항 $\frac{c}{0.929Q}$이 현실의 모든 엔지니어링 의사결정을 좌우한다.
만약 파일럿 테스트 환경에서 총 질의 수가 $Q = 1,000$개이고 컴파일 비용이 $c = 10$ 질의 등가라면, 시스템이 요구하는 최소 충분율은 $2.0\%$가 아니라 **$3.12\%$**로 껑충 뛴다. 만약 이 환경에서 측정된 충분율이 $p_h = 2.5\%$라면, 점근 공식(2%)만 믿고 컴파일을 진행할 경우 실제로는 $5.8$ 질의 등가의 토큰 적자를 보게 된다. 질의 트래픽이 적은 소규모 코퍼스에서는 컴파일하지 않고 원시 검색 하네스를 돌리는 것이 훨씬 경제적이다.

### 5.4 치환의 본질적 비용: 토큰과 턴 수(지연 시간)의 교환

증거 치환에 의한 토큰 절감은 공짜가 아니다. 치환 메커니즘은 필연적으로 **'토큰'을 '검색 턴 수(Rounds)' 및 '지연 시간(Latency)'과 맞바꾸는 트레이드오프**를 발생시킨다 [p. 10, §8.4] [^5].

단일 청크 전체를 읽는 베이스라인은 한 번에 풍부한 주변 맥락을 흡수하므로 적은 턴 수로 정답에 도달한다. 반면 증거 치환을 적용하면 에이전트가 읽는 증거 페이지는 극도로 얇아진다. 페이지가 작고 날카로워질수록 필연적으로 정보의 파편화가 발생하여, 에이전트는 결론을 확정 짓지 못하고 추가적인 검색 턴을 계속해서 호출하게 된다.

실제로 결정 게이트 없이 증거 치환만 단독 적용했을 때, 질의 토큰 소모량은 절반 가까이 줄어들었지만 **엔드투엔드 지연 시간은 약 3배(140초)까지 폭증**했다. 이 지연 시간 폭증은 게이트의 대기 시간 때문이 아니라, 순수하게 에이전트가 추가적인 검색 루프 턴을 돌면서 발생한 지연이다.

### 5.5 결정 게이트의 구원과 Table 4 종합 데이터 분석

이 지연 시간 폭증을 완화하는 장치가 바로 **결정 게이트(Decision Gate)**다. 클레임-잎 트리가 있는 조건에서 Qwen 기반 결정 게이트를 켜면, 원문이 보고한 대로 **평균 엔드투엔드 지연이 140초에서 30초로** 줄었다.

아래 Table 4는 FRAMES 벤치마크에서 Tree 템플릿과 `glm-4-flash` 추출기를 사용해 측정한 핵심 실험 결과다. Table 4의 토큰·정확도 수치는 **$N=200$** 질문에 대한 측정이며, 지연 비교(치환의 라운드 대가)는 양쪽 arm이 모두 답한 **7문항** 부분집합에 기초한다 [p. 9 §8.1, p. 10 Table 4]:

| 실험 조건 (Condition) | $\Delta$ 토큰 변화율 | 평균 소요 토큰 | 엔드투엔드 지연 시간 | 베이스라인 대비 정답 정확도 |
| :--- | :---: | :---: | :---: | :---: |
| **비컴파일 베이스라인 (BM25 / grep)** | **0% (기준)** | **324,479** | **46.7초** | **91.0% (기준 정확도)** |
| **증거 충분 조건 (Hit, 조건부 분할)** | **−91%** | – | – | 신뢰할 만한 변화 없음 (동등) |
| **증거 불충분 조건 (Miss, 조건부 분할)** | **+1.9%** | – | – | 신뢰할 만한 변화 없음 (동등) |
| **FRAMES 전체 평균 (Average)** | **−38%** | – | – | 신뢰할 만한 정확도 차이 없음 |
| **결정 게이트 적용, 증거 포함 (Arm Mean)** | **−52%** | **155,305** | **140초 $\to$ 30초** | 신뢰할 만한 변화 없음 (동등) |
| **결정 게이트 적용, 증거 미포함 (Arm Mean)** | **−30%** | – | – | 신뢰할 만한 변화 없음 (동등) |
| **BrowseComp-Plus (하네스 단독 스케일 체크)** | – | $\sim 3.0 \times 10^6$ | – | 85.0% |

*(주: 1~3행은 게이트 판정에 따른 조건부 분할이며, 4행은 벤치마크 전체 평균이다. 5~6행은 각 실험 분지(Arm)의 평균값으로 질의 구성이 다르므로 −52%는 −91% 적중 수치나 −38% 평균과 직접 수치적으로 대등 비교할 수 없다. BrowseComp-Plus는 컴파일 검증용이 아닌 하네스의 스케일 포화 점검용 데이터다.)*

결정 게이트는 증거가 없을 때도 불필요한 심층 독해를 건너뜀으로써 약 30%의 토큰을 절감한다. 증거가 있는 arm 평균에서는 비컴파일 베이스라인 대비 토큰 **−52%**(평균 155,305)와 함께 게이트 조건 지연 **30초**가 보고된다. 여기의 30초는 Table 4의 게이트·증거 arm이며, 비컴파일 베이스라인의 46.7초와는 조건이 다르므로 단순 ‘더 빠르다’로 읽지 않는 편이 안전하다.

---

## 6. 구조적 컴파일의 한계와 배포 원장 (Deployment Ledger)

지식 컴파일 연구에서 흔히 저지르는 가장 큰 착각 중 하나는 "문서를 요약 트리나 지식 그래프 같은 화려한 구조로 엮어내면 검색 정확도가 비약적으로 향상될 것"이라는 낭만적 믿음이다. 그러나 RAGFlow 연구진의 엄밀한 실증 감사는 이 믿음을 완전히 박살 낸다.

### 6.1 구조적 컴파일의 냉혹한 진실: Table 3 정확도 감사

연구진은 동일한 검색 하네스 조건 아래에서 잎사귀 증거를 제거한 순수 구조적 아티팩트들의 성능을 FRAMES 벤치마크에서 전수 감사했다 [p. 10, Table 3]:

| 구조적 아티팩트 변형 | 베이스라인 대비 정확도 | 관측된 고유 실패 모드 (Failure Mode) | 비교를 통해 분리 입증된 본질 |
| :--- | :---: | :--- | :--- |
| **네비게이션 트리, RAPTOR식 요약 노드 (클레임 제거)** | **중립 (Neutral)** | 에이전트가 요약문을 보고 방향만 잡은 뒤 결국 grep을 다시 수행함; 요약문은 새로운 사실을 전혀 더해주지 못하고 불필요한 턴만 낭비함 | 클레임-증거 잎사귀가 결여된 추상적 요약 클러스터의 무가치성 |
| **네비게이션 트리, PageIndex식 목차 아웃라인 (클레임 제거)** | **소규모 중립 $\to$ 대규모 부정적 (Negative)** | 추출된 계층 구조가 불완전하거나 어긋남; 한 번 잘못된 브랜치로 분기하면 열린 검색보다 훨씬 큰 대가를 치름; 확신에 찬 잘못된 라우팅이 소수 문서로 쿼리를 왜곡 집중시킴 | 클레임 잎사귀 없는 정적 목차 아웃라인의 스케일 취약성 [^6] |
| **LLM 위키 (Synthesized Wiki)** | **중립 (Neutral)** | 유려한 종합 산문이지만 정확한 원문 축자성(exact wording)과 출처 계통이 손실됨; 코퍼스 변경 시 재구축 비용이 극심함 | 텍스트 스팬이 제거된 산문 컴파일의 실익 부재 |
| **엔티티-관계 그래프 (Knowledge Graph)** | **중립 (Neutral)** | FRAMES는 이미 엔티티 연계 증거를 제공하므로, 대부분의 질의가 복잡한 그래프 조인을 요구하지 않음 | 단일 소스 중심 질의 환경에서 교차 소스 관계망의 정확도 기여 한계 |
| **클레임-증거 탑재 트리 (RAGFlow 계측 메커니즘)** | **정확도 중립; 토큰 −38% 절감** | 증거 프로젝션이 원문 스팬을 완벽히 보존하며 읽기 비용을 대폭 축소함; 미적중 오버헤드는 1.9%에 불과함 | 동일한 캐리어 트리에 '클레임-증거 쌍'을 장착했을 때의 토큰 절감 효과 |

### 6.2 구조는 증거가 아니다: 캐리어와 페이로드의 분리

이 감사 결과는 매우 중대한 사실을 웅변한다. **구조(Structure)는 증거가 아니다.** 요약 트리나 목차 아웃라인은 원본 내용을 다른 말로 재기술(re-describe)했을 뿐, 단 하나의 새로운 팩트도 추가하지 못한다.

특히 PageIndex 스타일의 계층적 목차 라우팅이 대규모 환경에서 심각한 역효과(negative asset)를 낸 메커니즘은 수학적으로 설명된다:
각 라우팅 단계의 결정 정확도가 95%로 매우 정밀해 보일지라도, 브랜칭 팩터가 8인 트리에서 문서 수가 $10^5$개로 늘어나면 계층을 타고 내려가는 엔드투엔드 라우팅 누적 성공률은 약 **75%** 수준으로 폭락한다 [^6]. 그리고 에이전트가 잘못된 브랜치에 '확신을 갖고' 진입하는 순간, 차라리 아무런 편향 없이 전체 문서를 키워드로 훑는 열린 검색(open search)보다 훨씬 치명적인 오답의 수렁에 빠지게 된다.

트리는 검색 엔진이 아니라 증거를 담아두는 **'운반체(Carrier)'**일 뿐이며, 진짜 가치는 잎사귀에 실린 **'증거 페이로드(Payload)'**에서 나온다. 잎사귀의 클레임-증거를 제거한 순수 트리는 단지 정리 도구에 불과하다.

### 6.3 배포 원장 (Table 2)의 실증적 엄격성: "측정된 효과 없음"의 의미

그렇다면 엔티티 그래프, 온톨로지, 타임라인, 세션 메모리 같은 다채로운 아티팩트들은 무용지물인가? 결코 그렇지 않다. 이 아티팩트들의 가치는 고정된 질의-응답 벤치마크 점수표 위에서는 결코 포착되지 않으며, 엔터프라이즈 프로덕션 운영 환경의 **'배포 원장(Deployment Ledger)'** 위에서 평가되어야 한다 [p. 8, Table 2].

| 컴파일 아티팩트 | 1차 목표 결과 (Primary Outcome) | 핵심 계측 지표 (Numerator / Denominator) | 계측 및 관측 장소 | 프로덕션 출시 결정 규칙 (Decision Rule) |
| :--- | :--- | :--- | :--- | :--- |
| **네비게이션 트리 (클레임 잎사귀)** | 더 저렴한 정답 생성 | 정답당 토큰 소모량; 1천 질의당 수락된 정답 수 | 스테이션별 태깅된 하네스 토큰 원장; 판정기 판결 | 비열등한 정확도 하에서 토큰 감소 시 출시 |
| **엔티티-관계 그래프** | 연관 원천 소스 발견 | 2개 이상 조인된 소스로 답변된 관계형 질문 / 전체 관계형 질문; 관계형 정답당 토큰 | 정선된 관계형 평가셋; PageRank 추적 로그; 토큰 원장 | 감사성 손실 없이 조인 성공률 상승 및 토큰 감소 시 출시 |
| **온톨로지 (Ontology)** | 어휘 표준화 및 제어 | 표준 정규 클래스로 매핑된 엔티티 / 전체 추출 엔티티 수; 미해소 타입 발생률 | 컴파일러 감사 로그; 온톨로지 검증기 | 매핑 목표 달성 및 유효하지 않은 관계 감소 시 출시 |
| **LLM 위키** | 온보딩 및 지식 종합 | 신규 사용자가 10개 도메인 질문에 답하는 데 걸린 시간; 인용 추적 클릭률 | 사용자 과업 연구; 원천 스팬 클릭스루 로그 | 소요 시간 단축 및 인용 추적성 100% 유지 시에만 출시 |
| **타임라인 (Timeline)** | 시간적 정향성 확보 | 사건 발생 순서 재구성 소요 시간; 시간 질의당 구버전 참조 오류율 | 타임라인 검증기; 질의 실행 로그 | 순서 정렬 정확도 상승 및 구버전 참조 오류 감소 시 출시 |
| **세션 메모리** | 지속성 및 연속성 | 반복 질문 발생률; 사실 정정 요청률; 과거 결정 복원 소요 시간 | 세션 상호작용 로그; 사용자 정정 이벤트 | 반복 질문 및 사용자 정정 발생률 감소 시 출시 |
| **모든 아티팩트 공통** | **감사 가능성 (Auditability)** | **해소 가능한 스팬 및 최신 버전을 가진 전달 클레임 / 전체 전달 클레임** | **인용 바인더; 버전 레지스터** | **반드시 100% 달성 필수; 미달 시 전달 전면 차단** |

**본 작성 시점 기준의 상태 보고:** 
연구진은 학술적 정직성을 지키기 위해 다음과 같은 엄정한 선언을 명시했다:
```
"Status at writing. No row of this ledger has yet met its pre-registered target
in an instrumented deployment, so every row is reported as 'no measured effect'
and none is promoted to a general claim..." [p. 8]
```
현재 계측된 프로덕션 섀도우 배포 환경에서 사전 등록된 목표(pre-registered target)를 공식적으로 완전히 달성한 데이터셋 관측치가 아직 없기 때문에, 배포 원장은 위 표의 모든 아티팩트 결과를 단 하나의 과장도 없이 **"측정된 효과 없음(No measured effect)"**으로 공식 기재했다. 오직 감사 가능성(Auditability) 지표만이 납품 게이트에 의해 100% 강제되는 시스템 불변량으로 작동하고 있다. 

[해설] 이는 AI 학계와 산업계에서 매우 보기 드문 고결한 엔지니어링 윤리를 보여준다. 통제되지 않은 환경에서의 정성적인 호평이나 모호한 내부 벤치마크를 근거로 "그래프를 도입했더니 정확도가 20% 올랐다"는 식의 입증되지 않은 주장을 철저히 배격하고, 사전 등록된 엄격한 A/B 섀도우 테스트 기준을 통과하기 전까지는 공식적인 효과를 0으로 기록하는 과학적 엄밀성을 견지하고 있다.

---

## 7. 루프를 통제하는 규율: 검색 하네스의 5개 스테이션과 6대 불변량

### 7.1 "과정은 정답이 아니다"

에이전틱 루프의 치명적 고질병은 두 가지 극단적 형태로 발현된다. 첫 번째는 너무 일찍 멈추어 처음 눈에 띈 그럴듯한 단락 하나만 보고 섣부른 오답을 내는 조기 종료(premature stop)다. 두 번째는 훨씬 더 치명적인 것으로, 예산이 바닥날 때까지 결코 멈추지 않고 루프를 무한히 공회전시키는 영구 루프(infinite loop)다.

후자의 실패는 막대한 비용을 초래한다. 규율이 없는 에이전트는 검색어를 조금씩 바꿔가며 같은 문서를 다시 뒤적거리고, 개별적으로는 그럴듯하지만 전체적으로는 아무런 쓸모도 없는 문단들을 컨텍스트 창에 끊임없이 퍼 담는다. 연산 과정(process)은 막대한 토큰을 집어삼켰지만, 그 과정은 끝내 하나의 정답(answer)으로 응축되지 못한다.

검색 하네스의 본질은 바로 이 에이전트 루프가 반드시 정답으로 수렴하도록 강제하는 **규율 프레임워크(Discipline Framework)**다. 언어모델이 스스로 결코 지키지 못하는 제약들—예산 통제, 불충분한 블록의 완전 폐기, 인용 번호의 엄격한 부여, 비정상 종료 시의 폴백 보장—을 하네스라는 외부 프레임워크가 물리적 불변량으로 틀어쥐는 것이다.

### 7.2 하네스를 관통하는 질의의 여정: 5개 스테이션

사용자의 질의가 인입되면 하네스는 설계된 5개의 정규 스테이션을 순차적으로 통과시킨다 [p. 7, §6.3]:

<div class="svg-container" style="margin: 2rem 0; width: 100%; text-align: center;">
<svg viewBox="0 0 420 612" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fbbf24"/></marker></defs><rect width="420" height="612" fill="#0b1120" rx="14"/><text x="210" y="34" fill="#f8fafc" font-size="20px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">하네스의 5개 스테이션</text><rect x="30" y="52" width="330" height="58" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><text x="195" y="76" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">1. 역량 점검</text><text x="195" y="99" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">미컴파일 코퍼스엔 구조 도구 숨김</text><line x1="195" y1="110" x2="195" y2="128" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><rect x="30" y="130" width="330" height="58" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><text x="195" y="154" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">2. 증거 프리페치</text><text x="195" y="177" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">생각 전 1회 플랫 리콜</text><line x1="195" y1="188" x2="195" y2="206" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><rect x="30" y="208" width="330" height="58" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><text x="195" y="232" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">3. 증거 게이트</text><text x="195" y="255" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">충분→즉시 답변 / 불충분→폐기</text><line x1="195" y1="266" x2="195" y2="284" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><rect x="30" y="286" width="330" height="58" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><text x="195" y="310" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">4. 도구 루프</text><text x="195" y="333" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">병렬 · 스텝·시간 예산</text><line x1="195" y1="344" x2="195" y2="362" stroke="#fbbf24" stroke-width="3" marker-end="url(#ah)"/><rect x="30" y="364" width="330" height="58" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/><text x="195" y="388" fill="#38bdf8" font-size="17px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">5. 결정론적 마감</text><text x="195" y="411" fill="#e2e8f0" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">확보 증거로 폴백 답변</text><path d="M360,237 H395 V393 H368" fill="none" stroke="#34d399" stroke-width="3" marker-end="url(#ah)"/><text x="388" y="315" fill="#34d399" font-size="16px" font-weight="bold" text-anchor="end" font-family="system-ui, -apple-system, sans-serif">충분</text><text x="210" y="456" fill="#fbbf24" font-size="18px" font-weight="bold" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">6대 불변량</text><rect x="20" y="472" width="184" height="36" rx="8" fill="#422006" stroke="#fbbf24"/><text x="112" y="496" fill="#fde68a" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">(i) 생각 전 증거</text><rect x="216" y="472" width="184" height="36" rx="8" fill="#422006" stroke="#fbbf24"/><text x="308" y="496" fill="#fde68a" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">(ii) 불충분 시 폐기</text><rect x="20" y="516" width="184" height="36" rx="8" fill="#422006" stroke="#fbbf24"/><text x="112" y="540" fill="#fde68a" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">(iii) 도구 게이팅</text><rect x="216" y="516" width="184" height="36" rx="8" fill="#422006" stroke="#fbbf24"/><text x="308" y="540" fill="#fde68a" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">(iv) 예산화된 호출</text><rect x="20" y="560" width="184" height="36" rx="8" fill="#422006" stroke="#fbbf24"/><text x="112" y="584" fill="#fde68a" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">(v) 전달 시 인용</text><rect x="216" y="560" width="184" height="36" rx="8" fill="#422006" stroke="#fbbf24"/><text x="308" y="584" fill="#fde68a" font-size="16px" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">(vi) 마감 보장</text></svg>
</div>

1. **역량 점검 (Capability check):** 모델이 도구 목록을 보기 전, 대상 코퍼스에 컴파일된 아티팩트가 실제로 존재하는지 검사한다. 컴파일되지 않은 코퍼스라면 네비게이션 트리, 그래프 탐색기, PageIndex 목차 도구의 설명조차 모델에게 절대 노출하지 않는다.
2. **증거 프리페치 (Evidence prefetch):** 모델이 검색어를 고민하기 전에, 프레임워크가 전체 코퍼스에 걸쳐 단 1회의 평평한(flat) 증거 조회를 선제 실행한다. 작은 트리를 통해 문서를 라우팅하면 특정 문서로 편향되는 왜곡이 생기므로, 전체 코퍼스 대상의 어휘 검색이나 치환을 활용한다.
3. **증거 게이트 (Evidence gate):** 프리페치된 증거 묶음의 유닛 수, 출처 다양성, 질문 커버리지를 엄밀히 평가한다. 충분하다고 판정되면 단 1회의 모델 호출로 답변을 생성하고 원본 텍스트는 1글자도 읽지 않는다. 만약 불충분하다고 판정되면, **그 증거 블록 전체를 프롬프트에서 깨끗이 폐기**한다.
4. **도구 루프 (Tool loop):** 게이트가 증거를 거절했을 때 비로소 진입한다. 한 턴 내에서 여러 개의 검색 행위가 병렬로 실행되며, 정해진 스텝 수 제한과 월클락(wall-clock) 시간 예산 안에서 구조적으로 수렴하도록 통제된다.
5. **결정론적 마감 (Deterministic close):** 만약 루프가 시간 초과 등으로 비정상 종료되더라도, 시스템은 충돌을 일으키지 않고 지금까지 확보된 증거와 질문을 결합하여 결정론적인 폴백 답변을 안전하게 합성해 낸다.

### 7.3 프레임워크가 보증하는 6대 불변량

하네스의 5개 스테이션은 언어모델이 스스로 지킬 수 없는 6가지 엄격한 불변량을 물리적으로 보증한다:
- (i) **생각 전 증거 (Evidence before thought):** 모델이 첫 번째 추론을 시작하기 전에 컴파일된 증거가 이미 프런트에 대기한다.
- (ii) **불충분 시 폐기 (Discard on insufficiency):** 게이트에서 기각된 불충분한 증거 블록은 시스템 프롬프트와 인용 테이블에서 흔적도 없이 완전히 삭제된다. 어설픈 증거 찌꺼기가 컨텍스트 창을 오염시키는 것을 방지한다.
- (iii) **도구 게이팅 (Tool gating):** 코퍼스가 실제로 지원하고 실익이 입증된 도구만 선별적으로 노출된다.
- (iv) **예산화된 호출 (Budgeted calls):** 모델 호출은 토큰과 시간 예산 하에서만 허용되며, 예산 초과 시 우아하게 품질을 낮추어(graceful degradation) 마감한다.
- (v) **전달 시 인용 식별자 부여 (Citations at delivery):** 인용 번호와 출처 태그는 언어모델이 환각으로 지어내는 것이 아니라, 증거가 실제로 전달되는 순간 하네스 시스템이 물리적으로 번호를 매겨 바인딩한다.
- (vi) **마감 보장 (Guaranteed close):** 어떤 기괴한 예외가 발생하더라도 모든 질의는 반드시 유효한 정답 또는 명시적인 실패 사유와 함께 안전하게 닫힌다.

### 7.4 실패 원인 기반 도구 설계와 제로 히트(Zero-Hit) 원칙

현대 에이전트 시스템의 흔한 실수는 구현 기술(검색, 브라우징, grep, 그래프)을 중심으로 도구 목록을 나열하는 것이다. RAGFlow는 **도구가 제거하는 '실패 원인(Failure Cause)'을 기준으로 도구를 엄격히 재분류**한다:
- 어휘 불일치 실패 $\to$ BM25, grep, 클레임 어휘 검색
- 대규모 위치 식별 실패 $\to$ 아웃라인/트리 네비게이션, 메타데이터 스코프
- 교차 소스 관계망 단절 $\to$ 엔티티 룩업, 그래프 확장
- 시간적 모호성 실패 $\to$ 타임라인, as-of 시점 필터
- 지식 종합 부담 실패 $\to$ 증거 프로젝션, 위키 계층
- 도구 문법 오류 실패 $\to$ 에러를 관측치로 변환하고 해당 턴에서 도구를 잠정 비활성화하는 결정론적 래퍼

#### 제로 히트 원칙 (The Zero-Hit Principle)
에이전틱 검색에서 가장 빈번하게 발생하는 거짓 음성(false negative)은, 검색 엔진이 "결과 0건(0 results)"을 반환했을 때 에이전트가 이를 "코퍼스에 정보가 없다"는 의미적 부재 결론으로 성급하게 받아들이는 것이다.

검색 결과 0건은 단지 **'도구의 설정이나 필터가 맞지 않았다'는 도구적 특성**일 뿐, 코퍼스의 실제 내용에 대한 진실이 아니다. 따라서 하네스는 모델이 "0 results"를 직접 보고 자의적으로 해석하지 못하도록 가로챈다. 하네스는 내부적인 폴백 사다리(fallback ladder)—필터 완화, 컴파일 검색에서 원시 어휘 검색으로의 전환, 시간 윈도우 확장—를 순차적으로 모두 밟아본 뒤에야 비로소 코퍼스에 정답이 없다는 최종 결론을 허용한다.

### 7.5 자유로운 도구 선택의 환상 배제

[해설] 오늘날 유행하는 수많은 자율 에이전트 프레임워크들은 "모델에게 수십 가지 도구를 쥐여주고 스스로 알아서 고르게 하라"는 자유방임주의적 환상에 빠져 있다. 그러나 연구진이 지적하듯, 거대한 도구 세트와 낯선 코퍼스를 마주한 언어모델은 도구를 선택하는 메타 의사결정에서 극도로 무력하다. 모델은 쓸데없는 도구를 호출하며 턴을 낭비하고, 매우 자신만만하지만 완전히 비생산적인 계획을 수립한다.

진정한 엔지니어링 규율은 에이전트의 도구 선택권을 빼앗는 데서 출발한다. **어떤 도구가 지금 사용 가능한지(admissible)는 하네스 프레임워크가 엄격하게 결정하고, 모델은 오직 하네스가 허락한 극소수의 도구를 '어떻게 활용할 것인가'에만 집중해야 한다.**

---

## 8. 신뢰성과 평가의 한계: 수락률과 정답 정확도의 간극

### 8.1 수락률($p_h$)은 충분성($H$)이 아니다

연구진은 토큰 경제학 공식에서 $p_h$를 충분율의 대리 지표로 사용했지만, 실제 운영에서 게이트가 출력하는 숫자는 단지 **'프리페치된 블록을 통과시킨 수락률(Acceptance Rate)'**일 뿐이라는 점을 냉정하게 비판한다 [p. 11, §8.6].

게이트가 43%의 질의를 통과시켰다고 해서, 그 43%가 실제로 정답을 보증하는 충분한 증거였는지는 알 수 없다. 게이트가 단지 겉보기에 유려하지만 엉뚱한 증거 블록을 실수로 통과시켰을 수도 있기 때문이다.

이를 수학적으로 엄밀히 규명하기 위해 다음과 같은 확률 변수들을 정의한다 [^7]:
- $A$: 게이트의 수락 사건 (Acceptance)
- $H$: 실제 증거의 진정한 충분성 사건 (True Sufficiency)
- $C$: 최종 생성된 답변의 정답 사건 (Correct Final Answer)

여기서 **오수락률(False-accept rate) $\phi$**와 **오거절률(False-reject rate) $\rho$**, 그리고 조건부 정답률들을 다음과 같이 정의한다:

$$\phi = \Pr(\neg H \mid A), \qquad \rho = \Pr(H \mid \neg A)$$
$$a_T = \Pr(C \mid A, H), \qquad a_F = \Pr(C \mid A, \neg H)$$

게이트가 수락한 브랜치에서의 관측 정답률 $a_A$는 참수락 정답률과 오수락 정답률의 가중합으로 전개된다 [Eq. 10]:

$$a_A = (1 - \phi) a_T + \phi a_F$$

이를 오수락률 $\phi$에 대해 정리하면 다음과 같은 1차 추정 공식이 유도된다 [Eq. 11]:

$$\phi = \frac{a_T - a_A}{a_T - a_F}$$

이 공식은 매우 무서운 현실을 폭로한다. 오수락된 질문의 정답률이 참수락 정답률보다 35% 포인트 낮다고 가정할 때($a_T - a_F = 0.35$), 참수락 정답률과 수락 브랜치 전체 정답률 사이의 격차가 고작 1% 포인트($0.01$)만 벌어지더라도 오수락률 $\phi$는 최대 $2.9\%$에 달하며, 3% 포인트 격차가 벌어지면 $\phi$는 무려 **$8.6\%$**까지 치솟는다.

즉, **게이트가 겉보기에 높은 정답률을 유지하고 있더라도, 실제로는 상당한 비율의 질의가 엉뚱하고 왜곡된 증거를 바탕으로 위험하게 답변되고 있을 가능성을 배제할 수 없다.** 따라서 프로덕션 환경에서는 단순히 토큰 절감률이나 수락률 $p_h$만을 보고 환호해서는 안 되며, 반드시 라벨링된 감사를 통해 오수락률 $\phi$를 함께 측정하고 통제해야 한다.

### 8.2 최소 감사 (Minimum Audit) 프로토콜

오수락률 $\phi$를 과학적으로 확정 짓기 위해 연구진이 제시한 프로토콜이 바로 **최소 감사(Minimum Audit)**다.
수락된 질의들 중 무작위 층화 표본을 추출하여 실제 증거 충분성($H$) 여부를 사람이 직접 검증하는 표본 설계다:
- **100개 표본 감사 시:** 실제 오수락률이 10% 수준일 때 이항 신뢰구간은 약 $4\% \sim 16\%$로 넓게 퍼진다. 이는 3건 중 1건을 잘못 통과시키는 최악의 게이트와 30건 중 1건을 통과시키는 우수한 게이트를 구별할 수는 있지만, 10%와 20%의 정밀한 차이를 가려내지는 못한다.
- **400개 표본 감사 시:** 동일한 조건에서 신뢰구간이 약 $7\% \sim 13\%$로 좁혀져 실무적으로 유의미한 품질 관리가 가능해진다.

이 400개 규모의 엄격한 라벨 감사가 벤치마크 스케일에서 전수 완료되기 전까지는 $\phi$의 확정 수치를 임의로 단정하지 않는다는 철저한 방법론적 엄밀성을 견지한다.

### 8.3 유효성 위협 및 한계

본 연구가 보고한 정량적 수치들은 다음과 같은 명확한 한계와 적용 조건을 지닌다 [p. 11, §8.8]:
1. **단일 벤치마크 및 모델 종속성:** 수치들은 FRAMES라는 단일 위키피디아 기반 벤치마크와 `glm-4-flash` 추출기를 기반으로 도출된 기술적 작동점(operating point)이다. 
2. **도메인 전이 시의 위험:** 복잡한 금융 스캔 문서, 수식이 난무하는 기술 표준, 오탈자가 많은 고객 상담 로그 등에서는 소형 모델의 클레임 추출 품질이 급락할 수 있으며, 이는 곧바로 미적중률 상승과 토큰 절감폭 축소로 이어질 수 있다.
3. **PageIndex 실패의 해석 범위:** PageIndex의 대규모 성능 저하는 FRAMES 규모에서 관측된 현상이며 모든 아웃라인 구조에 대한 보편 법칙은 아니다.

---

## 9. 결론: '에이전트 네이티브 데이터베이스'의 시대

정보 검색 계층은 이제 완전히 에이전틱 검색 하네스 속으로 흡수 통합되고 있다. 그리고 이 거대한 전환과 함께, 지난 수년간 인공지능 엔지니어링을 지배해 온 "벡터 유사도 검색으로 어휘 검색을 이겨보겠다"는 오랜 집착은 마침내 그 종언을 고하고 있다.

유능한 에이전트 하네스 앞에서는 화려한 요약 트리도, 거대한 지식 그래프도, 수백만 개의 문서를 엮은 위키도 FRAMES에서 감지 가능한 정확도 이득을 내지 못했다. 검색 하네스 시대에 진정으로 가치 있는 인프라는 더 복잡한 인덱스가 아니라, **"에이전트가 읽어야 할 컨텍스트를 얼마나 정밀하고 컴팩트하게 다듬어 선제 공급할 것인가"**이다.

### 9.1 시스템 엔지니어링을 위한 5대 설계 원칙

RAGFlow 연구진이 제시하는 차세대 시스템 설계 원칙(Design Rules)은 간결하고 단단하다 [p. 12, §9]:

1. **산문(요약)이 아닌 증거를 컴파일하라:** 모든 클레임에는 반드시 원본 텍스트의 축자적 스팬 오프셋을 달아라. 요약문은 감사할 수 없고 새 사실을 더하지 못하지만, 출처가 살아있는 증거는 안전한 폴백, 정밀 인용, 엄격한 감사를 가능케 한다.
2. **증거는 전체 코퍼스에서 평평하게 프리페치하라:** 섣불리 작은 트리를 타고 내려가며 문서를 고르려 하지 마라. 전체 코퍼스를 대상으로 평평하게 증거를 훑고, 무손실 폴백을 갖춘 결정 게이트로 충분성을 통제하라.
3. **평균이 아닌 조건부 비용을 계측하고, 지연 시간을 함께 측정하라:** 38%라는 달콤한 평균 절감률 이면에는 91%의 대박과 1.9%의 비용, 그리고 3배에 달하는 지연 시간 폭증이 도사리고 있다.
4. **소비가 보장된 것만 컴파일하라:** 유한 지평선 공식(식 9)을 적용하여, 예상 질의 유입량 $Q$가 초기 컴파일 비용 $c$를 능가할 때만 컴파일을 가동하라.
5. **밀집(벡터) 검색 레그를 기본값으로 추가하지 마라:** 루프를 도는 에이전트는 이미 의미적 재구성을 수행한다. 벡터 인덱스는 에이전트가 신뢰하는 어휘적 닻과 경쟁하여 정확도를 떨어뜨리고 갱신 비용만 가중시킬 뿐이다.

```
"What an agent needs in order to answer well is high-quality context,
and knowledge compilation is how that context is produced...
A system whose job is to produce and hand over that context,
rather than to rank and return chunks, is an agent-native database." [p. 12]
```

### 9.2 랭킹된 청크 목록에서 검증된 최소 충분 맥락으로

RAGFlow가 도달한 궁극의 결론은 검색 시스템의 정체성 변화다. 미래의 시스템은 더 이상 수백 개의 문서 조각을 대충 훑어 유사도 순으로 랭킹을 매긴 뒤 에이전트의 발밑에 쏟아붓는 수동적인 검색 엔진에 머물러서는 안 된다.

검색 시스템이 지향해야 할 새로운 형태는 바로 **에이전트 네이티브 데이터베이스(Agent-Native Database)**다. 원천 문서를 사전에 분석하여 엄격한 타입과 버전, 출처 계통을 부여한 지식 아티팩트로 컴파일해 두고, 런타임 하네스와 긴밀히 협력하여 에이전트의 컨텍스트 창에 **'검증되고 정제된 최소한의 충분 맥락(The Smallest Sufficient Set of Verified Context)'**을 선제 공급하는 지능형 데이터 인프라다.

문맥이 인프라가 될 때, 비로소 에이전트는 끝없는 검색 루프의 방황을 멈추고 가장 적은 토큰과 가장 빠른 시간 안에 정확한 진실에 도달하게 된다.

---

## 각주 (Footnotes)

[^1]: BrowseComp-Plus는 단일 질의 해결을 위해 광범위한 웹 및 문서 검색을 수행하며 질문당 약 300만 토큰을 소모하는 포화 한계 검증 벤치마크인 반면, FRAMES는 여러 위키피디아 문서를 넘나드는 복합 추론(multi-hop) 과업으로 질문당 약 32.5만 토큰 수준에서 평가된다. 두 벤치마크는 문제 성격과 연산 규모가 근본적으로 달라 직접 비교 대상이 아니다.

[^2]: Adnan Darwiche와 Pierre Marquis(2002)의 고전적 지식 컴파일(Knowledge Compilation Map)은 명제 논리 지식 베이스를 쿼리 다항 시간 처리가 보장되는 타겟 언어(OBDD, NNF 등)로 오프라인 변환하는 계산 복잡도 이론에 기반한다. 반면 RAGFlow의 지식 컴파일은 Karpathy의 LLM-Wiki 및 의미적 엔리치먼트 개념을 현대적 데이터 엔지니어링 파이프라인으로 승화시킨 시스템적 의미를 갖는다.

[^3]: Validate 단계에서 실패한 추출물을 언어모델을 재호출하여 수정하려 들면, 모델이 원문에 없는 가공의 사실을 그럴듯하게 덧붙이는 2차 환각(cascading hallucination)이 발생할 확률이 급격히 증가한다. 따라서 "검증 실패 시 즉시 폐기(drop without repair)" 원칙은 지식 베이스의 무결성을 지키는 핵심 불변량이다.

[^4]: 손익분기 공식 $p_h^* = \frac{\Delta_{\mathrm{miss}}}{|\Delta_{\mathrm{hit}}| + \Delta_{\mathrm{miss}}}$에 대한 편미분을 계산하면, $\frac{\partial p_h^*}{\partial \Delta_{\mathrm{miss}}} = \frac{|\Delta_{\mathrm{hit}}|}{(|\Delta_{\mathrm{hit}}| + \Delta_{\mathrm{miss}})^2} \approx \frac{0.91}{0.929^2} \approx 1.05$인 반면, $\frac{\partial p_h^*}{\partial |\Delta_{\mathrm{hit}}|} = -\frac{\Delta_{\mathrm{miss}}}{(|\Delta_{\mathrm{hit}}| + \Delta_{\mathrm{miss}})^2} \approx -\frac{0.019}{0.929^2} \approx -0.022$가 된다. 즉, 손익분기점의 기울기는 미적중 페널티 오차에 대해 절감량 오차보다 약 48배나 더 민감하다.

[^5]: 에이전트는 컨텍스트 창에 입력된 텍스트가 풍부할수록 한 번의 독해에서 여러 사실의 교차 검증을 완료할 수 있다. 반면 증거 치환을 통해 극도로 정제된 몇 줄의 문장만 주어지면, 에이전트는 결론에 도달하기 위한 추가적인 확신을 얻고자 새로운 어휘 질의를 계속 발생시켜 루프 턴(rounds) 수가 늘어난다.

[^6]: 분기 계수(branching factor)가 $b=8$인 트리 구조에서 총 $N=100,000$개의 문서를 인덱싱할 때 트리의 유효 깊이는 $d = \log_8(100,000) = \frac{\ln 100000}{\ln 8} \approx 5.53$이다. 각 계층에서의 라우팅 결정 성공률이 $p=0.95$라고 할 때, 리프 노드까지 올바르게 도달할 누적 성공률은 $0.95^{5.53} \approx 0.753$ (약 75.3%)으로 떨어진다.

[^7]: 게이트 수락 사건 $A$ 하에서 참수락($H$)과 오수락($\neg H$)은 상호 배타적이므로, 전체 수락 브랜치의 정답률은 $a_A = \Pr(C \mid A) = \Pr(C \mid A, H)\Pr(H \mid A) + \Pr(C \mid A, \neg H)\Pr(\neg H \mid A) = a_T (1 - \phi) + a_F \phi$로 분해된다. 이를 $\phi$에 대해 전개하면 식 (11) $\phi = \frac{a_T - a_A}{a_T - a_F}$이 유도된다.

---

## 참고 문헌 (References)

- [1] S. Agrawal, X. Li, and Y. Chen. 2026. Vector RAG vs LLM-Compiled Wiki: A Preregistered Comparison on a Small Multi-Domain Research. *arXiv:2605.18490*.
- [2] A. Asai, Z. Wu, Y. Wang, A. Sil, and H. Hajishirzi. 2024. Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection. In *ICLR*.
- [3] A. Darwiche and P. Marquis. 2002. A Knowledge Compilation Map. *Journal of AI Research* 17 (2002), 229–264.
- [4] D. Edge, H. Trivedi, and J. Larson. 2024. From Local to Global: A Graph RAG Approach to Query-Focused Summarization. *arXiv:2404.16130*.
- [5] S. Subramanian et al. 2025. Is Grep All You Need? How Agent Harnesses Reshape Agentic Search. *arXiv:2605.15184*.
- [6] T. Gao, H. Yen, J. Yu, and D. Chen. 2023. Enabling Large Language Models to Generate Text with Citations. In *EMNLP*.
- [7] D. Hawking. 2004. Challenges in Enterprise Search. In *Australasian Database Conference*.
- [8] A. Hogan et al. 2021. Knowledge Graphs. *ACM Computing Surveys* 54, 4 (2021), 1–37.
- [9] T.-H. Hsu, J.-H. Yang, and J. Lin. 2026. Rethinking Agentic Search with Pi-Serini: Is Lexical Retrieval Sufficient? *arXiv:2605.10848*.
- [10] G. Izacard et al. 2022. Unsupervised Dense Information Retrieval with Contrastive Learning. In *TMLR*.
- [11] S. Jeong, J. Baek, S. Cho, S. J. Hwang, and J. C. Park. 2024. Adaptive-RAG: Learning to Adapt Retrieval-Augmented LLMs through Question Complexity. In *NAACL*.
- [12] H. Jiang, Q. Wu, C.-Y. Lin, Y. Yang, and L. Qiu. 2023. LLMLingua: Compressing Prompts for Accelerated Inference of LLMs. In *EMNLP*.
- [13] A. Karpathy. 2026. LLM Wiki. <https://x.com/karpathy/status/1780884652155764942>.
- [14] V. Karpukhin et al. 2020. Dense Passage Retrieval for Open-Domain Question Answering. In *EMNLP*.
- [15] S. Krishna et al. 2024. FRAMES: Factuality, Retrieval, And Reasoning MEasurement Set. In *NeurIPS Datasets and Benchmarks Track*.
- [16] U. Kruschwitz and C. Hull. 2017. Searching the Enterprise. *Foundations and Trends in Information Retrieval* 11, 1 (2017), 1–142.
- [17] P. Lewis et al. 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. In *NeurIPS*.
- [18] Z. Li et al. 2026. Beyond Semantic Similarity: Rethinking Retrieval for Agentic Search via Direct Corpus Interaction. *arXiv:2605.05242*.
- [19] N. F. Liu et al. 2024. Lost in the Middle: How Language Models Use Long Contexts. *TACL* 12 (2024), 157–173.
- [20] S. Min et al. 2023. FActScore: Fine-Grained Atomic Evaluation of Factual Precision in Long-Form Text Generation. (2023).
- [21] N. F. Noy and D. L. McGuinness. 2001. Ontology Development 101. Technical Report KSL-01-05. Stanford.
- [22] C. Packer et al. 2023. MemGPT: Towards LLMs as Operating Systems. *arXiv:2310.08560*.
- [23] Pinecone. 2025. Introducing Nexus Knowledge Engine.
- [24] Qwen Team. 2026. Decision Model Preview.
- [25] P. Sarthi, S. Abdullah, A. Tuli, S. Khanna, and A. Goldie. 2024. RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval. *arXiv:2401.18059*.
- [26] StartLux. 2026. Decision Model.
- [27] H. Trivedi, N. Balasubramanian, T. Khot, and A. Sabharwal. 2023. Interleaving Retrieval with Chain-of-Thought Reasoning. In *ACL*.
- [28] Vectify AI. 2025. PageIndex: Document Index for Vectorless, Reasoning-based RAG.
- [29] S. Vijayaraghavan, P. Agarwal, and R. Chen. 2025. AgenticRAG: Agentic Retrieval for Enterprise Knowledge Bases. *arXiv:2605.05538*.
- [30] X. Wang et al. 2021. KEPLER: A Unified Model for Knowledge Embedding and Pre-trained Language Representation. In *TACL*.
- [31] Z. Yang, Q. Ma, J. Chen, and A. Shrivastava. 2026. Superintelligent Retrieval Agent: The Next Frontier of Agentic Retrieval. *arXiv:2605.06647*.
- [32] S. Yao et al. 2023. ReAct: Synergizing Reasoning and Acting in Language Models. In *ICLR*.
- [33] M. Yasunaga et al. 2021. QA-GNN: Reasoning with Language Models and Knowledge Graphs for QA. In *NAACL*.
