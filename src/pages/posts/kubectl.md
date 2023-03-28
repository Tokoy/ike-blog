---
layout: '../../layouts/MarkdownPost.astro'
title: 'kubectl常用命令'
pubDate: 2023-03-10
description: 'kubectl是k8s里非常频繁使用的命令，常用的几个使用方法'
author: 'ike'
cover:
    url: 'https://i1.100024.xyz/2023/03/10/qrisw0.webp'
    square: 'https://i1.100024.xyz/2023/03/10/qrisw0.webp'
    alt: 'cover'
tags: ["运维", "实用", "k8s", "kubectl"]
theme: 'light'
featured: false
---

### 用于替换现有的容器镜像或版本
```bash
kubectl set image deployment/DeploymentName -n NAMESPACE *=slpcat/rocketmq-exporter:latest
```

### 滚动的重启容器(优雅)
```bash
kubectl rollout restart deployment/DeploymentName -n NAMESPACE
```

### 回滚容器
```bash
kubectl rollout undo deployment/DeploymentName -n NAMESPACE`
```

### 设置/修改环境变量
```bash
kubectl set env deployment nginx-deploy DEPLOY_DATE="$(date)"
```

### 通过bash获得 pod 中某个容器的TTY，相当于登录容器
```bash
kubectl exec -it <pod-name> -c <container-name>  bash
```


### 查看容器的日志
```bash
kubectl logs <pod-name>
kubectl logs -f <pod-name> ### 实时查看日志
kubectl log  <pod-name>  -c <container_name> ### 若 pod 只有一个容器，可以不加 -c 
kubectl logs -l app=frontend ### 返回所有标记为 app=frontend 的 pod 的合并日志。
```

### 查看注释

```bash
kubectl explain pod
kubectl explain pod.apiVersion
```

### 查看节点 labels
```bash
kubectl get node --show-labels
```

### 重启 pod
```bash
kubectl get pod <POD名称> -n <NAMESPACE名称> -o yaml | kubectl replace --force -f -
```

### 修改网络类型
```bash
kubectl patch service istio-ingressgateway -n istio-system -p '{"spec":{"type":"NodePort"}}'
```

### 伸缩 pod 副本
### 可用于将Deployment及其Pod缩小为零个副本，实际上杀死了所有副本。当您将其缩放回1/1时，将创建一个新的Pod，重新启动您的应用程序。`
```bash
kubectl scale deploy/nginx-1 --replicas=0
kubectl scale deploy/nginx-1 --replicas=1
```

### 查看前一个 pod 的日志，logs -p 选项 
```bash
kubectl logs --tail 100 -p user-klvchen-v1.0-6f67dcc46b-5b4qb > pre.log
```

### 复制容器里的文件
```bash
kubectl cp my-namespace/my-pod:/path/to/remote/file /path/to/local/file
```

## 这里推荐一个k8s的可视化工具 k9s
**详细介绍：** [Kubernetes 集群管理工具 K9S](https://mp.weixin.qq.com/s?__biz=MzI0MDQ4MTM5NQ==&mid=2247510913&idx=2&sn=202da04302a9c2d1e14d709f3a833b06&chksm=e918ce9dde6f478b9b83c31898277473b747c6719bbbf81ad95350695201e619e4eb4379ead7&scene=178&cur_album_id=1790241575034290179#rd)

**github:** [项目地址](https://github.com/derailed/k9s/releases)
> k9s是基于终端的资源仪表板。它只有一个命令行界面。无论在Kubernetes仪表板Web UI上做什么，都可以在终端使用K9s仪表板工具进行相同的操作。k9s持续关注Kubernetes集群，并提供命令以使用集群上定义的资源。

```yaml
使用：下载后放到/bin/k9s 即可使用，需要安装kubectl
example: k9s -n ops  #即可查看ops的namespace
```

## 一些K8s的文章

[【openai】我们把k8s集群扩展到了7500个节点](https://openai.com/research/scaling-kubernetes-to-7500-nodes)