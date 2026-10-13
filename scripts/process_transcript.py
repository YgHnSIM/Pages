# -*- coding: utf-8 -*-
import io
import json
import os
import re
import sys
from youtube_transcript_api import YouTubeTranscriptApi

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def format_srt_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def format_timestamp(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"

def clean_text(text):
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def main():
    video_id = "9zJL0l99ejQ"
    out_dir = r"c:\Pages\raw_data\transcripts"
    os.makedirs(out_dir, exist_ok=True)

    api = YouTubeTranscriptApi()

    print("Fetching English transcript...")
    t_en = api.fetch(video_id, languages=['en-US', 'en'])
    print(f"EN items: {len(t_en)}")

    print("Fetching Korean transcript...")
    t_ko = api.fetch(video_id, languages=['ko', 'ko-orig'])
    print(f"KO items: {len(t_ko)}")

    # 1. Process English items
    cleaned_en = []
    for i, item in enumerate(t_en):
        start = item.start
        dur = item.duration
        if i < len(t_en) - 1:
            next_start = t_en[i + 1].start
            end = min(start + dur, next_start)
            if end <= start:
                end = start + 0.5
        else:
            end = start + dur
        txt = clean_text(item.text)
        if txt:
            cleaned_en.append({
                'index': len(cleaned_en) + 1,
                'start': start,
                'end': end,
                'text': txt
            })

    # 2. Process Korean items
    # In YouTube auto-subtitles for Korean, words are fragmented into tiny pieces.
    # Let's clean and merge adjacent fragments into natural phrases/sentences
    cleaned_ko_raw = []
    for i, item in enumerate(t_ko):
        start = item.start
        dur = item.duration
        if i < len(t_ko) - 1:
            next_start = t_ko[i + 1].start
            end = min(start + dur, next_start)
            if end <= start:
                end = start + 0.5
        else:
            end = start + dur
        txt = clean_text(item.text)
        if txt:
            cleaned_ko_raw.append({
                'start': start,
                'end': end,
                'text': txt
            })

    # Save EN SRT
    en_srt_path = os.path.join(out_dir, f"{video_id}_en.srt")
    with open(en_srt_path, 'w', encoding='utf-8') as f:
        for item in cleaned_en:
            f.write(f"{item['index']}\n")
            f.write(f"{format_srt_time(item['start'])} --> {format_srt_time(item['end'])}\n")
            f.write(f"{item['text']}\n\n")
    print(f"Saved: {en_srt_path}")

    # Save KO raw SRT
    ko_srt_path = os.path.join(out_dir, f"{video_id}_ko.srt")
    with open(ko_srt_path, 'w', encoding='utf-8') as f:
        for idx, item in enumerate(cleaned_ko_raw, 1):
            f.write(f"{idx}\n")
            f.write(f"{format_srt_time(item['start'])} --> {format_srt_time(item['end'])}\n")
            f.write(f"{item['text']}\n\n")
    print(f"Saved: {ko_srt_path}")

    # Save Plain Text Files
    en_txt_path = os.path.join(out_dir, f"{video_id}_en.txt")
    with open(en_txt_path, 'w', encoding='utf-8') as f:
        f.write(" ".join(item['text'] for item in cleaned_en))
    print(f"Saved: {en_txt_path}")

    # For KO text, join cleanly (handling spaces properly)
    ko_txt_path = os.path.join(out_dir, f"{video_id}_ko.txt")
    ko_tokens = []
    for item in cleaned_ko_raw:
        ko_tokens.append(item['text'])
    full_ko_text = " ".join(ko_tokens)
    # Fix repeated whitespaces or weird joins
    full_ko_text = re.sub(r'\s+', ' ', full_ko_text).strip()
    with open(ko_txt_path, 'w', encoding='utf-8') as f:
        f.write(full_ko_text)
    print(f"Saved: {ko_txt_path}")

    # Video Chapters
    chapters = [
        {"start": 0, "title_en": "Defining life: Computation & symbiogenesis", "title_ko": "생명의 정의: 계산(컴퓨테이션)과 세포내 공생설"},
        {"start": 384, "title_en": "Von Neumann cracked life's code", "title_ko": "폰 노이만이 풀어낸 생명의 코드: 자기 복제 오토마타"},
        {"start": 977, "title_en": "Viruses helped write your DNA", "title_ko": "바이러스와 수평적 유전자 이동: 생명의 나무가 아닌 덩굴"},
        {"start": 1400, "title_en": "Is AI alive?", "title_ko": "AI는 살아있는 생명체인가?"},
        {"start": 1679, "title_en": "Why life requires function", "title_ko": "생명에 '기능(Function)'이 필수적인 이유: 기능주의와 열역학"},
        {"start": 2000, "title_en": "The brain of Theseus", "title_ko": "테세우스의 뇌: 기질 독립성과 의식"},
        {"start": 2434, "title_en": "Life from random code", "title_ko": "무작위 코드에서 피어난 생명: 디지털 에코시스템과 기생"},
        {"start": 2955, "title_en": "An arms race of intelligence", "title_ko": "지능의 군비 경쟁: 상호작용과 사회적 진화"},
        {"start": 3097, "title_en": "Co-existing with AGI", "title_ko": "AGI와의 공존: 개체 중심주의를 넘어서"},
        {"start": 3196, "title_en": "AGI is already here", "title_ko": "AGI는 이미 도래했다: 분산된 지능과 사회적 실체"},
        {"start": 4025, "title_en": "AI is our new mitochondria", "title_ko": "AI는 인류의 새로운 미토콘드리아다"},
        {"start": 4437, "title_en": "Is anybody home?", "title_ko": "안에 누군가 있는가?: 내면적 경험과 감각질(Qualia)"}
    ]

    # Save JSON data with timestamps and chapters
    data_out = {
        "video_id": video_id,
        "title": "The theory that connects the origin of life to the rise of intelligence",
        "speaker": "Blaise Agüera y Arcas",
        "channel": "Big Think",
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "duration_seconds": 5097,
        "chapters": chapters,
        "en_segments": cleaned_en,
        "ko_segments": cleaned_ko_raw
    }

    json_path = os.path.join(out_dir, f"{video_id}_data.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data_out, f, ensure_ascii=False, indent=2)
    print(f"Saved: {json_path}")

if __name__ == "__main__":
    main()
