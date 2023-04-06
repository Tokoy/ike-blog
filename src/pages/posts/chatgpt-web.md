---
layout: '../../layouts/MarkdownPost.astro'
title: '简单搭建国内也可以使用的chatgpt'
pubDate: 2023-04-06
description: '来搭建一个不需要翻墙，手机也可以方便使用的Chatgpt吧！'
author: 'ike'
cover:
    url: '\static\images\3765.JPG'
    square: '\static\images\3765.JPG'
    alt: 'cover'
tags: ["技术", "实用", "ai", "chatgpt"]
theme: 'light'
featured: false
---
## 起因
因为目前chatgpt是禁止国内访问的（包括HK和TW），所以要访问chatgpt就得翻墙，但是目前我用的梯子都非常不稳定！
经常性的掉线，就很烦，2023年了，没法用google和chatgpt还怎么当程序员！经过我github上翻来翻去，总算找到几个
大佬开源的webui，再配上vercel或railway之类的应用托管网站，然后再配上自己的域名，完美解决了国内访问问题！

PS：目前chatgpt的[web界面](ai.com)是免费的，只要你注册了openai账号，就可以一直使用，但是api不是，免费账号
使用api只能用3个月，且有额度限制，我的第一批注册的用户基本上4月1号就都过期了，虽然api付费很便宜，基本上10美元
可以用一年，但需要绑定国外的卡，国内只能用depay之类的虚拟信用卡，很麻烦orz

## 准备
* [Yidadaa/ChatGPT-Next-Web](https://github.com/Yidadaa/ChatGPT-Next-Web)
这个webui界面简洁，对移动端优化也不错，但只支持apikey方式使用。  

* [Chanzhaoyu/chatgpt-web](https://github.com/Chanzhaoyu/chatgpt-web)
这个webui支持apikey方式也支持session-token的方式。

* 自己的域名（需要注册阿里云账号，然后填写信息模板申请后购买域名，一般top的域名第一年只需要9块钱）

## 搭建
搭建方式其实都差不多
1. 点击进入到对应的github项目里，然后fork项目到自己的仓库里。
2. 打开[vercel](https://vercel.com) 或者 [railway](https://railway.app/),用github账号登陆。
3. 新建project,选择从github仓库里导入,选择对应的仓库（如果找不到仓库，则需要加一下权限）。
4. 按提示，需要填写一些**环境变量**，具体变量参考项目里的README，这里举例：
   **ChatGPT-Next-Web**：
   _OPENAI_API_KEY_ ：你的apikey  
   _CODE_ ：自定义访问密码  
\
   **chatgpt-web**:  
   _OPENAI_API_KEY_ 和 _OPENAI_ACCESS_TOKEN_ 二选一(OPENAI_ACCESS_TOKEN的话可以登陆[chat.openai.com](https://chat.openai.com/api/auth/session)获取）
   _AUTH_SECRET_KEY_ : 你的session  
   _PORT_ : 3002  
5. 点击部署，等待部署完成。
6. 点击domain，新建你的domain，例如我的是chat.ikeno.top,然后会生成一个cname的地址
7. 登陆阿里云账号的DNS解析里，找到我的ikeno.top新增二级域名前缀**chat**，对应解析为cname，然后把地址也填写上**cname.vercel-dns.com**（如果是railway的填railway提供的地址），新增完毕后就可以解析成功啦！
8. 登陆你的域名看看，是不是已经可以正常访问了！而且不需要梯子了，手机也可以流畅访问！输入你设置好的账号密码就可以丝滑提问啦。