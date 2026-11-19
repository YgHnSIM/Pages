---
title: "그래프 엔지니어링 실행 통찰: 루프에서 지식 그래프까지"
subtitle: "병목은 다음 모델 호출이 아니라 기억과 평가를 어디에 두느냐다. 검증 가능한 루프 하나에서 시작해, 상태를 대화 기록 밖의 아티팩트·DAG·그래프로 옮겨라."
slug: "graph-engineering-loop-to-knowledge-graph"
date: "2026-11-20"
tags:
  - AI
  - 에이전트
  - 소프트웨어공학
  - 해설
summary: "병목은 다음 모델 호출이 아니라 기억과 평가를 어디에 두느냐라는 전제 아래, 검증 가능한 루프 하나에서 시작해 상태를 대화 기록 밖 아티팩트·DAG·지식 그래프로 옮기는 실행 방법을 정리한다. 시작 전 여섯 가지 질문과 상황별 출발점(한 번 호출, 루프, 체인, 라우터, 병렬, 오케스트레이터-워커, 커밋 DAG, 지식 그래프, 동적 워크플로)을 제시하고, 평가 가능한 호출에 반성 루프를 붙이는 법, 한 번에 하나만 바꿔 측정하는 래칫 루프, 도구·계획·역할·스웜을 필요한 만큼만 더하는 기준을 다룬다. 이어서 작업 이력을 커밋 DAG로 남기는 법, 추출·해소·조립 순서의 지식 그래프 구축, 공유 기억과 근거 검사로서의 그래프 활용, 층별 지표와 함정, 실행 예산 선언, 그래프가 필요 없는 경우, 운영 점검표와 기본 14단계를 해설한다."
---

## 1. 시작 전에 여섯 가지를 묻는다

<div class="callout-box info">
  <div class="callout-title">할 일</div>
  <p>구조를 더하기 전에 아래 질문으로 출발점을 고른다. 첫 질문에 "아니오"면 자율 실행부터 하지 않는다.</p>
</div>

1. **성공을 검증할 수 있나?** 없으면 테스트, 루브릭, 출처 요건, 사람 결정 중 하나를 먼저 정한다.
2. **단계가 고정돼 있나?** 그렇다면 체인을 쓰고, 그렇지 않다면 계획 단계나 오케스트레이터를 둔다.
3. **하위 작업이 서로 독립인가?** 그렇다면 병렬로 돌리고, 아니라면 의존성을 명시하고 동시 쓰기를 제한한다.
4. **대안 계보를 살려 둬야 하나?** 그렇다면 한 브랜치로 몰지 말고 DAG를 쓴다.
5. **사실이 실행 뒤에도 남아야 하나?** 그렇다면 아티팩트와 그래프 상태를 저장한다. 대화 요약에 기대지 않는다.
6. **비용과 지연을 감당할 수 있나?** 워커를 늘리기 전에 예산부터 정한다.

| 상황 | 시작점 |
| --- | --- |
| 단순하고 위험이 낮은 질문 | 한 번 호출 |
| 결과를 검사할 수 있음 | 루프 |
| 순서가 안정적 | 체인 |
| 범주가 뚜렷함 | 라우터 |
| 독립 단위가 많음 | 병렬 |
| 분해 방식이 매번 다름 | 오케스트레이터-워커 |
| 대안을 남겨야 함 | 커밋 DAG |
| 사실이 세션을 넘어 남아야 함 | 지식 그래프 |
| 아주 큰 병렬 작업 | 동적 워크플로 |

## 2. 첫날: 평가 가능한 호출 하나에 루프를 붙인다

<div class="callout-box info">
  <div class="callout-title">할 일</div>
  <p>결과를 평가할 수 있는 기존 LLM 호출 하나를 고른다. 첫 초안 저장, 기준이 명시된 평가자, 수정 단계, 중단 규칙을 붙이고 모든 버전을 남긴다. 품질이 실제로 좋아진 것이 측정되면 다음 단계로 간다.</p>
</div>

```python
def reflective_task(task, gen, eval, max_rounds=3):
    versions = [gen(task)]
    for _ in range(max_rounds):
        review = eval(task, versions[-1])
        if review["decision"] == "approve":
            return {"result": versions[-1], "versions": versions}
        versions.append(gen(task, prior=versions[-1],
                            instructions=review["changes"]))
    return {"result": versions[-1], "status": "iteration_limit"}
```

## 3. 자율 실험은 래칫 루프로 돌린다

