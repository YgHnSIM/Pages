---
title: "모든 것은 파일이다 — 리눅스의 /dev, /proc, /sys가 가리키는 보편 인터페이스"
subtitle: "열기·읽기·쓰기·닫기라는 네 동작이 장치와 프로세스와 커널 설정까지 같은 도구로 다루게 만든 유닉스 설계, 그리고 그 철학이 파일 디스크립터에서 멈추는 지점"
slug: "linux-everything-is-a-file"
date: "2026-11-13"
tags:
  - 컴퓨터과학
  - 시스템프로그래밍
  - 컴퓨터과학사
  - 해설
summary: "리눅스의 '모든 것은 파일이다(Everything is a file)'라는 설계 철학이 1970년대 초 벨 연구소의 유닉스 기원에서 출발해 오늘날 /dev의 장치와 특수 파일, /proc과 /proc/sys의 가상 프로세스·커널 설정, /sys와 cgroup의 하드웨어·컨테이너 제어, 그리고 파일 디스크립터와 셸 파이프로 이어지는 구조를 체계적으로 해설한다. 아울러 소켓과 ioctl, Plan 9의 사례를 통해 이 명제가 물리 법칙이 아니라 안내 원칙임을 짚고, '모든 것은 파일 디스크립터다'라는 더 정확한 표현과 엔지니어 실무의 쓰임을 정리한다."
archive_url: "https://yghnsim.github.io/Archive/pages/2026-11-13-리눅스모든것은파일.html"
---

## 서문: 명령어 더미가 하나의 단순한 체계로 보일 때

리눅스를 처음 마주하면 끝없이 이어지는 명령어와 알 수 없는 디렉터리 이름들이 거대한 미로처럼 느껴진다. 그런데 리눅스 파일시스템을 보물 찾기하듯 하나씩 열어 보면, 그 명령어 더미가 사실은 놀라울 만큼 단순한 하나의 체계 위에 놓여 있다는 사실이 드러난다. 키보드도 파일이고, 물리적인 하드디스크도 파일이다. 지금 실행 중인 프로그램은 파일로 가득한 폴더로 나타나고, 암호화 키를 만드는 난수 생성기마저 파일이다. 심지어 집어넣는 모든 것을 삼켜 버리고 아무것도 돌려주지 않는 아주 특별한 파일도 존재한다.

처음 들으면 기이하게 들리지만, 이것은 컴퓨팅 역사에서 가장 유명한 생각 중 하나를 압축한 네 단어에서 비롯된다. **"모든 것은 파일이다(Everything is a file)."** 이 네 단어의 의미를 제대로 이해하는 순간, 리눅스는 제각각 흩어진 명령어들의 집합이 아니라 하나의 일관된 인터페이스로 동작하는 정교한 시스템으로 보이기 시작한다.

이 글은 그 설계가 왜 탄생했는지부터 시작해, `/dev`, `/proc`, `/sys`라는 세 디렉터리를 따라 실제 리눅스 내부를 탐색하고, 그 아래에서 모든 입출력을 지탱하는 **파일 디스크립터(File Descriptor)**의 원리까지 짚어 본다. 마지막으로는 이 유명한 문장이 어디까지 참이고 어디에서 멈추는지, 그리고 왜 엔지니어들이 오늘날에도 이 마음 모형(mental model)에 깊이 의존하는지를 살핀다.

---

## 1. 만능 리모컨의 탄생: 왜 모든 것을 파일로 만들었을까

### 장치마다 '개인 언어'를 배우던 시절

왜 운영체제를 이런 방식으로 설계했을까? 답을 찾으려면 1970년대 초 벨 연구소(Bell Labs)로 거슬러 올라가야 한다. 당시 그곳에서 켄 톰슨(Ken Thompson)과 데니스 리치(Dennis Ritchie)는 유닉스(Unix)를 만들고 있었다[^1]. 그 시절에는 하드웨어 종류마다 말을 거는 방식이 제각각이었다. 테이프 드라이브는 자기만의 명령 집합을 요구했고, 프린터는 또 다른 명령 집합을 요구했으며, 터미널 역시 전혀 다른 명령 집합을 필요로 했다. 프로그램을 작성할 때마다 연결할 장치의 '개인 언어'를 일일이 배워야 했으니, 시스템 전체가 지저분하고 다루기 어려울 수밖에 없었다.

유닉스 설계자들은 여기서 **번뜩이면서도 거의 게으른(brilliant, almost lazy)** 아이디어를 떠올렸다. *"만약 모든 것이 같은 언어를 쓴다면 어떨까?"* 프린터를 텍스트 파일과 똑같은 방식으로 다룰 수 있다면 어떨까? 즉, **열기(open), 읽기(read), 쓰기(write), 닫기(close)**라는 단 네 가지 동작만으로 모든 대상을 다루게 하자는 것이었다. 프로그램이 파일을 다루는 법만 알면, 나머지 모든 장치와 자원도 자동으로 다룰 줄 알게 되는 구조다.

### 네 개의 버튼만 있는 만능 리모컨

이 발상은 **만능 리모컨**에 비유할 수 있다. 거실에 TV용 리모컨, 스피커용 리모컨, 에어컨용 리모컨을 따로 두는 대신, 모든 기기에 통하는 똑같은 버튼 네 개짜리 리모컨 하나만 쥐는 셈이다. 바로 이것이 유닉스 철학의 핵심이며, 유닉스의 설계를 따른 리눅스 역시 이 철학을 온전히 물려받았다.

<svg viewBox="0 0 420 780" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
<defs>
<marker id="eiaf1ah" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#38bdf8"/></marker><marker id="eiaf1ahg" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker>
</defs>
<rect x="0" y="0" width="420" height="780" rx="14" fill="#0b1120"/>

