import os
import re

target_file = r'c:\Pages\sources\지수-기호-발명사-로버트-레코드-데카르트.md'

with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. SVG for Archimedes Continued Proportions
svg_1 = '''<div class="svg-chart-container" style="margin: 28px 0; overflow-x: auto; -webkit-overflow-scrolling: touch;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" role="img" aria-label="아르키메데스의 연속 비례와 거듭제곱 곱셈 법칙" style="width:100%; min-width:680px; max-width:800px; height:auto; display:block; margin:0 auto; background:var(--bg-card); border-radius:14px; border:1px solid var(--border); box-shadow:var(--shadow-sm);">
  <defs>
    <marker id="m1-arr-gray" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,1 L5,3.5 L0,6 Z" fill="var(--text-light, #94a3b8)"/>
    </marker>
    <marker id="m1-arr-blue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,1.5 L6,4 L0,6.5 Z" fill="var(--primary, #2563eb)"/>
    </marker>
  </defs>

  <!-- Title & Subtitle -->
  <text x="400" y="32" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="15px" font-weight="700" fill="var(--text-main)">아르키메데스의 연속 비례(Continued Proportions)와 거듭제곱 곱셈 법칙</text>
  <text x="400" y="52" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" fill="var(--text-muted)">수열의 시작점(1)으로부터 떨어진 위치(단계)를 합산하여 곱셈 결과(a³ × a⁴ = a⁷)를 도출</text>

  <!-- Arc Jump: Step 3 + Step 4 = Step 7 -->
  <path d="M 425 105 C 425 45, 725 45, 725 105" fill="none" stroke="var(--primary, #2563eb)" stroke-width="2.5" stroke-dasharray="5,4" marker-end="url(#m1-arr-blue)"/>
  <rect x="535" y="46" width="90" height="22" rx="6" fill="var(--bg-surface)" stroke="var(--primary, #2563eb)" stroke-width="1.2"/>
  <text x="580" y="61" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="700" fill="var(--primary, #2563eb)">3 + 4 = 7단계</text>

  <!-- Nodes (1 -> a -> a² -> a³ -> a⁴ -> a⁷) -->
  <!-- Node 0: 1 -->
  <g transform="translate(35, 115)">
    <rect width="75" height="64" rx="10" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1.5"/>
    <text x="37.5" y="28" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="15px" font-weight="700" fill="var(--text-main)">1</text>
    <text x="37.5" y="48" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-muted)">시작점 (0)</text>
  </g>
  <line x1="110" y1="147" x2="145" y2="147" stroke="var(--text-light, #94a3b8)" stroke-width="1.5" marker-end="url(#m1-arr-gray)"/>

  <!-- Node 1: a -->
  <g transform="translate(150, 115)">
    <rect width="75" height="64" rx="10" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1.5"/>
    <text x="37.5" y="28" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="15px" font-weight="700" fill="var(--text-main)">a</text>
    <text x="37.5" y="48" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-muted)">1단계</text>
  </g>
  <line x1="225" y1="147" x2="260" y2="147" stroke="var(--text-light, #94a3b8)" stroke-width="1.5" marker-end="url(#m1-arr-gray)"/>

  <!-- Node 2: a² -->
  <g transform="translate(265, 115)">
    <rect width="75" height="64" rx="10" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1.5"/>
    <text x="37.5" y="28" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="15px" font-weight="700" fill="var(--text-main)">a²</text>
    <text x="37.5" y="48" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-muted)">2단계</text>
  </g>
  <line x1="340" y1="147" x2="375" y2="147" stroke="var(--text-light, #94a3b8)" stroke-width="1.5" marker-end="url(#m1-arr-gray)"/>

  <!-- Node 3: a³ -->
  <g transform="translate(380, 115)">
    <rect width="85" height="64" rx="10" fill="var(--primary-light, #eff6ff)" stroke="var(--primary, #2563eb)" stroke-width="2"/>
    <text x="42.5" y="28" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="15px" font-weight="800" fill="var(--primary, #2563eb)">a³</text>
    <text x="42.5" y="48" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="600" fill="var(--primary, #2563eb)">3단계</text>
  </g>
  <line x1="465" y1="147" x2="495" y2="147" stroke="var(--text-light, #94a3b8)" stroke-width="1.5" marker-end="url(#m1-arr-gray)"/>

  <!-- Node 4: a⁴ -->
  <g transform="translate(500, 115)">
    <rect width="85" height="64" rx="10" fill="var(--primary-light, #eff6ff)" stroke="var(--primary, #2563eb)" stroke-width="2"/>
    <text x="42.5" y="28" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="15px" font-weight="800" fill="var(--primary, #2563eb)">a⁴</text>
    <text x="42.5" y="48" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="600" fill="var(--primary, #2563eb)">4단계</text>
  </g>

  <!-- Ellipsis -->
  <text x="612" y="152" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="18px" font-weight="700" fill="var(--text-light, #94a3b8)">⋯</text>
  <line x1="632" y1="147" x2="668" y2="147" stroke="var(--primary, #2563eb)" stroke-width="1.5" marker-end="url(#m1-arr-blue)"/>

  <!-- Node 7: a⁷ -->
  <g transform="translate(675, 115)">
    <rect width="90" height="64" rx="10" fill="var(--primary, #2563eb)" stroke="var(--primary-hover, #1d4ed8)" stroke-width="2"/>
    <text x="45" y="28" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="16px" font-weight="800" fill="#ffffff">a⁷</text>
    <text x="45" y="48" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="600" fill="rgba(255,255,255,0.88)">7단계 (결과)</text>
  </g>

  <!-- Formula Summary -->
  <text x="400" y="215" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="13px" font-weight="600" fill="var(--text-main)">지수 곱셈 법칙: aᵐ · aⁿ = aᵐ⁺ⁿ  (a³ · a⁴ = a³⁺⁴ = a⁷)</text>
</svg>
</div>'''

