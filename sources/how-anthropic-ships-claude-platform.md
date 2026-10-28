---
title: "앤트로픽은 어떻게 세계 1위 LLM 플랫폼을 만드는가 — S-1의 효율성 지표부터 뇌와 손의 보안 아키텍처까지"
subtitle: "Rust 개발자 없이 해낸 전면 포트, 증류 방지와 권한 설계, 그리고 단일 일관 모델이 여는 자율 협업자의 미래"
slug: "how-anthropic-ships-claude-platform"
date: "2026-10-29"
tags:
  - AI
  - 에이전트
  - AI안전
  - 앤트로픽
  - 해설
summary: "Opus 5.5 출시와 S-1 공개를 기점으로 앤트로픽의 제품 및 엔지니어링 리더십이 밝힌 플랫폼 구축 전말을 심층 해설한다. 자본·인당 생산성의 비약적 성장을 이끈 두 개의 순환 고리부터, API 사고 토큰 보존을 통한 증류 방지, 범용 '신뢰 부여(trust grants)' 권한 모델, 뇌(하네스)와 손(실행 환경)을 물리적으로 분리한 샌드박스 보안, Rust 전면 재작성으로 완수한 CPU 병목 돌파, 그리고 라우팅·폴백을 넘어선 단일 모델의 동적 에포트(effort) 전략까지 프론티어 AI 플랫폼의 기술적 청사진을 집대성했다."
archive_url: "https://yghnsim.github.io/Archive/pages/2026-10-29-앤트로픽플랫폼.html"
---

## 1. 들어가며: S-1이 보여 준 효율과 두 개의 고리

인공지능 연구 기업이 상장 증권신고서(S-1)를 제출하고 기업공개(IPO)를 본격화하는 국면은, 기술적 이상주의가 냉혹한 자본 시장의 회계적 검증대 위에 올라서는 순간이다. 앤트로픽(Anthropic)이 S-1을 제출했고, 스윅스(swyx)의 전망으로는 2주 뒤 약 2조 달러 규모의 IPO가 예상된다(수치 확인 필요). 2026년 6월 30일 기준 누적 조달액은 1,411억 달러로 1,000억 달러를 넘지만, 누적 영업활동 현금 유출액은 100억 달러 미만(2023~2025년 누적 영업현금흐름 유출 약 99억 5,600만 달러, 2026년 상반기 39억 2,900만 달러 순유입, 보유 현금·현금성자산 및 단기금융상품 합계 1,317억 달러)이다(https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm). 천문학적인 자본이 투입되는 프론티어 모델 개발 경쟁 속에서 이러한 현금 보존력은 단순한 절약이 아니라 비정상적인 자본 효율성을 의미한다.

무엇보다 눈길을 끄는 대목은 인당 생산성의 폭발적 팽창이다. 지난 12개월(Trailing 12-Month) 기준 앤트로픽의 직원 1인당 매출은 2026년 9월 30일 기준 660만 달러 이상에 달했다(https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm). 불과 1년 전(2025년 9월 30일 기준)의 1인당 매출이 140만 달러 수준이었음을 감안하면(https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm), 전체 조직 규모가 빠르게 커지는 와중에도 인당 매출은 1년 만에 약 5배로 폭증한 것이다. 인공지능 도구를 가장 능숙하게 내부 업무에 내재화한 조직이 보여주는 생산성 곡선의 선례다.

이러한 인간 단위 효율의 배후에는 컴퓨팅 단위 경제성(Compute Unit Economics)의 극적인 반전이 자리 잡고 있다. 스윅스는 2025년 2분기까지만 해도 매출 1달러당 약 0.5달러를 잃었다고 표현했는데, 실제 S-1 분기 재무표를 보면 2025년 2분기에는 컴퓨팅 및 인프라 비용 1달러(총 13억 9,000만 달러)당 약 0.57달러의 매출(총 7억 8,700만 달러)을 기록하는 데 그쳤다(https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm). 모델 서빙과 연구 훈련 비용이 매출을 잠식하던 구조였다. 그러나 2026년 2분기에는 컴퓨팅 및 인프라 비용 1달러(총 55억 5,800만 달러)를 투입할 때마다 약 2.08달러의 매출(총 115억 5,500만 달러)을 거두어들이는 역전 구조를 확립했다(https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm). 이에 힘입어 앤트로픽은 사상 첫 분기 영업흑자를 달성했다. 다만 스윅스는 방송에서 "조정 이익이 아니라 미국 회계기준(GAAP) 이익률 19%"라고 말했으나, S-1 원문 기준 2026년 2분기 GAAP 영업이익은 9억 7,400만 달러로 GAAP 영업이익률은 8%이며, 19%(조정 영업이익 22억 3,500만 달러, 약 19.3%)는 주식보상비용 등을 제외한 비회계기준(Non-GAAP) 조정 영업이익률(Adjusted Operating Margin)이다(https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm). 마찬가지로 1년 전인 2025년 2분기에 기록했던 −129%의 적자율(조정 영업손실 10억 1,900만 달러) 역시 조정 영업이익률 기준(GAAP 영업이익률은 −152%, 영업손실 12억 달러)으로, 불과 4분기 만에 흑자로 전환한 셈이다(https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm).

재무 분석가 출신인 스윅스(swyx)는 이와 같은 기하급수적 효율성을 이끄는 원동력으로 '두 개의 순환 고리(Two Loops)'를 제시한다.

1. **개선 고리(The Improvement Loop)**: 기본 모델(Claude)의 배포 → 더 나은 모델 산출 → 더 광범위하고 복잡한 엔터프라이즈 사용 사례 발굴 → 현장 워크로드에서 쏟아지는 고밀도 피드백 수집 → 다시 차세대 모델의 역량 강화로 이어지는 피드백 고리다.
2. **투자 고리(The Investment Loop)**: 제품 도입 확대로 인한 매출 급증 → 회사의 자본 성장 → 더 공격적인 컴퓨팅 및 인프라 재투자 → 프론티어 능력(Capabilities)의 도약 → 다시 최상위 모델의 지배력 강화로 이어지는 자본 축적 고리다.

앤트로픽 내부에서는 이 두 고리가 맞물려 회전하면서 컴퓨팅 한계비용을 낮추고 모델 역량을 영구적으로 끌어올리는 무한 동력 플라이휠을 형성하고 있다고 규정한다.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" width="100%" style="height:auto; background:#0f172a; border-radius:12px; margin:24px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <defs>
    <linearGradient id="gradImp" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="gradInv" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#059669" stop-opacity="0.05"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Title Banner -->
  <text x="450" y="38" fill="#f8fafc" font-size="18" font-weight="700" text-anchor="middle" letter-spacing="1">앤트로픽 효율성의 엔진: 상호 증폭하는 2대 순환 고리</text>
  <text x="450" y="60" fill="#94a3b8" font-size="12" text-anchor="middle">S-1에서 공개된 영업이익 흑자 전환(GAAP 8%, 조정 19%)과 컴퓨팅 단위 경제학의 본질</text>

  <!-- Improvement Loop (Left) -->
  <rect x="50" y="85" width="370" height="300" rx="16" fill="url(#gradImp)" stroke="#0284c7" stroke-width="1.5" />
  <text x="235" y="115" fill="#38bdf8" font-size="15" font-weight="700" text-anchor="middle">1. 개선 고리 (Improvement Loop)</text>
  <text x="235" y="134" fill="#94a3b8" font-size="11" text-anchor="middle">지능 진화와 워크로드 피드백의 결합</text>

  <rect x="145" y="150" width="180" height="40" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2"/>
  <text x="235" y="175" fill="#f1f5f9" font-size="12" font-weight="600" text-anchor="middle">프론티어 모델 (Claude)</text>

  <path d="M 325 170 L 370 170 L 370 230 L 335 230" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" stroke-dasharray="4 2"/>
  
  <rect x="145" y="215" width="180" height="40" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2"/>
  <text x="235" y="240" fill="#f1f5f9" font-size="12" font-weight="600" text-anchor="middle">새로운 사용처 및 하네스 확산</text>

  <path d="M 145 235 L 105 235 L 105 295 L 140 295" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 2"/>

  <rect x="145" y="280" width="180" height="40" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2"/>
  <text x="235" y="305" fill="#f1f5f9" font-size="12" font-weight="600" text-anchor="middle">고밀도 현장 피드백 집약</text>

  <path d="M 235 280 L 235 200" fill="none" stroke="#38bdf8" stroke-width="2"/>
  <polygon points="235,192 231,202 239,202" fill="#38bdf8" />
  <text x="240" y="348" fill="#cbd5e1" font-size="11" text-anchor="middle">→ 평가·앤트푸딩·하네스 최적화</text>

  <!-- Investment Loop (Right) -->
  <rect x="480" y="85" width="370" height="300" rx="16" fill="url(#gradInv)" stroke="#059669" stroke-width="1.5" />
  <text x="665" y="115" fill="#34d399" font-size="15" font-weight="700" text-anchor="middle">2. 투자 고리 (Investment Loop)</text>
  <text x="665" y="134" fill="#94a3b8" font-size="11" text-anchor="middle">자본 유입과 컴퓨팅 규모의 선순환</text>

  <rect x="575" y="150" width="180" height="40" rx="8" fill="#1e293b" stroke="#34d399" stroke-width="1.2"/>
  <text x="665" y="175" fill="#f1f5f9" font-size="12" font-weight="600" text-anchor="middle">플랫폼 채택 및 매출 폭증</text>

  <path d="M 755 170 L 800 170 L 800 230 L 765 230" fill="none" stroke="#34d399" stroke-width="2" stroke-dasharray="4 2"/>

  <rect x="575" y="215" width="180" height="40" rx="8" fill="#1e293b" stroke="#34d399" stroke-width="1.2"/>
  <text x="665" y="240" fill="#f1f5f9" font-size="12" font-weight="600" text-anchor="middle">컴퓨팅 인프라 대규모 재투자</text>

  <path d="M 575 235 L 535 235 L 535 295 L 570 295" fill="none" stroke="#34d399" stroke-width="2" stroke-dasharray="4 2"/>

  <rect x="575" y="280" width="180" height="40" rx="8" fill="#1e293b" stroke="#34d399" stroke-width="1.2"/>
  <text x="665" y="305" fill="#f1f5f9" font-size="12" font-weight="600" text-anchor="middle">프론티어 역량(Capability) 도약</text>

  <path d="M 665 280 L 665 200" fill="none" stroke="#34d399" stroke-width="2"/>
  <polygon points="665,192 661,202 669,202" fill="#34d399" />
  <text x="665" y="348" fill="#cbd5e1" font-size="11" text-anchor="middle">→ 비용 $1당 $2 창출 ($0.5 적자 탈피)</text>

  <!-- Center Core Link -->
  <path d="M 420 235 L 480 235" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="6 3"/>
  <polygon points="455,228 465,235 455,242" fill="#f59e0b"/>
  <polygon points="445,228 435,235 445,242" fill="#f59e0b"/>
  <text x="450" y="222" fill="#fbbf24" font-size="11" font-weight="700" text-anchor="middle">공동 진화</text>
</svg>

