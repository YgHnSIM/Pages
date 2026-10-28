---
title: 선 하나를 어디에 그을 것인가 — 서포트 벡터 머신, 임계값에서 커널 트릭까지
subtitle: 마진·소프트 마진·차원 올리기·커널 트릭의 직관을 따라가고, 파이썬 코드로 두 모델이 같은 답을 내는 장면까지 확인한다
slug: support_vector_machines_concepts_code
date: 2026-10-29
tags:
  - AI
  - 머신러닝
  - 해설
summary: 서포트 벡터 머신(SVM)의 핵심 원리를 1차원 임계값과 최대 마진의 취약성부터 소프트 마진, 서포트 벡터 분류기(SVC), 고차원 투영과 커널 트릭까지 단계별로 해설합니다. 파이썬과 scikit-learn으로 2차 다항 커널 모델과 "직접 제곱한 열 + 선형 커널" 모델이 같은 혼동 행렬과 정확도(약 68%)를 내는 것을 확인하고, 가중치와 편향에서 결정 직선의 기울기와 절편을 구해 보이지 않던 분류기를 그려 봅니다.
archive_url: "https://yghnsim.github.io/Archive/pages/2026-10-29-SVM.html"
---

## 서론: 데이터 사이를 가르는 가장 견고한 경계선을 찾아서

기계학습에서 지도학습 분류(Classification) 문제의 핵심은 하나의 본질적인 질문으로 수렴한다. "서로 다른 두 집단을 가르는 수많은 경계선 중, 미래의 새로운 데이터에 대해서도 가장 안정적으로 정답을 맞힐 경계선은 어디인가?"

직관적으로 생각하면 두 데이터 군집의 한가운데를 가로지르는 선을 그으면 될 것 같다. 그러나 현실의 데이터는 결코 친절하지 않다. 측정 오차로 인해 상대 진영 깊숙이 침범한 이상치(Outlier)가 존재하고, 두 집단의 경계가 모호하게 뒤섞여 있기도 하며, 심지어는 아무리 정교하게 직선을 그어도 도저히 분리할 수 없는 복잡한 비선형 구조를 띠기도 한다.

서포트 벡터 머신(Support Vector Machine, SVM)은 이 세 가지 어려움을 하나씩 차례로 넘어서며 만들어진 분류기다. 출발점은 수직선 위에 점 하나를 찍는 일이고, 도착점은 데이터를 실제로 옮기지 않고도 더 높은 차원에서 선을 긋는 '커널 트릭(Kernel Trick)'이다. 각 단계는 앞 방법이 구체적으로 실패하는 장면에서 시작한다. 임의의 임계값이 실패하면 마진이 나오고, 마진이 이상치에 무너지면 소프트 마진이 나오고, 소프트 마진도 겹친 데이터 앞에서 무력해지면 차원을 올린다.

이 흐름은 엄밀한 최적화 이론 없이도 그림만으로 따라갈 수 있다. 마지막에는 파이썬 코드로, 커널 트릭을 쓴 모델과 변환을 손으로 한 모델이 정말 같은 답을 내는지 확인한다. 본문 중 표준 교과서의 수식으로 덧붙인 내용은 [보충]으로 따로 표시했다.

---

## 1. 선 하나 긋기의 어려움 — 임계값과 마진

### 단순 임계값의 한계와 임의성의 위험

분류 문제의 가장 단순한 형태를 상상해 보자. 실험용 생쥐의 체중(mass)이라는 단 하나의 연속형 수치(1차원 특성)를 측정하여, 이 생쥐가 비만(Obese)인지 비비만(Not Obese)인지를 판정하고자 한다.

1차원 수직선 위에 데이터 포인트를 점으로 찍으면, 일반적으로 가벼운 생쥐(비비만, 적색 점)들은 왼쪽에 모이고, 무거운 생쥐(비만, 녹색 점)들은 오른쪽에 모인다. 이제 새로운 생쥐의 체중을 쟀을 때 비만 여부를 판정하려면, 수직선 위에 기준이 되는 하나의 경계 지점, 즉 **임계값(Threshold)**을 정해야 한다. 임계값보다 체중이 적으면 비비만으로, 임계값보다 크면 비만으로 분류하는 규칙이다.

문제는 이 임계값을 "어디에" 둘 것인가이다. 만약 아무런 원칙 없이 임계값을 비비만 군집 바로 옆에 두었다고 해 보자. 이때 임계값보다 조금 오른쪽, 그러니까 두 군집 사이 빈 공간에서 비비만 쪽에 더 가까운 자리에 새 생쥐가 들어온다면 어떻게 될까? 이 생쥐는 거리상으로는 비비만 군집에 훨씬 가깝지만, 임계값의 오른쪽에 위치한다는 이유만으로 '비만'으로 판정된다. 이는 상식과 데이터의 분포에 정면으로 위배되는 어색한 결과다. 임의로 그은 임계값은 새로운 데이터에 대해 일반화 능력을 보장하지 못한다.

### 가장자리 관측과 중점 임계값

이러한 모순을 해결하는 가장 자연스러운 발상은 데이터 군집의 '경계'에 주목하는 것이다. 비비만 군집에서 체중이 가장 무거운 가장자리(edge) 관측과, 비만 군집에서 체중이 가장 가벼운 가장자리 관측을 찾는다. 그리고 **두 가장자리 관측의 정중앙(midpoint)**에 임계값을 배치한다.

이렇게 중점에 임계값을 두면, 임계값의 왼쪽으로 들어오는 새로운 관측은 수학적으로 반드시 비비만 군집에 더 가깝고, 오른쪽으로 들어오는 관측은 비만 군집에 더 가깝게 된다. 직관과 수학적 타당성이 처음으로 일치하는 순간이다.

### 마진(Margin)의 수학적 정의

여기서 머신러닝 역사상 가장 중요한 개념 중 하나인 **마진(Margin)**이 도출된다.

> **마진(Margin)이란?**  
> 분류 경계면(1차원에서는 임계값)으로부터 가장 가까운 훈련 데이터 관측점까지의 **최단 거리(shortest distance)**를 의미한다.

임계값을 두 군집의 가장자리 관측 정중앙에 놓았을 때, 양쪽 가장자리 관측점까지의 거리는 동일하며, 이 거리가 바로 시스템이 확보할 수 있는 '안전거리'가 된다. 만약 임계값을 정중앙에서 왼쪽이나 오른쪽으로 조금이라도 이동시키면, 한쪽 관측점까지의 거리는 늘어나지만 반대쪽 관측점까지의 거리는 좁아지므로 최단 거리로서의 마진은 감소한다. 즉, **두 가장자리 관측의 정중앙에 위치할 때 마진은 극대화(maximum)된다.**

### 최대 마진 분류기(Maximal Margin Classifier)

이처럼 훈련 데이터의 양쪽 군집 사이에서 마진을 가능한 한 가장 크게 확보하는 임계값(또는 초평면)을 찾아 분류를 수행하는 알고리즘을 **최대 마진 분류기(Maximal Margin Classifier)**라고 부른다.

최대 마진 분류기는 기하학적으로 대단히 우아하다. 도로의 폭(마진)을 최대로 넓혀 차선(임계값)을 도로 중앙에 그리는 것과 같아서, 향후 새로운 관측이 약간의 측정 오차나 노이즈를 안고 들어오더라도 경계를 벗어나 오분류될 위험을 최소화한다.

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 360" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 1: 1차원 데이터에서의 임계값 위치와 마진의 극대화</text>
<text x="30" y="68" font-size="16px" fill="#64748b">임의 임계값의 취약성과 두 군집 가장자리 중점에서 마진이 최대가 되는 기하학적 구조</text>
<g transform="translate(40, 90)">
<rect width="380" height="230" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="20" y="32" font-size="17px" font-weight="bold" fill="#334155">(A) 임의의 임계값: 비합리적 분류 발생</text>
<line x1="30" y1="120" x2="350" y2="120" stroke="#94a3b8" stroke-width="3"/>
<circle cx="60" cy="120" r="9" fill="#ef4444"/>
<circle cx="100" cy="120" r="9" fill="#ef4444"/>
<circle cx="140" cy="120" r="9" fill="#ef4444"/>
<text x="50" y="155" font-size="16px" fill="#ef4444" font-weight="bold">비비만 군집</text>
<line x1="160" y1="75" x2="160" y2="165" stroke="#f59e0b" stroke-width="3" stroke-dasharray="6,4"/>
<text x="115" y="70" font-size="16px" fill="#b45309" font-weight="bold">임의의 임계값</text>
<circle cx="190" cy="120" r="11" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
<text x="40" y="200" font-size="16px" fill="#1d4ed8" font-weight="bold">새 관측: 비비만에 더 가깝지만</text>
<text x="40" y="222" font-size="16px" fill="#1d4ed8" font-weight="bold">임계값 오른쪽이라 비만으로 분류</text>
<rect x="270" y="111" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="310" y="111" width="18" height="18" rx="3" fill="#10b981"/>
<text x="280" y="155" font-size="16px" fill="#10b981" font-weight="bold">비만 군집</text>
</g>
<g transform="translate(460, 90)">
<rect width="400" height="230" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="20" y="32" font-size="17px" font-weight="bold" fill="#334155">(B) 최대 마진 임계값: 안정적 경계 형성</text>
<line x1="30" y1="120" x2="370" y2="120" stroke="#94a3b8" stroke-width="3"/>
<circle cx="60" cy="120" r="9" fill="#ef4444"/>
<circle cx="100" cy="120" r="9" fill="#ef4444"/>
<circle cx="140" cy="120" r="10" fill="#ef4444" stroke="#991b1b" stroke-width="2.5"/>
<rect x="260" y="110" width="20" height="20" rx="3" fill="#10b981" stroke="#065f46" stroke-width="2.5"/>
<rect x="310" y="111" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="345" y="111" width="18" height="18" rx="3" fill="#10b981"/>
<line x1="200" y1="70" x2="200" y2="170" stroke="#6366f1" stroke-width="3.5"/>
<text x="145" y="65" font-size="16px" fill="#4338ca" font-weight="bold">최대 마진 임계값</text>
<line x1="140" y1="95" x2="200" y2="95" stroke="#6366f1" stroke-width="2" stroke-dasharray="4,3"/>
<text x="152" y="90" font-size="16px" fill="#4338ca">마진</text>
<line x1="200" y1="95" x2="260" y2="95" stroke="#6366f1" stroke-width="2" stroke-dasharray="4,3"/>
<text x="212" y="90" font-size="16px" fill="#4338ca">마진</text>
<text x="90" y="195" font-size="16px" fill="#991b1b" font-weight="bold">가장자리 관측</text>
<text x="240" y="195" font-size="16px" fill="#065f46" font-weight="bold">가장자리 관측</text>
</g>
</svg>
</div>

---

## 2. 이상치의 횡포와 오분류를 허용할 용기 — 편향-분산과 소프트 마진

### 최대 마진 분류기의 아킬레스건: 이상치 민감성

완벽해 보이는 최대 마진 분류기에는 치명적인 약점이 숨어 있다. 바로 **이상치(Outlier)에 극도로 취약하다**는 점이다.

생쥐 체중 데이터셋에 예상치 못한 관측이 하나 섞여 들어왔다고 가정하자. 유전적 특이체질이거나 측정 오류로 인해, 실제로는 '비비만' 생쥐인데 체중이 비만 생쥐 군집 바로 앞까지 육박하는 이상치가 발생했다.

최대 마진 분류기는 훈련 데이터에 대해 '단 하나의 오분류도 허용하지 않는다(Hard Margin)'는 엄격한 규칙을 따른다. 따라서 비비만 군집의 가장자리 기준점은 대다수 정상 비비만 생쥐가 아니라, 이 외로운 이상치 하나로 강제 이동된다. 그 결과 임계값은 비만 군집 쪽으로 극단적으로 밀려붙게 된다.

이 상태에서 대다수 정상 관측치들의 중간 영역에 새로운 생쥐 관측값이 유입되면 어떻게 될까? 상식적으로는 당연히 비비만으로 분류되어야 마땅하지만, 이상치에 이끌려 왜곡된 임계값 탓에 '비만'으로 오분류되고 만다. 단 하나의 특이 관측값이 전체 분류 모델의 형태를 완전히 파괴한 것이다.

### 오분류를 허용해야 이상치에 둔감해진다

이 문제에 직면했을 때 우리가 내릴 수 있는 결론은 역설적이다. **"이상치에 휘둘리지 않는 견고한 분류기를 만들려면, 훈련 데이터에서 일부 오분류를 의도적으로 허용해야 한다."**

