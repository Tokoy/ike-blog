---
layout: '../../layouts/MarkdownPost.astro'
title: 'AI绘画工具webui简单入门'
pubDate: 2023-03-14
description: '介绍一下如何使用webui工具生成绘画'
author: 'ike'
cover:
    url: 'https://i2.100024.xyz/2023/03/14/w26414.webp'
    square: 'https://i2.100024.xyz/2023/03/14/w26414.webp'
    alt: 'cover'
tags: ["技术", "ACG", "AI", "绘图"]
theme: 'dark'
featured: false
---

### 工具下载地址：
[stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui)

1.下载完成后运行webui-user.bat文件，会下载相关的依赖，国内网络可能需要翻墙或者用镜像站(修改launch.py文件把github地址都改为国内的镜像站地址)，也可以推荐`dev-sidecar`这个免费工具加速github。
或者可以直接上b站检索`秋葉aaaki`up主，直接下载整合包。

2.安装完成后再运行webui-user.bat文件后等待出现`Running on local URL:  http://127.0.0.1:7860` 就可以访问127.0.0.1:7860打开webui页面啦。

3.打开后先别急，需要安装一些基础的插件，点击扩展，从网址安装，然后把git地址粘贴后安装即可，我这边推荐几个最常用的：
[汉化插件](https://github.com/dtlnor/stable-diffusion-webui-localization-zh_CN)  安装完后：setting >> user interface >> Localization (requires restart) >> 选择 zh-CN >> apply setting >> reload ui
[Control插件](https://github.com/Mikubill/sd-webui-controlnet.git)  用来加载lora相关模型。
[关键字补全插件](https://github.com/DominikDoom/a1111-sd-webui-tagcomplete)  用来补全prompt关键字的，适合英文小白~

4.安装完成后到`设置`里的`显示所有页面`，`快捷设置列表`填写`sd_model_checkpoint,sd_vae`然后重启webui，基础工具就安装好啦，接下来就是模型了！

## 模型下载地址：
[Civitai](https://civitai.com/)

1.注册好账号后就可以查看很多网上分享的模型，找一个你最喜欢的，例如Counterfeit，点击下载即可。

2.下载好后记得要把模型放到 `\webui\models\Stable-diffusion` 目录下，这样才会读取到模型，Lora的模型要放到`\webui\models\Lora`里,有模型后就可以生成AI图片啦！

当然只是简单的模型还是不够的，后续进阶还需要用到vae模型，EasyNegative模型，lora模型，openpose模型，高清化等，这个后续有时间再梳理下，慢慢学习进步！

分享例子：

>关键字：
((masterpiece,best quality)),1girl, solo, animal ears, rabbit, barefoot, knees up, dress, sitting, rabbit ears, short sleeves, looking at viewer, grass, short hair, smile, white hair, puffy sleeves, outdoors, puffy short sleeves, bangs, on ground, full body, animal, white dress, sunlight, brown eyes, dappled sunlight, day, depth of field

>Negative关键字：
EasyNegative, extra fingers,fewer fingers,

>Steps: 20, Sampler: DPM++ 2M Karras, CFG scale: 10, Seed: 414619472, Size: 512x728, Model hash: 59ea4aa1d8, Model: cetusMix_cetusVersion3, Denoising strength: 0.7, Hires upscale: 2, Hires steps: 20, Hires upscaler: SwinIR_4x

![兔子](https://i2.100024.xyz/2023/03/14/xskx4s.webp)
