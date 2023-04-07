---
layout: '../../layouts/MarkdownPost.astro'
title: 'Kubernetes的探针机制'
pubDate: 2023-03-28
description: '讲一下k8s里的探针'
author: 'ike'
cover:
    url: '\static\images\k8syaml.svg'
    square: '\static\images\k8syaml.svg'
    alt: 'cover'
tags: ["运维", "实用", "k8s", "yaml"]
theme: 'light'
featured: false
---

## 演示
k8s里探针有三种：存活(livenessProbe)、就绪(readinessProbe)和启动(startupProbe)探针

直接演示一下代码吧

```yaml
....省略其他....
      containers:
        - name: nginx
          image: registry.k8s.io/busybox:v1
          imagePullPolicy: IfNotPresent
          readinessProbe:
            httpGet:
              port: 1111
              path: /metrics/prometheus
            initialDelaySeconds: 60
            successThreshold: 1
            failureThreshold: 3
            timeoutSeconds: 5
          startupProbe:
            httpGet:
              port: 1111
              path: /metrics/prometheus
            initialDelaySeconds: 60
            successThreshold: 1
            failureThreshold: 3
            timeoutSeconds: 5
          livenessProbe:
            httpGet:
              port: 1111
              path: /metrics/prometheus
            initialDelaySeconds: 60
            successThreshold: 1
            failureThreshold: 3
            timeoutSeconds: 5
          resources:
            requests:
              memory: 1024Mi
            limits:
              memory: 2048Mi
....省略其他...
```
## 解释
**readinessProbe**: 用于确定容器是否已准备好接收网络流量。

当探针发现容器已经准备就绪时，Kubernetes 将开始将流量引导到容器中。
使用 HTTP GET 方法检查容器的 /metrics/prometheus 路径是否可用，如果容器返回状态码 200，则认为容器已准备好接收流量。 

*initialDelaySeconds* 表示在容器启动后多少秒后开始检查。
*successThreshold* 表示成功的最小连续计数。
*failureThreshold* 表示失败的最小连续计数。
*timeoutSeconds* 表示检查超时的秒数。

**startupProbe**: 用于确定容器是否正在启动中。

当探针发现容器正在启动时，Kubernetes 将等待一段时间，以允许容器完成启动过程，然后再检查容器是否已准备就绪。

*initialDelaySeconds、successThreshold、failureThreshold 和 timeoutSeconds* 参数的含义与 readinessProbe 中的相同。

**livenessProbe**: 用于确定容器是否正在运行。

当探针发现容器已停止运行时，Kubernetes 将自动重新启动容器。

*initialDelaySeconds、successThreshold、failureThreshold 和 timeoutSeconds* 参数的含义与 readinessProbe 中的相同。

## 使用场景
一般更新业务容器的时候，不加探针的话容器只要能正常启动，原先的容器就会被kill掉，但其实这个时候新的业务容器还没完全起来，这时候就会出现空挡，导致业务不可用，如果加上了探针，只有当新的容器业务完全起来了后，可以检测到监控指标了，才会把旧的kill掉，这样就可以无缝的滚动更新。而且有时候应用可能卡死了，内部出现一些error导致程序不可用，但容器并没有检测到挂掉之类的，探针这时候也可以检测到，然后自动重启。

## 其他
一般业务上云，要对业务的日志，监控，以及探针都需要添加，已确保业务上线后可以充分检测到运行情况，方便运维和开发定位和发现问题。


## 文章
推荐可以看看官方的文档
[配置存活、就绪和启动探针](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