비만 군집 근처에 홀로 떨어진 비비만 이상치 하나를 과감하게 '틀린 것'으로 인정하고 무시하면, 임계값은 다시 대다수 정상 비비만 군집과 비만 군집의 건강한 중점으로 복귀한다. 비록 훈련 세트에서 그 이상치 하나는 오분류되지만, 향후 들어올 수많은 새로운 정상 데이터에 대해서는 압도적으로 정확한 예측을 수행할 수 있게 된다.

### 편향-분산 트레이드오프(Bias-Variance Tradeoff)의 기하학

이 타협은 머신러닝 전 영역을 관통하는 가장 근본적인 딜레마인 **편향-분산 트레이드오프(Bias-Variance Tradeoff)**의 정확한 물리적 현현이다.

* **오분류를 절대 허용하지 않는 경우 (엄격한 최대 마진)**:
  * 훈련 데이터셋에 자로 잰 듯 완벽하게 들어맞으므로 훈련 데이터에 대한 오차, 즉 **편향(Bias)은 매우 낮다**.
  * 그러나 훈련 데이터의 사소한 노이즈나 이상치 하나에도 결정 경계가 요동치므로, 새로운 테스트 데이터가 주어지면 성능이 곤두박질친다. 즉 **분산(Variance)이 극도로 높다**. 이는 전형적인 과적합(Overfitting) 상태다.
* **오분류를 유연하게 허용하는 경우 (소프트 마진)**:
  * 훈련 데이터의 일부 점을 틀리게 처리하므로 훈련 오차, 즉 **편향(Bias)은 상대적으로 다소 높아진다**.
  * 하지만 데이터의 사소한 변동에 둔감해져 결정 경계가 안정되므로, 새로운 미지의 데이터에 대해 훨씬 높은 적중률을 유지한다. 즉 **분산(Variance)이 크게 낮아진다**.

> *"훈련 데이터에서 조금 틀리고, 테스트 데이터에서 많이 맞힌다."*  
> 이것이야말로 머신러닝이 일반화(Generalization) 성능을 획득하는 보편적 거래의 법칙이다.

### 소프트 마진(Soft Margin)과 교차검증(Cross Validation)

오분류를 허용할 때, 데이터 포인트와 임계값 사이의 거리를 **소프트 마진(Soft Margin)**이라고 부른다. 소프트 마진 환경에서는 데이터 포인트가 마진의 경계선 안쪽으로 침범하거나, 심지어 임계값을 넘어 반대편으로 넘어가 오분류되는 것을 용인한다.

그렇다면 얼마나 많은 오분류와 마진 침범을 허용해야 하는가? 관측자가 주관적으로 "오분류 2개쯤 봐주자"고 결정할 수는 없다.

여기서 **교차검증(Cross Validation)**이 등장한다. 소프트 마진 안에 몇 개의 오분류와 몇 개의 관측을 허용할지 여러 방식으로 바꿔 가며, 각 선택이 학습에 쓰지 않은 데이터를 얼마나 잘 맞히는지 비교한다. (교차검증은 보통 데이터를 여러 조각으로 나눠 번갈아 검증용으로 쓰는 방식으로 한다.) 예를 들어 교차검증을 거친 결과 "마진 안쪽에 오분류 1개와 올바르게 분류된 관측 2개가 들어오는 것을 허용하는 소프트 마진"이 검증 세트에서 가장 높은 정확도를 낸다면, 그것이 해당 데이터셋에 대한 최적의 소프트 마진으로 채택된다.

> [!NOTE]
> **[보충] 표준 교과서의 언어: 마진 폭 $2/\|\mathbf{w}\|$, 슬랙 변수 $\xi_i$, 정규화 파라미터 $C$**[^1]  
> 위의 직관을 최적화 문제로 쓰면 이렇다. 분류기를 $f(\mathbf{x}) = \mathbf{w}\cdot\mathbf{x} + b$, 정답 표지를 $y_i\in\{-1,+1\}$로 두고, 마진 경계를 $f(\mathbf{x})=\pm1$로 맞추면 두 경계 사이 폭은 $2/\|\mathbf{w}\|$다. 그래서 마진을 넓히는 일은 $\|\mathbf{w}\|$를 줄이는 일과 같다.
> - 하드 마진: $\min \tfrac12\|\mathbf{w}\|^2$, 조건 $y_i(\mathbf{w}\cdot\mathbf{x}_i+b)\ge 1$ (모든 점이 마진 밖, 오분류 0)
> - 소프트 마진: $\min \tfrac12\|\mathbf{w}\|^2 + C\sum_i \xi_i$, 조건 $y_i(\mathbf{w}\cdot\mathbf{x}_i+b)\ge 1-\xi_i,\ \xi_i\ge 0$
>
> 슬랙 $\xi_i$는 점이 마진을 얼마나 침범했는지 잰다. $\xi_i=0$이면 마진 밖, $0<\xi_i\le1$이면 마진 안이지만 올바른 쪽, $\xi_i>1$이면 임계값을 넘은 오분류다. 최적해에서는 $\xi_i=\max(0,\,1-y_if(\mathbf{x}_i))$, 곧 **힌지 손실**이 된다. $C$가 클수록 침범 비용이 커져 하드 마진에 가까워지고, 작을수록 마진이 넓어지며 더 많은 침범을 허용한다. 따라서 "마진 안에 몇 개를 허용할지 교차검증으로 고른다"는 직관은, 실무에서 $C$를 교차검증으로 고르는 일에 해당한다. 참고로 뒤의 코드는 $C$를 따로 지정하지 않아 scikit-learn 기본값 $C=1$을 쓴다.

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 370" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 2: 이상치로 인한 왜곡 vs 오분류를 허용한 소프트 마진</text>
<text x="30" y="68" font-size="16px" fill="#64748b">편향을 소폭 희생하여 분산을 낮추고 일반화 능력을 획득하는 메커니즘</text>
<g transform="translate(40, 90)">
<rect width="380" height="245" rx="8" fill="#fff1f2" stroke="#fecdd3" stroke-width="1.5"/>
<text x="20" y="32" font-size="17px" font-weight="bold" fill="#9f1239">(A) 오분류 불허: 이상치에 끌려감</text>
<line x1="30" y1="120" x2="350" y2="120" stroke="#94a3b8" stroke-width="3"/>
<circle cx="50" cy="120" r="8" fill="#ef4444"/>
<circle cx="80" cy="120" r="8" fill="#ef4444"/>
<circle cx="110" cy="120" r="8" fill="#ef4444"/>
<circle cx="230" cy="120" r="10" fill="#ef4444" stroke="#881337" stroke-width="2.5"/>
<text x="195" y="90" font-size="16px" fill="#881337" font-weight="bold">비비만 이상치!</text>
<path d="M 230,95 L 230,110" stroke="#881337" stroke-width="1.5"/>
<line x1="250" y1="75" x2="250" y2="175" stroke="#e11d48" stroke-width="3"/>
<text x="215" y="195" font-size="16px" fill="#e11d48" font-weight="bold">왜곡된 임계값</text>
<rect x="270" y="111" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="305" y="111" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="335" y="111" width="18" height="18" rx="3" fill="#10b981"/>
<text x="20" y="225" font-size="16px" fill="#be123c">편향 낮음(훈련 오분류 0), 분산 높음</text>
</g>
<g transform="translate(460, 90)">
<rect width="400" height="245" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
<text x="20" y="32" font-size="17px" font-weight="bold" fill="#14532d">(B) 소프트 마진: 이상치 오분류 허용</text>
<line x1="30" y1="120" x2="370" y2="120" stroke="#94a3b8" stroke-width="3"/>
<circle cx="50" cy="120" r="8" fill="#ef4444"/>
<circle cx="80" cy="120" r="8" fill="#ef4444"/>
<circle cx="110" cy="120" r="8" fill="#ef4444"/>
<circle cx="230" cy="120" r="9" fill="#ef4444" opacity="0.6"/>
<text x="215" y="90" font-size="16px" fill="#b91c1c">(오분류 허용)</text>
<line x1="190" y1="70" x2="190" y2="175" stroke="#16a34a" stroke-width="3.5"/>
<text x="150" y="65" font-size="16px" fill="#15803d" font-weight="bold">강건한 임계값</text>
<rect x="110" y="98" width="160" height="44" fill="#22c55e" fill-opacity="0.15" rx="4"/>
<line x1="110" y1="95" x2="110" y2="145" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="3,3"/>
<line x1="270" y1="95" x2="270" y2="145" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="3,3"/>
<text x="145" y="165" font-size="16px" fill="#15803d">소프트 마진 대역</text>
<rect x="270" y="111" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="305" y="111" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="335" y="111" width="18" height="18" rx="3" fill="#10b981"/>
<text x="20" y="225" font-size="16px" fill="#166534">편향 조금 높음, 분산 낮음</text>
</g>
</svg>
</div>

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 400" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 3 [보충]: 마진 폭 2/‖w‖와 슬랙 ξ</text>
<text x="30" y="68" font-size="16px" fill="#64748b">경계 f(x)=±1 사이가 마진, 침범한 정도가 슬랙</text>
<rect x="40" y="90" width="820" height="290" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<line x1="330" y1="110" x2="330" y2="330" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6,4"/>
<line x1="450" y1="110" x2="450" y2="330" stroke="#6366f1" stroke-width="3.5"/>
<line x1="570" y1="110" x2="570" y2="330" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6,4"/>
<text x="268" y="352" font-size="16px" fill="#475569">f(x) = −1</text>
<text x="420" y="352" font-size="16px" fill="#4338ca" font-weight="bold">f(x) = 0</text>
<text x="545" y="352" font-size="16px" fill="#475569">f(x) = +1</text>
<line x1="330" y1="128" x2="570" y2="128" stroke="#4338ca" stroke-width="2"/>
<text x="400" y="122" font-size="18px" fill="#4338ca" font-weight="bold">폭 = 2/‖w‖</text>
<circle cx="120" cy="200" r="9" fill="#ef4444"/>
<circle cx="190" cy="260" r="9" fill="#ef4444"/>
<circle cx="330" cy="230" r="10" fill="#ef4444" stroke="#7f1d1d" stroke-width="2.5"/>
<text x="140" y="300" font-size="16px" fill="#991b1b">ξ = 0 (경계 위: 서포트 벡터)</text>
<rect x="661" y="191" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="731" y="251" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="491" y="171" width="18" height="18" rx="3" fill="#10b981" stroke="#065f46" stroke-width="2"/>
<text x="585" y="160" font-size="16px" fill="#065f46">0 &lt; ξ ≤ 1 (마진 안)</text>
<rect x="381" y="271" width="18" height="18" rx="3" fill="#10b981" stroke="#065f46" stroke-width="2"/>
<text x="470" y="290" font-size="16px" fill="#b91c1c" font-weight="bold">ξ &gt; 1 (오분류)</text>
</svg>
</div>


---

## 3. 서포트 벡터 분류기와 차원의 언어 — 선·면·초평면

### 서포트 벡터(Support Vector)와 이름의 유래

소프트 마진을 채택하여 경계의 위치를 결정하는 분류기를 **서포트 벡터 분류기(Support Vector Classifier, SVC)**라고 부른다.

왜 하필 '서포트 벡터'라는 독특한 명칭이 붙었을까? 그 비밀은 마진을 형성하는 데이터 포인트의 물리적 역할에 있다. 마진의 가장자리 경계선에 걸쳐 있거나, 마진의 안쪽 및 오분류 영역에 위치한 관측점들을 가리켜 **서포트 벡터(Support Vector)**라고 부른다.

(해설) 이 점들이 서포트(지지)라고 불릴 만한 이유는, 만약 이 점들을 제외한 저 멀리 바깥쪽에 있는 수백, 수천 개의 데이터 포인트를 제거하거나 위치를 조금 이동시키더라도 결정 경계선은 눈 하나 깜짝하지 않고 그대로 유지되기 때문이다. 경계선의 기울기와 절편, 마진의 폭은 오직 이 소수의 서포트 벡터들에 의해 지탱되고 결정된다.