<text x="210" y="28" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">유닉스·리눅스의 만능 리모컨</text>
<text x="210" y="52" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">네 가지 공통 동작</text>
<text x="210" y="74" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">open / read / write / close</text>
<text x="210" y="100" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">프로그램은 대상의 '개인 언어'를</text>
<text x="210" y="120" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">배우는 대신, 동일한 네 버튼으로</text>
<text x="210" y="140" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">모든 자원에 접근한다</text>
<rect x="16" y="158" width="388" height="108" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/>
<text x="210" y="186" fill="#7dd3fc" font-size="17px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">사용자 프로그램</text>
<text x="210" y="210" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">파일을 다룰 줄만 알면</text>
<text x="210" y="230" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">나머지도 다룬다</text>
<rect x="135" y="232" width="150" height="26" rx="6" fill="#0f172a" stroke="#475569" stroke-width="1"/>
<text x="210" y="251" fill="#94a3b8" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" text-anchor="middle">cat / echo / dd</text>
<line x1="210" y1="266" x2="210" y2="290" stroke="#38bdf8" stroke-width="3" marker-end="url(#eiaf1ah)"/>
<rect x="16" y="298" width="388" height="214" rx="10" fill="#111827" stroke="#f59e0b" stroke-width="2"/>
<text x="210" y="326" fill="#fcd34d" font-size="17px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">만능 리모컨 (보편 인터페이스)</text>
<rect x="60" y="342" width="300" height="32" rx="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
<text x="210" y="364" fill="#e2e8f0" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" text-anchor="middle">1. open()  열기</text>
<rect x="60" y="382" width="300" height="32" rx="6" fill="#0f172a" stroke="#10b981" stroke-width="1.5"/>
<text x="210" y="404" fill="#e2e8f0" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" text-anchor="middle">2. read()  읽기</text>
<rect x="60" y="422" width="300" height="32" rx="6" fill="#0f172a" stroke="#a78bfa" stroke-width="1.5"/>
<text x="210" y="444" fill="#e2e8f0" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" text-anchor="middle">3. write() 쓰기</text>
<rect x="60" y="462" width="300" height="32" rx="6" fill="#0f172a" stroke="#f43f5e" stroke-width="1.5"/>
<text x="210" y="484" fill="#e2e8f0" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" text-anchor="middle">4. close() 닫기</text>
<line x1="210" y1="512" x2="210" y2="542" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#eiaf1ahg)"/>
<rect x="16" y="548" width="188" height="72" rx="8" fill="#111827" stroke="#475569" stroke-width="1.5"/>
<text x="110.0" y="578" fill="#f1f5f9" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">일반 텍스트 파일</text>
<text x="110.0" y="602" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">/ 디렉터리</text>
<rect x="216" y="548" width="188" height="72" rx="8" fill="#111827" stroke="#475569" stroke-width="1.5"/>
<text x="310.0" y="578" fill="#f1f5f9" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">하드웨어 장치</text>
<text x="310.0" y="602" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(/dev: 디스크·터미널)</text>
<rect x="16" y="632" width="188" height="72" rx="8" fill="#111827" stroke="#475569" stroke-width="1.5"/>
<text x="110.0" y="662" fill="#f1f5f9" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">실행 중 프로세스</text>
<text x="110.0" y="686" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">·커널 설정 (/proc)</text>
<rect x="216" y="632" width="188" height="72" rx="8" fill="#111827" stroke="#475569" stroke-width="1.5"/>
<text x="310.0" y="662" fill="#f1f5f9" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">하드웨어 계층</text>
<text x="310.0" y="686" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">·컨테이너 제한 (/sys)</text>
<text x="210" y="728" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">유닉스 철학: 1970년대 초</text>
<text x="210" y="750" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">벨 연구소의 설계가 리눅스로 그대로 이어짐</text>
</svg>

[해설] 이 구조의 핵심은 **추상화의 경계**를 어디에 두었는가이다. 장치마다 고유한 입출력 규칙을 사용자 공간(User Space) 프로그램에 노출하지 않고, 운영체제 커널 아래의 장치 드라이버가 번역 책임을 맡도록 넘긴 덕분에 상위 도구는 단 하나의 파일 인터페이스만 알면 되게 되었다[^3].

---

## 2. 오해 바로잡기와 `ls -l`이 보여 주는 일곱 가지 이름표

### "모든 것이 디스크 위 텍스트 문서"라는 뜻은 아니다

"모든 것은 파일이다"라는 말을 처음 접할 때 가장 흔히 빠지는 오해가 있다. 키보드나 하드디스크가 폴더 안에 들어 있는 텍스트 문서처럼 디스크 공간을 차지하고 있다는 뜻으로 받아들이는 것이다. 그러나 리눅스가 말하는 의미는 그것이 아니다.

정확한 뜻은 다음과 같다. **시스템 안의 모든 자원이 파일시스템을 통해 도달할 수 있고, 경로(path)를 가지며, 같은 기본 도구로 열고 읽고 쓸 수 있다**는 것이다.

### `ls -l`의 첫 글자: 정체를 밝히는 이름표

이 구조를 눈으로 확인하는 가장 깔끔한 방법은 아무 폴더에서나 `ls -l`을 실행해 각 줄의 **맨 앞 한 글자**를 보는 것이다. 그 작은 알파벳 하나가 해당 항목이 실제로 무엇인지를 알려 주는 이름표(name badge) 역할을 한다. 리눅스 파일시스템에는 이렇게 일곱 가지 파일 유형이 존재한다.

| 첫 글자 | 영문 명칭 | 한국어 명칭 | 성격과 역할 | 대표 예시 |
| :---: | :--- | :--- | :--- | :--- |
| `-` | Regular file | 일반 파일 | 데이터를 담고 있는 보통 파일 | 사진, 스크립트, 텍스트 문서 |
| `d` | Directory | 디렉터리 | 폴더 역시 파일이다. 다른 파일들의 **이름 목록**을 담은 특수 파일 | `/home`, `/dev`, `/proc` |
| `l` | Symbolic link | 심볼릭 링크 | 다른 파일이나 경로를 가리키는 바로가기 | `/proc/self/fd/0` 등 링크 |
| `c` | Character device | 문자 장치 | 데이터를 **한 글자(문자) 단위**로 순차 전송하는 장치 | 키보드, 터미널 |
| `b` | Block device | 블록 장치 | 데이터를 **큰 덩어리(블록) 단위**로 읽고 쓰는 장치 | 하드디스크, USB 저장장치 |
| `p` | Named pipe | 네임드 파이프 | 두 프로그램이 데이터를 주고받을 수 있게 해 주는 작은 터널 | 프로세스 간 파이프 파일 |
| `s` | Socket | 소켓 | 프로그램끼리 대화하기 위해 사용하는 문(doorway) | 로컬·네트워크 통신 소켓 |

일곱 가지 성격이 서로 다른 대상들이 **하나의 파일시스템** 안에 나란히 놓이고, **하나의 도구 집합**으로 다뤄진다. 디렉터리조차 예외가 아니다. 폴더는 파일과 별개의 신비한 그릇이 아니라, 그저 안에 담긴 이름들의 목록을 보관하는 특수한 파일일 뿐이다.

---

## 3. `/dev`: 물리 하드웨어와 순수한 마법의 특수 파일들

보물 찾기의 첫 번째 목적지는 `/dev` 디렉터리다. 이름 그대로 장치(devices)의 줄임말이며, 리눅스가 하드웨어와 특수 장치를 나타내는 파일들을 모아 두는 곳이다. `ls /dev`를 실행하면 긴 목록이 쏟아져 나온다.

### 물리 디스크를 바이트 단위로 읽고 쓰는 `dd`

`/dev` 안에는 시스템에 연결된 저장장치가 파일 이름으로 올라와 있다. 디스크의 종류에 따라 `sda`나 `nvme0n1` 같은 이름으로 나타나고, 그 안의 파티션은 `sda1`, `sda2`처럼 번호가 붙어 표시된다.

여기서 놀라운 점은, 사용자가 **root** 권한을 가지고 있다면 그 디스크 파일을 열어서 물리 하드디스크 전체를 **바이트 단위로 통째로 읽을 수 있다**는 사실이다. 디스크를 복제하거나 USB 설치 이미지를 굽는 `dd` 명령이 동작하는 원리가 바로 이것이다. `dd`는 그저 한 파일에서 데이터를 읽어 다른 파일에 쓸 뿐이다. 도구 입장에서는 자기가 읽고 쓰는 파일 중 하나가 물리적인 디스크 통째라는 사실을 전혀 신경 쓰지 않는다.