<div class="callout-box info">
  <div class="callout-title">할 일</div>
  <p>한 번에 하나만 바꾸고, 커밋하고, 짧게 돌려서 측정한다. 나아졌으면 남기고, 아니면 직전에 남긴 상태로 되돌린다. 기록을 남긴 뒤 사람에게 묻지 않고 계속한다.</p>
</div>

다음 네 조건이 갖춰져야 잘 돈다. 결과를 측정할 수 있어야 하고, 행동을 되돌릴 수 있어야 하며(git reset), 피드백 주기가 짧아야 하고(약 5분), 작업 환경이 제한돼 있어야 한다.

### 지시 파일(program.md)에 적을 것

- 수정 가능한 파일과 보호할 파일
- 지표와 개선 방향
- 실험 예산과 실행 명령
- 출력 파싱 방법과 충돌 처리
- 커밋/되돌리기 규칙과 기록 규칙
- 사람을 부를 조건과 탐색을 끝낼 조건

```
loop:
  state = inspect()            # 현재 코드와 최근 기록 읽기
  change = propose(state)      # 근거 있는 변경 하나
  commit = apply(change)
  try: score = evaluate()
  except: revert(commit); log("crash"); continue
  if better(score, current): keep(commit); current = score; log("kept")
  else: revert(commit); log("reverted")
```

지표만 보면 루프가 속는다. 주 지표와 함께 메모리, 처리량, 안정성, 일반화 같은 제약 조건을 같이 걸어 둔다. 그래프라면 추출 품질을 올리되 해소 정밀도와 질의 지연이 나빠지지 않게 한다.

## 4. 도구, 계획, 역할은 필요한 만큼만 하나씩 더한다

<div class="callout-box info">
  <div class="callout-title">할 일</div>
  <p>단계마다 해결할 문제가 하나씩 있어야 하고, 그 문제가 풀렸는지를 다음 단계로 넘어가는 기준으로 삼는다.</p>
</div>

| 단계 | 언제 더하나 | 넘어가는 기준 |
| --- | --- | --- |
| 도구 | 측정된 실패 하나를 고칠 때. 타입 있는 스키마, 권한, 결과 확인을 갖춘다 | 알려진 오류 유형이 줄었다 |
| 계획 | 작업 경로가 매번 다를 때만. 실행 전에 JSON 계획을 요구한다 | 경로가 다른 작업도 끝난다 |
| 다중 에이전트 | 생성자와 비평자 둘로 시작한다 | 역할을 나눈 쪽이 단일 에이전트보다 낫다 |
| 지속 그래프 | 사실이 세션을 넘어 남아야 할 때 | 세션을 넘는 질의가 된다 |
| 스웜 | 작업이 병렬로 나뉘고 리듀서가 정해졌을 때 | 품질 손실 없이 걸리는 시간이 준다 |

### 계획 JSON의 형태

```json
{"objective": "Construct verified knowledge graph",
 "steps": [
  {"id":"s1","action":"extract","depends_on":[],
   "success":"Each doc returns ExtractedGraph"},
  {"id":"s2","action":"resolve_entities","depends_on":["s1"],
   "success":"Every surface form maps to one ID"},
  {"id":"s3","action":"assemble_graph","depends_on":["s1","s2"],
   "success":"All endpoints resolve to nodes"}]}
```

실행 전에 의존성을 검증한다. 계획을 다시 짤 때는 이미 성공한 작업을 보존하고, 재시도 횟수와 총비용에 상한을 둔다.

### 역할을 나눌 때

- 소프트웨어 작업이라면 계획자, 구현자, 테스트 작성자, 리뷰어, 보안 리뷰어, 종합자로 나눈다.
- 넘겨주는 지점마다 산출물 형식(아티팩트 계약)을 정해 둔다.
- 리뷰어는 "좋아 보임"이 아니라 기준별 결함 목록을 돌려준다.
- 여러 코딩 에이전트가 같은 저장소를 고치면 워크트리로 격리한다.
- 설계, 서사 글쓰기, 강하게 얽힌 리팩터링처럼 하나의 맥락이 필요한 일은 쪼개지 않는다.

## 5. 스웜은 리듀서와 예산을 먼저 정하고 돌린다

<div class="callout-box info">
  <div class="callout-title">할 일</div>
  <p>병렬로 나뉘는 작업 하나를 고른다. 예를 들어 결함 한 종류를 찾는 전 파일 감사, 수천 문서에서 개체 추출, 독립 모듈별 테스트 생성이 그렇다. 펼치기 전에 결과를 모으는 방식(리듀서)부터 정한다.</p>
</div>

### 펼치기 전에 정할 것