> **마진의 본질적 통찰:**  
> 마진은 "가장 가까운 관측점까지의 거리"로 정의되므로, 분류기의 위치를 결정하는 것은 전체 데이터셋이 아니라 극소수의 가장자리 점(서포트 벡터)들이다. 데이터가 깔끔하게 나뉠 때는 소수의 점만 기억하면 되므로 모델이 간결하다. 반대로 그 소수가 이상치라면 분류기 전체가 끌려간다. 같은 성질이 장점이자 약점이다. 다만 '소수'는 데이터가 얼마나 겹치느냐에 달려 있다. 뒤에서 다룰 혈당 데이터처럼 겹침이 심하면 마진 안으로 들어오는 점이 많아져, 훈련 데이터 796개 중 532개가 서포트 벡터가 된다(코드를 직접 실행해 확인한 값).

### 2차원 공간에서의 서포트 벡터 분류기: 직선

이제 문제를 2차원으로 확장해 보자. 생쥐의 체중(mass)에 더해 두 번째 측정값인 키(height, cm)를 함께 측정했다고 하자.

데이터는 더 이상 1차원 수직선 위의 점이 아니라 2차원 평면 위의 좌표 $(x_1, x_2)$가 된다. 이때 서포트 벡터 분류기는 하나의 점이 아니라 **1차원 직선(Line)**의 형태를 취한다.

2차원에서의 소프트 마진은 분류 직선과 평행하게 양쪽으로 펼쳐지는 두 개의 평행선(마진 경계선)으로 나타난다. 두 군집의 서포트 벡터들이 이 평행한 마진 경계선을 떠받친다. 마진 안쪽에 위치하거나 분류선 반대편으로 넘어간 이상치 점은 훈련 과정에서 오분류되지만, 이 선택은 교차검증 결과 장기적으로 더 나은 분류를 준다고 판단된 것이다. 훈련 데이터에서 작은 오차를 받아들이는 대신 테스트 데이터에서 훨씬 잘 맞히는 거래다.

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 4: 2차원(체중·키)의 서포트 벡터 분류기</text>
<text x="30" y="68" font-size="16px" fill="#64748b">분류기는 직선, 소프트 마진은 그와 평행한 두 선 사이</text>
<rect x="40" y="90" width="820" height="310" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<line x1="90" y1="360" x2="820" y2="360" stroke="#94a3b8" stroke-width="2"/>
<line x1="90" y1="360" x2="90" y2="110" stroke="#94a3b8" stroke-width="2"/>
<text x="730" y="388" font-size="16px" fill="#475569">체중</text>
<text x="100" y="128" font-size="16px" fill="#475569">키(cm)</text>
<polygon points="300,360 420,360 640,110 520,110" fill="#6366f1" fill-opacity="0.10"/>
<line x1="300" y1="360" x2="520" y2="110" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6,4"/>
<line x1="420" y1="360" x2="640" y2="110" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6,4"/>
<line x1="360" y1="360" x2="580" y2="110" stroke="#6366f1" stroke-width="3.5"/>
<circle cx="160" cy="200" r="9" fill="#ef4444"/>
<circle cx="200" cy="290" r="9" fill="#ef4444"/>
<circle cx="250" cy="170" r="9" fill="#ef4444"/>
<circle cx="300" cy="240" r="9" fill="#ef4444"/>
<circle cx="414" cy="230" r="11" fill="#ef4444" stroke="#7f1d1d" stroke-width="2.5"/>
<rect x="452" y="281" width="18" height="18" rx="3" fill="#10b981" stroke="#065f46" stroke-width="2.5"/>
<rect x="620" y="300" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="680" y="200" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="740" y="270" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="452" y="190" width="18" height="18" rx="3" fill="#10b981" stroke="#065f46" stroke-width="2.5"/>
<text x="600" y="160" font-size="16px" fill="#4338ca" font-weight="bold">분류기(직선)</text>
<text x="130" y="335" font-size="16px" fill="#7f1d1d">굵은 테두리 = 서포트 벡터</text>
<text x="520" y="345" font-size="16px" fill="#b91c1c">마진 안 오분류 1개 허용</text>
</svg>
</div>

### 3차원 공간에서의 서포트 벡터 분류기: 평면

여기에 세 번째 특성인 나이(age)를 추가하면 데이터는 3차원 공간에 배치된다.

3차원 좌표계에서 두 군집을 양분하는 선형 분류기는 직선이 아니라 **2차원 평면(Plane)**이 된다. 새로운 생쥐 관측이 들어오면, 이 관측점이 3차원 공간 속 분류 평면의 위쪽에 놓이는가 아래쪽에 놓이는가를 따져 클래스를 판정한다.

만약 네 번째 특성으로 혈압(blood pressure)을 추가한다면 어떻게 될까? 데이터는 4차원 공간에 존재하게 된다. 안타깝게도 인간의 뇌와 2차원 종이는 4차원 공간을 직접 그릴 수 없다.

### 차원의 기하학적 통합: Flat Affine 부분공간과 초평면

여기서 우리는 수학이 차원을 다루는 일반화된 언어를 마주하게 된다.

| 데이터 차원 ($N$) | 서포트 벡터 분류기의 기하학적 형태 | 수학적 공식 명칭 (부분공간) | 일상적 표현 |
| :---: | :---: | :---: | :---: |
| **1차원** (체중) | **0차원** 부분공간 | Flat affine 0-dimensional subspace | **점 (Point)** |
| **2차원** (체중, 키) | **1차원** 부분공간 | Flat affine 1-dimensional subspace | **직선 (Line)** |
| **3차원** (체중, 키, 나이) | **2차원** 부분공간 | Flat affine 2-dimensional subspace | **평면 (Plane)** |
| **4차원 이상** ($N$차원) | **$(N-1)$차원** 부분공간 | Flat affine $(N-1)$-dimensional subspace | **초평면 (Hyperplane)** |

수학적으로 엄밀히 말하자면, 1차원의 점이든 2차원의 선이든 3차원의 면이든 모두 자신이 속한 공간보다 차원이 하나 작은 **평평한 아핀 부분공간(Flat Affine Subspace)**이며, 이들을 총칭하여 **초평면(Hyperplane)**이라 부른다.

그러나 인간은 냅킨 위에 쓱쓱 그릴 수 있는 1차원 선이나 2차원 면에 대해서는 친숙한 단어('직선', '평면')를 사용하고, 차원이 4차원 이상으로 올라가 머릿속으로 시각화할 수 없을 때 비로소 '초평면'이라는 거창한 학술 용어를 꺼내 드는 경향이 있다. 본질적으로 이들은 모두 동일한 선형 분할 경계면이다.

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 320" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 5: 데이터 차원에 따른 분류기(Flat Affine 부분공간)의 진화</text>
<text x="30" y="68" font-size="16px" fill="#64748b">모든 분류기는 N차원 공간을 이등분하는 (N-1)차원의 평평한 초평면이다</text>
<g transform="translate(30, 95)">
<rect width="190" height="195" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="15" y="30" font-size="17px" font-weight="bold" fill="#334155">1차원 공간 (N=1)</text>
<line x1="20" y1="100" x2="170" y2="100" stroke="#94a3b8" stroke-width="2.5"/>
<circle cx="50" cy="100" r="7" fill="#ef4444"/>
<circle cx="140" cy="100" r="7" fill="#10b981"/>
<circle cx="95" cy="100" r="8" fill="#6366f1"/>
<line x1="95" y1="65" x2="95" y2="135" stroke="#6366f1" stroke-width="2.5"/>
<text x="55" y="160" font-size="16px" font-weight="bold" fill="#4338ca">분류기: 0차원 점</text>
<text x="25" y="182" font-size="16px" fill="#64748b">flat affine 0차원</text>
</g>
<g transform="translate(245, 95)">
<rect width="195" height="195" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="15" y="30" font-size="17px" font-weight="bold" fill="#334155">2차원 공간 (N=2)</text>
<line x1="30" y1="130" x2="165" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
<line x1="30" y1="130" x2="30" y2="50" stroke="#94a3b8" stroke-width="1.5"/>
<circle cx="60" cy="70" r="6" fill="#ef4444"/>
<circle cx="75" cy="95" r="6" fill="#ef4444"/>
<rect x="120" y="75" width="12" height="12" rx="2" fill="#10b981"/>
<rect x="140" y="105" width="12" height="12" rx="2" fill="#10b981"/>
<line x1="105" y1="45" x2="95" y2="135" stroke="#6366f1" stroke-width="2.5"/>
<text x="55" y="160" font-size="16px" font-weight="bold" fill="#4338ca">분류기: 1차원 선</text>
<text x="30" y="182" font-size="16px" fill="#64748b">flat affine 1차원</text>
</g>
<g transform="translate(465, 95)">
<rect width="195" height="195" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="15" y="30" font-size="17px" font-weight="bold" fill="#334155">3차원 공간 (N=3)</text>
<polygon points="40,110 110,60 160,85 90,135" fill="#6366f1" fill-opacity="0.3" stroke="#6366f1" stroke-width="2"/>
<circle cx="70" cy="65" r="5" fill="#ef4444"/>
<circle cx="60" cy="85" r="8" fill="#ef4444"/>
<rect x="120" y="95" width="10" height="10" rx="2" fill="#10b981"/>
<rect x="135" y="115" width="14" height="14" rx="2" fill="#10b981"/>
<text x="50" y="160" font-size="16px" font-weight="bold" fill="#4338ca">분류기: 2차원 면</text>
<text x="30" y="182" font-size="16px" fill="#64748b">flat affine 2차원</text>
</g>
<g transform="translate(685, 95)">
<rect width="185" height="195" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="15" y="30" font-size="17px" font-weight="bold" fill="#334155">4차원 이상 (N≥4)</text>
<g transform="translate(45, 55)">
<rect x="10" y="10" width="75" height="65" rx="6" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2" stroke-dasharray="4,2"/>
<text x="18" y="48" font-size="18px" font-weight="bold" fill="#4338ca">(N−1)차원</text>
</g>
<text x="30" y="160" font-size="16px" font-weight="bold" fill="#4338ca">분류기: 초평면</text>
<text x="25" y="182" font-size="16px" fill="#64748b">그릴 수 없는 고차원</text>
</g>
</svg>
</div>

---

## 4. 겹친 데이터와 차원 올리기 — 골디락스 문제와 SVM의 세 단계

### 서포트 벡터 분류기의 한계: "골디락스" 데이터셋

서포트 벡터 분류기(SVC)는 이상치와 약간의 중첩을 능숙하게 처리할 수 있어 대단히 실용적이다. 하지만 데이터의 본질적 분포가 선형적으로 분리 불가능할 정도로 뒤엉켜 있다면 어떻게 될까?

대표적인 예시가 신약의 **약물 투여량(Drug Dosage)**에 따른 환자의 치료 효과 데이터다.
* 투여량이 너무 적으면 약효가 없어 치료되지 않는다(미치유, 적색 점).
* 투여량이 너무 많으면 독성 부작용 때문에 치료되지 않는다(미치유, 적색 점).
* 오직 투여량이 중간의 적정 범위에 있을 때만 환자가 완치된다(치유, 녹색 점).

동화 《골디락스와 세 마리 곰》에서 너무 뜨겁지도 차갑지도 않은 '딱 알맞은(just right)' 죽을 찾는 것처럼, 효과를 보는 구간이 중앙에 샌드위치처럼 끼어 있는 이른바 **골디락스 문제**다.

이 1차원 수직선 위에서는 임계값(0차원 점)을 어디에 단 하나 긋더라도 대량의 오분류가 불가피하다. 왼쪽을 가르면 오른쪽 미치유 환자들이 오분류되고, 오른쪽을 가르면 왼쪽 미치유 환자들이 오분류된다. 서포트 벡터 분류기(SVC)는 이처럼 샌드위치 형태로 중첩된 비선형 데이터를 선형적으로 가르는 데 완전히 무력하다.

### SVM의 직관: $y = \text{dosage}^2$ 축의 창조

여기서 서포트 벡터 머신(SVM)은 발상을 바꾼다. **"1차원에서 직선으로 가를 수 없다면, 데이터를 2차원으로 들어 올려 가르면 되지 않는가?"**

새로운 차원을 만들기 위해 환자에게서 새로운 피를 뽑거나 추가 검사를 할 필요는 전혀 없다. 우리가 이미 가지고 있는 유일한 특성인 '투여량($x$)'을 제곱하여, 이를 새로운 세로축 좌표 $y$로 삼는 것이다.

$$y = x^2$$

예를 들어 투여량이 $0.5$였던 환자는 새로운 평면에서 $(0.5, 0.5^2) = (0.5, 0.25)$라는 2차원 좌표를 얻는다. 모든 환자의 관측점을 $(x, x^2)$로 변환하여 2차원 평면에 산점도를 그리면 어떻게 될까?

