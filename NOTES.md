# Learning Notes & User Preferences

## User Profile & Preferences
- **Mental Model Foundation**: C/시스템 관점(포인터, 힙/스택, C 구조체, 메모리 주소)의 배경지식을 가지고 있어, 파이썬을 CPython 내부 구현(PyObject, ob_refcnt, ob_type) 및 메모리 레이아웃으로 환원해 설명할 때 이해도가 가장 높고 통찰을 얻음.
- **Form & Cleanliness**: 어수선한 서식, 깨진 인라인 태그([span_x], 노이즈)에 극도로 민감함. 군더더기 없는 정갈한 도식(ASCII/SVG/HTML)과 Tufte 스타일의 정돈된 레이아웃을 강력히 선호.
- **Core Insights Established**:
  1. 변수는 값을 담는 상자(Bucket)가 아니라 객체에 붙는 이름표(Label/Reference).
  2. 파이썬 세계는 객체 노드들과 참조 화살표로 이루어진 거대한 '객체 그래프(Object Graph)'.
  3. C 표준 추상기계 객체(스택 상의 단순 메모리 영역)와 파이썬 객체(헤더 메타데이터를 지닌 힙 노드)의 본질적 차이 이해.
- **Key Friction Points Addressed & Monitored**:
  1. self의 참조 방향: 인스턴스가 함수를 가리키는 것이 아니라, 함수가 실행될 때 인스턴스 자신을 전달받는 역방향 바인딩 화살표임.
  2. Bound Method의 실체: 단순 문법적 설탕이나 자동 호출기가 아니라, 점(.) 연산자로 인스턴스를 통해 함수를 조회할 때 디스크립터 프로토콜에 의해 힙에 동적으로 생성되는 얇은 래퍼 객체 (m1 is m2 -> False).
  3. 데이터(인스턴스 상태)와 로직(클래스 함수)의 완전한 공간적 분리.