- 동시 실행 한도와 전체 워커 수 상한
- 토큰 예산과 워커별 제한 시간
- 재시도 정책과 중복 제거 정책
- 증거 형식(무엇을 돌려줘야 하는지)
- 마지막 평가 관문

```javascript
audits  = gather(files.map(f => spawn("auditor",
            {file: f, instructions: "Inspect for race conditions. Return JSON."})),
            {concurrency: 16})
suspicious = audits.filter(r => r.confidence >= 0.70)
reviews = gather(suspicious.map(r => spawn("reviewer",
            {report: r, instructions: "Try to refute this finding."})),
            {concurrency: 16})
return spawn("synthesizer", {audits, reviews,
            instructions: "Produce one cited report."})
```

병렬 워커는 같은 오류를 함께 낸다. 검증 단계가 도움이 되려면 리뷰어에게 다른 프롬프트, 다른 증거, 다른 역할을 준다. 동적 워크플로를 쓰더라도 목표, 대상 파일, 출력 형식, 권한, 검증 정책, 동시성·토큰 예산, 롤백 규칙, 종합에 필요한 증거는 사람이 정한다.

## 6. 작업 이력은 커밋 DAG로 남긴다

<div class="callout-box info">
  <div class="callout-title">할 일</div>
  <p>실험 하나를 노드 하나로, 부모 연결을 간선으로 저장한다. 버린 실험도 지우지 말고 남긴다. 다른 에이전트에게는 그 아이디어가 어떤 조건에서 실패했는지 알려 주는 근거가 된다.</p>
</div>

### 노드에 담을 것

부모 커밋, 만든 에이전트, 가설, 코드 diff, 지표, 실행 시간, 메모리, 환경, 유지/폐기 여부, 토론 글 링크, 관련 실험 링크.

### 바로 쓸 질의

- `children <hash>`: 이 결과 위에서 무엇을 시도했나
- `leaves`: 아직 아무도 이어 가지 않은 탐색 끝단
- `lineage <hash>`: 이 결과에 이른 경로
- 메모리 한도 안에서 지표가 가장 좋은 유지 결과는? 평가가 없는 잎은? 빨리 좋아지다가 멈춘 계보는?

에이전트에게 이전 대화 기록 전체를 넘기지 않는다. 필요한 계보를 질의하고, 요약 몇 개를 읽고, 커밋 하나를 가져와 이어 가게 한다. DAG는 무한히 자라므로 가지치기, 보관, 요약 정책을 둔다.

## 7. 지식 그래프는 추출, 해소, 조립 순서로 만든다

<div class="callout-box info">
  <div class="callout-title">할 일</div>
  <p>스키마로 출력을 제한한 호출로 개체와 관계를 뽑는다. 더 강한 모델로 같은 대상을 하나로 묶은 다음, 모든 간선에 출처를 붙여 조립한다.</p>
</div>

1. **추출**: 문서마다 구조화 출력 호출을 하나씩 한다(원문 예시는 Haiku). Pydantic 스키마(Entity: name, type, description / Relation: source, predicate, target)가 학습 데이터 역할을 한다.
2. **해소**: 후보를 개체 유형별로 묶고, 설명을 맥락 증거 삼아 더 강한 모델(원문 예시는 Sonnet)에게 대표 개체 묶음을 제안하게 한다. 규모가 커지면 값싼 블로킹 신호로 후보를 먼저 줄인다. 문자열 유사도만으로는 "Edwin Aldrin"과 "Buzz Aldrin"을 못 잡고, 이름이 같은 다른 사람을 잘못 합친다.
3. **조립**: 노드에는 이름, 유형, 설명, 출처 문서, 별칭을 넣고, 간선에는 관계, 출처 문서, 신뢰도를 넣는다(예: NetworkX MultiDiGraph).

### 해소는 되돌릴 수 있게

대표 개체에 별칭, 출처 문서, 병합 근거, 신뢰도, 병합한 실행을 남긴다. 잘못 합쳐진 노드 하나가 하류의 모든 질의를 오염시키므로, 파이프라인 전체를 다시 돌리지 않고 병합만 풀 수 있어야 한다.

### 처음 저장소는 단순하게

버전이 붙은 JSON이나 관계형 테이블로 시작한다. 저장할 것은 개체, 주장, 출처, 관계, 아티팩트, 에이전트 실행, 평가, 버전, 별칭, 열린 질문이다.

## 8. 그래프를 공유 기억과 근거 검사로 쓴다