# 2. SVG for Robert Recorde's Equals Sign Evolution
svg_2 = '''<div class="svg-chart-container" style="margin: 28px 0; overflow-x: auto; -webkit-overflow-scrolling: touch;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" role="img" aria-label="로버트 레코드의 등호 발명 계보" style="width:100%; min-width:680px; max-width:800px; height:auto; display:block; margin:0 auto; background:var(--bg-card); border-radius:14px; border:1px solid var(--border); box-shadow:var(--shadow-sm);">
  <defs>
    <marker id="m2-arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,1.5 L6,4 L0,6.5 Z" fill="var(--text-light, #94a3b8)"/>
    </marker>
  </defs>

  <!-- Title & Subtitle -->
  <text x="400" y="30" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="15px" font-weight="700" fill="var(--text-main)">로버트 레코드의 등호(=) 발명 계보: 『지혜의 숫돌』(1557)</text>
  <text x="400" y="48" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" fill="var(--text-muted)">라틴어 수사적 문장 반복에서 세계 공통의 수학 기호로의 진화</text>

  <!-- 4 Step Cards -->
  <!-- Card 1 -->
  <g transform="translate(30, 70)">
    <rect width="155" height="95" rx="10" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1.5"/>
    <rect x="12" y="12" width="60" height="20" rx="4" fill="var(--border)"/>
    <text x="42" y="26" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="700" fill="var(--text-muted)">1. 기존 관습</text>
    <text x="77.5" y="52" text-anchor="middle" font-family="ui-monospace, monospace" font-size="13px" font-weight="700" fill="var(--text-main)">is equalle to</text>
    <text x="77.5" y="74" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-muted)">지루한 문장 끝없는 반복</text>
  </g>
  <line x1="190" y1="117" x2="225" y2="117" stroke="var(--text-light, #94a3b8)" stroke-width="1.5" marker-end="url(#m2-arr)"/>

  <!-- Card 2 -->
  <g transform="translate(230, 70)">
    <rect width="155" height="95" rx="10" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1.5"/>
    <rect x="12" y="12" width="60" height="20" rx="4" fill="var(--border)"/>
    <text x="42" y="26" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="700" fill="var(--text-muted)">2. 레코드의 고뇌</text>
    <text x="77.5" y="52" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" font-weight="700" fill="var(--text-main)">시각적 단순화</text>
    <text x="77.5" y="74" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-muted)">집필 피로 및 교육 혁신</text>
  </g>
  <line x1="390" y1="117" x2="425" y2="117" stroke="var(--text-light, #94a3b8)" stroke-width="1.5" marker-end="url(#m2-arr)"/>

  <!-- Card 3: Gemowe lines -->
  <g transform="translate(430, 70)">
    <rect width="170" height="95" rx="10" fill="var(--primary-light, #eff6ff)" stroke="var(--primary, #2563eb)" stroke-width="1.8"/>
    <rect x="12" y="12" width="70" height="20" rx="4" fill="var(--primary, #2563eb)"/>
    <text x="47" y="26" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="700" fill="#ffffff">3. 쌍둥이 선</text>
    <text x="85" y="52" text-anchor="middle" font-family="ui-monospace, monospace" font-size="14px" font-weight="800" fill="var(--primary, #2563eb)">====== (Gemowe)</text>
    <text x="85" y="74" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="600" fill="var(--primary, #2563eb)">"더 같을 수는 없다"</text>
  </g>
  <line x1="605" y1="117" x2="635" y2="117" stroke="var(--text-light, #94a3b8)" stroke-width="1.5" marker-end="url(#m2-arr)"/>

  <!-- Card 4: Global Standard -->
  <g transform="translate(640, 70)">
    <rect width="130" height="95" rx="10" fill="var(--primary, #2563eb)" stroke="var(--primary-hover, #1d4ed8)" stroke-width="2"/>
    <rect x="12" y="12" width="65" height="20" rx="4" fill="rgba(255,255,255,0.2)"/>
    <text x="44.5" y="26" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="700" fill="#ffffff">4. 세계 표준</text>
    <text x="65" y="60" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="28px" font-weight="800" fill="#ffffff">=</text>
    <text x="65" y="80" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="10px" font-weight="600" fill="rgba(255,255,255,0.85)">인류 공통 등호</text>
  </g>
</svg>
</div>'''