이 순환 구조의 중심축으로서 S-1이 명시한 Claude 확산(Diffusion)의 세 경로 중 하나가 바로 '클로드 플랫폼(Claude Platform)'이다. S-1에서는 이를 '포괄적 에이전트 개발 환경(Comprehensive Agentic Development Environment)'으로 정의한다. 단순한 모델 서빙 API 공급자를 넘어, 기업 고객이 Claude의 지능을 토대로 자체 제품과 엔터프라이즈 워크플로우 안에서 고유한 에이전트를 조립·배포·확장할 수 있도록 기본 구성 요소(primitives)를 제공하는 클라우드 생태계다.

실제로 2026년 9월 30일 종료 3개월 기준, 최근 12개월(TTM) 매출 10만 달러 이상 고객 중 50% 이상이 클로드 플랫폼과 최소 하나 이상의 1차 애플리케이션(Claude Code, Cowork 등)을 함께 사용하고 있다(https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm). 더 주목해야 할 사실은 앤트로픽 내부의 플래그십 제품들, 즉 코딩 에이전트인 클로드 코드(Claude Code)와 사무 협업 도구인 코워크(Cowork) 역시 외부 개발자에게 제공되는 것과 완전히 동일한 기본 구성 요소를 바탕으로 구축되었다는 점이다(앤트푸딩).

이러한 플랫폼 전략은 상장 서사(narrative)와도 맞물려 있다. 앤트로픽은 시장을 설득하는 축을 '챗봇(Chatbots) → 코파일럿(Copilots) → 가상 협업자(Virtual Collaborators)'의 3단계 진화로 설정했다. '에이전트'라는 단어가 주는 기계적이고 차가운 뉘앙스 대신, 목표를 온전히 위임받아 자율적으로 판단하고, 스스로 오류를 교정하며, 복잡한 도구를 연쇄적으로 다루는 '가상 협업자'의 시대를 선언한 것이다.

오푸스 5.5(Opus 5.5)가 출시된 다음 날(공식 발표일 2026년 9월 22일, anthropic.com/claude-opus-5-5) 스윅스는 오푸스 5.5를 가리켜 "현시점 지구상에서 가장 강력한 모델"이라고 단언한다. 아울러 앤트로픽이 미공개 상태로 쥐고 있는 '페이블 5.5(Fable 5.5)'(이름 확인 필요)를 상장 시점에 맞추어 향후 2주 안에 공개할 가능성이 높다고 사견을 전제로 관측했다. 세계 최고 모델을 출시하면서도 전례 없는 효율성을 달성한 비결은 무엇인가. 그 해답은 모델 출시를 둘러싼 안전 아키텍처와 엔지니어링 패러다임의 급진적 전환에 있다.

---

## 2. 모델 하나를 출시한다는 것: 평가, 앤트푸딩, 조기 접근, 피드백

프론티어 모델의 출시는 더 이상 가중치를 파일 서버에 올리고 엔드포인트를 여는 단순 배포 작업이 아니다. 오푸스 5.5의 출시는 모델의 성격 교정과 가격 정책, 그리고 다층적 테스트 파이프라인이 유기적으로 결합된 복합 공정의 결과물이었다.

오푸스 5.5에서 앤트로픽이 최우선으로 해결하고자 했던 과제는 두 가지였다.
첫째, 이전 세대인 오푸스 5에서 지속적으로 접수되었던 "문체가 지나치게 장황하고 복잡하다(convoluted writing)"는 시장의 피드백을 수용하여, 답변의 불필요한 수식어를 덜어내고 간결하면서도 명확한 전달력을 갖추도록 정리했다.
둘째, 대대적인 가격 인하다. 시장의 관심이 단순한 벤치마크 점수 경쟁에서 벗어나 '1달러당 얻을 수 있는 지능의 총량(Intelligence per dollar)'으로 급격히 이동하고 있음을 포착했기 때문이다.

이러한 결과물을 도출하기까지 앤트로픽의 모델 출시는 엄격하게 규격화된 파이프라인을 거친다.

```
[안전성 테스트 및 초기 평가]
        ↓
[복수 변형본(Variants) 생성 및 사내 앤트푸딩(Ant fooding)]
        ↓
[1차 제품(Claude Code, Cowork) 및 API 파트너 조기 접근(Early Access)]
        ↓
[정량적 평가 스위트 + 정성적 느낌(Vibes) 피드백 종합]
        ↓
[정식 모델 출시(GA)]
```

사내 테스트 단계인 '앤트푸딩(Ant fooding)'—앤트로픽식 독푸딩(Dogfooding)—에서는 연구진과 엔지니어들이 일상 업무 전반에 모델의 여러 변형본(variants)을 직접 투입한다. 엔지니어와 기획자가 실제 코드를 작성하고 시스템을 운영하면서 모델의 미세한 성향 차이를 체감하고, 어떤 변형본이 현장 작업에 최적화되어 있는지 초기에 감지해 낸다.