그렇기 때문에 `dd`를 쓸 때는 각별히 조심해야 한다. 잘못된 디스크 파일 경로를 지정해 쓰기를 실행하면, 그 디스크 전체가 그대로 덮어써져 버린다. 같은 단순한 규칙이 아주 현실적이고 무서운 결과를 낳는 셈이다.

[해설] `dd` 명령은 원래 IBM JCL의 `DD`(Data Definition) 구문에서 유래했다고 알려져 있으며, 오타 한 번으로 디스크를 통째로 지워 버릴 수 있다는 점에서 엔지니어들 사이에선 흔히 'Disk Destroyer'라는 별명으로 불리기도 한다[^4].

### 하드웨어 없는 순수한 마법: `/dev`의 네 가지 특수 파일

`/dev`에는 물리적인 하드웨어와 전혀 연결되어 있지 않지만, 모든 리눅스 엔지니어가 알아야 할 순수한 가상 특수 파일들도 살고 있다.

| 특수 파일 | 비유·역할 | 읽기(`read`) 동작 | 쓰기(`write`) 동작 | 주된 쓰임새 |
| :--- | :--- | :--- | :--- | :--- |
| `/dev/null` | 리눅스의 **블랙홀** | 읽으려 하면 **아무것도 나오지 않음** | 쓰는 모든 데이터가 흔적 없이 사라짐 | 스크립트의 불필요한 메시지·에러 침묵시키기 |
| `/dev/zero` | 끝없는 **0의 샘** | 0(널 바이트, 0x00)을 끝없이 내보냄 | — | 일정 크기의 빈 파일 생성, 저장공간 깨끗이 지우기 |
| `/dev/random`<br>`/dev/urandom` | **커널 난수 생성기** | 커널이 생성한 무작위 바이트 반환 | — | 암호화 키, 비밀번호, 보안 웹사이트 연결 |
| `/dev/full` | **가득 찬 디스크** | — | 쓰려고 하면 항상 **"디스크가 가득 참"** 오류 반환 | 저장공간 부족 상황에서 프로그램 동작 테스트 |

- **`/dev/null`**: 리눅스의 블랙홀이다. 여기에 무엇을 쓰든 즉시 사라져 버리고, 반대로 읽으려고 하면 아무것도 돌려주지 않는다. 명령어가 관심 없는 경고나 출력 메시지를 홍수처럼 쏟아낼 때 그 출력을 `/dev/null`로 리다이렉션해 소음을 없애는 데 자주 쓰인다. 엔지니어들 사이에서는 누군가의 불만을 들을 생각이 없을 때 *"불만 사항은 `/dev/null`로 보내라(Send your complaints to /dev/null)"*라고 농담하기도 한다.
- **`/dev/zero`**: 읽을 때마다 끝없는 0을 내어 준다. 원하는 크기의 빈 파일을 미리 만들어 두거나, 무언가를 0으로 덮어 깨끗하게 지워야 할 때 유용하다.
- **`/dev/random`과 `/dev/urandom`**: 이 파일들을 읽으면 커널이 만들어 낸 무작위 바이트(random bytes)를 얻는다. 바로 이 무작위성이 암호화 키, 비밀번호, 그리고 보안 연결의 바탕이 된다. 우리가 보안 웹사이트에 접속할 때, 프로그램 입장에서는 그저 파일 하나를 읽은 것처럼 보이지만 실제로는 커널이 건네준 난수가 보안을 뒷받침하고 있을 가능성이 크다.

[해설] 결정론적인 컴퓨터가 난수를 만들기 위해 리눅스 커널은 키보드 입력 간격, 하드웨어 인터럽트 타이밍 등 환경 노이즈를 엔트로피 풀(entropy pool)에 모아 암호학적 CSPRNG(현재 구현은 주로 ChaCha20 스트림 암호)를 시드·재시드하고, 그 출력으로 `/dev/random`과 `/dev/urandom`의 난수를 만든다[^5]. 전통적으로 `/dev/random`은 엔트로피 추정량이 부족하면 대기(blocking)하고 `/dev/urandom`은 대기하지 않는 것으로 구분되었다. Linux 5.6(2020) 이후에는 `/dev/random`의 블로킹 풀이 제거되어, 초기화 이후에는 `/dev/urandom`과 거의 동일하게 동작하며, 조기 부팅 단계에서만 `/dev/random`이 대기할 수 있다.

- **`/dev/full`**: 재미있으면서도 실용적인 파일이다. 여기에 무엇이든 쓰려고 하면 항상 *"죄송합니다, 디스크가 가득 찼습니다"*라는 오류를 돌려준다. 오직 개발자들이 디스크 공간이 바닥났을 때 자기 프로그램이 어떻게 반응하고 버티는지 시험해 볼 수 있도록 존재한다. 리눅스에서는 **에러 메시지조차 파일로 구현되어 있는 것**이다.

### 두 터미널 창으로 해 보는 작은 실험: TTY와 의사 터미널

터미널과 셸의 관계에서도 `/dev`의 파일 철학은 생생하게 드러난다[^2]. 터미널에서 `tty` 명령을 입력하면 `/dev/pts/0`이나 `/dev/pts/1` 같은 경로가 출력된다. 바로 그것이 파일이며, 사용자의 터미널 세션 전체가 이 파일을 통해 연결되어 있다.

이 사실은 간단한 실험 하나로 바로 증명된다.
1. 터미널 창을 두 개 연다.
2. 첫 번째 창에서 `tty`를 실행해 자기 터미널 장치 파일의 경로를 확인한다.
3. 두 번째 창에서 `echo hello > /dev/pts/<첫_창_번호>`처럼 첫 번째 창의 파일 경로로 텍스트를 리다이렉션해 보낸다.

그러면 놀랍게도 첫 번째 터미널 창 화면에 `hello`라는 글자가 불쑥 나타난다. 특별한 메신저 프로그램도 없고 네트워크 통신 코드를 짠 것도 아니다. 그저 파일에 글을 썼을 뿐인데 다른 터미널 창으로 메시지가 전달되었다. 이것이 "모든 것은 파일이다"라는 철학을 한눈에 보여 주는 가장 작은 실험이다.

---

## 4. `/proc`: 디스크에 없는 가상 파일시스템, 커널의 뇌로 난 창

지금까지는 하드웨어나 가상 장치를 다루는 `/dev`를 보았다. 이제 한 걸음 더 기이한 곳, **`/proc`** 디렉터리로 들어가 보자.

`/proc`의 가장 중요한 특징은 **디스크 위에 실제로 존재하지 않는다**는 점이다. 이곳은 **가상 파일시스템(Virtual File System)**이다. 사용자가 파일을 읽으려고 시도하는 바로 그 순간, 커널이 즉석에서 파일을 만들어 내어 내용을 채워 넣는다. 말하자면 커널의 뇌 속을 들여다볼 수 있도록 뚫어 놓은 마법의 창이다.

### 프로세스마다 생기는 폴더와 거울 `/proc/self`