데이터 포인트들은 2차 곡선, 즉 **포물선(Parabola)** 위에 정렬된다(투여량은 음수가 없으므로 포물선의 오른쪽 절반).
* 투여량이 적었던 미치유 환자들은 원점 가까운 왼쪽 아래에 놓인다.
* 투여량이 적정했던 치유 환자들은 곡선의 중간쯤에 놓인다.
* 투여량이 많았던 미치유 환자들은 오른쪽 위로 가파르게 올라간다.

투여량은 0 이상이므로 점들은 오른쪽 위로 휘어 올라가는 곡선 위에 놓인다. 곡선이 아래로 볼록하기 때문에, 양 끝의 미치유 환자를 잇는 선보다 가운데 치유 환자들이 아래쪽에 있다. 그래서 그 사이로 **비스듬한 직선 하나**를 그으면 직선 아래는 치유, 위는 미치유로 나뉜다.

1차원에서는 죽었다 깨어나도 하나의 점으로 분리할 수 없었던 데이터가, 차원을 하나 높여 포물선으로 구부려 놓자 단순한 직선 하나로 우아하게 양분되는 것이다.

> **특성 표현에 대한 통찰:**  
> 추가된 차원은 외부에서 관측한 새로운 정보가 아니라, 기존 데이터를 수학적으로 재해석하여 '지어낸(fabricated)' 것이다. 데이터가 보유한 근원적 정보의 총량은 변하지 않았지만, **표현(Representation)의 기하학적 형태**가 바뀌는 것만으로도 선형 분리가 불가능했던 문제가 자명한 선형 분리 문제로 전환된다.

### SVM의 세 단계 메커니즘 요약

이 직관이 바로 서포트 벡터 머신(SVM)의 핵심 알고리즘 전체를 관통하는 3단계 공식이다.

1. **저차원 데이터에서 시작한다**: 원래 데이터는 비교적 낮은 차원(예: 1차원 투여량)에 머물러 있으며, 이 상태에서는 선형 분리가 불가능하다.
2. **고차원 공간으로 매핑(투영)한다**: 수학적 변환을 통해 데이터를 더 높은 차원(예: $x^2$를 추가한 2차원 평면)으로 들어 올린다.
3. **고차원에서 선형 서포트 벡터 분류기를 찾는다**: 고차원 공간 속에서 두 그룹을 완벽하게 또는 최적의 소프트 마진으로 가르는 평평한 초평면(직선이나 면)을 학습한다.

새로운 환자가 들어왔을 때의 판정 역시 명쾌하다. 새로운 환자의 투여량을 똑같이 제곱하여 2차원 공간에 점을 찍은 뒤, 그 점이 고차원 분류 직선의 위쪽에 놓이는지 아래쪽에 놓이는지만 확인하면 끝난다.

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 6: 골디락스 문제 해결 — 1D 비선형 데이터를 2D 포물선으로 들어 올려 선형 분리</text>
<text x="30" y="68" font-size="16px" fill="#64748b">기존 특성을 제곱(x²)하여 차원을 추가함으로써 단순한 직선으로 분리하는 SVM의 직관</text>
<g transform="translate(40, 95)">
<rect width="360" height="255" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="20" y="30" font-size="17px" font-weight="bold" fill="#334155">(A) 1차원: 임계값 하나로는 불가</text>
<line x1="30" y1="130" x2="330" y2="130" stroke="#94a3b8" stroke-width="3"/>
<circle cx="50" cy="130" r="8" fill="#ef4444"/>
<circle cx="75" cy="130" r="8" fill="#ef4444"/>
<text x="40" y="165" font-size="16px" fill="#ef4444" font-weight="bold">미치유</text>
<rect x="135" y="121" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="170" y="121" width="18" height="18" rx="3" fill="#10b981"/>
<rect x="205" y="121" width="18" height="18" rx="3" fill="#10b981"/>
<text x="160" y="165" font-size="16px" fill="#10b981" font-weight="bold">치유</text>
<circle cx="265" cy="130" r="8" fill="#ef4444"/>
<circle cx="295" cy="130" r="8" fill="#ef4444"/>
<text x="260" y="165" font-size="16px" fill="#ef4444" font-weight="bold">미치유</text>
<text x="30" y="210" font-size="16px" fill="#b91c1c" font-weight="bold">어떤 점을 찍어도 대량 오분류 발생!</text>
<text x="30" y="235" font-size="16px" fill="#64748b">적정량에서만 치유</text>
</g>
<g transform="translate(440, 95)">
<rect width="420" height="275" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="20" y="30" font-size="17px" font-weight="bold" fill="#334155">(B) 2차원: y = x² 추가로 직선 분리</text>
<line x1="50" y1="210" x2="390" y2="210" stroke="#94a3b8" stroke-width="2"/>
<text x="320" y="232" font-size="16px" fill="#64748b">투여량 x</text>
<line x1="50" y1="210" x2="50" y2="45" stroke="#94a3b8" stroke-width="2"/>
<text x="58" y="58" font-size="16px" fill="#64748b">y = x²</text>
<path d="M 50,210 Q 215,210 380,50" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="4,4"/>
<circle cx="76" cy="209" r="8" fill="#ef4444"/>
<circle cx="103" cy="206" r="8" fill="#ef4444"/>
<rect x="174" y="176" width="16" height="16" rx="3" fill="#10b981"/>
<rect x="207" y="162" width="16" height="16" rx="3" fill="#10b981"/>
<rect x="240" y="144" width="16" height="16" rx="3" fill="#10b981"/>
<circle cx="330" cy="94" r="8" fill="#ef4444"/>
<circle cx="363" cy="66" r="8" fill="#ef4444"/>
<line x1="66" y1="232" x2="380" y2="79" stroke="#6366f1" stroke-width="3"/>
<text x="120" y="100" font-size="16px" fill="#4338ca" font-weight="bold">비스듬한 직선 분류기</text>
<text x="60" y="258" font-size="16px" fill="#15803d" font-weight="bold">직선 아래 = 치유, 위 = 미치유</text>
</g>
</svg>
</div>

---

## 5. 커널: 다항 커널의 차수 $d$와 RBF 커널의 가중 최근접 이웃

### 변환의 자의성을 극복하는 커널 함수(Kernel Function)

앞선 예시를 보며 자연스러운 의문이 솟구칠 것이다. "왜 하필 제곱($x^2$)인가? 세제곱($x^3$)이나 네제곱은 안 되는가? 아니면 $\frac{\pi}{4}\sqrt{x}$ 같은 엉뚱한 식은 어떤가? 최적의 변환 함수는 도대체 어떻게 정하는가?"

데이터를 고차원으로 보내는 변환 규칙은 이론상 무한히 존재한다. 만약 분석가가 매번 주관적인 감으로 변환 공식을 지어내야 한다면 기계학습이라 부를 수 없을 것이다. SVM은 이 수학을 가능하고 효율적으로 만들기 위해 고차원 분류기를 체계적으로 찾는 도구를 쓴다. 그것이 **커널 함수(Kernel Function)**다.

커널 함수는 임의의 주먹구구식 변환 대신, 수학적으로 잘 정의된 규칙에 따라 고차원 공간 속에서 관측 쌍 간의 기하학적 관계를 탐색할 수 있도록 돕는다.

### 다항 커널(Polynomial Kernel)과 차수 $d$

가장 대표적인 커널 중 하나가 **다항 커널(Polynomial Kernel)**이다. 다항 커널은 다항식의 차수를 결정하는 핵심 파라미터 **$d$(degree)**를 지닌다.

* **$d = 1$**: 1차원 원래 공간에서 관측 쌍 사이의 선형적 관계를 계산한다. (단순 선형 분류기와 동일)
* **$d = 2$**: 투여량의 제곱($x^2$)을 기반으로 두 번째 차원을 체계적으로 생성하여 2차원 공간에서의 관계를 계산한다.
* **$d = 3$**: 투여량의 세제곱($x^3$) 차원까지 포함하여 3차원 공간에서의 관측 쌍 관계를 계산한다.
* **$d \ge 4$**: 4차원, 5차원 이상의 고차원 공간으로 차원을 점진적으로 확장하여 초평면을 탐색한다.

중요한 점은 분석가가 차수 $d$를 임의로 찍어서 맞추는 것이 아니라, **교차검증(Cross Validation)**을 통해 $d=1, 2, 3, 4\dots$를 체계적으로 대입해 보며 검증 성능이 가장 높은 최적의 차수 $d$를 데이터로부터 과학적으로 도출한다는 사실이다.

> [!NOTE]
> **[보충] 다항 커널의 식**[^2]  
> 두 관측 $a, b$에 대해 다항 커널은 $K(a,b) = (a\cdot b + r)^d$로 쓴다. $r$은 모든 값에 더하는 상수(뒤 코드의 `coef0`), $d$는 차수다. scikit-learn은 여기에 계수 $\gamma$를 붙여 $(\gamma\, a\cdot b + r)^d$를 계산하는데, 기본값 `gamma='scale'`은 $1/(\text{특성 수}\times\text{분산})$이라 표준화한 특성 하나만 쓰는 뒤의 예에서는 $\gamma=1$이 된다.

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 330" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 7: 다항 커널의 차수 d가 정하는 차원</text>
<text x="30" y="68" font-size="16px" fill="#64748b">d가 커질수록 관계를 계산하는 공간의 차원이 늘어난다. 좋은 d는 교차검증으로</text>
<g transform="translate(30, 95)">
<rect x="0" y="0" width="195" height="200" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
<text x="20" y="34" font-size="20px" font-weight="bold" fill="#1d4ed8">d = 1</text>
<text x="20" y="72" font-size="16px" fill="#1e40af">원래 1차원 그대로</text>
<text x="20" y="100" font-size="16px" fill="#1e40af">(x)</text>
<line x1="20" y1="150" x2="175" y2="150" stroke="#94a3b8" stroke-width="2.5"/>
<line x1="98" y1="125" x2="98" y2="175" stroke="#6366f1" stroke-width="3"/>
<rect x="215" y="0" width="195" height="200" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
<text x="235" y="34" font-size="20px" font-weight="bold" fill="#15803d">d = 2</text>
<text x="235" y="72" font-size="16px" fill="#166534">제곱 차원 추가</text>
<text x="235" y="100" font-size="16px" fill="#166534">(x, x²)</text>
<path d="M 240,180 Q 300,180 385,120" fill="none" stroke="#16a34a" stroke-width="2.5"/>
<rect x="430" y="0" width="195" height="200" rx="8" fill="#fdf4ff" stroke="#a855f7" stroke-width="2"/>
<text x="450" y="34" font-size="20px" font-weight="bold" fill="#7e22ce">d = 3</text>
<text x="450" y="72" font-size="16px" fill="#6b21a8">세제곱 차원까지</text>
<text x="450" y="100" font-size="16px" fill="#6b21a8">(x, x², x³)</text>
<polygon points="460,175 530,130 600,150 530,190" fill="#a855f7" fill-opacity="0.25" stroke="#a855f7" stroke-width="2"/>
<rect x="645" y="0" width="195" height="200" rx="8" fill="#f1f5f9" stroke="#64748b" stroke-width="2" stroke-dasharray="5,3"/>
<text x="665" y="34" font-size="20px" font-weight="bold" fill="#334155">d ≥ 4</text>
<text x="665" y="72" font-size="16px" fill="#334155">차원이 더 늘어남</text>
<text x="665" y="100" font-size="16px" fill="#334155">(그릴 수 없음)</text>
<text x="665" y="160" font-size="16px" fill="#334155">초평면으로 분류</text>
</g>
</svg>
</div>

### 방사형 기저 함수 커널 (Radial / RBF Kernel)

또 하나의 대표적인 커널은 **방사형 커널(Radial Kernel)**, 흔히 **RBF(Radial Basis Function) 커널**이라 부르는 것이다. ([보충] scikit-learn `SVC`의 기본 커널도 RBF다.)

RBF 커널의 가장 충격적인 특징은 데이터를 **무한 차원(Infinite Dimensions)**의 공간으로 매핑하여 서포트 벡터 분류기를 찾는다는 점이다. 무한 차원은 칠판에도, 모니터에도, 인간의 뇌 속에도 그릴 수 없다. 그렇다면 무한 차원에서 작동하는 RBF 커널을 우리는 어떻게 직관적으로 이해할 수 있을까?

놀랍게도 RBF 커널이 새로운 데이터를 분류할 때 보이는 실제 거동은 지극히 친숙하고 직관적인 모델인 **가중 최근접 이웃(Weighted Nearest Neighbors)**처럼 행동한다.

