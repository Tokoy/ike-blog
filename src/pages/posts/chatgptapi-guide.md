---
layout: '../../layouts/MarkdownPost.astro'
title: 'Chatgpt的API入门'
pubDate: 2023-04-18
description: '简单介绍下如何使用chatgpt的API吧'
author: 'ike'
cover:
    url: 'https://img.ikeno.top/2023/katanasj.JPG'
    square: 'https://img.ikeno.top/2023/katanasj.JPG'
    alt: 'cover'
tags: ["技术", "AI"]
theme: 'light'
featured: false
---

_chatgpt.py_
```python
import openai
from PIL import Image
import requests

class AI:
    def __init__(self):
        # 可以不需要指定api_base，用默认的就好了，前提是网络通，默认需要翻墙
        self.api_base = "https://XXX/api/v1"
        self.api_key = "sk-XXX"
        
    def chat(self,prompt,msg):
        openai.api_base = self.api_base
        openai.api_key = self.api_key
        chat_completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages = [
            # 系统消息，它有助于设置助手的行为
            {"role": "system", "content": prompt},
            # 用户消息，输入你的问题吧
            {"role": "user", "content": msg},
            # 我们还可以添加以前的对话，但你需要用while true循环把之前的消息也发送过去，很费token
            # {"role": "assistant", "content": messages},
        ],
        )
        response = chat_completion.choices[0].message.content
        print(response)
        return 

    def image(self,prompt):
        openai.api_base = self.api_base
        openai.api_key = self.api_key
        image_completion = openai.Image.create(
            #提示要生成什么样的图片
            prompt=prompt,
            #数量
            n=1,
            #大小
            size="512x512"
        )
        image_url = image_completion['data'][0]['url']
        r = requests.get(image_url)
        with open('test.png', 'wb') as f:
            f.write(r.content)
            img = Image.open('test.png')
            img.show()
        return 
```

_main.py_
```python
from service.chatgpt import AI
import json

def main():
    with open('data.json', "r", encoding="utf-8") as f:
        msg = json.dumps(json.load(f))
        prompt = "你现在是一个告警AI机器人,我会发送过去24小时的告警数据统计信息给你，请生成日报，要有时间范围、告警总数、TOP5告警，告警级别、告警分析、告警建议"
        ai = AI()
        ai.chat(prompt,msg)
    
    
if __name__ == "__main__":
    main()
```

**收费**：官方是 0.002 美刀/1000token，但是使用api必须把账号升级为付费账号，也就说要绑定国外的信用卡，很麻烦，目前只能用depay这种虚拟信用卡充USD来实现，或者用国内的一些[代理](https://console.openai-asia.com/)之类的了，希望以后有更方便的方法吧。

**参考**：[官方API文档](https://platform.openai.com/docs/guides/chat)