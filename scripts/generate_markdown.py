# -*- coding: utf-8 -*-
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def format_timestamp(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"

def main():
    json_path = r"c:\Pages\raw_data\transcripts\9zJL0l99ejQ_data.json"
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    chapters = data['chapters']
    en_segs = data['en_segments']
    ko_segs = data['ko_segments']

    out_md_path = r"c:\Pages\raw_data\transcripts\9zJL0l99ejQ_full_script.md"

    # Chapter summary highlights based on the actual transcript contents
    chapter_summaries = {
        0: {
            "title_ko": "생명의 정의: 계산(컴퓨테이션)과 세포내 공생설",
            "desc": "블레이즈는 생물학자마다 생명의 정의가 제각각임을 지적하며, '복제(Replication)'와 '대사(Metabolism)'를 아우르는 계산적 관점(Computational view)을 제시합니다. 린 마굴리스의 세포내 공생설(Endosymbiosis)을 인용하며 생명은 단일한 '독립 개체'가 아니라 공생하는 네트워크임을 설명합니다."
        },
        384: {
            "title_ko": "폰 노이만이 풀어낸 생명의 코드: 자기 복제 오토마타",
            "desc": "존 폰 노이만은 DNA 구조가 발견되기 전 이미 논리적으로 자기 복제 시스템의 필요조건(소프트웨어로서의 코드와 하드웨어로서의 복제기)을 증명했습니다. 생명은 단순한 기계적 복제가 아니라 정보를 해석하고 실행하는 계산 프로세스입니다."
        },
        977: {
            "title_ko": "바이러스와 수평적 유전자 이동: 생명의 나무가 아닌 덩굴",
            "desc": "바이러스는 생명과 비생명의 경계에 위치하며, 유전 물질을 유기체 간에 끊임없이 이동시킵니다. 다윈의 전통적인 '생명의 나무(Tree of Life)' 모델 대신, 수평적 유전자 이동(HGT)과 공생이 지배하는 '뒤얽힌 덩굴(Tangled Vine)' 모델이 실제 생명의 본질임을 역설합니다."
        },
        1400: {
            "title_ko": "AI는 살아있는 생명체인가?",
            "desc": "생명을 정보 처리와 에너지 대사, 자기 유지(Autopoiesis) 시스템으로 정의할 때, 오늘날 데이터 센터와 인간 사회의 전력망 위에서 작동하며 복제되고 진화하는 AI 모델을 새로운 형태의 생명체로 볼 수 있는 가능성을 탐구합니다."
        },
        1679: {
            "title_ko": "생명에 '기능(Function)'이 필수적인 이유: 기능주의와 열역학",
            "desc": "생명은 엔트로피 증가에 저항하는 비평형 열역학 시스템입니다. 물리적 구성 성분이 무엇인가보다 그 시스템이 수행하는 '기능적 역할(Function)'이 핵심이라는 기능주의(Functionalism) 철학을 설명합니다."
        },
        2000: {
            "title_ko": "테세우스의 뇌: 기질 독립성과 의식",
            "desc": "테세우스의 배 패러독스를 뇌에 적용하여, 뇌의 뉴런을 하나씩 인공 부품으로 교체하더라도 생각과 의식이 유지될 것인가라는 '기질 독립성(Substrate Independence)' 문제를 다룹니다."
        },
        2434: {
            "title_ko": "무작위 코드에서 피어난 생명: 디지털 에코시스템과 기생",
            "desc": "토마스 레이의 '티에라(Tierra)' 시뮬레이션 및 알리다(Avida) 등 디지털 유기체 실험을 소개합니다. 무작위 기계어 코드 메모리 풀에서 스스로 복제하는 프로그램이 출현하고, 곧이어 기생충(Parasite)과 면역 기제가 자연 발생하는 놀라운 과정을 보여줍니다."
        },
        2955: {
            "title_ko": "지능의 군비 경쟁: 상호작용과 사회적 진화",
            "desc": "지능은 정적인 환경에 적응하기 위해 생겨난 것이 아니라, 다른 지능체들과의 경쟁과 협력, 속임수와 사회적 상호작용 속에서 폭발적으로 진화한 군비 경쟁(Arms Race)의 결과물임을 설명합니다."
        },
        3097: {
            "title_ko": "AGI와의 공존: 개체 중심주의를 넘어서",
            "desc": "인공일반지능(AGI)을 영화 터미네이터처럼 '단일한 전지전능한 지배자'로 바라보는 헐리우드식 공포를 비판하며, 인간과 AI가 공생 네트워크를 형성해야 함을 강조합니다."
        },
        3196: {
            "title_ko": "AGI는 이미 도래했다: 분산된 지능과 사회적 실체",
            "desc": "AGI는 어느 날 갑자기 완성되는 특이점이 아니라, 인터넷, 시장, 법인, 도시, 그리고 대형 언어 모델(LLM)이 결합된 '분산된 초지능 네트워크' 형태로 이미 우리 일상 속에 구현되고 있습니다."
        },
        4025: {
            "title_ko": "AI는 인류의 새로운 미토콘드리아다",
            "desc": "고대 세포가 호기성 박테리아를 흡수해 미토콘드리아로 공생 진화하면서 진핵생물이 탄생했듯, 인류 사회는 AI라는 강력한 연산 기관을 체내화(내부화)하여 새로운 문명적 진핵생물 단계로 도약하고 있음을 은유합니다."
        },
        4437: {
            "title_ko": "안에 누군가 있는가?: 내면적 경험과 감각질(Qualia)",
            "desc": "AI에게 주관적 경험(Qualia)이나 의식이 존재하는가의 문제, 지능과 의식의 분리 가능성, 튜링 테스트의 한계와 미래 지능체의 내면성에 대한 심도 있는 철학적 고찰로 마무리합니다."
        }
    }

    lines = []
    lines.append("# The theory that connects the origin of life to the rise of intelligence")
    lines.append("## 생명의 기원에서 지능의 탄생까지: 계산, 공생, 그리고 AGI의 미래")
    lines.append("")
    lines.append("- **강연자:** Blaise Agüera y Arcas (블레이즈 아구에라 이 아르카스 - Google Fellow & VP, CTO of Technology & Society)")
    lines.append("- **채널:** Big Think")
    lines.append("- **영상 링크:** https://www.youtube.com/watch?v=9zJL0l99ejQ")
    lines.append("- **총 재생시간:** 84분 57초 (1시간 24분 57초)")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 목차 (Table of Contents)")
    lines.append("")
    for ch in chapters:
        ts = format_timestamp(ch['start'])
        title_ko = chapter_summaries.get(ch['start'], {}).get('title_ko', ch['title_ko'])
        lines.append(f"- **[{ts}]** [{title_ko}](#{ts.replace(':', '')}-{ch['title_en'].lower().replace(' ', '-').replace(':', '').replace('&', '').replace('\'', '')}) (`{ch['title_en']}`)")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Build chapters with full transcripts
    for idx, ch in enumerate(chapters):
        start = ch['start']
        end = chapters[idx + 1]['start'] if idx + 1 < len(chapters) else 999999
        ts = format_timestamp(start)
        ts_end = format_timestamp(end if end != 999999 else 5097)
        ch_meta = chapter_summaries.get(start, {})
        title_ko = ch_meta.get('title_ko', ch['title_ko'])
        anchor_id = f"{ts.replace(':', '')}-{ch['title_en'].lower().replace(' ', '-').replace(':', '').replace('&', '').replace('\'', '')}"

        lines.append(f"## <a id=\"{anchor_id}\"></a>[{ts} ~ {ts_end}] {title_ko}")
        lines.append(f"*{ch['title_en']}*")
        lines.append("")
        lines.append(f"> **핵심 요약:** {ch_meta.get('desc', '')}")
        lines.append("")

        # Extract EN segments for this chapter
        cur_en = [s for s in en_segs if start <= s['start'] < end]
        # Extract KO segments for this chapter
        cur_ko = [s for s in ko_segs if start <= s['start'] < end]

        # Group EN into coherent paragraphs (~30-60 seconds chunks)
        # We can group by paragraph intervals
        grouped_chunks = []
        cur_chunk = {"start": None, "end": None, "en_texts": []}
        for s in cur_en:
            if cur_chunk["start"] is None:
                cur_chunk["start"] = s["start"]
            cur_chunk["end"] = s["end"]
            cur_chunk["en_texts"].append(s["text"])
            
            # Flush every ~4-6 lines or if long gap or sentence end
            if len(cur_chunk["en_texts"]) >= 5:
                grouped_chunks.append(cur_chunk)
                cur_chunk = {"start": None, "end": None, "en_texts": []}
        if cur_chunk["en_texts"]:
            grouped_chunks.append(cur_chunk)

        # For each grouped chunk, find matching KO text
        for chunk in grouped_chunks:
            c_start = chunk["start"]
            c_end = chunk["end"]
            c_ts = format_timestamp(c_start)

            en_paragraph = " ".join(chunk["en_texts"])
            # Find KO segments roughly in [c_start - 0.5, c_end + 1.0]
            matching_ko = [k["text"] for k in cur_ko if c_start - 1.0 <= k["start"] <= c_end + 1.0]
            ko_paragraph = " ".join(matching_ko)
            ko_paragraph = re.sub(r'\s+', ' ', ko_paragraph).strip()

            lines.append(f"### [{c_ts}]")
            if ko_paragraph:
                lines.append(f"**한국어 번역/자막:**")
                lines.append(f"{ko_paragraph}")
                lines.append("")
            lines.append(f"**영어 원문 (English):**")
            lines.append(f"{en_paragraph}")
            lines.append("")

        lines.append("---")
        lines.append("")

    with open(out_md_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))

    print(f"Successfully generated: {out_md_path} ({os.path.getsize(out_md_path)} bytes)")

if __name__ == "__main__":
    main()
