# -*- coding: utf-8 -*-
import os
import re
import json

def main():
    html_path = r"C:\Users\globe\.gemini\antigravity\brain\15b9863c-e7fe-47c9-80c7-86a4c2cda3f8\.system_generated\steps\76\content.md"
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find transcript part
    start_token = '<div id="transcript"'
    end_token = '<div id="articles"'
    
    start_idx = content.find(start_token)
    end_idx = content.find(end_token, start_idx)
    
    transcript_html = content[start_idx:end_idx]
    
    # Extract paragraphs: <p><strong>[00:00] Stuart:</strong> ...</p>
    p_pattern = re.compile(r'<p>(.*?)</p>', re.DOTALL)
    matches = p_pattern.findall(transcript_html)
    
    parsed_utterances = []
    
    time_speaker_pattern = re.compile(r'<strong>\[(\d{2}:\d{2})\]\s*([^:]+):</strong>\s*(.*)', re.DOTALL)
    
    current_time = "00:00"
    current_speaker = "Stuart"
    
    for m in matches:
        # replace html entities
        text = m.replace('&#x27;', "'").replace('&quot;', '"').replace('&amp;', '&').replace('&nbsp;', ' ')
        ts_match = time_speaker_pattern.match(text)
        if ts_match:
            time_str, speaker, body = ts_match.groups()
            body_clean = re.sub(r'<[^>]+>', '', body).strip()
            parsed_utterances.append({
                "timestamp": time_str,
                "speaker": speaker.strip(),
                "text": body_clean
            })
            current_time = time_str
            current_speaker = speaker.strip()
        else:
            body_clean = re.sub(r'<[^>]+>', '', text).strip()
            if body_clean:
                # Continuation paragraph
                if parsed_utterances:
                    parsed_utterances[-1]["text"] += "\n\n" + body_clean
                else:
                    parsed_utterances.append({
                        "timestamp": current_time,
                        "speaker": current_speaker,
                        "text": body_clean
                    })

    print(f"Total utterances parsed: {len(parsed_utterances)}")
    
    # Also parse chapters from video_info.json
    video_info_path = r"c:\Pages\video_info.json"
    chapters = []
    if os.path.exists(video_info_path):
        with open(video_info_path, 'r', encoding='utf-16') as vf:
            vdata = json.load(vf)
            raw_chs = vdata.get('chapters') or []
            for ch in raw_chs:
                st = ch['start_time']
                m = int(st // 60)
                s = int(st % 60)
                chapters.append({
                    "start_seconds": st,
                    "timestamp": f"{m:02d}:{s:02d}",
                    "title": ch['title']
                })
                
    output_data = {
        "video_id": "RNquQF3mmr0",
        "url": "https://youtu.be/RNquQF3mmr0",
        "title": "AI pioneer: we're playing with fire | Stuart Russell",
        "guest": "Stuart Russell",
        "host": "Beatrice Erkers",
        "show": "Existential Hope Podcast",
        "date": "2026-09-29",
        "duration_seconds": 2470,
        "chapters": chapters,
        "transcript": parsed_utterances
    }
    
    os.makedirs(r"c:\Pages\raw_data\transcripts", exist_ok=True)
    out_json = r"c:\Pages\raw_data\transcripts\RNquQF3mmr0_data.json"
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    print(f"Saved transcript data to {out_json}")

    # Also save raw text file in c:\Pages\
    out_txt = r"c:\Pages\RNquQF3mmr0_en.txt"
    with open(out_txt, 'w', encoding='utf-8') as f:
        for u in parsed_utterances:
            f.write(f"[{u['timestamp']}] {u['speaker']}: {u['text']}\n\n")
    print(f"Saved plain text transcript to {out_txt}")

if __name__ == '__main__':
    main()