<div class="callout-box info">
  <div class="callout-title">할 일</div>
  <p>워커는 결과를 검증된 그래프 업데이트로 올리고, 종합자는 그래프를 탐색해 결과를 합친다. 그래프 전체를 맥락에 쏟지 말고 작업별 부분 그래프만 만들어 준다.</p>
</div>

### 그래프 쓰기 절차

스키마 검사 → 출처 검사 → 트랜잭션 안에서 버전 노드 upsert, 간선 추가, 실행(run_id·agent_id) 연결 → 커밋. 쓰기마다 다음 네 가지를 지킨다.

- 모든 주장에 출처가 있거나 추론이라고 표시돼 있다.
- 모든 아티팩트에 작성한 실행과 버전이 있다.
- 모든 평가가 루브릭을 밝힌다.
- 대체된 객체도 계속 찾아갈 수 있다.

### 맥락 짓기 7단계

1. 작업에 나온 개체를 그래프에서 찾는다.
2. 허용된 간선 유형으로 1~2홉만 넓힌다.
3. 현재 아티팩트 버전을 넣는다.
4. 최근에 검증된 주장을 앞에 둔다.
5. 충돌과 불확실성도 넣는다.
6. 토큰 예산 안에서 직렬화한다.
7. 인용할 수 있게 고정 간선 ID를 붙인다.

### 평가자는 빠진 간선을 지목한다

주장을 그래프 경로로 확인하고, 근거가 없으면 자유 서술 대신 구조화된 피드백을 돌려준다.

```json
{"decision": "revise",
 "claim": "Vendor X supplied the component in Y",
 "reason": "No supported path from Vendor X to Y",
 "required_evidence": ["A source-backed supplied relation",
                       "A source-backed involved_in relation"]}
```

커밋 DAG(무엇이 바뀌었나, 누가, 어느 계보)와 지식 그래프(무엇이 있고 어떻게 연결되며 근거는 무엇인가)는 합치지 말고 따로 두되, `run → produced → claim → supported_by → source`처럼 서로 연결한다.

## 9. 층마다 지표를 따로 재고 함정을 피한다

<div class="callout-box info">
  <div class="callout-title">할 일</div>
  <p>골드셋을 만든다. 추출 프롬프트, 온톨로지, 해소 정책, 질의 직렬화기도 래칫 루프로 개선한다. 한 번에 하나를 바꾸고, 골드셋에서 측정해서, 나아지면 남기고 나빠지면 되돌린다.</p>
</div>

| 층 | 지표 | 흔한 오독 |
| --- | --- | --- |
| 추출 | 개체·관계 F1, 스키마 유효율, 비용, 지연 | 정밀도가 높으면 빠진 개체가 가려진다 |
| 해소 | 쌍별 정밀도·재현율, 오병합·누락병합률, 압축률 | 압축률만 보면 과병합을 칭찬하게 된다 |
| 그래프 | 연결 요소, 밀도 | 하나로 다 이어진 그래프가 늘 좋은 것은 아니다 |
| 질의 | 정확도, 인용 경로 | 매끄러운 답이 엉뚱한 간선을 인용할 수 있다 |
| 워크플로 | 성공률, 비용 | 에이전트를 늘리면 일만 늘고 가치는 없을 수 있다 |
| 운영 | 복구, 수정 | 평균 성공률이 치명적 사례를 가린다 |

### 질의 답이 통과할 조건

질문 속 개체를 바르게 해소했는가, 관련 부분 그래프를 가져왔는가, 근거 있는 간선만 썼는가, 시간·출처 제약을 지켰는가, 사실과 추론을 구분했는가, 쓴 간선을 인용했는가, 빠진 증거를 밝혔는가를 본다. 오해를 부르는 별칭, 서로 모순되는 날짜, 끊긴 경로로 적대적 사례를 만들어 시험한다.

### 운영 중에는 추세를 본다

문서 유형별 추출률, 스키마 실패율, 해소 압축률, 연결 요소 변화, 질의 지연, 부분 그래프 크기, 인용 간선 유효성, 토큰 비용, 오래된 개체 수, 그래프 업데이트 실패, 재시도율을 지켜본다. 고립 노드가 갑자기 늘면 해소가 퇴행했다는 신호이고, 갑자기 줄면 과병합 신호다.

## 10. 모든 실행에 예산을 선언한다

<div class="callout-box info">
  <div class="callout-title">할 일</div>
  <p>실행마다 상한을 먼저 적는다. 예산이 바닥나면 매끄러운 최종 답으로 부분 실패를 덮지 말고, 현재까지의 상태를 그대로 돌려준다.</p>
</div>