# 3. SVG for Paradigm Shift: Oral Semantics -> Visual Syntax
svg_3 = '''<div class="svg-chart-container" style="margin: 32px 0; overflow-x: auto; -webkit-overflow-scrolling: touch;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" role="img" aria-label="대수학 인식론 대도약: 구술적 의미론에서 시각적 구문론으로" style="width:100%; min-width:680px; max-width:800px; height:auto; display:block; margin:0 auto; background:var(--bg-card); border-radius:14px; border:1px solid var(--border); box-shadow:var(--shadow-sm);">
  <defs>
    <marker id="m3-arr-blue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,1.5 L6,4 L0,6.5 Z" fill="var(--primary, #2563eb)"/>
    </marker>
  </defs>

  <!-- Title & Subtitle -->
  <text x="400" y="30" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="15px" font-weight="700" fill="var(--text-main)">대수학 인식론의 대도약: 구술적 의미론에서 시각적 구문론으로</text>
  <text x="400" y="48" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" fill="var(--text-muted)">"표기 규칙(Syntax)이 물리적 실체(Semantics)의 한계를 깨고 새로운 수학적 진리를 창출한다"</text>

  <!-- Left Card: Oral Semantics -->
  <g transform="translate(30, 70)">
    <rect width="345" height="225" rx="12" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1.5"/>
    <rect x="16" y="14" width="135" height="24" rx="6" fill="var(--border)"/>
    <text x="83.5" y="30" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="700" fill="var(--text-main)">과거: 구술적 의미론 중심</text>

    <!-- Sub-box 1: Intuition -->
    <rect x="16" y="48" width="313" height="66" rx="8" fill="var(--bg-card)" stroke="var(--border)" stroke-width="1"/>
    <text x="30" y="70" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" font-weight="700" fill="var(--text-main)">1. 물리적 직관 &amp; 구술 설명 (출발점)</text>
    <text x="30" y="90" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-muted)">• 선(1D) → 정사각형(2D) → 정육면체(3D)의 감각적 굴레</text>
    <text x="30" y="104" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-muted)">• 수는 사물을 꾸미는 '형용사' (계란 한 다스, 동전 3개)</text>

    <!-- Down Arrow inside left card -->
    <path d="M 172 118 L 172 134" stroke="var(--text-light)" stroke-width="2" marker-end="url(#m3-arr-blue)"/>

    <!-- Sub-box 2: Notation as mere recording -->
    <rect x="16" y="140" width="313" height="66" rx="8" fill="var(--bg-card)" stroke="var(--border)" stroke-width="1"/>
    <text x="30" y="162" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" font-weight="700" fill="var(--text-main)">2. 기호의 종속적 위치 (결과물)</text>
    <text x="30" y="182" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-muted)">• 기호는 단지 '말과 발음의 기록 도구'에 불과</text>
    <text x="30" y="196" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-muted)">• zenzizenzic, sursolid 등 명칭의 미로에 감금</text>
  </g>

  <!-- Big Central Transition -->
  <g transform="translate(385, 150)">
    <rect x="-3" y="-22" width="34" height="44" rx="8" fill="var(--primary-light, #eff6ff)" stroke="var(--primary, #2563eb)" stroke-width="1.5"/>
    <text x="14" y="5" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="18px" font-weight="800" fill="var(--primary, #2563eb)">➔</text>
  </g>

  <!-- Right Card: Visual Syntax -->
  <g transform="translate(425, 70)">
    <rect width="345" height="225" rx="12" fill="var(--primary-light, #eff6ff)" stroke="var(--primary, #2563eb)" stroke-width="1.8"/>
    <rect x="16" y="14" width="145" height="24" rx="6" fill="var(--primary, #2563eb)"/>
    <text x="88.5" y="30" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="700" fill="#ffffff">근대: 시각적 구문론 혁명</text>

    <!-- Sub-box 1: Syntax Rules -->
    <rect x="16" y="48" width="313" height="66" rx="8" fill="var(--bg-card)" stroke="var(--primary)" stroke-width="1"/>
    <text x="30" y="70" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" font-weight="700" fill="var(--primary, #2563eb)">1. 순수 기호 조작 규칙 (출발점)</text>
    <text x="30" y="90" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-main)">• 나눗셈 차감 규칙: xᵃ / xᵇ = xᵃ⁻ᵇ</text>
    <text x="30" y="104" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-main)">• 거듭제곱 곱셈 규칙: (xᵃ)ᵇ = xᵃᵇ</text>

    <!-- Down Arrow inside right card -->
    <path d="M 172 118 L 172 134" stroke="var(--primary, #2563eb)" stroke-width="2" marker-end="url(#m3-arr-blue)"/>

    <!-- Sub-box 2: Semantic Emergence -->
    <rect x="16" y="140" width="313" height="66" rx="8" fill="var(--bg-card)" stroke="var(--primary)" stroke-width="1"/>
    <text x="30" y="162" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" font-weight="700" fill="var(--primary, #2563eb)">2. 새로운 의미의 자동 창출 (도약)</text>
    <text x="30" y="182" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="600" fill="var(--text-main)">• 음수 지수 탄생: 2³ / 2⁵ = 2⁻² = 1/4</text>
    <text x="30" y="196" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="600" fill="var(--text-main)">• 분수 지수 통일: (2¹/²)² = 2¹ ⟹ 2¹/² = √2</text>
  </g>
</svg>
</div>'''