> **RBF 커널의 직관적 물리:**  
> 새로운 데이터 포인트가 주어졌을 때, 
> 1. 그 데이터와 **매우 가까운 이웃 관측점들**은 새로운 점의 판정에 **막대한 영향력(큰 가중치)**을 행사한다.
> 2. 반면 **멀리 떨어진 관측점들**은 분류에 **작은 영향**만 준다. ([보충] 아래 식에서 보듯 영향력은 거리의 제곱에 대해 지수적으로 줄어든다.)
> 
> (해설) 결국 새 점 주변에 어떤 클래스의 이웃이 가까이 모여 있는지가 분류를 크게 좌우한다.

무한 차원이라는 현란한 수학적 외피 속에, "가까운 이웃들의 목소리에 가장 귀를 기울인다"는 가장 상식적인 국소적 기하학 원리가 살아 숨 쉬고 있는 것이다.

> [!NOTE]
> **[보충] RBF 커널의 수식과 감마($\gamma$) 파라미터**[^2]  
> RBF 커널의 직관적 물리 동작을 수학 문헌의 엄밀한 수식으로 보충하자면, RBF 커널은 두 벡터 $\mathbf{x}_i, \mathbf{x}_j$ 사이의 유클리드 거리를 이용해 다음과 같이 정의된다.
> $$K(\mathbf{x}_i, \mathbf{x}_j) = \exp\left(-\gamma \|\mathbf{x}_i - \mathbf{x}_j\|^2\right)$$
> 여기서 하이퍼파라미터 $\gamma$(gamma)는 가중치가 거리 대비 얼마나 가파르게 감소하는지를 결정하는 대역폭(Bandwidth) 역할을 한다. $\gamma$가 너무 크면 아주 가까운 이웃만 고려하므로 결정 경계가 복잡하게 굴곡져 과적합 위험이 커지고, $\gamma$가 너무 작으면 먼 이웃들까지 둔감하게 반영하여 단순한 경계를 형성한다. 실무에서는 $\gamma$와 $C$를 함께 교차검증으로 고른다.

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 340" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 8: 방사형 기저 함수(RBF) 커널의 물리 — 가중 최근접 이웃의 직관</text>
<text x="30" y="68" font-size="16px" fill="#64748b">무한 차원의 분류기지만, 새 점에는 가까운 관측이 크게, 먼 관측이 작게 영향</text>
<g transform="translate(50, 95)">
<rect width="800" height="215" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<circle cx="380" cy="110" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
<text x="345" y="145" font-size="16px" font-weight="bold" fill="#1d4ed8">새 관측값 (x*)</text>
<rect x="300" y="95" width="22" height="22" rx="4" fill="#10b981" stroke="#047857" stroke-width="2"/>
<path d="M 330,106 L 360,108" stroke="#10b981" stroke-width="5"/>
<text x="240" y="85" font-size="16px" font-weight="bold" fill="#047857">가까운 이웃 (큰 영향력!)</text>
<rect x="420" y="60" width="20" height="20" rx="4" fill="#10b981" stroke="#047857" stroke-width="2"/>
<path d="M 415,75 L 395,95" stroke="#10b981" stroke-width="4"/>
<rect x="360" y="40" width="20" height="20" rx="4" fill="#10b981" stroke="#047857" stroke-width="2"/>
<path d="M 370,65 L 375,90" stroke="#10b981" stroke-width="4.5"/>
<circle cx="120" cy="80" r="10" fill="#ef4444"/>
<path d="M 140,85 L 355,108" stroke="#ef4444" stroke-width="1" stroke-dasharray="6,5" opacity="0.4"/>
<text x="90" y="60" font-size="16px" fill="#991b1b">먼 이웃 (작은 영향)</text>
<circle cx="150" cy="150" r="10" fill="#ef4444"/>
<path d="M 165,145 L 360,115" stroke="#ef4444" stroke-width="1" stroke-dasharray="6,5" opacity="0.4"/>
<circle cx="650" cy="120" r="10" fill="#ef4444"/>
<path d="M 635,118 L 400,111" stroke="#ef4444" stroke-width="1" stroke-dasharray="6,5" opacity="0.4"/>
<text x="610" y="95" font-size="16px" fill="#991b1b">먼 이웃 (작은 영향)</text>
<rect x="220" y="170" width="360" height="32" rx="6" fill="#ecfdf5" stroke="#6ee7b7" stroke-width="1"/>
<text x="240" y="192" font-size="16px" font-weight="bold" fill="#065f46">가까운 녹색 이웃 영향이 커서 '치유'</text>
</g>
</svg>
</div>

---

## 6. 커널 트릭: 변환하지 않고 변환한 것처럼

### 커널 트릭(Kernel Trick)의 충격적 실체

여기서 SVM의 가장 영리한 부분인 **커널 트릭(Kernel Trick)**이 등장한다.

지금까지의 설명을 들으면 누구나 이렇게 상상할 것이다. 
"아, SVM은 데이터를 가져와서 실제로 $x^2, x^3\dots$을 일일이 계산해 거대한 고차원 데이터 테이블을 만든 뒤, 그 고차원 공간에서 복잡한 초평면 연산을 수행하는구나!"

**하지만 그것은 완전히 틀렸다.** 
현실의 SVM은 데이터를 고차원으로 실제로 변환하는 계산을 **단 한 번도 수행하지 않는다.**

> **커널 트릭의 핵심 정의:**  
> 커널 함수는 데이터를 실제로 고차원 공간으로 변환(프로젝션)하지 않고도, **오직 저차원 공간의 원래 데이터 좌표만을 사용하여**, 마치 데이터가 고차원에 매핑되었을 때 나타날 두 점 사이의 기하학적 관계(내적, Dot Product)를 수학적으로 완벽하게 계산해내는 영리한 기법이다.

개념은 그대로다. 여전히 "고차원으로 옮겨 그곳에서 서포트 벡터 분류기를 찾는다". 달라지는 것은 옮기는 계산을 실제로 하지 않는다는 점뿐이다.

> [!NOTE]
> **[보충] 작은 예로 확인하는 커널 트릭**  
> 뒤의 코드와 같은 설정인 $r=\tfrac12,\ d=2$의 다항 커널을 1차원 값 $a, b$에 대해 풀어 보자.
> $$(ab+\tfrac12)^2 = a^2b^2 + ab + \tfrac14 = (a^2,\ a,\ \tfrac12)\cdot(b^2,\ b,\ \tfrac12)$$
> 왼쪽은 원래 숫자 두 개로 곱하고 더하고 제곱하는 계산이고, 오른쪽은 각 점을 3차원 좌표 $(x^2, x, \tfrac12)$로 옮긴 뒤 내적한 값이다. 둘은 언제나 같다. 예를 들어 $a=1, b=2$이면 왼쪽은 $(2+0.5)^2=6.25$, 오른쪽은 $1\cdot4+1\cdot2+0.25=6.25$다. 세 번째 좌표 $\tfrac12$는 모든 점에서 같아서 분류에 영향을 주지 않으므로, 실질적으로는 $(x, x^2)$ 평면에서 선을 긋는 것과 같다. 이것이 앞의 투여량 예와 뒤의 코드 실험을 잇는 다리다.


<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 330" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 9 [보충]: (ab + ½)²은 3차원 좌표의 내적과 같다</text>
<text x="30" y="68" font-size="16px" fill="#64748b">a = 1, b = 2일 때 두 길로 계산한 값이 모두 6.25</text>
<rect x="40" y="95" width="380" height="205" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
<text x="60" y="130" font-size="18px" font-weight="bold" fill="#15803d">커널로 바로 계산</text>
<text x="60" y="175" font-size="18px" fill="#166534">(1 × 2 + 0.5)²</text>
<text x="60" y="215" font-size="18px" fill="#166534">= 2.5² = 6.25</text>
<text x="60" y="270" font-size="16px" fill="#166534">새 좌표를 만들지 않음</text>
<rect x="480" y="95" width="380" height="205" rx="8" fill="#fff7ed" stroke="#f97316" stroke-width="2"/>
<text x="500" y="130" font-size="18px" font-weight="bold" fill="#c2410c">좌표로 옮긴 뒤 내적</text>
<text x="500" y="175" font-size="18px" fill="#9a3412">(1, 1, ½) · (4, 2, ½)</text>
<text x="500" y="215" font-size="18px" fill="#9a3412">= 4 + 2 + 0.25 = 6.25</text>
<text x="500" y="270" font-size="16px" fill="#9a3412">점마다 (x², x, ½)를 계산</text>
<text x="433" y="205" font-size="26px" font-weight="bold" fill="#334155">=</text>
</svg>
</div>

### 왜 커널 트릭이어야만 하는가?

커널 트릭이 머신러닝의 축복인 이유는 명확하다.

1. **계산량을 줄인다**: 
   차원이 높아질수록 좌표를 실제로 만들고 저장하는 비용이 커진다. 커널 트릭은 원래 좌표로 몇 번의 연산만 해서 고차원의 관계를 얻는다.
2. **무한 차원(RBF 커널)의 현실적 계산 실현**:
   어떤 컴퓨터도 데이터를 실제로 무한 차원 좌표로 바꿔 담을 수는 없다. 커널 트릭 덕분에 원래 데이터만으로 무한 차원에서의 관계를 계산할 수 있고, 그래서 RBF 커널을 쓸 수 있다.

### 커널 트릭의 불가피한 대가: 보이지 않는 모델

그러나 세상에 공짜 점심은 없다. 커널 트릭은 경이로운 연산 속도를 선물한 대신, 실무자에게 치명적인 대가를 요구한다.

> **커널 트릭의 트레이드오프:**  
> 모델이 학습을 마친 뒤에도, 고차원 공간에 변환된 데이터의 $x, y$ 좌표는 메모리상에 **애초에 존재하지 않는다.** 따라서 우리는 모델로부터 고차원 데이터의 좌표를 꺼낼 수도 없고, 모델이 찾은 멋진 고차원 초평면을 눈으로 시각화할 수도 없다!

이것이 파이썬 코드로 SVM을 다룰 때 많은 입문자들이 부딪히는 거대한 벽이다. "기껏 모델을 학습시켰는데, 왜 고차원 산점도와 결정 평면을 `plt.plot`으로 그릴 수 없는가?" 
좌표 자체가 계산된 적이 없기 때문이다. 따라서 모델의 동작을 눈으로 직접 확인하고 검증하려면, 분석가가 손으로 직접 수동 변환을 수행하여 눈앞에 펼쳐 보여야 한다.

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 340" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 10: 명시적 고차원 변환 vs 커널 트릭(Kernel Trick)의 연산 구조 비교</text>
<text x="30" y="68" font-size="16px" fill="#64748b">실제 고차원 좌표를 만들지 않고 저차원에서 동일한 내적 결과를 얻는 수학적 지름길</text>
<g transform="translate(40, 95)">
<rect width="380" height="215" rx="8" fill="#fff1f2" stroke="#fecdd3" stroke-width="1.5"/>
<text x="20" y="30" font-size="17px" font-weight="bold" fill="#9f1239">(A) 직접 변환 (무겁고 비효율적)</text>
<rect x="25" y="55" width="100" height="40" rx="6" fill="#ffffff" stroke="#e11d48"/>
<text x="35" y="80" font-size="16px" fill="#9f1239">저차원 (x)</text>
<path d="M 135,75 L 185,75" stroke="#e11d48" stroke-width="2.5"/>
<text x="140" y="65" font-size="16px" fill="#e11d48">Φ(x)</text>
<rect x="195" y="50" width="160" height="50" rx="6" fill="#ffffff" stroke="#e11d48"/>
<text x="205" y="75" font-size="16px" font-weight="bold" fill="#9f1239">실제 고차원 매핑</text>
<text x="205" y="93" font-size="16px" fill="#64748b">(x, x², x³ …)</text>
<path d="M 275,105 L 275,133" stroke="#e11d48" stroke-width="2.5"/>
<rect x="180" y="135" width="190" height="45" rx="6" fill="#ffe4e6" stroke="#e11d48"/>
<text x="195" y="162" font-size="16px" font-weight="bold" fill="#9f1239">내적 Φ(x)·Φ(z)</text>
<text x="25" y="208" font-size="16px" fill="#be123c">한계: 계산량 증가, 무한 차원 불가</text>
</g>
<g transform="translate(460, 95)">
<rect width="400" height="215" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
<text x="20" y="30" font-size="17px" font-weight="bold" fill="#14532d">(B) 커널 트릭 (가볍고 우아한 지름길)</text>
<rect x="25" y="55" width="110" height="40" rx="6" fill="#ffffff" stroke="#16a34a"/>
<text x="33" y="80" font-size="16px" fill="#14532d">원래 x, z</text>
<path d="M 145,75 Q 300,60 300,135" fill="none" stroke="#16a34a" stroke-width="3.5"/>
<text x="160" y="55" font-size="16px" font-weight="bold" fill="#15803d">K(x, z)로 바로</text>
<rect x="220" y="140" width="165" height="45" rx="6" fill="#dcfce7" stroke="#16a34a"/>
<text x="232" y="168" font-size="16px" font-weight="bold" fill="#15803d">같은 고차원 관계값</text>
<text x="25" y="125" font-size="16px" fill="#15803d" font-weight="bold">고차원 좌표 생성 없음</text>
<text x="25" y="150" font-size="16px" fill="#15803d" font-weight="bold">무한 차원(RBF)도 계산 가능</text>
<text x="25" y="205" font-size="16px" fill="#166534">대가: 좌표가 없어 시각화 불가</text>
</g>
</svg>
</div>