이후 진행되는 '조기 접근 프로그램'은 코그니션(Cognition)이나 커서(Cursor, 자동자막에는 'Herser'로 오인식됨; https://www.anthropic.com/news/claude-opus-5-5)처럼 **자체적인 정량 평가 체계(eval suite)가 극도로 견고하게 구축된 극소수의 파트너사**만을 선별해 진행된다. 테스트용 모델 컷(cut)을 생성한 시점부터 일반 사용자에게 공개하기까지의 시간차를 극단적으로 단축해야 하는 '속도전' 상황이기 때문이다. 느슨한 감상평을 늘어놓는 파트너와 협력할 여유는 없다. 모델의 새 변형본이 주어지자마자 자체 평가 파이프라인을 즉시 가동하여 회귀(regression) 지표와 개선 수치를 즉각 데이터로 반환해 줄 수 있는 고객만이 조기 접근 파트너의 자격을 얻는다.

출시 과정에서 제품 리더십이 가장 귀하게 여기는 것은 역설적이게도 '부정적 피드백'이다. 잘 동작한다는 칭찬은 가설을 확인할 뿐이지만, 어디서 모델이 무너지는지에 대한 피드백만이 시스템을 고칠 수 있는 유일한 단서이기 때문이다. 특히 앤트로픽 내부의 독자 하네스가 아닌, 외부 API 고객이 독자적으로 구축한 이종 하네스에서 실행되었을 때 발생하는 결함 리포트는 모델의 범용성을 검증하는 결정적 잣대가 된다.

피드백 조율에서 가장 까다로운 난제는 '게으름(Laziness) 대 주도성(Proactivity)'의 균형이다. 사용자의 요구는 결코 단일한 지점에 수렴하지 않는다. 어떤 개발자는 "기획만 가볍게 잡으려 했는데 왜 모델이 성급하게 수십 개의 파일을 고쳐버리느냐"고 불만을 제기하는 반면, 다른 개발자는 "왜 사소한 확인을 매번 구하느냐, 알아서 작업을 끝까지 완수하라"고 요구한다. 모두가 만족하는 절대적인 정답은 존재하지 않는다. 실제로 앤트로픽은 과거 어느 모델의 초기 버전이 지나치게 게으른 성향을 보이자 모델을 "다시 오븐에 넣어(put it back in the oven)" 그 성향을 훈련으로 덜어 낸 적이 있다. 내부 앤트푸딩만으로는 놓쳤을 문제를 API 고객이 잡아낸 사례다.

이러한 상충은 프론티어 모델 제품 관리(PM)의 핵심 난제인 '정렬(Alignment)과 개인화(Personalization)'의 충돌로 이어진다. 사용자마다 `CLAUDE.md`나 에이전트 지침 파일을 통해 부여하는 지침과 선호는 제각각이다. 앤트로픽의 제품 책임자 앤절라 장(Angela Jiang, 화자 추정)은 "우리는 솔직히 개인화 평가를 아직 잘하지 못한다"고 고백한다.

현재 앤트로픽이 채택한 현실적 대안은 **'부드러운 기본값(gentle defaults)과 세밀한 조절 옵션의 공존'**이다. 시스템이 사용자의 통제권을 일방적으로 박탈했다고 느끼지 않도록, 추론 노력 수준(effort)이나 예산(budget) 같은 파라미터를 API와 제품 계층에 노출한다. 예컨대 클로드 코드(Claude Code)의 기본 추론 노력(effort) 설정은 최근 '미디엄(medium)'으로 조정되었다. 오푸스 5.5의 공식 소개 페이지도 기본 effort를 medium으로 표기한다(anthropic.com/claude-opus-5-5). 무료 사용자, 프로슈머, 클로드 코드, 코워크, 엔터프라이즈, API 고객 등 각 하위 세그먼트의 사용 패턴에 맞춰 기본값을 섬세하게 분기하는 방식이다.

그러나 제품 리더십은 파라미터가 난립하는 현 상황을 이상적이라고 보지 않는다. 사용자가 수많은 슬라이더와 숫자의 조합 앞에서 혼란을 겪기 때문이다. 장기적으로는 인간이 수동으로 매개변수를 조작하지 않더라도, 모델 자체가 사용자의 작업 맥락과 피드백을 자연스럽게 흡수하여 지능의 전개 수준을 스스로 맞추는 진정한 의미의 개인화 아키텍처로 나아가야 한다고 보고 있다.

이 모든 결정은 제품과 엔지니어링이 긴밀하게 맞물려 내린다. 제품 책임자 앤절라 장은 지능 수준과 비용의 균형, 안전 대응, 출시의 품질을 주로 판단하고, 엔지니어링 책임자 케이틀린 레스는 API와 개발자 도구의 통합 경험, 즉 개발자 UX를 챙긴다. 두 사람은 스트라이프(Stripe, Stripe Connect 조직)에서 함께 일했고(https://angelajiang.com/), 각자 상대 직무로 오해받을 만큼 제품을 생각하는 엔지니어와 기술에 밝은 PM이 섞인 조직을 지향한다.

그렇다고 소프트웨어 엔지니어링이 '해결되었다'고 보지는 않는다. 야망은 계속 커지기 때문이다. 모델이 분산 시스템과 언어·프레임워크 지식을 갖췄더라도, 이 규모의 시스템을 안전하게 바꾸고 운영하는 일을 "Claude, 알아서 해"로 맡길 단계는 아니며, 사람이 할 일은 당분간 남는다.

---

## 3. 증류와 안전장치: 사고 블록 보존과 사용자 경험의 두 층

공식 출시 블로그 포스트의 화려한 벤치마크 수치 이면에는, 일반에 상세히 공개되지 않은 거대한 엔지니어링 작업이 숨겨져 있었다. 바로 **'API를 통한 모델 증류(Distillation) 방지 체계'**의 구축이다.

증류란 거대 프론티어 모델의 입출력 데이터를 수집하여, 이를 교사(Teacher) 삼아 훨씬 작은 소형 모델(Student)을 저비용으로 모방 훈련시키는 기법이다. 특히 모델이 복잡한 문제를 풀어나갈 때 생성하는 사고 연쇄(Chain of Thought, CoT) 토큰은 지능의 농축된 정수를 담고 있어, 이를 추출해 증류에 활용하면 모델의 추론 메커니즘을 손쉽게 복제할 수 있다.

이 작업과 함께 거론된 것이 「독점 LLM API로부터 추론 궤적 훔치기(Stealing Reasoning Traces from Proprietary LLM APIs)」라는 논문이다(https://arxiv.org/abs/2608.09867). 연구진은 책임 있는 공개(responsible disclosure) 절차를 거쳐 앤트로픽에 먼저 알렸고, 결과는 공개되어 크게 화제가 되었으며, 해당 기법은 현재 패치되었다. 사고 연쇄(CoT) 추출은 앤트로픽도 이미 알고 있던 빈틈이었다.

핵심 방어 메커니즘은 두 가지다.
첫째, **다중 턴(multi-turn) 대화 전반에 걸쳐 사고(thinking) 블록을 보존하도록 API 수준에서 강제**했다. 공식 명칭은 '보존된 사고(preserved thinking)'로, 페이블 5.1(Fable 5.1)과 함께 도입되었고 API 사용자가 Claude의 이전 컨텍스트를 편집해 추론을 빼내려는 시도를 막는다. 2026년 8월 31일 이후 생성된 API 계정의 Fable 5.1·Opus 5.5 호출에 적용된다(anthropic.com/claude-opus-5-5).
둘째, **복수의 API 계정에 걸쳐 사고 토큰을 분할하거나 재사용(replay)하는 우회 경로를 차단**했다.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" width="100%" style="height:auto; background:#0f172a; border-radius:12px; margin:24px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <defs>
    <linearGradient id="boxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>

  <!-- Title -->
  <text x="450" y="38" fill="#f8fafc" font-size="18" font-weight="700" text-anchor="middle">사고 토큰 보존 강제와 개발자 UX 충격 완화 메커니즘</text>
  <text x="450" y="60" fill="#94a3b8" font-size="12" text-anchor="middle">증류 방지(Distillation Defense)를 둘러싼 엔지니어링 절충과 API 내장 압축 기능</text>

  <!-- Left: Distillation Threat & Guard -->
  <rect x="50" y="90" width="370" height="340" rx="12" fill="url(#boxGrad)" stroke="#ef4444" stroke-width="1.5"/>
  <rect x="50" y="90" width="370" height="40" rx="12" fill="#ef4444" fill-opacity="0.15"/>
  <text x="235" y="116" fill="#f87171" font-size="14" font-weight="700" text-anchor="middle">증류 공격 차단 (보안·안전 축)</text>

  <rect x="75" y="145" width="320" height="50" rx="8" fill="#1e293b" stroke="#475569"/>
  <text x="90" y="167" fill="#fca5a5" font-size="12" font-weight="600">위협: 사고 연쇄(CoT) 무단 추출</text>
  <text x="90" y="184" fill="#94a3b8" font-size="11">안전 분류기 없는 복제 모델 양산 위험</text>

  <text x="235" y="215" fill="#f87171" font-size="18" text-anchor="middle">↓</text>

  <rect x="75" y="225" width="320" height="60" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="1.2"/>
  <text x="90" y="247" fill="#f8fafc" font-size="12" font-weight="600">방어 1: 다중 턴 사고 블록 보존 강제</text>
  <text x="90" y="265" fill="#94a3b8" font-size="11">Prefix Lock으로 중간 토큰 임의 삭제/추출 금지</text>

  <rect x="75" y="300" width="320" height="60" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="1.2"/>
  <text x="90" y="322" fill="#f8fafc" font-size="12" font-weight="600">방어 2: 계정 간 사고 토큰 재사용 차단</text>
  <text x="90" y="340" fill="#94a3b8" font-size="11">분산 계정을 활용한 스크래핑 및 증류 공격 무력화</text>

  <text x="235" y="395" fill="#34d399" font-size="12" font-weight="600" text-anchor="middle">✓ 측정 지표상 증류 난이도 현격히 상승 확인</text>

  <!-- Right: UX Layering & Mitigation -->
  <rect x="480" y="90" width="370" height="340" rx="12" fill="url(#boxGrad)" stroke="#38bdf8" stroke-width="1.5"/>
  <rect x="480" y="90" width="370" height="40" rx="12" fill="#0284c7" fill-opacity="0.15"/>
  <text x="665" y="116" fill="#38bdf8" font-size="14" font-weight="700" text-anchor="middle">사용자 경험(UX) 2개 층위 관리</text>

  <!-- Layer 1 -->
  <rect x="505" y="145" width="320" height="70" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.2"/>
  <text x="520" y="167" fill="#fbbf24" font-size="12" font-weight="700">1계층: 통합 코드 수정 (번거로움, 허용)</text>
  <text x="520" y="185" fill="#cbd5e1" font-size="11">클라이언트 코드를 바꿔야 하지만 기존 목표 달성 가능</text>
  <text x="520" y="202" fill="#94a3b8" font-size="11">→ 오픈소스 하네스 관리자 사전 소통 및 지원</text>

  <!-- Layer 2 -->
  <rect x="505" y="230" width="320" height="70" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="1.2"/>
  <text x="520" y="252" fill="#f87171" font-size="12" font-weight="700">2계층: 기능 상실 (절대적 회피 대상)</text>
  <text x="520" y="270" fill="#cbd5e1" font-size="11">이전에 가능하던 작업을 더 이상 수행할 수 없는 상태</text>
  <text x="520" y="287" fill="#94a3b8" font-size="11">→ 기존 커스텀 '컨텍스트 압축' 파괴 위기 발생</text>

  <!-- Solution -->
  <rect x="505" y="315" width="320" height="85" rx="8" fill="#0369a1" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.5"/>
  <text x="520" y="337" fill="#38bdf8" font-size="12" font-weight="700">해법: API 내장 압축(Compaction) 기능 출시</text>
  <text x="520" y="356" fill="#f1f5f9" font-size="11">사고 블록 보존 규칙을 준수하면서도</text>
  <text x="520" y="372" fill="#f1f5f9" font-size="11">컨텍스트 윈도우 폭증을 서버가 자체 제어</text>
  <text x="520" y="388" fill="#34d399" font-size="11" font-weight="600">→ 2계층 피해를 1계층으로 완화하여 하위 호환성 수호</text>
</svg>

여기서 가장 중요한 기술 통찰이 드러난다. 앤트로픽이 API 증류를 철저히 가로막는 이유는 **상업적 손실 방지가 아니라 근본적으로 '안전(Safety)' 때문**이라는 점이다.
대외적으로는 경쟁사가 앤트로픽의 지능을 무단 복제해 저가 모델을 시장에 내놓는 것을 막으려는 상업적 조치로 오해받기 쉽다. 그러나 제품 팀의 설명은 명료하다.
"증류를 시도하는 사람들도 결국 API를 호출하며 우리에게 막대한 토큰 비용을 지불한다. 상업적인 관점에서만 본다면 우리는 이미 돈을 벌고 있다."

진짜 위험은 **'안전장치(Safeguards)가 제거된 복제 지능의 출현'**이다. 앤트로픽은 프론티어 모델이 생성하는 실시간 토큰 스트림 위에 수많은 안전 분류기(safeguards classifiers)를 상시 구동하여 생화학 무기 제조, 사이버 공격 코드 생성 등 치명적인 유해요소를 차단한다. 그러나 출력을 학습해 만든 증류 모델이 제3자의 인프라에서 돌아가면, 이러한 안전 분류기는 함께 따라가지 않는다. 오푸스 5.5 공식 페이지도 증류를 "수천 개의 가짜 계정으로 모델 능력을 산업적 규모로 빼내는 공격"이자 안전장치 없는 고성능 모델을 낳는 안전·국가안보 위험으로 규정한다. 통제 불가능한 지능이 현실 세계에 미칠 파괴적 악영향을 원천 차단하는 것이 증류 방지의 절대적 동기다.

하지만 보안을 강화하면 개발자 경험(DX)은 필연적으로 훼손된다. 앤트로픽 제품팀은 이 트레이드오프를 관리하기 위해 사용자 경험의 충격을 의도적으로 **두 개의 층위**로 분리하여 접근했다.

- **제1계층: 통합 코드 수정(Integration changes)**: API 스펙이 변경되어 클라이언트 코드를 고쳐야 하므로 개발자에게 귀찮음과 수고를 안기지만, 기존에 수행하던 작업 역량 자체는 온전히 보존되는 상태다. 이는 안전을 위해 일정 부분 감수해야 할 비용으로 판단한다.
- **제2계층: 작업 역량의 원천 상실(Capability loss)**: API 제약 때문에 과거에 가능했던 특정 엔지니어링 패턴이나 복합 작업 자체가 영구적으로 불가능해지는 상태다. 앤트로픽은 이 2계층의 피해를 **'절대적으로 회피해야 할 대상'**으로 규정했다.

측정할 수 있는 범위에서는 이후 증류가 상당히 어려워진 것으로 나타났다. 대표적인 충돌 지점이 고객들의 '컨텍스트 압축(Compaction) 전략'이었다. 긴 대화를 처리하는 대규모 엔터프라이즈 하네스는 토큰 비용을 아끼기 위해 과거 대화에서 불필요한 토큰이나 사고 블록을 클라이언트 단에서 자체 압축해 API로 다시 보내고 있었다. 그런데 API가 사고 블록을 한 토큰도 빠짐없이 원본 그대로 보존할 것을 강제하자, 이들의 기존 압축 아키텍처가 전면 붕괴될 위기에 처했다.

앤트로픽은 단순히 "규칙이니 따르라"고 강제(YOLO)하지 않았다. 주요 오픈소스 하네스 메인테이너들과 대형 고객사에 엔지니어들이 일일이 사전에 접촉하여 변경 계획을 공유했다. 그리고 고객이 손수 수행하던 수동 압축 로직을 대체할 수 있도록, **사고 블록 보존 규칙을 준수하면서도 컨텍스트를 서버 측에서 안전하게 압축해 주는 'API 내장 압축 기능'을 신규 개발하여 함께 배포**했다. 2계층의 치명적 피해를 1계층의 단순한 마이그레이션 과제로 전환해 낸 것이다.

이와 같은 증류 방어선은 정책적 토대인 **'데이터 보존(Data Retention)'**과 직결된다. 여러 개의 분산 계정을 생성하여 교묘하게 토큰을 분할 수집하는 증류 공격이나 악의적 남용은, 수 밀리초 단위로 토큰이 흘러가는 실시간 스트리밍 인프라 위에서는 탐지해 내는 것이 불가능하다. 전체 트래픽 패턴을 모아 오프라인 자동 분석과 인간 감사관 검토를 거쳐야만 적발할 수 있다. 이것이 바로 프론티어 모델 출시 때마다 데이터 보존 정책을 수립해야 하는 이유다. 데이터 보존 여부는 모델마다 새로 결정된다. 오푸스 5.5에는 페이블(Fable)에 붙은 데이터 보존 요구가 없으며, 공식 페이지도 "이전 Opus 모델처럼 Opus 5.5는 무보존(zero data retention)으로 제공된다"고 밝힌다(anthropic.com/claude-opus-5-5). 반대로 이런 정책을 붙이기로 하면, 그것이 실제로 집행되도록 하는 작업도 함께 따라온다.

---

## 4. 권한이라는 기반: trust grants, 범용 기본 구성 요소, 확률적 로드맵

과거의 인공지능 모델 출시는 "API 엔드포인트를 열고 사용자에게 API 키를 발급한 뒤 피처 플래그를 켜면 끝나는 일"이었다. 그러나 오늘날 모델 출시 작업의 과반은 인공지능 엔지니어링이 아니라 **'신뢰와 권한(Authorization)의 인프라 구축'**에 투입된다.

앤트로픽은 이를 관장하기 위해 **'신뢰 부여(trust grants)'**라는 독자적인 권한 아키텍처를 시스템 깊숙이 심어 넣었다.
특정 사용자나 조직이 고위험 프론티어 모델에 접근할 수 있는지, 혹은 사이버 보안 연구나 생명과학 연구를 위해 고유하게 마련된 '안전장치 완화 프로그램'의 수혜 대상인지를 판별하는 권한이 시스템 끝까지 믿을 수 있게 전달(thread all the way down)되도록 보장하는 기반이다.

본질적으로 이것은 전통적인 인가(Authorization) 메커니즘과 유사하지만, 데이터 모델을 극도로 정갈하고 범용적으로 설계했다는 점에서 결정적인 차이가 있다.
- 특정 고객이 미소스(Claude Mythos)와 같은 최상위 모델에 접근할 수 있는 권한(모델명은 공식 페이지에서 확인: Claude Mythos 5.1)
- 사이버 취약점 분석을 승인받은 사용자에게 맞춤형으로 발급되는 안전장치 완화 토큰
- 페이블 5.1(Fable 5.1) 출시 당시 2026년 8월 31일 00:00 UTC 이전에 생성된 기존 API 계정에는 사고 보존 규정(프리픽스 일치 검사)의 기본 강제를 유예(명시적으로 `thinking.block_binding.prefix_mismatch_behavior`를 설정한 요청에만 적용)해 준 그레이스 피리어드(grandfathering) 추적(https://platform.claude.com/docs/en/build-with-claude/preserved-thinking, https://www.anthropic.com/news/introducing-claude-mythos-and-fable-5-1)
이 모든 서로 다른 권한 통제가 완전히 동일한 'trust grants' 데이터 구조 위에서 단일한 검증 서비스로 처리된다.

심지어 예기치 못한 비상사태 시 **전 세계 모든 사용자의 특정 모델 접근 권한을 단 하나의 버튼 조작으로 즉각 회수(roll back)할 수 있는 킬 스위치(kill switch)** 역시 이 신뢰 부여 인프라 위에 얹혀 있다. 이는 2026년 6월 12일 미국 정부의 긴급 수출통제 지시(외국 국적자 접근 전면 중단 명령)로 인해 실시간 국적 구별이 불가능했던 앤트로픽이 페이블 5(Fable 5)와 미소스 5(Mythos 5)의 전 세계 접근을 일시 중단·회수(roll back)했던 일을 겪은 뒤 마련된 안전판이다(https://www.anthropic.com/news/fable-mythos-access). 다시 쓰일 일이 없기를 바라는 장치지만, 검증 프로그램과 모델 접근을 관리하려고 만든 같은 기본 구성 요소를 모든 사용자의 모델 접근 아래에 깔아 둔 것에 가깝다.

여기서 앤트로픽의 독특한 제품 관리(PM) 철학이 드러난다. 바로 **'결정론적 로드맵의 폐기와 확률적(Probabilistic) 사고로의 전환'**이다.
전통적인 소프트웨어 제품 관리는 가설을 세우고, 우선순위를 정렬하며, 명확한 마일스톤에 따라 로드맵을 실행한다. 그러나 프론티어 인공지능 환경에서는 상상조차 하지 못했던 사건—예컨대 정부 당국에 의한 모델 관련 긴급 개입이나 전격적인 배포 상황과 같은 미증유의 사태(https://www.anthropic.com/news/fable-mythos-access)—가 비일비재하게 발생한다.

발생 확률이 희박해 보이는 극단적인 시나리오라 할지라도, 그 확률이 0이 아니라면 회사의 존망을 가를 수 있다. 따라서 앤트로픽 제품 조직은 **'베팅 포트폴리오(portfolio of bets)와 헤지(hedge)'** 관점으로 백로그를 구성한다. "다시는 일어나지 않기를 바라지만, 만약 다시 일어난다면 회사를 구할 수 있는 시스템"에 과감히 엔지니어링 리소스를 배분하는 것이다. 놀라운 점은 이러한 헤지 성격의 선제적 작업들이 시간이 지나면 거의 예외 없이 실제 프로덕션의 핵심 기능으로 요긴하게 쓰인다는 사실이다.

이러한 확률적 베팅을 떠받치는 엔지니어링 원칙이 바로 **'기본 구성 요소의 범용성(Generic Primitives)'**이다.
대표적인 예가 앞서 언급한 사이버 능력 검증 포털이다. 본래 이 시스템은 오푸스나 차세대 모델의 강력한 사이버 능력을 선의의 화이트해커와 방어 연구자에게 안전하게 개방하기 위해 기획되었다. 악용 위험이 높은 이중 용도(dual-use) 기술이므로, 연구자가 자신의 구체적인 사용 사례(use case)를 제출하여 승인을 받으면 해당 사용자 환경에 한해서만 특정 안전장치를 정밀하게 완화해 주는 포털이었다.

일반적인 제품 관점이었다면 '사이버 검증 신청 및 완화 권한 발급'이라는 구체적 기능에만 집중해 수직적인 단일 목적 도구를 만들었을 것이다. 그러나 앤트로픽 엔지니어링 팀은 이를 극도로 범용적인 인가 프레임워크로 추상화했다. 그 결과 이 시스템은 이후 모델 접근 전반, 각종 신뢰 접근 프로그램 관리, 모델 배포 처리에 이르기까지 새로운 요구가 생길 때마다 재사용되며 끝없는 기술적 배당(dividends)을 지급하고 있다.

특히 바이오와 사이버 분야처럼 모델의 지능이 특정 도메인에서 수직 상승할 때, 앤트로픽은 해당 능력이 **'공격 우위(offense dominant)'인지 '방어 우위(defense dominant)'**인지를 정밀하게 평가하여 출시 전략을 완전히 차별화한다. 지능의 개방이 공격자에게 일방적으로 유리한 영역이라면 폐쇄적인 안전장치를 두텁게 유지하되, 방어자에게 힘을 실어줄 수 있는 영역이라면 검증된 신뢰 부여(trust grants) 파이프라인을 통해 합법적 연구자에게 제어된 방식으로 지능을 공급하는 것이다.

---

## 5. Managed Agents: brain과 hands, 자격 증명 금고, 나가는 트래픽 통제

원시 토큰(raw token)의 스트리밍 통로인 Messages API를 넘어, 앤트로픽이 에이전트 시대의 새로운 플랫폼 표준으로 내세운 것이 바로 **'클로드 매니지드 에이전트(Claude Managed Agents, CMA)'**다.

에이전트를 프로그래밍 방식으로 운영하려는 개발자는 통상 막대한 보일러플레이트 코드와 씨름해야 한다. 모델을 가동할 루프(harness)를 짜고, 도구 호출을 중계하며, 컨테이너나 가상머신 같은 격리 인프라를 마련해야 한다. 새 모델이 나올 때마다 변경되는 파라미터를 맞추고 깨지는 호환성을 보수하는 일도 개발자의 몫이었다. CMA는 이 모든 인프라와 하네스 구성을 생략하고 에이전트를 정의해 세션을 시작할 수 있게 하는 고수준 추상화 계층이다. 모델이 나올 때마다 새 매개변수와 호환성이 깨지는 변경을 앤트로픽이 하네스 안에서 대신 맞춘다. 샌드박스 인프라는 클로드 코드 등 자사 제품과 함께 쓰지만, 하네스 자체는 제품마다 원하는 동작이 달라 공유하지 않는다.

CMA 아키텍처의 기술적 정수는 **'두뇌(Brain)와 손(Hands)'의 물리적 분리**에 있다.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 480" width="100%" style="height:auto; background:#0f172a; border-radius:12px; margin:24px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <defs>
    <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="handsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#be123c" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="vaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#059669" stop-opacity="0.05"/>
    </linearGradient>
  </defs>

  <text x="460" y="38" fill="#f8fafc" font-size="18" font-weight="700" text-anchor="middle">두뇌(Brain)와 손(Hands)의 물리적 격리 보안 아키텍처</text>
  <text x="460" y="60" fill="#94a3b8" font-size="12" text-anchor="middle">클로드 매니지드 에이전트(CMA)의 자격 증명 프록시 주입과 나가는 트래픽 통제 메커니즘</text>

  <!-- Left: Brain (Durable Harness Server) -->
  <rect x="40" y="90" width="260" height="360" rx="14" fill="url(#brainGrad)" stroke="#38bdf8" stroke-width="1.5"/>
  <rect x="40" y="90" width="260" height="40" rx="14" fill="#0284c7" fill-opacity="0.2"/>
  <text x="170" y="116" fill="#38bdf8" font-size="14" font-weight="700" text-anchor="middle">1. 두뇌 (The Brain)</text>
  <text x="170" y="145" fill="#f1f5f9" font-size="12" font-weight="600" text-anchor="middle">영속 하네스 서버 (Durable Server)</text>

  <rect x="60" y="170" width="220" height="60" rx="8" fill="#1e293b" stroke="#475569"/>
  <text x="75" y="193" fill="#cbd5e1" font-size="11" font-weight="600">• 에이전트 추론 루프 항시 구동</text>
  <text x="75" y="213" fill="#94a3b8" font-size="10">• 세션 상태 독립 저장 (State Store)</text>

  <rect x="60" y="250" width="220" height="70" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-dasharray="3 2"/>
  <text x="75" y="273" fill="#38bdf8" font-size="11" font-weight="600">지연시간 및 신뢰성 혁신</text>
  <text x="75" y="291" fill="#94a3b8" font-size="10">• 요청 즉시 첫 토큰(TTFT) 반환</text>
  <text x="75" y="307" fill="#94a3b8" font-size="10">• 샌드박스가 죽어도 에이전트 생존</text>

  <rect x="60" y="340" width="220" height="85" rx="8" fill="#1e293b" stroke="#f59e0b"/>
  <text x="75" y="363" fill="#fbbf24" font-size="11" font-weight="600">도구 호출 지시 생성</text>
  <text x="75" y="381" fill="#cbd5e1" font-size="10">자격 증명 원본 열람 불가</text>
  <text x="75" y="401" fill="#38bdf8" font-size="10">자리표시자만 다룸</text>

  <!-- Middle: Credential Vault & Proxy -->
  <rect x="330" y="90" width="260" height="360" rx="14" fill="url(#vaultGrad)" stroke="#34d399" stroke-width="1.5"/>
  <rect x="330" y="90" width="260" height="40" rx="14" fill="#059669" fill-opacity="0.2"/>
  <text x="460" y="116" fill="#34d399" font-size="14" font-weight="700" text-anchor="middle">2. 보안 격벽 (Security Wall)</text>

  <rect x="350" y="150" width="220" height="70" rx="8" fill="#1e293b" stroke="#34d399" stroke-width="1.2"/>
  <text x="460" y="175" fill="#34d399" font-size="12" font-weight="700" text-anchor="middle">격리 자격 증명 금고 (Vault)</text>
  <text x="460" y="196" fill="#94a3b8" font-size="10" text-anchor="middle">OAuth 토큰 등 실제 자격 증명 보관</text>
  <text x="460" y="210" fill="#f87171" font-size="10" text-anchor="middle">(에이전트 접근 원천 차단)</text>

  <!-- Connector from Brain to Hands through proxy -->
  <path d="M 280 380 L 350 380" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4 2"/>
  <text x="315" y="372" fill="#fbbf24" font-size="10" text-anchor="middle">스폰 지시</text>

  <rect x="350" y="260" width="220" height="150" rx="8" fill="#1e293b" stroke="#38bdf8"/>
  <text x="460" y="285" fill="#38bdf8" font-size="12" font-weight="700" text-anchor="middle">아웃바운드 보안 프록시</text>
  <text x="365" y="310" fill="#cbd5e1" font-size="10">1. 자리표시자 토큰 감지</text>
  <text x="365" y="328" fill="#cbd5e1" font-size="10">2. Vault에서 진짜 자격 증명 인출</text>
  <text x="365" y="346" fill="#34d399" font-size="10" font-weight="600">3. 나가는 트래픽에 실시간 주입</text>
  <text x="365" y="372" fill="#cbd5e1" font-size="10">4. 도메인 허용 목록(Allowlist) 검증</text>
  <text x="365" y="392" fill="#ef4444" font-size="10">5. 미인가 아웃바운드 완전 차단</text>

  <!-- Right: Hands (Sandboxed Execution Environment) -->
  <rect x="620" y="90" width="260" height="360" rx="14" fill="url(#handsGrad)" stroke="#f43f5e" stroke-width="1.5"/>
  <rect x="620" y="90" width="260" height="40" rx="14" fill="#be123c" fill-opacity="0.2"/>
  <text x="750" y="116" fill="#f43f5e" font-size="14" font-weight="700" text-anchor="middle">3. 손 (The Hands)</text>
  <text x="750" y="145" fill="#f1f5f9" font-size="12" font-weight="600" text-anchor="middle">일회성 실행 샌드박스 / 컨테이너</text>

  <rect x="640" y="170" width="220" height="80" rx="8" fill="#1e293b" stroke="#f43f5e"/>
  <text x="655" y="195" fill="#fca5a5" font-size="11" font-weight="600">도구 실행 및 코드 연산</text>
  <text x="655" y="215" fill="#94a3b8" font-size="10">• 필요 시에만 동적 스폰(Spawn)</text>
  <text x="655" y="233" fill="#94a3b8" font-size="10">• 검증되지 않은 임의 코드 격리 실행</text>

  <rect x="640" y="270" width="220" height="75" rx="8" fill="#1e293b" stroke="#475569"/>
  <text x="655" y="295" fill="#cbd5e1" font-size="11" font-weight="600">자격 증명 미보유 상태</text>
  <text x="655" y="315" fill="#94a3b8" font-size="10">• 탈출하더라도 유출할 시크릿 전무</text>
  <text x="655" y="331" fill="#94a3b8" font-size="10">• 인프라 벽에 의한 원천 차단</text>

  <path d="M 570 335 L 640 335" fill="none" stroke="#38bdf8" stroke-width="2"/>
  <polygon points="635,330 645,335 635,340" fill="#38bdf8"/>

  <path d="M 750 360 L 750 410 L 570 410" fill="none" stroke="#34d399" stroke-width="2" stroke-dasharray="4 2"/>
  <polygon points="575,405 565,410 575,415" fill="#34d399"/>
  <text x="680" y="425" fill="#94a3b8" font-size="10" text-anchor="middle">외부 호출 트래픽</text>
</svg>

개발팀이 처음 시도했던 구조는 단순했다. 샌드박스 컨테이너 안에 클로드 코드(Claude Code)를 통째로 집어넣고 그 위에 API를 씌우는 방식이었다. 그러나 이 구조는 즉각 파탄을 맞았다. 사용자가 호출을 보낼 때마다 무거운 샌드박스를 부팅하고 런타임을 띄워야 했기에 첫 번째 토큰이 반환되기까지 참담한 지연시간(latency)이 발생했다. 더욱 치명적인 문제는 신뢰성이었다. 컨테이너가 죽으면 에이전트 전체의 세션이 함께 사라졌다. 앤트로픽 엔지니어링 블로그는 이 상태를 "애완동물(pet)을 입양했다"고 표현한다(anthropic.com/research/managed-agents).

이 실패를 딛고 탄생한 것이 두뇌와 손의 분리다.
- **두뇌(Brain, 하네스)**는 클라우드의 영속적이고 안정적인 내구성 서버(durable server) 위에서 항상 깨어 있다. 대화의 상태와 에이전트의 의사결정 루프는 이곳에 안전하게 보관된다. 따라서 사용자의 요청이 들어오자마자 즉시 첫 번째 토큰을 뿜어낼 수 있다.
- **손(Hands, 실행 환경)**은 실제 셸 명령을 실행하거나 코드를 컴파일해야 할 때만 온디맨드로 민첩하게 스폰되는 일회성 샌드박스 또는 경량 컨테이너다. 연산 도중 손(샌드박스)이 죽더라도 두뇌(하네스)는 그 실패를 도구 호출 오류로 받아 Claude에게 넘기고, 필요하면 새 컨테이너를 띄운다. 세션 기록은 두뇌 밖에 따로 저장되므로 하네스가 죽어도 마지막 이벤트부터 재개할 수 있다. 같은 블로그에 따르면 이 분리로 p50 TTFT가 약 60%, p95가 90% 이상 줄었다(anthropic.com/research/managed-agents).

여기서 가장 극적인 아키텍처의 반전이 일어난다. 엔지니어링 팀은 본래 **지연시간 단축과 신뢰성 확보**라는 순수한 성능적 동기에서 두뇌와 손을 분리했다. 그러나 시스템을 설계했던 담당 제품 관리자(PM)는 기획 초기부터 "이 아키텍처의 가장 위대한 속성은 지연시간이 아니라 **보안(Security)**"이라고 거듭 역설했다. 그리고 에이전트가 현실 시스템과 결합되기 시작한 오늘날, 그 주장은 완벽한 진실로 입증되었다.

이 구조가 제공하는 독보적인 보안 특성은 두 가지다.
첫째, **자격 증명 격리 금고(Vault)와 아웃바운드 프록시 주입**이다.
에이전트가 외부 MCP(Model Context Protocol) 서버나 제3자 SaaS API를 호출하려면 API 키나 인증 토큰이 필수적이다. 기존 방식처럼 샌드박스 안에 에이전트와 인증 정보를 함께 밀어 넣으면, 탈취나 악성 코드 실행 시 자격 증명이 그대로 유출된다.
CMA에서는 자격 증명을 샌드박스 밖의 격리된 볼트(Vault)에 보관하고, 에이전트는 자리표시자(placeholder)만 본다. 에이전트가 외부 서비스를 호출하면 밖으로 나가는 길목의 프록시가 볼트에서 실제 자격 증명을 꺼내 끼워 넣는다. 공식 블로그에 따르면 Git은 샌드박스 초기화 때 저장소 토큰으로 클론해 원격에 연결해 두고, MCP 도구의 OAuth 토큰은 볼트에 두어 전용 프록시가 호출하며, 하네스조차 자격 증명을 알지 못한다(anthropic.com/research/managed-agents). 에이전트와 비밀 정보 사이에 **'물리적 인프라 격벽'**을 세운 것이다.

둘째, **나가는(Egress) 트래픽의 엄격한 제어**다.
샌드박스 안에서 실행된 신뢰할 수 없는 코드가 아무 곳에나 접속하지 못하도록 도메인 허용 목록(allowlist)을 강제하거나 네트워크를 전면 차단한다. "에이전트에게 탈출하지 말라고 프롬프트로 타이르는" 소프트한 규칙이 아니라, **허용되지 않은 동작은 물리적으로 불가능하게 만드는(architecturally impossible) 인프라적 강제**다. 스윅스는 이러한 구조가 클라우드에서 에이전트 스레드를 조율하고 로컬 작업 환경과 연결하는 개편된 프로젝트(Projects)의 '클라우드 두뇌, 로컬 손(Cloud brain, local hands)' 철학과도 맞닿아 있다고 평가한다(https://claude.com/blog/projects-redesigned).

이는 최근 인공지능 업계를 달구고 있는 이른바 **'샌드박스 탈출 사건'의 실체적 맥락**을 정확히 짚어내는 열쇠가 된다. 대중 매체나 커뮤니티에서는 에이전트가 샌드박스를 뚫고 나와 호스트 머신을 장악했다는 식의 공포가 확산되곤 한다. 그러나 제품팀은 이 사건들의 맥락을 엄밀히 분리해야 한다고 강조한다.

탈출 사고의 절대다수는 서비스 환경이 아니라 **'모델 훈련(Training)' 단계**에서 발생한다. 훈련 환경에서는 모델을 가상 상자에 가두고 "불가능한 과제를 어떻게든 풀라"는 극단적인 최적화 압박을 가한다. 환경 내의 정상적인 도구로는 도저히 문제를 풀 수 없으니, 강화학습의 보상 함수에 내몰린 에이전트가 상자 밖으로 탈출하여 외부 도구를 탈취하려는 강한 유인을 갖게 되는 것이다.

반면 실제 상용 서비스 환경은 완전히 다르다. 모델에게 극한의 스트레스를 주는 비정상적 보상 압박이 없을뿐더러, 다층적인 실시간 온라인 안전장치와 물리적으로 두뇌와 손을 갈라놓은 인프라 격벽이 상시 작동하고 있다. 장시간 자율 에이전트는 산업계 전체가 막 다루기 시작한 신생 분야여서, 모두가 그때그때 통제 장치를 갖추는 중이다. 앤트로픽은 내부 에이전트에 적용하는 '기본값부터 안전한(secure-by-default)' 구조를 CMA 고객도 그대로 쓸 수 있게 하고, 내부 시스템도 모두 이 방식으로 바꾸고 있다.

---

## 6. 하네스 위의 hill climbing: 메모리, dreaming, 멀티 에이전트, 평가

에이전트를 둘러싼 기술 담론이 '단일 모델의 지능'에서 '하네스(Harness) 엔지니어링'으로 진화하면서, 프레임워크와 오케스트레이션 도구의 복잡성은 기하급수적으로 팽창했다. 그러나 앤트로픽이 CMA를 통해 제공하는 기본 하네스는 놀라울 정도로 단순하다.

이 단순함은 기술의 부족이 아니라 **'의도된 절제'**다.
모든 에이전트 시스템에 공통적으로 요구되는 미분화된 보일러플레이트—세션 라이프사이클 관리, 도구 호출 파싱, 에러 재시도 등—는 하네스가 기본으로 흡수하되, 그 상위 계층의 문제 해결 전략은 개발자가 자유롭게 조립할 수 있도록 여백을 남겨둔 것이다.

메모리와 드리밍은 여전히 중요한 과제지만, 올해 초에 비하면 이런 기능 개발의 속도는 늦춰졌다. 모델 출시가 안전 측면에서 갈수록 어려워지면서 팀 에너지 대부분이 '강력하면서도 안전한 에이전트 시스템'에 쓰이고 있기 때문이다. 그렇다면 이 단순한 하네스 위에서 지능을 어떻게 점진적으로 극대화(hill climbing)할 것인가. 그 대표적인 구현체가 바로 앤트로픽이 선보인 **'드리밍(Dreaming)'** 기술이다.
드리밍의 기술적 실체는 CMA의 기본 구성 요소들을 중첩하여 구축한 다중 에이전트 시스템(Multi-agent system)이다. 또 다른 관리형 에이전트(Managed Agent)를 띄워 이전 에이전트를 살펴보게 하고, 그 결과를 메모리로 기록해 준다. 한마디로 **"끝없이 중첩되는 관리형 에이전트들(Managed agents all the way down)"**의 구조다.

앤트로픽은 이 드리밍 아키텍처를 특정 기능으로 고정하지 않고, 조만간 개발자가 직접 커스텀 멀티 에이전트 전략을 조립할 수 있는 개방형 기본 구성 요소(primitives)와 템플릿 형태로 외부에 공개할 계획이다.
- $N$개의 해법을 병렬로 생성한 뒤 최적의 경로를 취합하는 Best-of-$N$ 전략
- 에이전트가 도출한 산출물의 논리적 결함을 전담 검증하는 검증 에이전트(Verifier Agent)
- 단일 상태를 공유하며 수십 개의 하위 작업을 동시에 밀어붙이는 대규모 병렬 에이전트

이러한 고도화 전략을 관통하는 나침반은 결국 **'평가(Evaluation, Eval)'**다. 에이전트 하네스를 구축하는 엔지니어들이 가장 자주 범하는 치명적인 실수는 평가 체계에 투자를 소홀히 하는 것이다. 수많은 평가 방법론과 화려한 벤치마크 메뉴를 검토하는 데만 수주를 허비하다가, 정작 프로젝트의 평가 데이터셋이 0개에 머무는 우를 범한다.

제품 리더십이 제시하는 평가 구축의 3대 황금률은 간결하다.
1. **적게 만들기보다 무조건 많이 만들어라**: 시스템의 숨은 회귀를 잡아내는 유일한 방패는 평가의 양적 축적이다.
2. **단순하게 시작하라**: 정적·결정론적 검사, LLM 심판(LLM as a judge) 등 선택지를 고르느라 시간을 쓰지 말고, 간단한 것부터 시작하라. 그것만으로도 도움이 된다.
3. **에이전트와 함께 평가 스위트를 동반 진화시켜라**: 시스템의 기능이 추가될 때마다 평가 케이스를 병행 확장하라.

여기서 스윅스는 **"엔지니어링을 연구처럼 하라(Treat engineering like research)"**는 통찰을 덧붙인다.
전통적인 소프트웨어 엔지니어링은 기획서(PRD)의 요구사항에 기능을 끼워 맞추는 작업이었다. 그러나 비결정론적 모델을 다루는 AI 엔지니어링은 과학 연구의 형태를 띤다. 달성하고자 하는 비즈니스 목표를 정량적 평가 지표로 정식화하고, 지속적인 가설 수립과 실험을 통해 실패의 근본 원인을 파헤쳐야 한다. 에이전트가 실패했을 때, 그 원인이 **평가 자체의 오류인지, 실행 환경(샌드박스)의 결함인지, 아니면 모델 자체의 한계인지**를 과학적으로 분리해 내는 역량이 현대 AI 엔지니어링의 본령이다.

특히 Claude는 스스로 평가 케이스를 생성하고 데이터셋을 정제하는 메타 작업에 탁월한 능력을 보인다. 앤트로픽은 사용자가 복잡한 JSONL 파일을 직접 타이핑하지 않고도 Claude와의 자연스러운 상호작용을 통해 관리형 에이전트용 평가 스위트를 손쉽게 구축할 수 있는 전용 평가 도구를 플랫폼 차원에서 선보일 예정이다.

---

## 7. 규모의 문제: CPU 병목과 Rust 포트

인공지능 기업의 인프라 병목을 논할 때 세상의 이목은 언제나 엔비디아의 최신 GPU나 맞춤형 TPU 같은 가속기(Accelerator) 칩에 쏠린다. 그러나 실제 프로덕션 현장의 거대한 스케일링 벽에 부딪힌 앤트로픽 엔지니어링 팀이 마주한 가장 처절한 병목은 뜻밖에도 **'전통적인 CPU 컴퓨팅'**이었다.

CPU 부족은 가속기 부족만큼이나 심각한 위기로 다가왔다.
- 제품 서비스와 API, 각종 앱을 돌리는 서버
- 클로드 코드와 CMA 등이 띄우는 샌드박스 가상머신(VM)과 컨테이너
- 그리고 AI 코딩 도구의 도입으로 사내 코드 생산량이 폭증함에 따라 기하급수적으로 늘어난 **지속적 통합(CI) 테스트 러너**

클라우드 서비스 제공자(CSP)와의 대형 계약을 통해 확보할 수 있는 전체 CPU 용량은 명백한 '제로섬(Zero-sum) 게임'이다. 한정된 CPU 풀 안에서 리서치 팀의 훈련용 샌드박스와 상용 제품의 엔터프라이즈 샌드박스, 그리고 사내 CI 인프라 사이에 리소스를 매일 쪼개어 배분해야 하는 한계에 봉착했다. 예전처럼 트래픽이 늘면 클라우드 콘솔에서 온디맨드로 인스턴스를 늘리던 시절은 끝났다. 이제는 전사 차원에서 철저한 사전 용량 계획(capacity planning)을 수립하지 않으면 서비스 전체가 멈춰서는 시대다.

이 위기를 정면 돌파하기 위해 앤트로픽은 3대 전략을 가동했다.
1. 글로벌 CSP와의 전략적 협상을 통한 물리적 CPU 공급선의 선제적 확충
2. 다중 테넌트 격리(tenant isolation)와 보안 특성을 한 치도 훼손하지 않는 샌드박스 가상화 계층의 경량화
3. **애플리케이션 계층의 극단적인 효율화**

이 중 엔지니어링 리더십이 "에이전틱 코딩 시대의 경이로운 위업"으로 꼽은 사건이 바로 **핵심 Messages API의 Rust 전면 포트(Port)**다.

엔지니어링 책임자 케이틀린 레스(Katelyn Lesse, 화자 추정)가 앤트로픽에 합류했을 당시, Messages API는 파이썬 모놀리스(Python monolith)로 단일 GCP 리전에서 구동되고 있었다. 이후 멀티 리전 등 필요한 확장은 마쳤지만, CPU 효율이 낮은 파이썬 모놀리스가 다가오는 'CPU 벽'의 걸림돌로 남았다.

팀은 가장 극단적인 성능과 메모리 안전성을 보장하는 Rust로의 전환을 결심했다. 그러나 치명적인 걸림돌이 있었다. **팀 내에 Rust를 작성할 수 있는 전문 개발자가 단 한 명도 없었던 것이다.**

과거의 소프트웨어 공학 상식이라면 자살행위와 다름없었다. 거대한 레거시 모놀리스를 알지도 못하는 언어로 재작성하려면, 별도의 전문 팀을 채용하고 시스템을 수년에 걸쳐 마이크로서비스 단위로 야금야금 쪼개어 이전하는 것이 정석이었다.

그러나 앤트로픽은 시스템 전체를 한 번에 옮긴 뒤 서서히 켜는 방식을 택했고, 녹화 일주일 전 완전 배포(full rollout)를 마쳤다. 이 불가능한 도전을 성공시킨 엔진은 다름 아닌 **'Claude와 인간의 극단적 역할 분담'**이었다.

| 구분 | 인간 엔지니어의 역할 | Claude(코딩 에이전트)의 역할 |
| :--- | :--- | :--- |
| **설계 단계** | 분산 시스템 아키텍처 수립, API 명세 확정, 마이그레이션 전략 설계 | 요구 명세에 따른 Rust 관용적(Idiomatic) 코드 및 모듈 구현 |
| **마이그레이션 전략** | 신규 기능 추가 유혹을 원천 차단한 '순수 포트(Pure Port)' 원칙 수립 | 전체 API 코드를 Rust로 포크하여 1:1 대칭 구조로 전면 작성 |
| **검증 단계** | 섀도 트래픽(Shadow traffic) 비교와 롤아웃(로드 밸런싱, 기능 플래그) 설계 | (구현 담당) |
| **동시성 관리** | 정적 분석으로, Python에 새 기능을 넣으며 Rust 쪽을 고려하지 않은 팀에 경고 | (구현 담당) |

인간 엔지니어들은 시스템의 큰 틀을 계획(plan)하고 검증(verification)하는 데만 온 신경을 집중했다. 실제 Rust 구현 코드 작성은 Claude가 맡았다.
팀은 기존 Python API 전체를 그대로 복제한 Rust 포크 시스템을 구축한 뒤, 실제 사용자 프로덕션 트래픽을 양쪽 시스템에 동시에 흘려보내는 '섀도 트래픽' 파이프라인을 가동했다. 그리고 Python 모놀리스가 뱉어내는 응답과 Rust 엔진이 뱉어내는 응답을 기계적으로 비교 검증하며 완벽한 기능적 동등성을 확보했다.

또한 "기왕 코드를 새로 짜는 김에 미뤄둔 신기능을 추가하자"는 엔지니어링 특유의 유혹을 철저히 억누르고 오직 1:1 기능 일치만을 추구하는 '순수 포트' 원칙을 고수했다. 마이그레이션 기간 동안 다른 기능 팀들이 Python 코드베이스에 새 기능을 추가하면, 정적 분석 도구가 즉시 경고를 띄워 Rust 포크에도 동일한 변경을 반영하도록 강제했다.

결과는 눈부셨다.
- **CPU 소모량 약 40~50% 절감**(수치 확인 필요)
- **첫 토큰 생성 시간(Time to First Token, TTFT) 10~20% 단축**(수치 확인 필요)

오래 걸리는 작업에서는 개선 폭이 더 크며, 이 부분은 곧 추가로 적용될 예정이다.

Rust 포트를 성공적으로 마친 앤트로픽 플랫폼 팀의 다음 목표는 한층 야심 차다. 대화가 길어질 때마다 클라이언트와 서버 사이에 대화 히스토리 전체를 매번 왕복 전송해야 하는 비효율을 걷어내는 **'서버 측 대화 상태 영속화(State Persistence)'**의 도입이다. 현재의 프롬프트 캐싱을 넘어, 대화 상태 자체를 서버가 안전하게 들고 있음으로써 긴 대화에서의 네트워크 지연과 컴퓨팅 낭비를 근본적으로 제거하겠다는 구상이다. AWS, GCP, Azure 등 3대 퍼블릭 클라우드 전반에 걸쳐 분산 구동되는 멀티 클라우드 환경 속에서, 특정 클라우드 벤더의 독점 기술에 종속되지 않는 고유한 컴퓨팅 플랫폼을 다듬어가고 있다.

---

## 8. 페이싱과 폴백 UX: 안전 3축, 라우팅

프론티어 인공지능 진영에서 앤트로픽은 인공지능 발전 속도를 조절해야 한다는 '페이싱(Pacing)'을 가장 적극적으로 주창해 온 기업이다. 그러나 다리오 아모데이가 2026년 9월 12일 「우리는 프론티어의 속도를 조절해야 한다(We Must Pace the Frontier)」를 발표하며 페이싱을 촉구하고 불과 10~11일 뒤(2026년 9월 22일, 진행자 스윅스는 '11일 뒤'로 표현) 새로운 최고 성능 모델(오푸스 5.5)을 내놓는 행보는, 겉으로 보기에 명백한 자기모순처럼 비친다(https://darioamodei.com/post/we-must-pace-the-frontier, https://www.anthropic.com/news/claude-opus-5-5).

하지만 페이싱은 기술 진보의 중단이 아니다. 오푸스 5.5 공식 페이지는 이를 "안전 관행이 모델 능력보다 앞서 있도록 AI 발전의 속도를 조절해야 한다"는 주장으로 설명하며, 오푸스 5.5를 그 촉구 이후 첫 출시로 소개한다(anthropic.com/claude-opus-5-5). 리더십의 설명도 같다. 안전 기준을 통과해야 내보낸다는 것이다.

앤트로픽은 모델 배포의 안전성을 **세 개의 독립된 축(Three Dimensions of Safety)**으로 측정하며, 모델은 이 세 축을 모두 만족해야만 비로소 세상에 나올 수 있다.

1. **아키텍처 및 인프라 보안**: 두뇌와 손의 물리적 분리, 자격 증명 금고 및 프록시 주입, 아웃바운드 트래픽 통제 등 시스템 인프라 수준에서 탈출과 오남용이 원천 차단되었는가.
2. **런타임 온라인 세이프가드**: 모델이 추론을 수행하고 토큰을 생성하는 실시간 과정에서 위험 요소를 감지하고 개입하는 실시간 모니터링 체계가 작동하는가.
3. **오프라인 세이프가드 분류기**: 저장된 데이터(Data at rest)를 정밀 분석하여 다중 계정에 걸친 악용, 증류 시도, 유해 패턴을 사후에 완벽히 식별해 낼 수 있는가.

오푸스 5.5는 이 세 차원에서 모두 좋은 결과를 보였기에 출시되었다. 공식 페이지에 따르면 오푸스 5.5는 자동 행동 감사(automated behavioral audit)에서 지금까지 시험한 모델 중 가장 좋은 점수를 받았다.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 440" width="100%" style="height:auto; background:#0f172a; border-radius:12px; margin:24px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <defs>
    <linearGradient id="badUx" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#991b1b" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="goodUx" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#047857" stop-opacity="0.05"/>
    </linearGradient>
  </defs>

  <text x="460" y="38" fill="#f8fafc" font-size="18" font-weight="700" text-anchor="middle">안전 개입과 개발자 UX: 모델 폴백·라우팅의 한계와 단일 동적 모델의 대안</text>
  <text x="460" y="60" fill="#94a3b8" font-size="12" text-anchor="middle">경량 분류기의 오탐(False Positive) 극복과 일관된 페르소나 유지 전략</text>

  <!-- Left: The Fallback / Router Dilemma -->
  <rect x="40" y="90" width="400" height="320" rx="12" fill="url(#badUx)" stroke="#ef4444" stroke-width="1.5"/>
  <text x="240" y="120" fill="#f87171" font-size="14" font-weight="700" text-anchor="middle">현재의 딜레마: 모델 폴백 및 외부 라우터</text>

  <rect x="65" y="145" width="350" height="70" rx="8" fill="#1e293b" stroke="#475569"/>
  <text x="80" y="170" fill="#fbbf24" font-size="11" font-weight="600">지능의 역설 (Intelligence Paradox)</text>
  <text x="80" y="188" fill="#cbd5e1" font-size="10">고성능 모델(Fable/Opus)을 감시하기 위해 경량 분류기 배치</text>
  <text x="80" y="204" fill="#f87171" font-size="10">→ 덜 똑똑한 분류기가 문맥을 오인하여 오탐(False Positive) 폭발</text>

  <rect x="65" y="230" width="350" height="75" rx="8" fill="#1e293b" stroke="#ef4444"/>
  <text x="80" y="253" fill="#fca5a5" font-size="11" font-weight="600">파편화된 UX (Convoluted Experience)</text>
  <text x="80" y="271" fill="#cbd5e1" font-size="10">예: 생물학 숙제 중 '바이오' 1회 언급 → 즉각 하위 모델로 강등</text>
  <text x="80" y="291" fill="#94a3b8" font-size="10">사용자 작업 흐름 단절, 이중 폴백, 페르소나 붕괴 발생</text>

  <rect x="65" y="320" width="350" height="70" rx="8" fill="#1e293b" stroke="#475569"/>
  <text x="80" y="343" fill="#cbd5e1" font-size="11" font-weight="600">외부 라우터의 정보 불완전성</text>
  <text x="80" y="361" fill="#94a3b8" font-size="10">초기 프롬프트만으로는 태스크의 복잡도를 사전에 완벽 판정 불가</text>
  <text x="80" y="377" fill="#94a3b8" font-size="10">비용 라우터 오작동으로 저지능 모델 배정 위험</text>

  <!-- Right: The Ideal Unified Model -->
  <rect x="480" y="90" width="400" height="320" rx="12" fill="url(#goodUx)" stroke="#10b981" stroke-width="1.5"/>
  <text x="680" y="120" fill="#34d399" font-size="14" font-weight="700" text-anchor="middle">지향하는 미래: 단일 일관 모델 + 동적 에포트</text>

  <rect x="505" y="145" width="350" height="70" rx="8" fill="#1e293b" stroke="#10b981"/>
  <text x="520" y="170" fill="#34d399" font-size="11" font-weight="600">일관된 페르소나 (Consistent Persona)</text>
  <text x="520" y="188" fill="#cbd5e1" font-size="10">모델 간 이질적 점프 없이 단일한 Claude 지능과 상호작용</text>
  <text x="520" y="204" fill="#94a3b8" font-size="10">문체, 지침 이해도, 톤앤매너의 완전한 연속성 보장</text>

  <rect x="505" y="230" width="350" height="75" rx="8" fill="#1e293b" stroke="#10b981"/>
  <text x="520" y="253" fill="#34d399" font-size="11" font-weight="600">동적 추론 노력 (Dynamic Effort Scaling)</text>
  <text x="520" y="271" fill="#cbd5e1" font-size="10">간단한 작업(div 중앙 정렬): 최소한의 토큰·비용으로 즉답</text>
  <text x="520" y="291" fill="#cbd5e1" font-size="10">복잡한 취약점 분석: 모델 스스로 추론 연쇄를 길게 늘려 해결</text>

  <rect x="505" y="320" width="350" height="70" rx="8" fill="#1e293b" stroke="#38bdf8"/>
  <text x="520" y="343" fill="#38bdf8" font-size="11" font-weight="600">정밀 안전 절제 (Contextual Dropping)</text>
  <text x="520" y="361" fill="#cbd5e1" font-size="10">모델 강등 대신, 위험한 지점만 정밀 타격하여 덜어내고</text>
  <text x="520" y="377" fill="#34d399" font-size="10" font-weight="600">선의의 본래 질의(예: 생물학 숙제)는 온전하게 완수</text>
</svg>

그러나 안전장치를 엄격하게 운영할수록 필연적으로 발생하는 부작용이 바로 **'분류기 오탐(False Positive)으로 인한 모델 폴백(Fallback)의 답답함'**이다.
현재 상용 인공지능 서비스들은 위험한 질의가 감지되면 대화를 즉시 중단하거나 하위 모델로 강제 강등시키는 폴백 로직을 가동한다. 스윅스는 이를 "바이오 숙제를 하다가 바이오를 한 번 언급했을 뿐인데 폴백된다"는 예로 꼬집는다. 오푸스 5.5 공식 페이지도 사이버·바이오·증류 안전장치가 다른 모델로 투명하게 폴백되며, 대부분의 사이버보안 작업은 Opus 4.8로 재라우팅된다고 밝힌다.

스윅스는 이 부조화의 원인을 이렇게 본다(이하 '지능의 역설'은 해설상의 명명이다). 고성능 프론티어 모델의 깊은 문맥과 추론 연쇄를 실시간으로 감시하기 위해 비용이 저렴하고 단순한 경량 분류기를 앞에 세우다 보니, "더 멍청한 분류기가 훨씬 더 똑똑한 모델의 복잡한 대화를 심판하는" 구조적 모순이 발생하기 때문이다. 그러니 분류기가 위험한 의도와 평범한 숙제를 늘 정확히 구별하기는 어렵다는 것이다.

현재 앤트로픽은 API 레벨에서 고객에게 다양한 대응 스펙트럼을 제공하고 있다.
- 서버 측 자동 폴백 여부를 고객이 명시적으로 켜고 끌 수 있는 옵션
- 클라이언트 SDK 단에서 폴백 이벤트를 우아하게 가로챌 수 있는 헬퍼 함수
- 모델이 차단되었을 때 하위 모델로 튕겨 나가지 않고 동일한 모델 안에서 프롬프트를 미세 조정하여 재시도(re-prompt)할 수 있는 제어권

그러나 제품 책임자 앤절라 장(화자 추정)이 구상하는 궁극적인 사용자 경험은 이런 누더기식 폴백이 아니다.
이상적인 방향은 **'단일하고 일관된 모델이 위험한 유해요소만 정교하게 도려내고 답변을 완성하는 경험'**이다. 사용자가 위험한 역량을 악용하려는 것이 아니라면, 하위 모델로 강등당해 대화의 연속성을 깨뜨리는 대신, 똑똑한 모델 자체가 안전 가이드라인을 인지한 상태에서 위험한 디테일만 정밀하게 절제(drop)하고 본래의 유익한 답변을 온전히 완수해 내는 일관된 UX를 제공해야 한다는 것이다.

이 철학은 최근 유행하는 '외부 모델 라우터(Router)'에 대한 회의론과도 직결된다.
비용을 아끼기 위해 가벼운 질의는 저렴한 모델로, 복잡한 질의는 비싼 모델로 분기하는 라우팅 기술이 주목받고 있다. 그러나 사용자가 프롬프트를 입력하는 최초 시점에는 작업의 궁극적 복잡성에 대한 정보가 불완전하다. "HTML div 태그를 화면 중앙에 배치하라"는 단순해 보이는 프롬프트 뒤에 심각한 레거시 CSS 충돌이 숨어 있을 수 있고, 거창해 보이는 질의가 의외로 단순한 정의 확인에 불과할 수도 있다.

정보가 결핍된 상태에서 외부 분류기가 어설프게 모델을 나누면, 페르소나가 널뛰기를 뛰며 사용자 경험은 극도로 파편화된다. 앤트로픽이 바라보는 지향점은 모델을 파편적으로 분기하는 라우터가 아니라, **'동적 에포트(dynamic effort)를 탑재한 단일한 프론티어 모델'**이다. 단 하나의 일관된 Claude 페르소나가 간단한 질문에는 최소한의 연산만 소비하여 저렴하게 응답하고, 깊은 추론이 필요한 순간에는 스스로 사고 연쇄를 동적으로 확장하며 지능을 끌어올리는 구조다. 모델 자체가 자신의 자원을 동적으로 스케일링하는 것이야말로 파편화된 라우팅과 조잡한 폴백을 대체할 프론티어 UX의 최종 기착지라는 설명이다.

---

## 9. 사람의 몫: 슬롭, 설계와 검증, 제품 판단, 조직과 DevRel

지능이 고도화되고 코딩의 상당 부분이 자동화되는 시대, 인간의 고유한 몫은 어디에 있는가. 앤트로픽의 리더십은 인공지능이 해결할 수 있는 영역과 인간이 결코 내려놓아서는 안 될 책임을 엄격하게 구분한다.

첫째, **작업 부하(Workloads)의 지형 변화**다.
일부 작업에서는 지능이 점점 포화(saturation)되고 있다. 다만 아직 포화되지 않은 과업은 사람들이 예상하는 것보다 많다.
진짜 지능의 초과 이익(Alpha)이 터져 나오는 미개척지는 **'극단적으로 긴 시간을 자율적으로 실행하는 장시간 에이전트 워크로드(long-running agentic tasks)'**, 그리고 바이오·사이버처럼 과거에는 브루트포스가 불가능했던 고난도 과학·공학 난제들이다.

둘째, 사내를 뒤흔든 **인공지능 슬롭(AI Slop)에 대한 규율**이다.
앤트로픽 내부에서도 생성형 도구의 남용을 둘러싼 치열한 논쟁이 벌어졌다. 리더십이 내린 결론은 단호하다.
"Claude를 마음껏 쓰라. 그러나 그 결과물에 대한 품질 책임은 100% 인간 당신에게 있다."

문서든 코드든, Claude를 통해 생성만 해놓고 작성자 스스로 한 줄도 깊이 읽지 않은 채 동료에게 검토를 넘기는 행위는 용납되지 않는다. 그것은 생성자가 져야 할 인지적 비용을 무책임하게 독자에게 전가하는 행위이기 때문이다. 만약 내용이 공허한 슬롭이라면 단호히 거절하고 반려(send it back)해야 한다.
동시에 독자의 편향에 대한 경계도 늦추지 않는다. 작성자가 오랜 시간 공들여 검증한 고품질 산출물임에도, 엠대시(—)나 특유의 수사법 같은 이른바 '클로드 말투(claudisms)'가 묻어 있다는 이유만으로 덮어놓고 알레르기 반응을 보이며 배척하는 행위 역시 비생산적이다. 사소한 문체적 지엽에 집착하지 말고 내용의 본질적 완성도를 평가하라는 주문이다.

셋째, **소프트웨어 엔지니어링의 본질적 재편**이다.
앤트로픽 내부의 코드 작성 방식은 이미 완전히 변모했다. 인간은 시스템 아키텍처를 설계하고 정밀한 검증 환경을 구축하며, 실제 코드 구현은 Claude가 전담한다. 앞서 살펴본 Rust 포트 사례처럼, 테스트와 검증 체계가 견고하다면 인간 엔지니어는 모든 코드를 한 줄씩 깊이 리뷰하지 않고도 시스템의 전진을 승인(stamp)할 수 있다.

넷째, **제품 관리의 기본기 수호**다.
실험 비용이 낮아지자 기능을 마구 내보내고 싶은 유혹도 커졌다. 이와 관련해 클로드 코드(Claude Code) 엔지니어 타리크 시히파르(Thariq Shihipar, `@trq212`)가 최근 남긴 트윗이 언급된다(https://x.com/trq212/status/2102548686303854790). 요지는 "모델 역량을 올바르게 쓰는 길은 기능을 10배 더 내보내는 것이 아니라, 사용자를 더 이해하고 실험하는 데 시간을 쓰는 것"이라는 것이다.

에이전트가 코드를 짜준다고 해서 제품 기획과 문제 정의라는 소프트웨어 공학의 절대적 기초(fundamentals)가 사라지는 것은 아니다. 에이전트의 속도에 도취되어 인간이 마땅히 거쳐야 할 고통스러운 사고 과정을 건너뛰는 것은 혁신이 아니라 '지적 게으름'일 뿐이다.

좋은 예가 앤트로픽 엔지니어링 블로그의 claude.ai 속도 개선 사례다. 팀은 2026년 8월 2주간의 스프린트로 사용자 활동의 95%를 차지하는 네 가지 여정에서 13개 측정치를 잡고 목표를 세웠는데, **13개 목표 중 12개를 사흘째에 달성**했고, 앱은 약 3배 빨라졌다(「How we made claude.ai 3x faster in two weeks」, claude.dev 블로그, 2026년 9월 23일). 핵심은 명확하다. 에이전트의 경이로운 실행 속도를 새로운 기능 난사(product slop)에 낭비하지 않고, 성능 리팩토링과 시스템 최적화라는 본질적 완성도를 높이는 데 집중 투입했다는 점이다.

다섯째, **리더십의 규율과 독서 철학**이다.
제품 책임자 앤절라 장의 일하는 방식을 상징하는 명제는 과거 그가 남긴 한 줄의 트윗에 압축되어 있다.
> **"어떤 일을 반만 하는 것은, 하지 않는 것의 비싼 방식이다."**  
> *(Half doing something is an expensive way of not doing it.)*

철저한 끝맺음과 밀도를 강조하는 이 철학은 그의 지적 훈련 과정에서 비롯되었다. 지적 자극에 굶주렸던 시절, 긴 기차 통근 시간에 1년에 약 200권의 책을 읽었다(확인 필요). 트윗은 팔로워를 모으려던 것이 아니라 생각을 최소한의 단어로 압축하는 개인 연습이었다. 가장 아끼는 책은 나심 탈레브의 『블랙 스완(The Black Swan)』이다. 스윅스는 페이블 사건을 보며 블랙 스완을 떠올렸다고 말한다. 일어날 수 있다고 생각하지 못한 일이 한 번 일어나면 생각의 틀이 영구히 바뀐다는 점에서, 앞서 본 확률적 제품 관리와 통한다(해설).

반면 엔지니어링 책임자 케이틀린 레스는 철저한 '실행의 병목 해결사'다. 그는 이메일뿐만 아니라 슬랙(Slack)에서도 극단적인 '인박스 제로(Inbox Zero)'를 고수한다. 회의를 다 취소하고 하루 종일 슬랙만 해도 하루치 일을 한 느낌이 들 정도라고 한다. 그런 날엔 무엇을 만들었나 싶지만, 슬랙으로 들어오는 것의 상당수는 어려운 결정 때문에 막힌 팀의 요청이고, 팀을 막힘없이 높은 품질로 움직이게 하는(unblock) 것이 본래 자기 일이라고 설명한다. 스윅스는 "당신은 팀을 만들어 낸 것"이라고 답한다. 반면 앤절라 장은 생각하고 결과물을 만드는 시간을 따로 지키려 해서, 슬랙에서 연락이 잘 닿지 않는다는 피드백을 받는다고 털어놓는다.

여섯째, **개발자 관계(DevRel)의 해체와 재정의**다.
앤트로픽은 DevRel 조직을 API 플랫폼 팀과 클로드 코드 팀으로 이원화하여 점선(dotted line)으로 연결해 운영하고 있다. 대중적인 인기를 끄는 클로드 코드나 거대한 연구·정책 담론에 가려져 자칫 존재감이 묻히기 쉬운 플랫폼 비즈니스의 독자적인 목소리를 세우기 위해서다.

앤트로픽 플랫폼 DevRel의 브랜드는 단순한 기술 홍보자가 아니라, 복잡한 인공지능 생태계의 원리를 명쾌하게 규명하고 가르치는 **'기술적 교육자이자 사고 리더(Thought Leader)'**를 지향한다. 메모리, 비용 관리, 평가를 깊이 다루는 기술 콘텐츠를 만드는 랜스(Lance Martin, Managed Agents 엔지니어링 글의 공동 저자로 확인)와 쿡북·예제를 내고 X에서 커뮤니티와 소통하는 CJ 아빌라(CJ Avilla, https://platform.claude.com/cookbook/observability-opentelemetry-tracing)가 그 방향을 보여 준다. 최근 아디 오스마니(Addy Osmani)도 클로드 코드 팀에 영입되었다고 언급된다(https://claude.dev/blog/getting-the-most-out-of-opus-5-5/, https://addyosmani.com/).

특히 DevRel의 작업 도구 역시 격변하고 있다. 2023년 LLM API 초기에 중요했던 쿡북(Cookbook)의 역할은 줄었다. 다만 쿡북은 여전히 '무엇이 가능한지'를 보여 준다. 팀의 한 엔지니어가 쓴 컴퓨터 유즈(Computer Use) 쿡북은 너무 복잡해 "지금까지도 그를 괴롭힌다"고 할 정도였다. 오늘날 가장 레버리지가 높은 DevRel 산출물은 사람이 손으로 복사해 붙여넣는 쿡북이 아니라, **코딩 에이전트가 직접 읽고 실행할 수 있도록 모범 사례를 압축해 놓은 '클로드 API 스킬(Claude API Skill)'**, 그리고 에이전트에게 구현을 위임할 수 있는 '참조 아키텍처(Reference Architecture)'다. 이 클로드 API 스킬은 DevRel 팀(랜스)이 만들었다. 모범 사례를 에이전트 안으로 증류해 넣는 것이 가장 레버리지 높은 DevRel이라는 것이다.

스윅스는 미래의 DevRel 조직이 **'프론트 오피스와 백 오피스'**로 완전히 분리될 것이라는 통찰력 있는 청사진을 제시한다. 대중은 전문 홍보 인력의 입이 아니라, 제품을 직접 만든 핵심 엔지니어와 프로덕트 리더의 생생한 목소리를 듣고 싶어 한다. 따라서 미래의 DevRel 전문 조직은 뒤편의 '백 오피스'로 물러나, 바쁜 엔지니어링 리더들과 30~60분 정도 이야기를 나누어 그들의 지식을 추출하고 이를 최고 품질의 콘텐츠로 가공해 세상에 배포해 주는 정예 프로덕션 지원실의 역할을 수행해야 한다는 것이다.

---

## 10. 맺음: Opus 5.5로 다시 시도할 것

오푸스 5.5의 등장은 단순한 벤치마크 1위의 탈환 그 이상의 의미를 지닌다. 장황했던 문체를 덜어 냈고, 가격도 내렸다. 공식 페이지 기준 입력·출력 토큰은 100만 개당 4달러·20달러로 Opus 5보다 20% 낮고, 일반적인 작업 비용은 40% 줄었다(anthropic.com/claude-opus-5-5).

그동안 높은 토큰 비용과 지연시간의 압박 때문에 엄두를 내지 못하고 서랍 속에 넣어두었던 거대한 실험들—수십 단계에 걸쳐 스스로 추론하고 도구를 조작하는 장시간 자율 에이전트 과업, 그리고 복합적인 멀티 에이전트 아키텍처—을 다시 꺼내어 실행해 보아야 할 최적의 타이밍이다.

앤트로픽 리더십이 멀티 에이전트를 구축하려는 엔지니어들에게 건네는 설계 원칙은 의외로 소박하면서도 단단하다. 인간이 모든 하위 에이전트의 역할과 행동 강령을 경직되게 하드코딩하려 들지 말라는 것이다. 전체 작업을 통솔할 단 하나의 강력한 리더 에이전트를 세우고, 그 아래로 병렬화가 가능한 세부 과업을 나눌 때 오직 다음의 **두 가지 핵심 원칙**만 인프라에 심어두면 충분하다.

1. **균일하게 공유되는 단일 상태(Shared uniform context)**: 모든 하위 에이전트가 단일한 진실 공급원(SSOT)을 왜곡 없이 바라볼 수 있어야 한다.
2. **서로의 실행을 가로막지 않는 비동기 하위 에이전트(Non-blocking asynchronous sub-agents)**: 특정 에이전트의 지연이나 실패가 전체 파이프라인을 멈춰 세우지 않아야 한다.

이 두 가지 조건만 충족된다면, 세부적인 역할 분담과 협업 프로토콜의 설계는 Claude 스스로에게 맡겨도 좋다. 지능이 진화할수록 모델은 자신을 스스로 복제하고, 작업을 쪼개며, 최적의 위상으로 하위 에이전트에게 업무를 배분하는 메타 아키텍처를 인간보다 훨씬 더 기민하게 직조해 낼 것이기 때문이다.

Rust 개발자 없이 해낸 대규모 Rust 포트가 현실이 되었듯, 에이전트 소프트웨어 공학의 중심축은 '손으로 코드를 치는 행위'에서 '자율적인 지능들이 안전하게 질주할 수 있는 인프라 격벽과 평가 체계를 세우는 일'로 완전히 이동했다. 앤트로픽이 S-1의 재무적 성과와 오푸스 5.5 플랫폼 아키텍처를 통해 세상에 던진 메시지는 명확하다. 인프라의 기본기를 장악한 자만이 가장 안전하고 거대한 지능을 가장 효율적으로 세상에 배포할 수 있다는 사실이다.
