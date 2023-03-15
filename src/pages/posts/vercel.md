---
layout: '../../layouts/MarkdownPost.astro'
title: '如何使用Vercel环境变量'
pubDate: 2023-03-15
description: '记录下Vercel相关的操作'
author: 'ike'
cover:
    url: 'https://img2.baidu.com/it/u=2186708879,2344638312&fm=253&fmt=auto&app=138&f=JPEG?w=631&h=356'
    square: 'https://img2.baidu.com/it/u=2186708879,2344638312&fm=253&fmt=auto&app=138&f=JPEG?w=631&h=356'
    alt: 'cover'
tags: ["技术", "应用部署", "gitalk","vercel"]
theme: 'light'
featured: false
---

起因：本来搭建好了博客，但是总觉的少了一些功能，没错，博客怎么能少了评论功能！（虽然可能没什么人评论）
但本着**我可以不用但不能没有**的精神，刚好也有大大推荐了gitalk，就研究了下，发现集成第三方评论系统[gitalk](https://github.com/gitalk/gitalk)集成非常简单,只需要加下面一段代码就好了
```js
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
```js
    <script>
      import 'gitalk/dist/gitalk.css';
      import Gitalk from 'gitalk';
    
      const gitalk = new Gitalk({
        clientID: import.meta.env.CLIENT_ID,
        clientSecret: import.meta.env.CLIENT_Secret,
        repo: 'blogtalk',
        owner: 'Tokoy',
        admin: ['Tokoy'],
        id: window.location.pathname,
        distractionFreeMode: false
      });
    
      gitalk.render('gitalk-container');
    </script>
    
    <div id="gitalk-container"></div>
```

