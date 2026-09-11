# Python Mental Model Resources

## Knowledge

- [Official Python Documentation: The Python Data Model](https://docs.python.org/3/reference/datamodel.html)
  파이썬 객체, 프로토콜, 디스크립터, 특수 메서드에 대한 공식 최고 권위 명세. Use for: 객체의 3요소(Identity, Type, Value) 및 매직 메서드 동작 규격 확인.
- [CPython Source Code: Include/object.h](https://github.com/python/cpython/blob/main/Include/object.h)
  CPython의 심장. PyObject, PyObject_HEAD, PyTypeObject의 실제 C 구조체 정의. Use for: C 레벨 메모리 레이아웃 및 참조 카운트 필드 검증.
- [Book: *CPython Internals* — Anthony Shaw](https://realpython.com/products/cpython-internals-book/)
  CPython 인터프리터의 컴파일, 바이트코드, 객체 할당, 가비지 컬렉션 심층 분석서. Use for: 정수 메모리 할당(PyLongObject) 및 바이트코드 실행 흐름 파악.
- [Book: *Fluent Python (2nd Edition)* — Luciano Ramalho](https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/)
  전문가를 위한 파이썬 내부 구조와 데이터 모델의 바이블. Use for: 변수 바인딩(상자 vs 레이블), 디스크립터 프로토콜, 얕은 복사/깊은 복사 심화.
- [Essay: *Facts and Myths about Python names and values* — Ned Batchelder](https://nedbatchelder.com/text/names.html)
  변수는 상자가 아니라 이름표라는 멘탈 모델을 정립한 역사적 명문. Use for: 변수 재할당과 뮤터블 인플레이스 변경의 차이 직관화.
- [HowTo Guide: *Descriptor HowTo Guide* — Raymond Hettinger](https://docs.python.org/3/howto/descriptor.html)
  파이썬 코어 개발자가 해설하는 바운드 메서드, 속성 조회, __get__ 메커니즘. Use for: 점(.)을 찍었을 때 왜 바운드 메서드 객체가 새로 생기는지 확인.

## Wisdom (Communities)

- [Python Core Mentorship / Discourse](https://discuss.python.org/c/core-dev/)
  CPython 개발자들과 코어 컨트리뷰터들이 파이썬 언어 아키텍처를 논의하는 공식 포럼. Use for: CPython 내부 구현 변경점 및 심층 아키텍처 질문.
- [r/Python](https://reddit.com/r/Python)
  글로벌 파이썬 엔지니어 커뮤니티. Use for: 파이썬 모범 사례, 실무에서의 객체 그래프/참조 버그 케이스 토론.