시스템에서 실행 중인 모든 프로세스는 `/proc` 아래에 자신의 프로세스 ID(PID)를 이름으로 갖는 폴더를 얻는다. 예를 들어 어떤 프로그램의 PID가 `1234`라면 `/proc/1234` 폴더가 생긴다. 그 폴더 안을 열어 보면 해당 프로세스를 실행한 명령어, 환경 변수, 메모리 사용량, 그리고 지금 열어 둔 파일 목록까지 모두 파일 형태로 들어 있다.

여기에는 아주 영리한 바로가기 하나가 더 있다. **`/proc/self`**는 언제나 *지금 그 경로를 들여다보고 있는 프로세스 자기 자신*을 가리킨다. 따라서 터미널에서 `cat /proc/self/status`를 실행하면, `cat` 프로그램이 자기 자신의 상태 정보를 읽게 된다. 프로그램이 거울을 들여다보는 셈이다.

### 시스템 전역 정보와 모니터링 도구의 비밀

`/proc`은 개별 프로세스 정보만 담고 있지 않다. 시스템 전체를 보여 주는 파일들도 가득하다.
- `cat /proc/cpuinfo`: 시스템의 프로세서(CPU) 상세 정보
- `cat /proc/meminfo`: 메모리가 현재 어떻게 사용되고 있는지에 대한 상세 내역
- `cat /proc/uptime`: 시스템이 켜진 뒤 얼마나 오래 가동되었는지

우리가 일상적으로 쓰는 모니터링 도구들의 비밀도 여기에 있다. `ps`, `top`, `free` 같은 명령어들이 프로세스 목록과 메모리 상태를 보여 줄 때, 이들은 대부분 비밀스러운 전용 통로를 쓰는 것이 아니라 **`/proc` 아래의 파일들을 읽어 사람 눈에 보기 좋게 단장해 출력할 뿐**이다. 마음만 먹으면 `cat`만으로도 같은 날것의 데이터를 확인할 수 있다. `ps`나 `top`은 그저 그것을 더 예쁘게 보여 줄 뿐이다.

### `/proc`은 읽기 전용이 아니다: `/proc/sys`와 커널 실시간 제어

여기서 흔히 저지르는 잘못된 도식을 하나 바로잡아야 한다. `/proc`을 '읽기 전용', `/sys`를 '쓰기 전용'으로 나누어 이해하는 것은 사실과 다르다. **`/proc` 역시 양방향**이다.

특히 **`/proc/sys`** 아래에 있는 일부 파일들은 읽는 것뿐 아니라 **쓰기**도 가능하다. 여기에 값을 쓰면 시스템을 재부팅하지 않고도 실행 중인 커널의 동작 방식을 즉시 바꿀 수 있다. 대표적인 예가 네트워크 트래픽 포워딩 설정이다. 리눅스 머신이 여러 네트워크 인터페이스 사이에서 트래픽을 전달할지, 즉 일종의 라우터처럼 동작할지를 결정하는 파일이 `/proc/sys` 아래에 있다. 이 파일에 `0`이 들어 있으면 포워딩이 꺼져 있는 상태이고, **root** 권한으로 `1`을 써 넣으면 그 즉시 포워딩 기능이 켜진다. 도커 같은 컨테이너 플랫폼이나 쿠버네티스(Kubernetes)의 네트워킹이 바로 이런 커널 설정에 의존한다.

리눅스 관리자들이 자주 쓰는 `sysctl` 명령어도 마법이 아니다. 그것은 단지 `/proc/sys` 아래의 바로 이 파일들을 좀 더 친숙하고 편하게 읽고 쓸 수 있게 감싸 놓은 도구일 뿐이다. 결국 커널의 핵심 동작을 바꾸는 일조차 **파일에 숫자 하나를 쓰는 일**로 환원된다.

---

## 5. `/sys`: 하드웨어 계층과 컨테이너 제한까지

`/proc`에는 **`/sys`**라는 동생이 하나 있다. `/sys` 역시 디스크에 없는 또 하나의 가상 파일시스템이다. `/proc`에 비해 구조가 훨씬 더 정돈되어 있으며, 주로 시스템에 연결된 장치, 드라이버, 그리고 물리적 하드웨어의 계층 구조를 기술한다.

<svg viewBox="0 0 420 844" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="420" height="844" rx="14" fill="#0b1120"/>

<text x="210" y="28" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">가상 파일시스템 /proc과 /sys</text>
<text x="210" y="52" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">둘 다 읽기·쓰기가 가능한 커널 창구</text>
<text x="210" y="76" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">디스크에 저장되지 않고, 읽는 순간</text>
<text x="210" y="96" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">커널이 생성하거나 쓰는 순간</text>
<text x="210" y="116" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">커널·하드웨어 동작을 바꾼다</text>
<rect x="16" y="132" width="388" height="330" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/>
<text x="210" y="158" fill="#7dd3fc" font-size="17px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">/proc</text>
<text x="210" y="182" fill="#7dd3fc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">프로세스·시스템·커널 설정</text>
<rect x="26" y="202" width="368" height="84" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1.2"/>
<text x="210" y="224" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">프로세스 및 시스템 상태 읽기</text>
<text x="210" y="244" fill="#94a3b8" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" text-anchor="middle">/proc/&lt;PID&gt;/, /proc/self/status,</text>
<text x="210" y="264" fill="#94a3b8" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" text-anchor="middle">cpuinfo, meminfo, uptime</text>
<rect x="26" y="294" width="368" height="84" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1.2"/>
<text x="210" y="316" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">모니터링 도구의 원천</text>
<text x="210" y="336" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">ps, top, free는 대체로 /proc을 읽어</text>
<text x="210" y="356" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">예쁘게 보여 줌</text>
<rect x="26" y="386" width="368" height="64" rx="8" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5"/>
<text x="210" y="408" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">양방향 쓰기: /proc/sys (sysctl)</text>
<text x="210" y="428" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">재부팅 없이 커널 동작 변경 (예: IP 포워딩 0/1)</text>
<rect x="16" y="478" width="388" height="350" rx="10" fill="#111827" stroke="#10b981" stroke-width="2"/>
<text x="210" y="504" fill="#6ee7b7" font-size="17px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">/sys</text>
<text x="210" y="528" fill="#6ee7b7" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">/proc의 동생 · 장치·드라이버·cgroup</text>
<rect x="26" y="548" width="368" height="84" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1.2"/>
<text x="210" y="570" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">하드웨어 상태 읽기</text>
<text x="210" y="590" fill="#94a3b8" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" text-anchor="middle">/sys/class/power_supply/.../capacity</text>
<text x="210" y="610" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(배터리 %)</text>
<rect x="26" y="640" width="368" height="84" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5"/>
<text x="210" y="662" fill="#6ee7b7" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">하드웨어 직접 제어 (root 쓰기)</text>
<text x="210" y="682" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">백라이트 brightness 파일에 더 작은 숫자를 써</text>
<text x="210" y="702" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">화면을 어둡게</text>
<rect x="26" y="732" width="368" height="84" rx="8" fill="#0f172a" stroke="#a78bfa" stroke-width="1.5"/>
<text x="210" y="754" fill="#c4b5fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">컨테이너 자원 제한 (/sys/fs/cgroup)</text>
<text x="210" y="774" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">도커·쿠버네티스 CPU·메모리 제한도</text>
<text x="210" y="794" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">파일에 숫자를 씀</text>
</svg>

