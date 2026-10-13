# -*- coding: utf-8 -*-
import subprocess
import json

try:
    res = subprocess.run(['yt-dlp', '--dump-json', 'https://www.youtube.com/watch?v=9zJL0l99ejQ'], capture_output=True, text=True, encoding='utf-8')
    if res.returncode == 0:
        data = json.loads(res.stdout)
        print("Title:", data.get('title'))
        print("Duration:", data.get('duration'))
        chapters = data.get('chapters') or []
        print(f"Chapters count: {len(chapters)}")
        for ch in chapters:
            m = int(ch['start_time'] // 60)
            s = int(ch['start_time'] % 60)
            print(f"{m:02d}:{s:02d} - {ch.get('title')}")
    else:
        print("yt-dlp returncode != 0:", res.stderr[:200])
except Exception as e:
    print("Error:", e)
