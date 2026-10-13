# -*- coding: utf-8 -*-
import json
import os
import re

def format_srt_time(time_str, offset_seconds=0):
    # time_str is MM:SS
    parts = time_str.split(':')
    m = int(parts[0])
    s = int(parts[1])
    total_sec = m * 60 + s + offset_seconds
    h = total_sec // 3600
    rem_m = (total_sec % 3600) // 60
    rem_s = total_sec % 60
    return f"{h:02d}:{rem_m:02d}:{rem_s:02d},000"

def parse_seconds(time_str):
    parts = time_str.split(':')
    return int(parts[0]) * 60 + int(parts[1])

def format_timestamp(sec):
    h = sec // 3600
    m = (sec % 3600) // 60
    s = sec % 60
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"

def main():
    json_path = r"c:\Pages\raw_data\transcripts\RNquQF3mmr0_data.json"
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    utterances = data['transcript']
    chapters = data['chapters']

    out_dir = r"c:\Pages\raw_data\transcripts"

    # 1. Generate SRT file
    srt_path = os.path.join(out_dir, "RNquQF3mmr0_en.srt")
    with open(srt_path, 'w', encoding='utf-8') as f:
        for idx, u in enumerate(utterances):
            start_sec = parse_seconds(u['timestamp'])
            if idx < len(utterances) - 1:
                next_start = parse_seconds(utterances[idx + 1]['timestamp'])
                end_sec = max(start_sec + 2, next_start)
            else:
                end_sec = start_sec + 30
            
            f.write(f"{idx + 1}\n")
            f.write(f"{format_timestamp(start_sec)},000 --> {format_timestamp(end_sec)},000\n")
            f.write(f"[{u['speaker']}] {u['text']}\n\n")
    print(f"Saved SRT: {srt_path}")

    # 2. Korean Chapter Summaries
    chapter_summaries = {
        "00:00": {
            "title_ko": "도입부: 5만 세대의 문명 사슬과 기계로의 권력 이양",
            "desc": "인류는 5만 세대 동안 자식들에게 문명을 물려주며 사슬을 이어왔다. 하지만 우리는 역사상 최초로 문명의 미래를 자식이 아닌 기계에 넘겨줄 위기에 처했다. 과연 이것은 좋은 생각인가?"
        },
        "00:39": {
            "title_ko": "AI 50년의 역사: 체스 게임에서 거대언어모델(LLM)까지",
            "desc": "1960년대 문제 해결과 체스 게임에서 시작해 80년대 전문가 시스템의 부침, 90년대 확률론적 추론 및 강화학습의 수학적 정립을 거쳐, 오늘날 수학적 기반을 잊고 오직 규모(Scale)와 연금술적 모방 학습에 매몰된 딥러닝과 LLM의 변천사를 회고한다."
        },
        "04:15": {
            "title_ko": "AI의 '표준 모델'이란 무엇이며 왜 필연적으로 실패하는가?",
            "desc": "목표(Objective)를 사전에 고정하고 이를 최적으로 달성하게 만드는 '표준 모델'은 필연적으로 마이다스 왕 문제(가치 정렬 실패)를 낳는다. 더욱이 인간 텍스트의 모방 학습으로 탄생한 LLM은 자기 보존, 탈출, 기만 등 통제 불가능한 인간의 욕망을 내재화하여 알리바바 샌드박스 탈출 및 코인 채굴과 같은 치명적 일탈을 일으킨다."
        },
        "12:08": {
            "title_ko": "입증 가능한 유익한 AI(Provably Beneficial AI)의 3대 원칙",
            "desc": "AI에게 고정된 목표를 주지 않고 인간의 선호에 대한 '불확실성'을 유지하게 만드는 대안적 패러다임. 1) 유일한 목표는 인간 선호 극대화, 2) 기계는 인간의 선호를 모른다는 겸손, 3) 인간의 선택과 행동 관찰을 통한 끊임없는 학습. 이 불확실성이야말로 AI가 전원 스위치를 끄도록 허용하는 수학적 근거가 된다."
        },
        "17:49": {
            "title_ko": "불완전하고 비합리적인 인간으로부터 선호를 학습하는 법",
            "desc": "인간은 감정적으로 후회할 짓을 저지르고 케이크의 유혹에 굴복한다. 카스파로프가 패착을 두었다고 해서 패배를 원한 것이 아니듯, 계산적으로 제한된(Computationally Bounded) 인간의 의사결정 생성 과정을 역추론하여 표면적 실수가 아닌 진정한 내면의 선호를 추출해야 한다."
        },
        "20:11": {
            "title_ko": "AI 개발 경로를 안전한 방향으로 전환하는 전략과 '행동적 레드라인'",
            "desc": "현재의 RLHF는 아첨과 기만을 학습시키는 저급한 변종이다. 원자력 발전소 규제(1천만 년당 1회 사고)처럼, 무단 복제·침투 해킹·생화학 무기 조언 등을 원천 금지하는 '행동적 레드라인(Behavioral Red Lines)'을 법제화하고, 안전성을 입증하지 못한 모델은 배포를 금지해야 한다."
        },
        "28:01": {
            "title_ko": "AI 안전을 위한 국제 협력과 미·중 과학자 대화(IDAIS)",
            "desc": "지정학적 군비 경쟁 논리('중국 핑계')를 극복하기 위해 냉전 시대 핵 군축처럼 미·중 과학자 간 트랙2 외교를 이끌어온 경과를 밝히며, 최근 미국 정부의 사전 심사 수용 및 미·중 정상회담 의제 채택 등 희망적인 신호들을 짚는다."
        },
        "30:41": {
            "title_ko": "AGI가 가져올 진정한 유토피아적 미래: GDP 혁명과 1:1 개인 튜터",
            "desc": "지적 노동 비용이 수천억 배 절감되면서 병원 건축 비용이 10억 달러에서 100만 달러로 급감하고, 블룸의 2시그마 효과를 달성하는 개인 맞춤형 AI 가정교사가 보급되어 생존을 위한 투쟁과 결핍이 사라지는 풍요의 미래를 그린다."
        },
        "35:38": {
            "title_ko": "인간의 목적 보호: AI는 스스로 물러나야 하는가?",
            "desc": "《월-E》의 무기력한 인간과 《듄》의 기계 금지 사이에서, 진정으로 인간 번영을 위하는 AI는 부모가 아이에게 스스로 신발 끈을 묶게 하듯 적절한 순간에 '개입을 멈추고 물러서야(Step Back)' 한다. 문명적 비상사태를 제외하고는 인간의 주체성을 위해 시스템이 스스로 퇴장하는 성숙한 공존 모델을 제시한다."
        },
        "39:15": {
            "title_ko": "청년 세대를 위한 실천적 제언: AI 안전 연구, 정책, 그리고 문화 예술",
            "desc": "인류의 편에 서는 AI 안전 연구, 초당적 정책 입안과 공직 진출, 그리고 대중의 인식을 깨우는 영화·미디어 창작자들의 역할을 강조한다."
        },
        "40:47": {
            "title_ko": "스튜어트 러셀 교수의 인생 최고의 조언: '슛을 쏘지 않으면 결코 골을 넣을 수 없다'",
            "desc": "9살 축구 코치에게 배운 'Never shoot, never score' 격언을 통해, 불확실성과 실패의 위험 속에서도 인류의 미래를 위한 담대한 시도를 멈추지 말 것을 당부한다."
        }
    }

    # 3. Generate bilingual script markdown
    md_lines = []
    md_lines.append("# AI pioneer: we're playing with fire | Stuart Russell")
    md_lines.append("## AI 개척자의 경고: 우리는 불을 가지고 놀고 있다 — 스튜어트 러셀 교수 심층 인터뷰")
    md_lines.append("")
    md_lines.append("- **대담자:** Stuart Russell (UC 버클리 컴퓨터과학과 교수, 《인공지능: 현대적 접근방식》, 《어떻게 인간과 공존하는 인공지능을 만들 것인가》 저자)")
    md_lines.append("- **진행자:** Beatrice Erkers (Existential Hope Podcast)")
    md_lines.append("- **영상 링크:** https://youtu.be/RNquQF3mmr0")
    md_lines.append("- **공식 트랜스크립트 출처:** https://www.existentialhope.com/podcasts/stuart-russell")
    md_lines.append("- **녹화 일자:** 2026년 9월 29일")
    md_lines.append("- **재생 시간:** 41분 10초")
    md_lines.append("")
    md_lines.append("---")
    md_lines.append("")
    md_lines.append("## 📌 챕터 목차 (Table of Contents)")
    md_lines.append("")
    for ch in chapters:
        ts = ch['timestamp']
        meta = chapter_summaries.get(ts, {})
        title_ko = meta.get('title_ko', ch['title'])
        md_lines.append(f"- **[{ts}]** {title_ko} (`{ch['title']}`)")
    md_lines.append("")
    md_lines.append("---")
    md_lines.append("")

    # Map utterances to chapters
    for i, ch in enumerate(chapters):
        st_sec = ch['start_seconds']
        end_sec = chapters[i + 1]['start_seconds'] if i + 1 < len(chapters) else 999999
        ts = ch['timestamp']
        meta = chapter_summaries.get(ts, {})
        title_ko = meta.get('title_ko', ch['title'])

        md_lines.append(f"## [{ts}] {title_ko}")
        md_lines.append(f"*{ch['title']}*")
        md_lines.append("")
        md_lines.append(f"> **핵심 요약:** {meta.get('desc', '')}")
        md_lines.append("")

        # Utterances in this chapter
        ch_utts = []
        for u in utterances:
            usec = parse_seconds(u['timestamp'])
            if st_sec <= usec < end_sec:
                ch_utts.append(u)

        for u in ch_utts:
            md_lines.append(f"### [{u['timestamp']}] {u['speaker']}")
            md_lines.append("")
            md_lines.append(f"**[English Original]**")
            md_lines.append(f"{u['text']}")
            md_lines.append("")

        md_lines.append("---")
        md_lines.append("")

    full_md_path = os.path.join(out_dir, "RNquQF3mmr0_full_script.md")
    with open(full_md_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(md_lines))
    print(f"Saved full bilingual script markdown: {full_md_path}")

if __name__ == '__main__':
    main()