### 배터리 잔량 읽기에서 화면 밝기 조절, cgroup까지

`/sys`가 실제 하드웨어와 맞닿아 있는 모습은 리눅스 노트북에서 쉽게 확인할 수 있다.

1. **배터리 잔량 확인**: 많은 리눅스 노트북에서는 `/sys/class/power_supply` 아래로 들어가 `capacity` 파일을 읽으면 현재 배터리가 몇 퍼센트 남아 있는지 숫자로 나온다.
2. **화면 백라이트 제어**: 일부 머신에는 화면 백라이트를 담당하는 `brightness` 파일이 존재한다. **root** 권한으로 이 파일에 지금보다 더 작은 숫자를 쓰면, 실제로 노트북 화면이 어두워진다. 파일의 숫자를 고쳐 쓰는 행위로 물리적 하드웨어를 직접 제어하는 것이다.
3. **컨테이너 자원 격리(cgroup)**: 도커(Docker)나 쿠버네티스 같은 컨테이너 기술이 특정 컨테이너의 CPU와 메모리 사용량을 제한할 때 쓰는 **cgroup** 설정 역시 보통 `/sys/fs/cgroup` 아래에 파일로 존재한다. 도커나 쿠버네티스가 컨테이너의 메모리 상한을 정할 때, 깊은 곳에서 일어나는 일은 결국 이 파일에 숫자를 쓰는 작업이다. 밑바닥 끝까지 내려가도 여전히 파일이 파일인 것이다.

[해설] 일부 시스템에서는 화면 백라이트 파일이 `/sys/class/backlight` 아래에 있으며, cgroup v2 환경에서 메모리 상한 파일의 표준 이름은 `memory.max`이다(cgroup v1의 대응 파일은 `memory.limit_in_bytes`). `/sys`(sysfs)는 2.5 개발 주기에서 만들어져 Linux 2.6.0에 포함되었고, 장치 모델과 자원 제어 인터페이스를 일관된 디렉터리 트리로 정리해 준다[^6].

| 구분 | `/proc` | `/sys` |
| :--- | :--- | :--- |
| **성격** | 디스크에 없는 가상 파일시스템 (커널의 뇌로 난 창) | 디스크에 없는 가상 파일시스템 (`/proc`의 더 정돈된 동생) |
| **주된 대상** | 실행 중 프로세스(`/proc/<PID>`), CPU·메모리·가동시간, 커널 매개변수 | 장치, 드라이버, 하드웨어 계층, cgroup 자원 제한 |
| **대표 읽기 예** | `/proc/cpuinfo`, `/proc/meminfo`, `/proc/uptime`, `/proc/self/status` | `/sys/class/power_supply`의 `capacity` (배터리 잔량) |
| **대표 쓰기 예** | **`/proc/sys`** 아래 파일(예: IP 포워딩 `0`/`1`, `sysctl`) | 백라이트 `brightness` 파일(root 쓰기), `/sys/fs/cgroup` 아래 컨테이너 제한 |

---

## 6. 그 아래의 진짜 열쇠: 파일 디스크립터와 셸 파이프

이제 한 층 더 깊이 내려가 보자. 지금까지 파일 경로의 세계를 보았다면, 이번에는 프로그램이 그 파일을 연 **다음에** 커널과 어떻게 대화하는지 살펴볼 차례다.

### 외투 보관소 번호표 비유

프로그램이 어떤 파일을 열면, 커널은 그 대가로 아주 작은 정수 하나를 돌려준다. 이것이 바로 **파일 디스크립터(File Descriptor, FD)**다.

이는 레스토랑이나 극장의 **외투 보관소 번호표**와 똑같다. 손님이 코트를 맡기면 직원이 "3번"이라고 적힌 번호표를 건넨다. 그 뒤로는 코트가 어떤 브랜드인지, 어느 옷걸이에 걸려 있는지 길게 설명할 필요 없이 그저 3번 번호표만 내밀면 자기 코트를 찾을 수 있다. 프로그램도 마찬가지다. 파일을 한 번 열어 번호를 받으면, 이후의 모든 읽기와 쓰기는 그 작은 번호를 통해 이뤄진다.

### 태어날 때부터 쥐고 있는 세 장의 표: 0, 1, 2

리눅스의 모든 프로그램은 실행되는 순간부터 **이미 세 장의 번호표**를 손에 쥐고 시작한다.
- **0번 — 표준 입력(Standard Input, stdin)**: 프로그램이 데이터를 읽어 들이는 곳. 보통 키보드다.
- **1번 — 표준 출력(Standard Output, stdout)**: 정상적인 실행 결과가 나가는 곳. 보통 화면이다.
- **2번 — 표준 에러(Standard Error, stderr)**: 오류 메시지가 나가는 곳.

이 번호를 알고 나면 셸 스크립트에서 흔히 마주치는 `2>/dev/null` 같은 기호가 단번에 읽힌다. 이는 *"2번 번호표, 즉 표준 에러 흐름을 리눅스의 블랙홀(`/dev/null`)로 보내라"*라는 뜻이다.

<svg viewBox="0 0 420 552" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
<defs>
<marker id="eiaf3ah" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker><marker id="eiaf3dn" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#38bdf8"/></marker>
</defs>
<rect x="0" y="0" width="420" height="552" rx="14" fill="#0b1120"/>