---

## 7. 코드로 확인하기 — 데이터 준비·스케일링·누수, poly SVC 68%

### 데이터셋 탐색과 구조 분석

이제 이론적 토대를 바탕으로 실제 파이썬과 scikit-learn 환경에서 SVM을 구현해 보자.
사용할 데이터는 995행짜리 `data_diabetes.csv`이고(당뇨 없음 497행, 있음 498행으로 거의 반반), 세 개의 열로 되어 있다.

1. `glucose`: 혈당 값 (20~70 범위의 정수, 학습용으로 만든 값)
2. `bloodpressure`: 혈압 값
3. `diabetes`: 당뇨병 진단 여부 ($0$: 정상/음성, $1$: 당뇨/양성)

데이터를 불러와 혈당(`glucose`) 단 하나의 특성만으로 당뇨 발병 여부(`diabetes`)를 1차원 수직선상에 시각화해 보면, 앞의 약물 투여량 예와 같은 구조가 나타난다. 혈당과 혈압을 함께 그린 2차원 산점도에서도 두 클래스는 가운데에서 크게 겹친다.

* 당뇨가 없는 정상 환자(클래스 $0$, 주황색 원)들은 혈당 수치 중간 영역에 집중적으로 뭉쳐 있다.
* 당뇨 환자(클래스 $1$, 파란색 x)들은 양쪽 끝에 퍼져 있다. 그래도 가운데에서 두 클래스가 상당히 겹친다.

결측치(`isnull().sum()`)가 전혀 없음을 확인한 후, 우리는 혈압을 제외하고 오직 혈당 수치 하나만을 독립변수 $X$로, 당뇨 여부를 종속변수 $y$로 분리한다.

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score

# 1. 데이터 로드 및 분리
df = pd.read_csv("data_diabetes.csv")
X = df.drop(['diabetes', 'bloodpressure'], axis=1) # glucose 특성만 유지
y = df['diabetes']
```

> **라이브러리 메모:**  
> `SVC`는 종속변수 $y$를 1차원 배열로 받기를 기대한다. 열 하나를 `df['diabetes']`로 꺼내면 자동으로 1차원(Series)이 되고, `df[['diabetes']]`처럼 대괄호를 한 겹 더 쓰면 데이터프레임으로 남는다.
>
> 이름도 짚어 둘 만하다. 서포트 벡터 '분류기'인 `SVC`가 서포트 벡터 '머신' 모듈(`sklearn.svm`)에 들어 있다. 이 글의 용어로 말하면 `SVC`는 커널을 지정하는 순간 SVM 전체를 수행한다. 이름만 보고 '선형 분류기만 하는 함수'로 오해하기 쉬운 지점이다.

### 데이터 분할과 특성 스케일링: 데이터 누수(Data Leakage)의 철저한 방지

이제 데이터를 80%의 훈련 세트와 20%의 테스트 세트로 분할한다(`test_size=0.2, random_state=42`).

SVM은 데이터를 스케일링하면 더 잘 작동한다. (해설) 마진과 커널이 모두 점 사이의 거리와 내적으로 계산되므로, 특성마다 단위가 다르면 숫자가 큰 특성이 결과를 좌우하기 쉽다. 그래서 평균을 빼고 표준편차로 나누어 평균 0, 표준편차 1로 맞추는 `StandardScaler`가 필수적이다.

여기서 데이터 분석의 성패를 가르는 치명적인 규칙이 존재한다. 바로 **데이터 누수(Data Leakage)의 차단**이다.

```python
# 2. 훈련/테스트 세트 분할
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 3. 스케일러 정의 및 '데이터 누수 방지' 적용
scaler = StandardScaler().set_output(transform="pandas")

# ★ 핵심: 훈련 데이터로만 평균과 표준편차를 학습(fit)한다
X_train_scaled = scaler.fit_transform(X_train)

# ★ 핵심: 테스트 데이터는 훈련 세트의 통계량을 사용해 변환(transform)만 한다
X_test_scaled = scaler.transform(X_test)
```

> **데이터 누수 차단의 원칙:**  
> 테스트 세트는 '미지의 미래 데이터'를 시뮬레이션하는 공간이다. 만약 전체 데이터나 테스트 세트를 포함하여 평균과 표준편차를 계산(`fit`)해 버리면, 모델은 테스트 세트의 분포 정보를 미리 엿보게(누수) 된다. 이는 실전 배포 시 성능 폭락으로 이어진다. 스케일러의 기준 통계량은 **오직 훈련 데이터로부터만 도출(`fit_transform`)**하고, 테스트 세트는 그 기준을 일방적으로 적용(`transform`)받아야만 정직한 모델 평가가 보장된다.

스케일링을 거치면 원래 $20 \sim 70$이던 혈당 값이 대략 $-4 \sim 4$ 안쪽으로 줄어든다(훈련 데이터 기준 약 $-3.7 \sim 3.9$, 테스트 데이터 약 $-3.7 \sim 3.1$). 분포의 모양은 바뀌지 않고 위치와 폭만 바뀐다.

### 다항 커널 SVC 모델 학습과 68% 정확도의 의미

이제 scikit-learn의 `SVC`를 활용해 2차 다항 커널 모델을 훈련시킨다.

```python
# 4. 다항 커널 SVC 학습
poly_model = SVC(kernel='poly', degree=2, coef0=0.5)
poly_model.fit(X_train_scaled, y_train)

# 5. 테스트 데이터 예측 및 평가
y_pred = poly_model.predict(X_test_scaled)
poly_cm = pd.crosstab(y_test, y_pred, rownames=['Actual'], colnames=['Predicted'])
poly_acc = accuracy_score(y_test, y_pred)

print(poly_cm)
print(f"Accuracy: {poly_acc:.2f}")
```

여기서 `degree=2`는 제곱 차원을 더하는 2차 변환이고, `coef0=0.5`는 커널 계산에서 모든 값에 더하는 상수다(앞 [보충]의 $r$). 0.5라는 값은 다항 커널을 설명할 때 쓴 예시 값을 그대로 가져온 것이다. 학습 과정에서 모델은 커널 트릭을 사용하므로 실제 고차원 좌표를 생성하지 않고 오직 관계값만을 빠르게 연산한다.

테스트 세트를 통과시킨 모델의 평가 결과는 다음과 같다.

* **혼동 행렬 (Confusion Matrix)**:
  $$\begin{pmatrix} 74 & 19 \\ 44 & 62 \end{pmatrix}$$
  * 정상 환자(0) 93명 중 74명을 정확히 맞히고, 19명을 당뇨로 오분류했다.
  * 당뇨 환자(1) 106명 중 62명을 정확히 맞히고, 44명을 정상으로 오분류했다.
* **정확도 (Accuracy)**: **약 68%** ($0.6834\dots$, $199$개 테스트 샘플 중 $136$개 정답)

68%는 높은 숫자가 아니다. 하지만 이 데이터는 가운데에서 두 클래스가 크게 겹친다. 그 상태에서 수직선 하나만 그어 "왼쪽은 1, 오른쪽은 0" 식으로 나누면 이보다 못하다. (해설) 같은 분할로 직접 재 보면, 훈련 데이터에서 가장 좋은 임계값 하나를 골라도 테스트 정확도는 약 57%이고, 전부 다수 클래스(1)로 찍으면 약 53%(106/199)다. 혈당 하나로 68%를 냈다는 것은 겹침을 감안하면 "훌륭하진 않지만 형편없지도 않은" 결과다. 성능 숫자는 데이터 구조와 함께 읽어야 한다.

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 360" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 11: 같은 혈당 하나로 낸 테스트 정확도 비교</text>
<text x="30" y="68" font-size="16px" fill="#64748b">테스트 199건 기준. 겹침이 심해 직선 하나로는 한계가 뚜렷하다</text>
<line x1="250" y1="95" x2="250" y2="300" stroke="#94a3b8" stroke-width="2"/>
<text x="40" y="140" font-size="17px" fill="#334155">전부 1로 예측</text>
<rect x="250" y="115" width="319" height="38" fill="#cbd5e1"/>
<text x="580" y="141" font-size="17px" fill="#334155">53.3%</text>
<text x="40" y="200" font-size="17px" fill="#334155">임계값 하나</text>
<rect x="250" y="175" width="341" height="38" fill="#fdba74"/>
<text x="602" y="201" font-size="17px" fill="#9a3412">56.8%</text>
<text x="40" y="260" font-size="17px" font-weight="bold" fill="#1d4ed8">2차 다항 커널</text>
<rect x="250" y="235" width="410" height="38" fill="#3b82f6"/>
<text x="671" y="261" font-size="17px" font-weight="bold" fill="#1d4ed8">68.3%</text>
<text x="250" y="325" font-size="16px" fill="#64748b">막대 길이 = 정확도 (0%에서 시작)</text>
</svg>
</div>

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 330" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 12: scikit-learn 데이터 전처리 및 누수 방지 파이프라인</text>
<text x="30" y="68" font-size="16px" fill="#64748b">훈련 세트의 평균·표준편차만을 추출하여 테스트 세트에 단방향 전파하는 안전한 구조</text>
<g transform="translate(40, 95)">
<rect x="0" y="30" width="180" height="150" rx="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
<text x="15" y="60" font-size="17px" font-weight="bold" fill="#334155">전체 995행</text>
<text x="25" y="90" font-size="16px" fill="#64748b">• glucose (혈당)</text>
<text x="25" y="115" font-size="16px" fill="#64748b">• diabetes (당뇨)</text>
<text x="15" y="145" font-size="16px" fill="#0284c7">8:2로 분할</text>
<path d="M 190,75 L 260,50" stroke="#0284c7" stroke-width="2.5"/>
<path d="M 190,135 L 260,160" stroke="#0284c7" stroke-width="2.5"/>
<rect x="270" y="15" width="230" height="75" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
<text x="285" y="42" font-size="16px" font-weight="bold" fill="#1d4ed8">훈련 세트 X_train (80%)</text>
<text x="285" y="68" font-size="16px" fill="#2563eb">fit_transform()</text>
<path d="M 505,50 L 555,80" stroke="#3b82f6" stroke-width="2.5"/>
<path d="M 505,160 L 555,135" stroke="#f97316" stroke-width="2.5"/>
<rect x="270" y="125" width="230" height="75" rx="6" fill="#fff7ed" stroke="#f97316" stroke-width="1.5"/>
<text x="285" y="152" font-size="16px" font-weight="bold" fill="#c2410c">테스트 세트 X_test (20%)</text>
<text x="285" y="178" font-size="16px" fill="#ea580c">transform()만 (누수 차단)</text>
<rect x="560" y="45" width="260" height="120" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
<text x="575" y="75" font-size="17px" font-weight="bold" fill="#15803d">스케일링 결과</text>
<text x="575" y="105" font-size="16px" fill="#166534">훈련: 평균 0, 표준편차 1</text>
<text x="575" y="130" font-size="16px" fill="#166534">테스트: 훈련 통계량 적용</text>
<text x="575" y="155" font-size="16px" fill="#047857" font-weight="bold">범위: 20~70 → 약 −4~4</text>
</g>
</svg>
</div>

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 360" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 13: 혼동 행렬(Confusion Matrix) 상세 구조 및 68% 정확도 해부</text>
<text x="30" y="68" font-size="16px" fill="#64748b">테스트 샘플 199개에 대한 실제값과 예측값의 2×2 교차 집계표</text>
<g transform="translate(60, 95)">
<text x="140" y="25" font-size="17px" font-weight="bold" fill="#334155">예측: 정상 (0)</text>
<text x="310" y="25" font-size="17px" font-weight="bold" fill="#334155">예측: 당뇨 (1)</text>
<text x="-50" y="85" font-size="17px" font-weight="bold" fill="#334155">실제: 정상 (0)</text>
<text x="-50" y="185" font-size="17px" font-weight="bold" fill="#334155">실제: 당뇨 (1)</text>
<rect x="110" y="40" width="160" height="90" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
<text x="155" y="80" font-size="26px" font-weight="bold" fill="#065f46">74</text>
<text x="135" y="110" font-size="16px" fill="#047857">진음성 TN</text>
<rect x="280" y="40" width="160" height="90" rx="8" fill="#fff7ed" stroke="#f97316" stroke-width="2"/>
<text x="335" y="80" font-size="26px" font-weight="bold" fill="#c2410c">19</text>
<text x="305" y="110" font-size="16px" fill="#ea580c">위양성 FP</text>
<rect x="110" y="140" width="160" height="90" rx="8" fill="#fff1f2" stroke="#f43f5e" stroke-width="2"/>
<text x="165" y="180" font-size="26px" font-weight="bold" fill="#9f1239">44</text>
<text x="135" y="210" font-size="16px" fill="#be123c">위음성 FN</text>
<rect x="280" y="140" width="160" height="90" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
<text x="335" y="180" font-size="26px" font-weight="bold" fill="#1e40af">62</text>
<text x="305" y="210" font-size="16px" fill="#2563eb">진양성 TP</text>
<g transform="translate(480, 40)">
<rect width="280" height="190" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="25" y="40" font-size="18px" font-weight="bold" fill="#1e293b">성과 종합 요약</text>
<text x="25" y="75" font-size="16px" fill="#334155">• 전체 평가 샘플: 199건</text>
<text x="25" y="105" font-size="16px" fill="#15803d">• 정답 맞힘: 74 + 62 = 136건</text>
<text x="25" y="135" font-size="16px" fill="#b91c1c">• 오분류: 19 + 44 = 63건</text>
<rect x="20" y="145" width="240" height="35" rx="6" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5"/>
<text x="35" y="169" font-size="17px" font-weight="bold" fill="#0369a1">정확도 약 68%</text>
</g>
</g>
</svg>
</div>

---

## 8. 보이지 않는 모델을 그리기 — 수동 제곱 + 선형 커널, 같은 결과, 기울기·절편

### 커널 트릭을 벗겨내는 수동 변환 실험

우리는 앞서 커널 트릭의 치명적 한계를 확인했다. `poly_model`은 내부에서 좌표를 계산하지 않으므로, 데이터가 포물선 위에서 어떻게 갈라지는지 시각화할 수 있는 좌표값을 제공하지 않는다.

그렇다면 모델이 실제로 포물선 위에서 직선 초평면을 그어 분류하고 있다는 사실을 어떻게 증명하고 눈으로 볼 수 있을까?
방법은 단순하다. **우리가 직접 손으로 2차원 특성을 만들고, 가장 단순한 선형 커널(`kernel='linear'`)을 돌려보는 것이다.**

```python
# 1. 수동 특성 공학: glucose^2 열 추가
X_linear_train = X_train_scaled.copy()
X_linear_train["glucose^2"] = X_train_scaled["glucose"] ** 2

