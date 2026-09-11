// Interactive Memory Model Visualizer
function initVisualizer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const steps = [
    {
      id: 1,
      code: "x = 10000",
      title: "1단계: 힙 객체 생성 및 이름표 바인딩",
      desc: "힙(Heap) 메모리에 28바이트 크기의 PyLongObject(정수 10000)가 할당됩니다. 전역 네임스페이스에 'x'라는 이름표(포인터)가 등록되어 이 객체를 가리킵니다. (refcnt = 1)",
      globals: [
        { name: "x", target: "0x7fa3a0" }
      ],
      heap: [
        {
          addr: "0x7fa3a0",
          type: "PyLongObject (int)",
          header: "ob_refcnt: 1 | ob_type: <class 'int'>",
          payload: "Value: 10000 (28 Bytes)",
          highlight: true
        }
      ]
    },
    {
      id: 2,
      code: "y = x",
      title: "2단계: 참조 복사 (객체 복제가 아님)",
      desc: "새로운 정수 객체가 만들어지는 것이 아니라, 'y'라는 또 하나의 이름표가 동일한 0x7fa3a0 객체에 연결됩니다. ob_refcnt가 2로 증가합니다.",
      globals: [
        { name: "x", target: "0x7fa3a0" },
        { name: "y", target: "0x7fa3a0", isNew: true }
      ],
      heap: [
        {
          addr: "0x7fa3a0",
          type: "PyLongObject (int)",
          header: "ob_refcnt: 2 (증가!) | ob_type: <class 'int'>",
          payload: "Value: 10000 (동일 인스턴스 공유)",
          highlight: true
        }
      ]
    },
    {
      id: 3,
      code: "x = x + 1",
      title: "3단계: 불변 객체의 특성 (새 객체 생성 & 재바인딩)",
      desc: "int는 불변(Immutable)이므로 내부 값을 10001로 고칠 수 없습니다! 새로운 10001 객체(0x7fa420)를 생성하고 'x' 이름표를 옮겨 달며, 기존 10000 객체의 refcnt는 1로 감소합니다.",
      globals: [
        { name: "x", target: "0x7fa420", isRebound: true },
        { name: "y", target: "0x7fa3a0" }
      ],
      heap: [
        {
          addr: "0x7fa3a0",
          type: "PyLongObject (int)",
          header: "ob_refcnt: 1 (감소) | ob_type: <class 'int'>",
          payload: "Value: 10000 (y가 계속 참조 중)"
        },
        {
          addr: "0x7fa420",
          type: "PyLongObject (int)",
          header: "ob_refcnt: 1 | ob_type: <class 'int'>",
          payload: "Value: 10001 (새로 할당된 객체)",
          highlight: true
        }
      ]
    },
    {
      id: 4,
      code: "my_dog = Dog('바둑이')",
      title: "4단계: 데이터(인스턴스)와 로직(클래스)의 분리",
      desc: "클래스 Dog는 단 1개만 존재하며 bark 함수를 보관하는 공구함입니다. 인스턴스 my_dog는 함수 코드가 없고 오직 자신의 상태('name': '바둑이')만 가집니다.",
      globals: [
        { name: "Dog", target: "0x80a100" },
        { name: "my_dog", target: "0x80b200", isNew: true }
      ],
      heap: [
        {
          addr: "0x80a100",
          type: "PyTypeObject (class Dog)",
          header: "ob_type: <class 'type'>",
          payload: "__dict__: {'bark': <function Dog.bark at 0x80a190>}"
        },
        {
          addr: "0x80b200",
          type: "Dog Instance",
          header: "ob_refcnt: 1 | ob_type: 0x80a100 (Dog)",
          payload: "__dict__: {'name': '바둑이'} (함수 없음!)",
          highlight: true
        }
      ]
    },
    {
      id: 5,
      code: "m = my_dog.bark",
      title: "5단계: 점(.)을 찍는 순간 <Bound Method> 동적 탄생!",
      desc: "점(.)으로 접근하자 디스크립터(__get__)가 작동하여 힙에 새로운 'method' 래퍼 객체(0x90c300)를 즉석 생성합니다! Dog.bark 함수와 my_dog 인스턴스를 양손에 쥐고 대기합니다.",
      globals: [
        { name: "my_dog", target: "0x80b200" },
        { name: "m", target: "0x90c300", isNew: true }
      ],
      heap: [
        {
          addr: "0x80a100",
          type: "class Dog",
          header: "로직 공구함",
          payload: "bark: <function at 0x80a190>"
        },
        {
          addr: "0x80b200",
          type: "Dog Instance",
          header: "데이터 본체 (ob_type: Dog)",
          payload: "__dict__: {'name': '바둑이'}"
        },
        {
          addr: "0x90c300",
          type: "method (Bound Method 래퍼)",
          header: "ob_type: <class 'method'> (힙에 방금 생성!)",
          payload: "__func__: 0x80a190 (Dog.bark)<br>__self__: 0x80b200 (my_dog)",
          highlight: true
        }
      ]
    },
    {
      id: 6,
      code: "m()  # 또는 my_dog.bark()",
      title: "6단계: 실행 및 self의 진짜 화살표 방향",
      desc: "래퍼가 함수를 실행하며 __self__(my_dog 인스턴스)를 첫 번째 인자로 밀어 넣습니다. 실행 스택 프레임에서 self 매개변수의 화살표는 인스턴스를 가리킵니다! (self -> my_dog)",
      globals: [
        { name: "my_dog", target: "0x80b200" },
        { name: "m", target: "0x90c300" }
      ],
      heap: [
        {
          addr: "0x80a100",
          type: "class Dog",
          header: "실행 중: Dog.bark(self)",
          payload: "def bark(self): print(self.name + ' 멍멍!')"
        },
        {
          addr: "0x80b200",
          type: "Dog Instance (대상체)",
          header: "self 매개변수가 가리키는 종착점!",
          payload: "[스택의 self] ──────▶ [0x80b200 (my_dog)]",
          highlight: true
        }
      ]
    }
  ];

  let currentStep = 0;

  function render() {
    const step = steps[currentStep];
    container.innerHTML = `
      <div class="visualizer">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <h3 style="margin:0; font-size:1.15rem; color:var(--accent-color);">${step.title}</h3>
          <span style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-muted);">Step ${currentStep + 1} of ${steps.length}</span>
        </div>

        <div class="visualizer-controls">
          ${steps.map((s, idx) => `
            <button class="viz-btn ${idx === currentStep ? 'active' : ''}" data-step="${idx}">
              ${s.code}
            </button>
          `).join('')}
        </div>

        <div style="margin-bottom: 1.25rem; font-size:0.95rem; line-height:1.6; background:var(--card-bg); border:1px solid var(--border-color); padding:0.9rem 1.1rem; border-radius:6px;">
          <strong>💡 시스템 레벨 설명:</strong> ${step.desc}
        </div>

        <div class="viz-screen">
          <div style="display:grid; grid-template-columns: 1fr 2fr; gap: 1.25rem;">
            <!-- Namespace (Names/Labels) -->
            <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:6px; padding:0.9rem;">
              <div style="font-weight:700; font-size:0.85rem; color:var(--text-muted); border-bottom:1px solid var(--border-color); padding-bottom:0.4rem; margin-bottom:0.75rem;">
                🏷️ 네임스페이스 (이름표)
              </div>
              <div style="display:flex; flex-direction:column; gap:0.5rem;">
                ${step.globals.map(g => `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:var(--code-bg); padding:0.4rem 0.6rem; border-radius:4px; border:1px solid ${g.isNew || g.isRebound ? 'var(--accent-color)' : 'var(--border-color)'};">
                    <span style="font-weight:700; color:${g.isNew ? 'var(--success-color)' : 'var(--text-color)'};">${g.name}</span>
                    <span style="color:var(--text-muted); font-size:0.8rem;">─▶ ${g.target}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Heap Objects -->
            <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:6px; padding:0.9rem;">
              <div style="font-weight:700; font-size:0.85rem; color:var(--text-muted); border-bottom:1px solid var(--border-color); padding-bottom:0.4rem; margin-bottom:0.75rem;">
                📦 힙 메모리 (독립 PyObject 엔티티들)
              </div>
              <div style="display:flex; flex-direction:column; gap:0.75rem;">
                ${step.heap.map(h => `
                  <div style="border:1px solid ${h.highlight ? 'var(--accent-color)' : 'var(--border-color)'}; background:${h.highlight ? 'rgba(9, 105, 218, 0.04)' : 'var(--code-bg)'}; border-radius:6px; padding:0.75rem;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.3rem;">
                      <span style="font-weight:700; color:var(--accent-color);">${h.type}</span>
                      <span style="color:var(--text-muted); font-family:var(--font-mono);">${h.addr}</span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem;">${h.header}</div>
                    <div style="font-size:0.85rem; font-weight:600; color:var(--text-color);">${h.payload}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.viz-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentStep = parseInt(btn.getAttribute('data-step'));
        render();
      });
    });
  }

  render();
}