<text x="210" y="28" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">파일 디스크립터</text>
<text x="210" y="52" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">커널이 건네는 외투 보관소 번호표</text>
<text x="210" y="74" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(0 · 1 · 2와 이후 번호)</text>
<text x="210" y="98" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">모든 프로세스는 0·1·2 세 장의 표를 쥔 채 시작하며,</text>
<text x="210" y="118" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">/proc/self/fd에서 열린 번호 목록을 볼 수 있다</text>
<rect x="16" y="140" width="388" height="118" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/>
<text x="210" y="168" fill="#7dd3fc" font-size="17px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">실행 중인 프로세스</text>
<text x="210" y="192" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">표 뒤에 무엇이 있는지 신경 쓰지 않고</text>
<text x="210" y="214" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">번호표로만 읽고 쓴다</text>
<rect x="50" y="224" width="320" height="26" rx="6" fill="#0f172a" stroke="#475569" stroke-width="1"/>
<text x="210" y="243" fill="#94a3b8" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" text-anchor="middle">/proc/self/fd/  →  실제 대상 링크</text>
<line x1="90.0" y1="258" x2="90.0" y2="288" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#eiaf3dn)"/>
<rect x="16" y="294" width="148" height="52" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
<text x="90.0" y="327" fill="#7dd3fc" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" text-anchor="middle">표 0 (stdin)</text>
<line x1="166" y1="320.0" x2="190" y2="320.0" stroke="#94a3b8" stroke-width="2" marker-end="url(#eiaf3ah)"/>
<rect x="192" y="294" width="210" height="52" rx="8" fill="#111827" stroke="#475569" stroke-width="1.5"/>
<text x="297.0" y="315" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">보통 키보드</text>
<text x="297.0" y="335" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">(또는 파이프 입력)</text>
<rect x="16" y="356" width="148" height="52" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5"/>
<text x="90.0" y="389" fill="#6ee7b7" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" text-anchor="middle">표 1 (stdout)</text>
<line x1="166" y1="382.0" x2="190" y2="382.0" stroke="#94a3b8" stroke-width="2" marker-end="url(#eiaf3ah)"/>
<rect x="192" y="356" width="210" height="52" rx="8" fill="#111827" stroke="#475569" stroke-width="1.5"/>
<text x="297.0" y="377" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">보통 화면 / 파일</text>
<text x="297.0" y="397" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">/ 파이프 / 소켓</text>
<rect x="16" y="418" width="148" height="52" rx="8" fill="#0f172a" stroke="#f43f5e" stroke-width="1.5"/>
<text x="90.0" y="451" fill="#fda4af" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" text-anchor="middle">표 2 (stderr)</text>
<line x1="166" y1="444.0" x2="190" y2="444.0" stroke="#94a3b8" stroke-width="2" marker-end="url(#eiaf3ah)"/>
<rect x="192" y="418" width="210" height="52" rx="8" fill="#111827" stroke="#475569" stroke-width="1.5"/>
<text x="297.0" y="439" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">에러 화면 또는</text>
<text x="297.0" y="459" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">2&gt;/dev/null 블랙홀</text>
<rect x="16" y="480" width="148" height="52" rx="8" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5"/>
<text x="90.0" y="513" fill="#fcd34d" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" text-anchor="middle">표 3, 4 …</text>
<line x1="166" y1="506.0" x2="190" y2="506.0" stroke="#94a3b8" stroke-width="2" marker-end="url(#eiaf3ah)"/>
<rect x="192" y="480" width="210" height="52" rx="8" fill="#111827" stroke="#475569" stroke-width="1.5"/>
<text x="297.0" y="501" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">추가로 연 파일, 장치,</text>
<text x="297.0" y="521" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">네트워크 소켓</text>
</svg>

### 프로그램은 표 뒤에 무엇이 있는지 모른다: 파이프의 우아함

이 구조가 가장 아름답게 빛나는 지점은 **무지(ignorance)의 설계**에 있다. 프로그램은 자기 번호표 뒤에 실제로 무엇이 연결되어 있는지 알지 못하며, 신경 쓸 필요도 없다. 1번 번호표가 모니터 화면일 수도 있고, 디스크의 텍스트 파일일 수도 있으며, 다른 프로그램으로 이어지는 파이프나 네트워크 연결일 수도 있다. 프로그램은 그저 1번 번호표에 데이터를 쓸 뿐이고, 리눅스가 그 데이터를 적절한 목적지로 배달한다.

그래서 유닉스와 리눅스의 **파이프(`|`)**가 이토록 매끄럽게 작동한다. 사용자가 첫 번째 명령어, 세로 막대(`|`), 두 번째 명령어를 나란히 입력하면, **셸(Shell)**이 첫 번째 프로그램의 1번 출력 번호표를 두 번째 프로그램의 0번 입력 번호표에 이어 준다. 두 프로그램 중 어느 쪽도 상대방이 누구인지 알거나 신경 쓰지 않는다. 그저 자기 번호표에서 읽고 자기 번호표에 쓸 뿐이다.

<svg viewBox="0 0 420 348" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
<defs>
<marker id="eiaf4ahg" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#10b981"/></marker><marker id="eiaf4ahb" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#38bdf8"/></marker>
</defs>
<rect x="0" y="0" width="420" height="348" rx="14" fill="#0b1120"/>

<text x="210" y="28" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">파이프(|)의 원리</text>
<text x="210" y="52" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">셸이 1번 출력 표와</text>
<text x="210" y="74" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">0번 입력 표를 잇는다</text>
<text x="210" y="98" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">어느 프로그램도 상대방을 알지 못한 채</text>
<text x="210" y="118" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">자기 번호표에만 읽고 쓴다</text>
<rect x="8" y="136" width="132" height="124" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2"/>
<text x="74.0" y="162" fill="#7dd3fc" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">명령어 1</text>
<text x="74.0" y="186" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">1번 표에</text>
<text x="74.0" y="206" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">결과를 쓸 뿐</text>
<rect x="80" y="226" width="52" height="24" rx="6" fill="#0f172a" stroke="#10b981" stroke-width="1.5"/>
<text x="106.0" y="243" fill="#6ee7b7" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" text-anchor="middle">FD 1</text>
<line x1="140" y1="198.0" x2="154" y2="198.0" stroke="#10b981" stroke-width="3" marker-end="url(#eiaf4ahg)"/>
<line x1="266" y1="198.0" x2="280" y2="198.0" stroke="#38bdf8" stroke-width="3" marker-end="url(#eiaf4ahb)"/>
<rect x="154" y="144" width="112" height="108" rx="10" fill="#0f172a" stroke="#f59e0b" stroke-width="2"/>
<text x="210.0" y="172" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">셸이 연결</text>
<text x="210.0" y="196" fill="#fcd34d" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">| (파이프)</text>
<text x="210.0" y="226" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">1번 → 0번</text>
<rect x="280" y="136" width="132" height="124" rx="10" fill="#111827" stroke="#a78bfa" stroke-width="2"/>
<text x="346.0" y="162" fill="#c4b5fd" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">명령어 2</text>
<text x="346.0" y="186" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">0번 표에서</text>
<text x="346.0" y="206" fill="#cbd5e1" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">데이터를 읽을 뿐</text>
<rect x="288" y="226" width="52" height="24" rx="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
<text x="314.0" y="243" fill="#7dd3fc" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" text-anchor="middle">FD 0</text>
<text x="210" y="288" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">참고: 셸이 파이프라인을 배선하면,</text>
<text x="210" y="310" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">커널은 그 파일 디스크립터들을 통해</text>
<text x="210" y="332" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">데이터를 흘려보낸다</text>
</svg>

[해설] 셸은 사용자가 입력한 `|` 기호를 해석해 파이프 생성과 표준 입출력 재배선(`pipe`, `dup2` 등)을 설정하는 주체이며, 실제 데이터 버퍼와 전송은 커널이 맡아 처리한다[^7].

이 번호표들의 실제 목록은 앞서 살펴본 `/proc`에서도 직접 확인할 수 있다. **`/proc/self/fd`** 폴더 안을 들여다보면, 현재 프로세스가 열어 둔 모든 파일의 번호(`0`, `1`, `2`와 그 이상의 번호들)가 나열되어 있고, **각 번호는 실제로 그 뒤에 연결된 대상을 가리키는 링크**로 되어 있다.

---

## 7. 솔직한 한계와 더 정확한 말: "모든 것은 파일 디스크립터다"

"모든 것은 파일이다"라는 문장은 강력하지만, 현실의 리눅스를 과장 없이 이해하려면 솔직한 한정선을 그을 필요가 있다. 이 문장은 **철학이지 완벽한 규칙이 아니며**, 리눅스 안에도 이 틀에 딱 들어맞지 않는 것들이 분명히 존재한다.

