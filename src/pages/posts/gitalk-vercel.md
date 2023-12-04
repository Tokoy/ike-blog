---
layout: '../../layouts/MarkdownPost.astro'
title: '如何部署gitalk作为评论系统'
pubDate: 2023-03-15
description: '给自己的博客添加第三方的评论系统'
author: 'ike'
cover:
    url: 'https://img.ikeno.top/2023/gitalk.png'
    square: 'https://img.ikeno.top/2023/gitalk.png'
    alt: 'cover'
tags: ["技术", "应用部署", "gitalk","vercel","twikoo","discuss"]
theme: 'light'
featured: false
---

## Gitalk：
本来搭建好了博客，但是总觉的少了一些功能，没错，博客怎么能少了评论功能！（虽然可能没什么人评论）
但本着**我可以不用但不能没有**的精神，刚好也有大大推荐了gitalk，就研究了下，发现集成第三方评论系统[gitalk](https://github.com/gitalk/gitalk)集成非常简单,只需要申请github账号的Secret然后前端里加下面一段代码就好了
```html
    <script>
      import 'gitalk/dist/gitalk.css';
      import Gitalk from 'gitalk';
    
      const gitalk = new Gitalk({
        clientID: myclientID,
        clientSecret: mySecret,
        repo: 'myrepo',
        owner: 'myusername',
        admin: ['myusername'],
        id: window.location.pathname,
        distractionFreeMode: false
      });
    
      gitalk.render('gitalk-container');
    </script>
    
    <div id="gitalk-container"></div>
```
就搞定了！但是又有一个问题，就是ClientID和Secret是明文的，放到github上太危险了，那有什么好方法呢，查了下，vercel是支持环境变量的，astro也支持，那就好办了。
查了一番官方文档，然后进行了以下操作，成功把vercel关联到项目，然后生成了.env文件。

```shell
npm i -g vercel
vercel --version
vercel login
vercel link --yes
vercel env ls
vercel env pull
```

接下来就简单了，只需要在Vercel的项目`Setting`中把Environment Variables添加下`myclientID`和`mySecret`，然后在代码里替换成`import.meta.env.CLIENT_ID`和`import.meta.env.CLIENT_Secret`就搞定！现在再push到github仓库里，就没有安全隐患了~
```html
    <script>
      import 'gitalk/dist/gitalk.css';
      import Gitalk from 'gitalk';
    
      const gitalk = new Gitalk({
        clientID: import.meta.env.CLIENT_ID,
        clientSecret: import.meta.env.CLIENT_Secret,
        repo: 'myrepo',
        owner: 'myusername',
        admin: ['myusername'],
        id: window.location.pathname,
        distractionFreeMode: false
      });
    
      gitalk.render('gitalk-container');
    </script>
    
    <div id="gitalk-container"></div>
```
## Twikoo
astro也支持twikoo的评论系统，后端参考官网[Twikoo文档](https://twikoo.js.org/),前端只需要```npm i twikoo```然后配置
```javascript
<script>
      import twikoo from "twikoo";
      twikoo({
        envId: "https://your vercel site", // your environment ID or url
        el: "#tcomment", // the container ID which will show the comment
        //lang: "en-GB", // language for the comment template. for the full list, refer to https://github.com/imaegoo/twikoo/blob/main/src/client/utils/i18n/index.js
      }).then(() => {
        console.log("comment loading success");
      });
</script>
<div id="tcomment"></div>
```
就可以了，当然别忘了再env.d.ts里吧```declare module "twikoo";```加上,声明下twikoo就不会报声明类型错误了。
## Analytics
velcel还支持查看流量访问，只需要```npm i -g vercel```安装完velcel后在官网项目里启动```Analytics```里的```Audiences```,然后创建完目录后在页面里引入下面的代码就搞定了~

```html
<script defer src="/_vercel/insights/script.js"></script>
```

