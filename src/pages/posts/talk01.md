---
layout: '../../layouts/MarkdownPost.astro'
title: 'kubectl常用命令'
pubDate: 2023-03-10
description: 'kubectl是k8s里非常频繁使用的命令，常用的几个使用方法'
author: 'ike'
cover:
    url: 'https://i1.100024.xyz/2023/03/10/qugxj2.webp'
    square: 'https://i1.100024.xyz/2023/03/10/qugxj2.webp'
    alt: 'cover'
tags: ["杂谈", "日常", "blog"]
theme: 'light'
featured: false
---

**用于替换现有的容器镜像或版本**
`kubectl set image deployment/DeploymentName -n NAMESPACE *=slpcat/rocketmq-exporter:latest`

**滚动的重启容器**
`kubectl rollout restart deployment/DeploymentName -n NAMESPACE`

**回滚容器**
`kubectl rollout undo deployment/DeploymentName -n NAMESPACE`