X_linear_test = X_test_scaled.copy()
X_linear_test["glucose^2"] = X_test_scaled["glucose"] ** 2

# 2. 선형 커널 SVC 학습 (변환 없이 직선 초평면만 탐색)
linear_model = SVC(kernel='linear')
linear_model.fit(X_linear_train, y_train)

# 3. 테스트 세트 예측 및 혼동 행렬
y_pred_linear = linear_model.predict(X_linear_test)
linear_cm = pd.crosstab(y_test, y_pred_linear, rownames=['Actual'], colnames=['Predicted'])
linear_acc = accuracy_score(y_test, y_pred_linear)
```

선형 커널은 데이터에 그 어떤 차원 변환도 가하지 않고 주어진 좌표 그대로에서 최적의 직선(초평면)만을 긋는다. 이미 우리가 $x$와 $x^2$라는 2차원 좌표를 직접 만들어서 떠먹여 주었기 때문이다.

### 이론과 실제의 일치

이제 두 모델의 성적표를 나란히 대조해 보자.

| 비교 항목 | 모델 1: 다항 커널 (`kernel='poly', degree=2`) | 모델 2: 수동 제곱 특성 + 선형 커널 (`kernel='linear'`) | 일치 여부 |
| :--- | :---: | :---: | :---: |
| **적용 기법** | 커널 트릭 (좌표 생성 없음) | 수동 $x^2$ 열 생성 (2차원 명시적 매핑) | - |
| **혼동 행렬** | $\begin{pmatrix} 74 & 19 \\ 44 & 62 \end{pmatrix}$ | $\begin{pmatrix} 74 & 19 \\ 44 & 62 \end{pmatrix}$ | **동일** |
| **정확도** | **68.34%** ($0.6834$) | **68.34%** ($0.6834$) | **동일** |

커널 트릭으로 1차원에서 관계만 계산한 모델과, 실제로 $x^2$ 축을 만들어 2차원에서 직선을 그은 모델이 **같은 혼동 행렬과 같은 정확도**를 낸다. 테스트 199건 각각의 예측도 모두 같다.

이론과 실제가 맞아떨어지는 장면이다. 커널 트릭은 "고차원으로 옮겨 선을 긋는 일"을 계산만 줄여서 그대로 해낸다.

> [!NOTE]
> **[보충] 왜 같은 답이 나오나, 그리고 언제나 같은가**  
> 앞 [보충]에서 본 대로 $(ab+\tfrac12)^2$은 좌표 $(x^2, x, \tfrac12)$의 내적이고, 이 예에서는 scikit-learn의 $\gamma$도 1이다. 그래서 다항 커널 모델은 사실상 $(x, x^2)$ 평면에서 선형 SVM을 푼다. 다만 두 모델이 수학적으로 완전히 같은 문제는 아니다. 커널 쪽에는 상수 좌표 $\tfrac12$의 가중치가 정규화 항에 함께 들어가고, `coef0`나 $\gamma$가 달라지면 $x$와 $x^2$ 좌표의 상대적 크기도 달라진다. 그러니 "언제나 똑같다"기보다 "같은 공간에서 거의 같은 선을 찾기 때문에 이 데이터에서는 예측이 모두 일치했다"고 이해하는 편이 정확하다.

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 14: 두 길, 같은 결과</text>
<text x="30" y="68" font-size="16px" fill="#64748b">커널 트릭 모델과 손으로 변환한 모델이 같은 혼동 행렬을 낸다</text>
<rect x="30" y="100" width="190" height="70" rx="8" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5"/>
<text x="48" y="130" font-size="16px" font-weight="bold" fill="#334155">표준화한 glucose</text>
<text x="48" y="155" font-size="16px" fill="#475569">(1차원)</text>
<path d="M 220,120 L 290,100" stroke="#3b82f6" stroke-width="2.5"/>
<path d="M 220,160 L 290,245" stroke="#f97316" stroke-width="2.5"/>
<rect x="290" y="80" width="300" height="70" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
<text x="305" y="108" font-size="16px" font-weight="bold" fill="#1d4ed8">kernel='poly', degree=2</text>
<text x="305" y="135" font-size="16px" fill="#1e40af">coef0=0.5 (좌표 생성 없음)</text>
<rect x="290" y="210" width="300" height="100" rx="8" fill="#fff7ed" stroke="#f97316" stroke-width="2"/>
<text x="305" y="238" font-size="16px" font-weight="bold" fill="#c2410c">① glucose^2 열을 직접 추가</text>
<text x="305" y="265" font-size="16px" fill="#9a3412">② kernel='linear'</text>
<text x="305" y="292" font-size="16px" fill="#9a3412">(직선만 찾음, 기울기 계산 가능)</text>
<path d="M 590,115 L 650,180" stroke="#3b82f6" stroke-width="2.5"/>
<path d="M 590,260 L 650,210" stroke="#f97316" stroke-width="2.5"/>
<rect x="650" y="140" width="220" height="110" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
<text x="668" y="170" font-size="16px" font-weight="bold" fill="#15803d">같은 혼동 행렬</text>
<text x="668" y="198" font-size="17px" fill="#166534">[[74, 19],</text>
<text x="668" y="222" font-size="17px" fill="#166534"> [44, 62]]</text>
<text x="668" y="244" font-size="16px" fill="#166534">정확도 0.68</text>
<text x="30" y="350" font-size="16px" fill="#64748b">테스트 199건의 예측이 하나하나 모두 같다</text>
</svg>
</div>

### 가중치($w$)와 편향($b$)으로부터 기울기와 절편 유도하기

이제 우리는 2차원 평면의 $x$축(`glucose`)과 $y$축(`glucose^2`) 좌표를 명시적으로 가지고 있으므로, `linear_model`이 학습한 결정 직선의 방정식을 유도하여 산점도 위에 빨간 직선으로 직접 그려 넣을 수 있다.

그러나 scikit-learn은 우리에게 중학교 수학 시간에 배운 친숙한 기울기($m$)와 $y$절편($k$)을 직접 반환해 주지 않는다. 대신 다차원 공간의 초평면 방정식 계수인 **가중치 벡터($\mathbf{w}$)**와 **편향($b$)**을 제공한다.

```python
w = linear_model.coef_[0]        # 가중치 벡터: [w0, w1]
b = linear_model.intercept_[0]   # 편향: 스칼라 값 b
```

2차원 평면에서 초평면의 일반 방정식은 다음과 같이 표현된다.

$$w_0 x + w_1 y + b = 0$$

우리가 원하는 것은 가로축이 $x$, 세로축이 $y$인 직교좌표계에서 직선의 표준형인 $y = (\text{기울기})x + (\text{절편})$ 꼴이다. 위 식을 $y$에 대해 정리하면 다음과 같은 아름다운 변환식이 유도된다.

$$w_1 y = -w_0 x - b$$

$$y = \left(-\frac{w_0}{w_1}\right)x + \left(-\frac{b}{w_1}\right)$$

따라서 분류 직선의 기울기와 절편은 다음과 같이 계산된다.

$$\text{기울기 (Slope)} = -\frac{w_0}{w_1}$$

$$y\text{절편 (y-Intercept)} = -\frac{b}{w_1}$$

실제 모델 파라미터를 추출해 계산한 결과는 다음과 같다.
* 가중치 벡터: $w_0 \approx 0.949368$, $w_1 \approx 1.750278$
* 편향: $b \approx -1.120897$
* **기울기 (Slope)**:
  $$\text{slope} = -\frac{0.94936762}{1.75027796} \approx \mathbf{-0.5424} \quad (\text{약 } -0.542)$$
* **$y$절편 ($y$-Intercept)**:
  $$y\text{\_intercept} = -\frac{-1.12089748}{1.75027796} \approx \mathbf{0.6404} \quad (\text{약 } 0.640)$$

```python
slope = -w[0] / w[1]
y_intercept = -b / w[1]

