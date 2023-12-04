---
layout: '../../layouts/MarkdownPost.astro'
title: '业务容器化需要注意的一些地方'
pubDate: 2023-06-01
description: 'java业务上云的一些注意点'
author: 'ike'
cover:
    url: 'https://img.ikeno.top/2023/4708.JPG'
    square: 'https://img.ikeno.top/2023/4708.JPG'
    alt: 'cover'
tags: ["运维", "实用", "k8s", "容器化"]
theme: 'light'
featured: false
---

## 废话不多说，直接上yaml文件。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: java-web
  namespace: ops
  labels:
    app: java-web
spec:
  selector:
    matchLabels:
      app: java-web
  replicas: 2
  strategy:
    type: RollingUpdate
  template:
    metadata:
      name: java-web
      annotations:   # 第一点：新增注解
        loki.io/scrape: 'true' # 抓取直接输出的日志到loki里
        prometheus.io/path: /metrics #采集的监控地址
        prometheus.io/port: '2112'  #采集暴露的监控端口
        prometheus.io/scrape: 'true'  #打开采集开关
      labels:
        app: java-web
    spec:
      imagePullSecrets:  # 第二点：添加权限
        - name: my-docker #只有该用户才有pull镜像的权限
      containers:
        - name: java-web
          image: hb.ops.top/ops/java-web:5917f92c
          imagePullPolicy: IfNotPresent
          readinessProbe:  # 第三点：新增存活检测，当前是针对监控端口进行存活检测，也就是说只有当监控端口起来了，程序才算完全启动
            httpGet:
              port: 2112
              path: /metrics/prometheus
            initialDelaySeconds: 60
            successThreshold: 1
            failureThreshold: 3
            timeoutSeconds: 5
          startupProbe:
            httpGet:
              port: 2112
              path: /metrics/prometheus
            initialDelaySeconds: 60
            successThreshold: 1
            failureThreshold: 3
            timeoutSeconds: 5
          livenessProbe:
            httpGet:
              port: 2112
              path: /metrics/prometheus
            initialDelaySeconds: 60
            successThreshold: 1
            failureThreshold: 3
            timeoutSeconds: 5
          resources: # 第四点：设置资源限制，如果是java程序，建议limit比request大，这样可以合理分配堆内存和非堆内存
            requests:
              memory: 1024Mi
            limits:
              memory: 2048Mi
          ports:
            - name: web-port
              containerPort: 8889
          env: # 第五点：设置环境变量，可以设置时区，指定EVN环境，添加JAVA参数等
            - name: JVM_OPTS
              value: -javaagent:/opt/skywalking/skywalking-agent.jar -Xmx1G -Xms1G
            - name: TZ
              value: Asia/Shanghai
            - name: APOLLO_LABEL
              value: gray
            - name: SW_AGENT_NAME
              value: 'k8s-java-web'
            - name: SW_AGENT_COLLECTOR_BACKEND_SERVICES
              value: '10.0.0.123:11800'
            - name: ENV
              value: prod

---

apiVersion: v1
kind: Service
metadata:
  labels:
    app: java-web
  name: java-web
  namespace: ops
spec:
  ports:
  - name: java-web-port
    port: 8889
    protocol: TCP
    targetPort: 8889
    nodePort: 30009
  selector:
    app: java-web
  sessionAffinity: None
  type: NodePort
status:
  loadBalancer: {}
```
