---
layout: '../../layouts/MarkdownPost.astro'
title: '本地部署chatAI【chatglm】'
pubDate: 2023-03-20
description: '让你的计算机变成AI吧'
author: 'ike'
cover:
    url: 'https://s1.ax1x.com/2023/03/20/pptlZ3d.md.png'
    square: 'https://s1.ax1x.com/2023/03/20/pptlZ3d.md.png'
    alt: 'cover'
tags: ["技术", "AI", "聊天"]
theme: 'light'
featured: false
---

## 硬件需求
内存：16G以上  
显卡：6G显存以上

## 下载地址
**模型：**
[chatglm-6b](https://huggingface.co/THUDM/chatglm-6b)

**Github：**
> B站 [大江户战士](https://space.bilibili.com/55123) UP主基于WEBUI开发的CHATUI界面，感兴趣可以关注下
[chatglm_webui](https://github.com/OedoSoldier/chatglm_webui)

## 安装方法
进入到chatglm_webui文件夹里运行以下命令安装依赖
```python
pip install -r requirements.txt
```
## 可能会遇到问题
* Q：python版本太低  
A: 官网下载安装python3.6或以上的版本，然后修改系统环境变量 `PATH`    

* Q：C++依赖安装失败  
A：下载C++的编译工具依赖：microsoft visual c++ build tools

* Q：依赖安装失败  
A：尝试用管理员权限启动CMD的`命令提示符`然后安装

* Q：`AssertionError: Torch not compiled with CUDA enabled`    
A：安装的python Torch是不包含显卡的版本，

* Q：`ERROR: No matching distribution found for torch==1.13.1+cu117`  
A：`python -m pip install torch==1.13.1+cu117 torchvision==0.14.1+cu117 --extra-index-url https://download.pytorch.org/whl/cu117 --no-cache-dir`

* Q：`python sentencepiece failed` 或者 `src/sentencepiece/sentencepiece_wrap.cxx(2822): fatal error C1083:`
A：尝试升级python3.6或以上的版本并安装microsoft visual c++ build tools
 
* Q：`Pip install sentencepiece failure`    
A: 尝试直接下载[sentencepiece文件](https://files.pythonhosted.org/packages/fd/45/6d0eb609d5cd81df094aab71a867b2ab6b315ffd592e78fb94a625c4d6aa/sentencepiece-0.1.3.tar.gz)然后放到python的`site-packages`目录里，不行就升级pip或者更换python版本。

## 运行方法
1.把下载好的`chatglm-6b`文件夹直接放到`chatglm_webui`目录下
2.运行```python main.py --low_vram``` （因为我的显卡只有8G显存，所以加了low_vram）

参数：
 - `--path`：指定模型所在文件夹，根目录不需要加
 - `--low_vram`：4-bit 量化，6GB 显存可用
 - `--med_vram`：8-bit 量化，10GB 显存可用
 - `--cpu`：CPU运行，32G 内存可用
 - `--low_ram`：CPU运行，16G 内存可用
 
## UI界面
![UI](https://s1.ax1x.com/2023/03/20/pptlV9H.png)

## 总结
当前单机版本的AI还属于调优阶段，没法和ChatGPT进行比较的，模型大小和参数的数量也不是一个数量级别，属于低智能AI。但meta的LLaMA和200G的模型也都开源了，相信过不了多久就可以做到真正的部署可实用的个人AI智能了，期待未来！