# 4. SVG for The Generalizers (Wallis -> Newton -> Euler)
svg_4 = '''<div class="svg-chart-container" style="margin: 28px 0; overflow-x: auto; -webkit-overflow-scrolling: touch;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" role="img" aria-label="일반화자들의 계보: 데카르트에서 오일러까지" style="width:100%; min-width:680px; max-width:800px; height:auto; display:block; margin:0 auto; background:var(--bg-card); border-radius:14px; border:1px solid var(--border); box-shadow:var(--shadow-sm);">
  <defs>
    <marker id="m4-arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,1.5 L6,4 L0,6.5 Z" fill="var(--text-light, #94a3b8)"/>
    </marker>
  </defs>

  <!-- Title & Subtitle -->
  <text x="400" y="30" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="15px" font-weight="700" fill="var(--text-main)">일반화자들의 계보: 데카르트에서 오일러까지 (1637 ~ 1748)</text>
  <text x="400" y="48" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" fill="var(--text-muted)">정수 반복 곱셈에서 무한급수와 복소 지수함수로의 연속적 확장</text>

  <!-- 4 Step Cards -->
  <!-- Card 1: Descartes -->
  <g transform="translate(25, 70)">
    <rect width="165" height="95" rx="10" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1.5"/>
    <text x="82.5" y="28" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" font-weight="700" fill="var(--text-main)">데카르트 (1637)</text>
    <text x="82.5" y="52" text-anchor="middle" font-family="ui-monospace, monospace" font-size="15px" font-weight="800" fill="var(--primary, #2563eb)">x³, x⁴, xx</text>
    <text x="82.5" y="74" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-muted)">밑과 위첨자 지수 확립</text>
  </g>
  <line x1="195" y1="117" x2="225" y2="117" stroke="var(--text-light, #94a3b8)" stroke-width="1.5" marker-end="url(#m4-arr)"/>

  <!-- Card 2: Wallis -->
  <g transform="translate(230, 70)">
    <rect width="165" height="95" rx="10" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1.5"/>
    <text x="82.5" y="28" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" font-weight="700" fill="var(--text-main)">존 월리스 (1655)</text>
    <text x="82.5" y="52" text-anchor="middle" font-family="ui-monospace, monospace" font-size="14px" font-weight="800" fill="var(--primary, #2563eb)">x⁻ⁿ, x¹/ⁿ</text>
    <text x="82.5" y="74" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" fill="var(--text-muted)">음수/분수 지수 제안</text>
  </g>
  <line x1="400" y1="117" x2="430" y2="117" stroke="var(--text-light, #94a3b8)" stroke-width="1.5" marker-end="url(#m4-arr)"/>

  <!-- Card 3: Newton -->
  <g transform="translate(435, 70)">
    <rect width="165" height="95" rx="10" fill="var(--primary-light, #eff6ff)" stroke="var(--primary, #2563eb)" stroke-width="1.8"/>
    <text x="82.5" y="28" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" font-weight="700" fill="var(--primary, #2563eb)">아이작 뉴턴 (1676)</text>
    <text x="82.5" y="52" text-anchor="middle" font-family="ui-monospace, monospace" font-size="13px" font-weight="800" fill="var(--primary, #2563eb)">(1+x)ʳ 급수</text>
    <text x="82.5" y="74" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="11px" font-weight="600" fill="var(--primary, #2563eb)">일반화된 이항정리</text>
  </g>
  <line x1="605" y1="117" x2="635" y2="117" stroke="var(--text-light, #94a3b8)" stroke-width="1.5" marker-end="url(#m4-arr)"/>

  <!-- Card 4: Euler -->
  <g transform="translate(640, 70)">
    <rect width="135" height="95" rx="10" fill="var(--primary, #2563eb)" stroke="var(--primary-hover, #1d4ed8)" stroke-width="2"/>
    <text x="67.5" y="28" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="12px" font-weight="700" fill="#ffffff">오일러 (1748)</text>
    <text x="67.5" y="52" text-anchor="middle" font-family="ui-monospace, monospace" font-size="13px" font-weight="800" fill="#ffffff">eⁱᵖᶦ + 1 = 0</text>
    <text x="67.5" y="74" text-anchor="middle" font-family="Pretendard, -apple-system, sans-serif" font-size="10px" font-weight="600" fill="rgba(255,255,255,0.85)">복소 지수함수 완성</text>
  </g>
</svg>
</div>'''

# Replace the 4 mermaid blocks in order
mermaid_blocks = re.findall(r'```mermaid[\s\S]*?```', content)
print(f'Found {len(mermaid_blocks)} mermaid blocks to replace.')

if len(mermaid_blocks) == 4:
    content = content.replace(mermaid_blocks[0], svg_1)
    content = content.replace(mermaid_blocks[1], svg_2)
    content = content.replace(mermaid_blocks[2], svg_3)
    content = content.replace(mermaid_blocks[3], svg_4)
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print('All 4 Mermaid blocks successfully replaced with responsive SVGs!')
else:
    print('Error: expected 4 mermaid blocks, but found:', len(mermaid_blocks))