### 파일 경로로 환원되지 않는 예외들

1. **네트워크 연결**: 웹 서버에 접속하거나 소켓 통신을 할 때, 우리는 `/net/google` 같은 경로를 `open`하는 방식으로 연결을 만들지 않는다. 네트워크 연결은 주로 **소켓(socket)**과 전용 **시스템 콜**을 통해 생성된다.
2. **네트워크 카드**: 디스크가 `/dev/sda`처럼 나타나는 것과 달리, 네트워크 카드는 보통 `/dev` 아래에 파일로 나타나지 않는다.
3. **단순 읽기·쓰기를 넘는 하드웨어 제어**: 현대 하드웨어 제어의 상당 부분은 단순히 바이트를 읽고 쓰는 것만으로는 부족하기 때문에 **`ioctl`**이라는 특수 명령(시스템 콜)을 통해 이뤄진다.

[해설] 예컨대 광학 드라이브 트레이를 열거나 직렬 포트의 통신 속도(baud rate)를 바꾸는 것처럼, 데이터 흐름이 아닌 장치 자체의 상태·옵션을 제어하는 작업에는 전통적으로 `ioctl`이 쓰인다. 통신 속도는 이식성을 위해 POSIX `termios`/`tcsetattr`로 설정하는 경우가 많으며, 그 구현이 내부적으로 ioctl을 호출하는 것이 보통이다[^8].

### Plan 9의 극단과 리눅스의 실용적 균형

유닉스를 만든 창시자들은 나중에 벨 연구소에서 **Plan 9**이라는 연구용 운영체제를 만들면서 이 생각을 유닉스보다 한층 더 밀어붙였다. Plan 9에서는 네트워크 연결은 물론이고 심지어 화면의 **창(Windows)**까지도 파일로 만들었다[^9].

반면 리눅스는 이 아이디어를 **대체로, 그리고 매우 성공적으로** 따른다. 즉, "모든 것은 파일이다"는 깨뜨릴 수 없는 물리 법칙이 아니라, 시스템 전체를 일관되게 엮어 주는 **안내 원칙(guiding principle)**이다.

그래서 조금 더 정확하게 표현하자면 **"모든 것은 파일 디스크립터다(Everything is a file descriptor)"**라고 말하는 편이 낫다. 처음에 문을 여는 방식이 경로를 통한 `open`이든, 소켓 시스템 콜이든 간에, 일단 한 번 열리고 나면 — 그것이 디스크든, 파이프든, 소켓이든, 터미널이든 — 프로그램은 그 번호표를 쥐고 거의 똑같은 방식으로 읽고 쓰기 때문이다.

<svg viewBox="0 0 420 654" width="420" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
<defs>
<marker id="eiaf5ah" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker>
</defs>
<rect x="0" y="0" width="420" height="654" rx="14" fill="#0b1120"/>

<text x="210" y="28" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">철학의 한계와 정밀화</text>
<text x="210" y="52" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">&quot;모든 것은 파일&quot;에서</text>
<text x="210" y="76" fill="#f8fafc" font-size="18px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">&quot;모든 것은 파일 디스크립터&quot;로</text>
<text x="210" y="100" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">안내 원칙이지 물리 법칙이 아니다</text>
<text x="210" y="120" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">생성 경로는 달라도</text>
<text x="210" y="140" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">열린 뒤에는 같은 번호표로 다룬다</text>
<rect x="16" y="156" width="388" height="230" rx="10" fill="#111827" stroke="#f59e0b" stroke-width="2"/>
<text x="210" y="184" fill="#fcd34d" font-size="17px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">경로 모델이 그대로 맞지 않는 예외</text>
<text x="36" y="212" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 네트워크 연결: /net/google 대신</text>
<text x="54" y="232" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif">소켓·특수 시스템 콜</text>
<text x="36" y="258" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 네트워크 카드: 보통 /dev에</text>
<text x="54" y="278" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif">파일로 나타나지 않음</text>
<text x="36" y="304" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif">• 복잡한 하드웨어 제어:</text>
<text x="54" y="324" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif">읽기·쓰기를 넘는 ioctl 호출</text>
<text x="36" y="352" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif">(참고: 벨 연구소 Plan 9은</text>
<text x="36" y="372" fill="#94a3b8" font-size="16px" font-family="system-ui, -apple-system, sans-serif">네트워크와 창까지 파일화)</text>
<line x1="210" y1="388" x2="210" y2="422" stroke="#94a3b8" stroke-width="3" marker-end="url(#eiaf5ah)"/>
<rect x="16" y="424" width="388" height="214" rx="10" fill="#111827" stroke="#10b981" stroke-width="2"/>
<text x="210" y="452" fill="#6ee7b7" font-size="17px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">더 정확한 말:</text>
<text x="210" y="474" fill="#6ee7b7" font-size="17px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">Everything is a File Descriptor</text>
<rect x="36" y="488" width="348" height="40" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1.2"/>
<text x="210" y="514" fill="#e2e8f0" font-size="16px" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">디스크 · 파이프 · 소켓 · 터미널</text>
<text x="210" y="552" fill="#38bdf8" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">↓ 일단 열리고 나면</text>
<rect x="36" y="568" width="348" height="52" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5"/>
<text x="210" y="590" fill="#6ee7b7" font-size="16px" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">거의 같은 방식으로</text>
<text x="210" y="610" fill="#6ee7b7" font-size="16px" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" text-anchor="middle">read() · write() · close()</text>
</svg>

---

## 8. 왜 엔지니어에게 중요한가: 하나의 마음 모형, 끝없는 쓰임

이 설계가 50년도 더 지난 오늘날에도 현업 엔지니어에게 엄청난 힘을 주는 이유는 단순하다. **`cat`, `echo`, `grep`, 그리고 리다이렉션(`>`, `2>`) 같은 지극히 단순한 도구들이 갑자기 텍스트 파일뿐 아니라 하드웨어, 실행 중인 프로세스, 커널 설정, 컨테이너에까지 똑같이 통하기 때문이다.**

하나의 마음 모형(mental model)을 머릿속에 세워 두면 실무에서의 쓰임새는 끝이 없다.
- **프로덕션 서버 디버깅**: 장애가 난 서버에 들어가 `/proc`을 들여다보면, 지금 특정 프로세스가 정확히 무슨 일을 하고 있는지, 어떤 파일들을 열어 두었는지, 어떤 환경 변수로 시작되었는지를 별도의 무거운 도구 없이도 확인할 수 있다.
- **원인 모를 디스크 용량 고갈 추적**: 디스크가 알 수 없는 이유로 계속 차오를 때, 파일은 이미 삭제되었지만 프로세스가 여전히 파일 디스크립터로 붙잡고 놓아주지 않은 **삭제된 파일**을 찾아낼 수 있다.
- **커널 튜닝**: 재부팅 없이 커널 동작을 조정해야 할 때, 결국 해야 하는 일은 `/proc/sys` 등의 파일에 숫자를 쓰는 것이다.
- **스크립트 소음 제거**: 자동화 스크립트를 짤 때 불필요한 출력이나 에러 홍수는 `/dev/null`로 흘려보내 깔끔하게 침묵시킨다.