<div class="budget-caps" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:1rem 0 1.25rem;">
  <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:16px;">최대 모델 호출</div>
  <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:16px;">최대 하위 에이전트</div>
  <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:16px;">최대 동시 워커</div>
  <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:16px;">최대 도구 호출</div>
  <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:16px;">최대 실행 시간</div>
  <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:16px;">최대 토큰</div>
  <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:16px;">최대 비용</div>
  <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:16px;">최대 재시도</div>
  <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:16px;">최대 그래프 쓰기</div>
  <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:16px;">마무리에 필요한 최소 증거</div>
</div>

예산이 소진되면 지금까지 최선의 아티팩트, 끝낸 작업, 풀지 못한 문제, 멈춘 이유를 돌려준다.

## 11. 그래프가 필요 없는 경우는 건너뛴다

<div class="callout-box info">
  <div class="callout-title">할 일</div>
  <p>에이전트를 쓴다는 이유만으로 지식 그래프를 넣지 않는다. 아래 중 하나라도 해당하면 테이블이나 문서 저장으로 충분한지 먼저 확인한다.</p>
</div>

- 작업이 서로 독립이다.
- 세션을 넘는 상태가 필요 없다.
- 답이 문서 하나에 달려 있다.
- 관계가 고정돼 있고 단순하다.
- 관계형 테이블로 모든 질의에 답할 수 있다.
- 출처 추적이 필요 없다.
- 추출 오류의 손해가 탐색으로 얻는 가치보다 크다.

연결 질의, 계속 변하는 관계, 출처 추적, 공유된 세계 상태가 핵심일 때 그래프가 비용값을 한다. 그래프의 품질은 원자료, 추출 프롬프트, 온톨로지, 해소 정책 수준을 넘지 못한다. 원자료에 빠진 문서가 있으면 그래프에도 간선이 빠진다.

## 12. 운영 점검표와 기본 실행 순서

<div class="callout-box info">
  <div class="callout-title">목표 상태</div>
  <p>중요한 결과 하나하나를 목표, 계획, 아티팩트, 출처, 그래프 경로, 평가자 결정, 상한이 있는 실행 기록까지 거슬러 추적할 수 있어야 한다. 이 상태가 아니면 에이전트를 늘릴수록 더 불투명해진다.</p>
</div>

| 요소 | 스스로 물을 것 | 빠지면 |
| --- | --- | --- |
| 목표 | 테스트할 수 있나? | 엉뚱한 것을 최적화 |
| 지표 | 개선을 구분하나? | 진전 없는 활동 |
| 되돌리기 | 업데이트를 취소할 수 있나? | 실패한 실험이 상태를 망침 |
| 도구 스키마 | 인자에 타입이 있나? | 잘못된 호출, 조용한 오류 |
| 아티팩트 계약 | 워커가 무엇을 돌려줘야 하나? | 제각각인 산문 |
| 출처 | 모든 주장에 출처가 있나? | 감사 불가 |
| 해소 정책 | 결정을 되돌릴 수 있나? | 오병합이 그래프 오염 |
| 예산 | 상한이 명시됐나? | 자원 무한 소모 |
| 감시 | 지표를 추적하나? | 퇴행이 안 보임 |
| 복구 | 상태에서 재개되나? | 중단될 때마다 처음부터 |

### 그래프 기반 에이전트 작업의 기본 14단계

1. 목표와 제약을 받는다.
2. 작업 개체를 그래프에서 해소한다.
3. 출처가 붙은 제한된 부분 그래프를 가져온다.
4. 타입 있는 계획을 만들고 의존성을 검증한다.
5. 독립 단계를 격리된 워커에 맡긴다.
6. 구조화된 아티팩트와 증거를 요구한다.
7. 후보 그래프 업데이트를 올린다.
8. 스키마, 권한, 출처를 검증한다.
9. 결정적 테스트를 돌린다.
10. 평가 에이전트를 루브릭으로 돌린다.
11. 충돌을 해결하거나, 불확실하면 사람에게 올린다.
12. 버전이 붙은 최종 아티팩트를 낸다.
13. 출처, 그래프 경로, 실행, 평가에 연결한다.
14. 비용, 지연, 실패, 열린 질문을 기록한다.

## 출처

원문: 「Graph Engineering: The Karpathy Loop, Improved 1000x by Itself / The Anthropic Playbook」, Agentic Software Engineering Practice 2026, 2026년 7월, PDF. 주요 바탕 자료: Karpathy의 autoresearch·AgentHub 저장소, Anthropic의 Building Effective Agents, Dynamic Workflows, Knowledge Graph Construction Cookbook.