print(f"Slope: {slope:.3f}")           # -0.542
print(f"y-Intercept: {y_intercept:.3f}") #  0.640
```

### 포물선 위의 빨간 직선 시각화

기울기 $-0.542$와 절편 $0.640$으로 2차원 산점도 위에 빨간 결정 직선을 그으면(matplotlib의 `axline`에 절편 점과 기울기를 넘기면 된다), SVM이 한 일이 눈에 보인다.

표준화한 혈당은 0을 중심으로 음수와 양수가 모두 있으므로, 점들은 $y = x^2$ 포물선을 따라 U자 모양으로 늘어선다. 빨간 직선은 포물선의 바닥을 비스듬히 가로지른다. 계산해 보면 직선 아래에 들어가는 구간은 표준화 혈당 약 $-1.1$에서 $0.6$ 사이다.
* **직선 아래쪽의 오목한 영역**: 정상 환자(클래스 0, 주황색 원)들의 대다수가 몰려 있어 **클래스 0**으로 판정된다.
* **직선 위쪽 영역**: 양쪽으로 올라가는 당뇨 환자(클래스 1, 파란색 x)들이 있어 **클래스 1**로 판정된다. 다만 바닥 근처에도 1이 적지 않게 섞여 있어, 이들은 0으로 잘못 분류된다. 혼동 행렬의 위음성 44건이 바로 이들이다.

1차원에서 가운데와 양 끝으로 갈라져 있던 데이터가, 2차원 포물선 위에서는 직선 하나로 나뉜다. 커널 트릭이 보이지 않게 한 일을 손으로 다시 해서 눈으로 확인한 셈이다.

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 470" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 15: (glucose, glucose²) 평면의 결정 직선</text>
<text x="30" y="68" font-size="16px" fill="#64748b">개념도(점은 예시). 직선 y = −0.542x + 0.640은 실제 학습값</text>
<g transform="translate(60, 90)">
<rect width="780" height="360" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<line x1="100" y1="240" x2="700" y2="240" stroke="#94a3b8" stroke-width="2"/>
<line x1="400" y1="250" x2="400" y2="25" stroke="#94a3b8" stroke-width="2"/>
<text x="410" y="35" font-size="16px" fill="#475569">glucose²</text>
<text x="390" y="262" font-size="16px" fill="#94a3b8">0</text>
<polyline points="130,42 139,55 148,68 157,80 166,91 175,102 184,113 193,124 202,134 211,143 220,152 229,161 238,169 247,176 256,184 265,190 274,197 283,203 292,208 301,213 310,218 319,222 328,226 337,229 346,232 355,234 364,236 373,238 382,239 391,240 400,240 409,240 418,239 427,238 436,236 445,234 454,232 463,229 472,226 481,222 490,218 499,213 508,208 517,203 526,197 535,190 544,184 553,176 562,169 571,161 580,152 589,143 598,134 607,124 616,113 625,102 634,91 643,80 652,68 661,55 670,42" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="6,4"/>
<circle cx="310" cy="218" r="8" fill="#f97316" fill-opacity="0.85"/>
<circle cx="337" cy="229" r="8" fill="#f97316" fill-opacity="0.85"/>
<circle cx="364" cy="236" r="8" fill="#f97316" fill-opacity="0.85"/>
<circle cx="391" cy="240" r="8" fill="#f97316" fill-opacity="0.85"/>
<circle cx="409" cy="240" r="8" fill="#f97316" fill-opacity="0.85"/>
<circle cx="436" cy="236" r="8" fill="#f97316" fill-opacity="0.85"/>
<circle cx="274" cy="197" r="8" fill="#f97316" fill-opacity="0.85"/>
<circle cx="472" cy="226" r="8" fill="#f97316" fill-opacity="0.85"/>
<path d="M 141,61 L 155,75 M 141,75 L 155,61" stroke="#1d4ed8" stroke-width="3"/>
<path d="M 177,106 L 191,120 M 177,120 L 191,106" stroke="#1d4ed8" stroke-width="3"/>
<path d="M 213,145 L 227,159 M 213,159 L 227,145" stroke="#1d4ed8" stroke-width="3"/>
<path d="M 249,177 L 263,191 M 249,191 L 263,177" stroke="#1d4ed8" stroke-width="3"/>
<path d="M 276,196 L 290,210 M 276,210 L 290,196" stroke="#1d4ed8" stroke-width="3"/>
<path d="M 483,211 L 497,225 M 483,225 L 497,211" stroke="#1d4ed8" stroke-width="3"/>
<path d="M 519,190 L 533,204 M 519,204 L 533,190" stroke="#1d4ed8" stroke-width="3"/>
<path d="M 555,162 L 569,176 M 555,176 L 569,162" stroke="#1d4ed8" stroke-width="3"/>
<path d="M 591,127 L 605,141 M 591,141 L 605,127" stroke="#1d4ed8" stroke-width="3"/>
<path d="M 636,73 L 650,87 M 636,87 L 650,73" stroke="#1d4ed8" stroke-width="3"/>
<path d="M 366,231 L 380,245 M 366,245 L 380,231" stroke="#1d4ed8" stroke-width="3"/>
<path d="M 411,232 L 425,246 M 411,246 L 425,232" stroke="#1d4ed8" stroke-width="3"/>
<line x1="130" y1="190" x2="670" y2="262" stroke="#ef4444" stroke-width="4"/>
<text x="140" y="30" font-size="16px" font-weight="bold" fill="#1d4ed8">직선 위 → 당뇨(1)</text>
<text x="40" y="285" font-size="16px" font-weight="bold" fill="#c2410c">직선 아래 → 정상(0)</text>
<text x="575" y="295" font-size="16px" fill="#475569">glucose (표준화)</text>
<rect x="210" y="300" width="320" height="42" rx="6" fill="#fef2f2" stroke="#f87171" stroke-width="1.5"/>
<text x="225" y="326" font-size="16px" font-weight="bold" fill="#b91c1c">결정 직선: y = −0.542x + 0.640</text>
<text x="560" y="335" font-size="16px" fill="#c2410c">● 0(정상)</text>
<text x="660" y="335" font-size="16px" fill="#1d4ed8">✕ 1(당뇨)</text>
</g>
</svg>
</div>

---

## 9. 정리: 개념 계보도와 머신러닝 실무 지침

### 선형 분류기의 3단계 진화 계보

지금까지의 흐름을 한 줄로 이으면, 앞 방법의 구체적 실패가 다음 방법을 부르는 계보가 된다.

```
[1단계] 단순 임계값
   ↓ (문제점: 임의의 위치 설정 시 비직관적 오분류 발생)
[2단계] 최대 마진 분류기 (Maximal Margin Classifier)
   ↓ (문제점: 이상치 하나에 경계선이 통째로 왜곡되는 극단적 분산)
[3단계] 서포트 벡터 분류기 (Support Vector Classifier, SVC)
   ↓ (해결책: 소프트 마진 도입, 교차검증으로 편향-분산 균형 달성)
   ↓ (문제점: 골디락스 예제처럼 데이터가 샌드위치 형태로 얽히면 선형 분리 불가)
[4단계] 서포트 벡터 머신 (Support Vector Machine, SVM)
   └─ 해결책: 고차원 투영 + 커널 함수(다항, RBF) + 커널 트릭을 통한 효율적 계산
```

<div class="svg-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin:24px 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 360" width="100%" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; margin:0; min-width:640px; display:block;">
<text x="30" y="40" font-size="20px" font-weight="bold" fill="#1e293b">도식 16: 서포트 벡터 머신(SVM) 알고리즘 진화 계보도</text>
<text x="30" y="68" font-size="16px" fill="#64748b">앞 단계의 구체적 실패와 한계를 극복하며 정립된 체계적 발전 경로</text>
<g transform="translate(30, 95)">
<rect x="0" y="20" width="240" height="110" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
<text x="18" y="48" font-size="17px" font-weight="bold" fill="#1d4ed8">1. 최대 마진 분류기</text>
<text x="18" y="74" font-size="16px" fill="#1e40af">• 마진 극대화 임계값</text>
<text x="18" y="98" font-size="16px" fill="#b91c1c">• 한계: 이상치에 민감</text>
<text x="18" y="120" font-size="16px" fill="#dc2626">• 오분류 불허 (하드 마진)</text>
<path d="M 245,75 L 305,75" stroke="#64748b" stroke-width="3"/>
<text x="250" y="65" font-size="16px" fill="#475569">극복</text>
<rect x="310" y="20" width="250" height="110" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
<text x="325" y="48" font-size="17px" font-weight="bold" fill="#15803d">2. 서포트 벡터 분류기</text>
<text x="325" y="74" font-size="16px" fill="#166534">• 소프트 마진 (오분류 허용)</text>
<text x="325" y="98" font-size="16px" fill="#166534">• 교차검증으로 마진 선택</text>
<text x="325" y="120" font-size="16px" fill="#b91c1c">• 한계: 심한 겹침에 무력</text>
<path d="M 565,75 L 625,75" stroke="#64748b" stroke-width="3"/>
<text x="570" y="65" font-size="16px" fill="#475569">도약</text>
<rect x="630" y="10" width="235" height="130" rx="8" fill="#fdf4ff" stroke="#a855f7" stroke-width="2.5"/>
<text x="645" y="38" font-size="17px" font-weight="bold" fill="#7e22ce">3. 서포트 벡터 머신</text>
<text x="645" y="64" font-size="16px" fill="#6b21a8">• 차원 올리기 (x² 등)</text>
<text x="645" y="88" font-size="16px" fill="#6b21a8">• 커널: 다항 d, RBF</text>
<text x="645" y="112" font-size="16px" fill="#6b21a8">• 커널 트릭</text>
<text x="645" y="132" font-size="16px" fill="#059669" font-weight="bold">겹친 데이터도 분류</text>
<rect x="0" y="165" width="865" height="48" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="25" y="195" font-size="16px" font-weight="bold" fill="#334155">각 단계는 앞 방법이 실패하는 장면에서 출발한다</text>
</g>
</svg>
</div>

### 3대 선형 분류기 핵심 특성 전수 비교

| 비교 기준 | 최대 마진 분류기 (Maximal Margin) | 서포트 벡터 분류기 (SVC) | 서포트 벡터 머신 (SVM) |
| :--- | :--- | :--- | :--- |
| **마진 유형** | 오분류 불허 마진 | 소프트 마진 | 고차원에서의 소프트 마진 |
| **오분류 허용 여부** | 절대 불허 (오차 허용 0개) | 유연하게 허용 (교차검증 결정) | 유연하게 허용 (교차검증 결정) |
| **이상치 민감도** | 극도로 민감 (과적합 위험) | 강건함 (이상치에 둔감) | 강건함 (이상치에 둔감) |
| **편향-분산 특성** | 낮은 편향, 높은 분산 | 편향 조금 높음, 분산 낮음 | 커널과 마진 선택으로 균형 |
| **작동 공간** | 원래의 원본 데이터 차원 | 원래의 원본 데이터 차원 | 변환된 고차원 (또는 무한 차원) |
| **비선형 중첩 해결** | 불가능 | 불가능 (선형 분할만 가능) | **가능** (커널을 통한 초평면 분할) |
| **분류기를 정하는 것** | 두 가장자리 관측의 중점 | 교차검증으로 고른 소프트 마진 | 커널(종류·차수)과 소프트 마진, 계산은 커널 트릭 |
| **고르는 값** | 없음 | 마진 안에 허용할 오분류·관측 수 ([보충] $C$) | 커널 종류, 차수 $d$ ([보충] RBF의 $\gamma$, $C$) |

### 코드에서 챙길 다섯 가지

1. **특성을 스케일링하라**:
   SVM은 스케일링하면 더 잘 작동한다. 거리와 내적으로 계산하므로, 단위가 다른 특성을 그대로 넣으면 숫자가 큰 쪽이 결과를 좌우한다.
2. **스케일러는 훈련 데이터로만 학습하라**:
   데이터 누수를 막기 위해 `scaler.fit_transform(X_train)`과 `scaler.transform(X_test)`의 엄격한 분리를 몸에 새겨야 한다.
3. **숫자 뒤에 숨은 기하학적 분포를 먼저 보라**:
   정확도 68%만 보면 실망스럽다. 그러나 가운데가 크게 겹친 데이터에서 임계값 하나로는 57% 남짓에 그친다. 산점도로 데이터 구조를 먼저 보고 숫자를 읽어라.
4. **시각화가 필요할 때는 수동 특성을 설계하라**:
   커널 트릭은 경이로운 속도를 제공하지만 내부 좌표를 지워 버린다. 결정 경계를 그려 봐야 한다면, 수동으로 다항 특성을 추가하고 선형 커널을 적용하여 기울기와 절편을 직접 추출하라.
5. **용어의 계층을 엄격히 구분하라**:
   scikit-learn에서는 서포트 벡터 '분류기'라는 이름의 `SVC`가 `svm` 모듈에 있고, 커널을 주면 SVM 전체를 수행한다. 개념상 서포트 벡터 분류기(고른 공간에서 선 긋기)와 SVM(차원을 올린 뒤 선 긋기)의 차이를 알고 있으면 이름에 헷갈리지 않는다.

---

## 각주

[^1]: 소프트 마진 최적화와 슬랙 변수의 표준적 정식화는 C. Cortes & V. Vapnik, "Support-Vector Networks", *Machine Learning* 20 (1995)에서 비롯한다. 본문의 [보충] 블록은 이 표준 형식을 요약한 것이다.
[^2]: 다항 커널 $(\gamma\,a\cdot b + r)^d$, RBF 커널 $\exp(-\gamma\|a-b\|^2)$, `gamma='scale'`의 정의와 `SVC`의 기본 커널(RBF)·기본 `C=1.0`은 scikit-learn의 `sklearn.svm.SVC` 문서 기준이다.