---

## 9. 정리와 세 가지 작은 실험

돌아보면 리눅스에서 모든 것은 파일이다. 우리가 매일 여는 일반 파일과 폴더는 물론이고, `/dev`의 디스크, `/dev/null`의 블랙홀, 난수 생성기, 터미널 세션, `/proc`에 모인 모든 실행 중 프로세스, `/proc/sys`의 커널 설정, `/sys`의 하드웨어, 그리고 cgroup의 컨테이너 자원 제한까지 모두 하나의 체계 아래에 놓인다.

그 모든 것의 바닥에 깔린 약속은 단 하나다. **열기, 읽기, 쓰기, 닫기.** 만능 리모컨의 같은 네 버튼. 50년도 더 전에 벨 연구소에서 시작된 영리한 지름길이[^1], 오늘날까지도 리눅스를 이토록 일관되고, 스크립트하기 쉽고, 탐험하기 즐거운 운영체제로 만드는 이유다.

[해설] 오늘날 클라우드 API, 스마트홈 기기, 각종 AI 도구들이 각기 다른 인터페이스와 규격을 요구하며 파편화되는 풍경을 보면, 장치마다 달랐던 1970년대의 혼란을 네 버튼으로 정리해 낸 유닉스의 만능 리모컨 비유는 시대를 건너뛰어 여전히 묵직한 질문을 던진다. 현대의 분산된 소프트웨어 세계에도 이런 보편 인터페이스가 다시 등장할 수 있을까?

이 글의 개념을 손끝으로 직접 확인해 보고 싶다면, 터미널을 열고 다음 **세 가지 작은 숙제**를 해 보는 것으로 충분하다.
1. `cat /proc/cpuinfo`를 실행해 내 컴퓨터의 프로세서가 파일이라는 창을 통해 어떻게 읽히는지 확인한다.
2. 터미널 창 두 개를 열어 `tty`로 첫 번째 창의 장치 파일 경로를 확인한 뒤, 두 번째 창에서 그 파일로 글을 써 메시지를 보내 본다.
3. `/proc/self` 안을 들여다보며 프로그램이 거울 속에서 자기 자신의 무엇을 보고 있는지 직접 확인한다.

---

[^1]: 유닉스는 1969년경 벨 연구소에서 시작되었고, 제1판 매뉴얼은 1971년 11월 3일이다. D. M. Ritchie, “The Evolution of the Unix Time-sharing System”, <https://www.nokia.com/bell-labs/about/dennis-m-ritchie/hist.html>; Unix Programmer’s Manual, <https://www.nokia.com/bell-labs/about/dennis-m-ritchie/1stEdman.html>. “1970년대 초”와, 2026년 기준으로 “50년도 더 전”은 이 연대와 맞는다. 장치와 파일을 같은 입출력으로 다루는 설계는 초기 유닉스부터 있었다(Ritchie & Thompson, “The UNIX Time-Sharing System”, <https://www.nokia.com/bell-labs/about/dennis-m-ritchie/cacm.html>). 다만 영어 표어 “Everything is a file” 자체는 초기 매뉴얼·논문에 그대로 등장하는 문구가 아니라, 그 설계를 나중에 요약한 관용구로 보는 것이 정확하다.
[^2]: 터미널과 셸의 차이는 별도 주제의 배경지식으로, 여기서는 터미널 세션이 `/dev/pts/...` 파일에 연결된다는 점만 다룬다.
[^3]: 같은 논문은 “Compatible file, device, and inter-process I/O”를 핵심 특징으로 들고, 특수 파일을 보통 파일처럼 읽고 쓰면 해당 장치가 동작한다고 설명한다. ioctl이나 소켓처럼 이 모형이 그대로 닿지 않는 지점은 본문 7장에서 다룬다.
[^4]: `dd`의 이름이 IBM JCL의 DD(Data Definition)에서 왔다는 설명은 Dennis Ritchie의 후일 언급으로 자주 인용되며, ‘Disk Destroyer’는 같은 맥락에서 엔지니어들 사이에 퍼진 별명이다.
[^5]: 엔트로피 풀이 CSPRNG를 시드한다는 설명은 random(7), <https://man7.org/linux/man-pages/man7/random.7.html>. 현재 커널 CSPRNG는 ChaCha20을 쓴다(`drivers/char/random.c`, <https://github.com/torvalds/linux/blob/master/drivers/char/random.c>). Linux 5.6 이후 `/dev/random`이 조기 부팅을 제외하면 더 이상 막지 않는다는 점은 random(4), <https://man7.org/linux/man-pages/man4/random.4.html>와 LWN, “Removing the Linux /dev/random blocking pool”, <https://lwn.net/Articles/808575/> (2020-01-07; 5.6 출시 <https://lwn.net/Articles/816213/>). random(7)의 비교표는 예전 블로킹 풀 동작을 적어 둔 곳이 있어, 5.6 이후 동작은 random(4)와 위 LWN을 따른다.
[^6]: 백라이트 ABI는 <https://www.kernel.org/doc/Documentation/ABI/stable/sysfs-class-backlight> (`/sys/class/backlight/<device>/brightness`). cgroup v2 `memory.max`는 <https://docs.kernel.org/admin-guide/cgroup-v2.html>, cgroup v1 `memory.limit_in_bytes`는 <https://docs.kernel.org/admin-guide/cgroup-v1/memory.html>. sysfs 문서는 <https://docs.kernel.org/filesystems/sysfs.html> (원문 날짜 2003-01-10). 2.5 개발 주기와 2.6.0-test 언급은 LWN, “kobjects and sysfs”, <https://lwn.net/Articles/54651/> (2003-10-22). Patrick Mochel, “The sysfs Filesystem”, OLS 2005, <https://www.kernel.org/pub/linux/kernel/people/mochel/doc/papers/ols-2005/mochel.pdf>.
[^7]: pipe(2), <https://man7.org/linux/man-pages/man2/pipe.2.html>; dup(2)/`dup2`, <https://man7.org/linux/man-pages/man2/dup.2.html>. 셸이 파이프를 이을 때는 `pipe`/`pipe2`, `fork`, `dup2`, `close`, `execve`가 함께 쓰이며, 커널이 파이프 버퍼와 전송을 담당한다.
[^8]: ioctl(2), <https://man7.org/linux/man-pages/man2/ioctl.2.html>. 터미널·시리얼 ioctl은 ioctl_tty(2), <https://man7.org/linux/man-pages/man2/ioctl_tty.2.html>. 이식성 있는 설정은 termios(3)/`tcsetattr`를 권한다.
[^9]: Rob Pike et al., “Plan 9 from Bell Labs”, <https://9p.io/sys/doc/9.html>. 파일시스템형 자원을 프로세스·그래픽·네트워크까지 확장했다고 명시한다. 창을 파일로 다루는 설계는 같은 계통의 “8½, the Plan 9 Window System”, <https://9p.io/sys/doc/8½/8½.html>과 이후 rio에도 이어진다.
