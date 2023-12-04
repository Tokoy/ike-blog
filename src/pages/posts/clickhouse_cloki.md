---
layout: '../../layouts/MarkdownPost.astro'
title: '使用ilogtail+cloki+clickhouse来做日志系统吧'
pubDate: 2023-08-30
description: '搭建轻量级日志系统架构'
author: 'ike'
cover:
    url: 'https://img.ikeno.top/2023/IMG_6605.GIF'
    square: 'https://img.ikeno.top/2023/IMG_6605.GIF'
    alt: 'cover'
tags: ["技术", "运维", "clickhouse", "cloki", "ilogtai", "grafana"]
theme: 'light'
featured: false
---
## 相关开源工具

* [clickhouse](https://github.com/ClickHouse/ClickHouse) 【文档：https://clickhouse.com/docs/zh】  
* [cloki](https://github.com/metrico/qryn)  【文档：https://qryn.metrico.in/#/installation】  
* [ilogtail](https://github.com/alibaba/ilogtail)  【文档：https://ilogtail.gitbook.io/】  

## 简介
**clickhouse**就不说了，可以参考我前面的博文，这里主要介绍一下cloki和ilogtail。  

**ilogtail**是阿里开源的一款轻量级的日志采集工具，针对k8s环境也有很好的优化，比filebeat轻，资源消耗低，采集效率也快一些。目前官方也支持多种输入、处理和输出，
其中就包含输出到loki或者clickhouse。（要注意logtail是阿里自带的一个日志采集工具，只能采集到阿里的sls，ilogtail是开源社区的，支持多种插件）

**cloki**也是国外开源的一个工具，类似于loki，API也和loki一模一样，但是后台可以关联到更高效的clickhouse作为存储。（目前相关文章不多，但可用）

## 部署
因为所有的都是部署在k8s上的，所以直接上yaml文件吧
#### cloki
cloki-deployment.yml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloki
  labels:
    io.metrico.service: cloki
spec:
  replicas: 1
  selector:
    matchLabels:
      io.metrico.service: cloki
  strategy: {}
  template:
    metadata:
      annotations:
        qryn.cmd: qryn.dev
      creationTimestamp: null
      labels:
        io.metrico.service: cloki
    spec:
      containers:
        - env:
            - name: CLICKHOUSE_SERVER                   # 具体配置参考文档
              value: clickhouse                     
            - name: CLICKHOUSE_AUTH
              value: 'default:xxxxxx'
            - name: CLICKHOUSE_PORT
              value: '8123'
            - name: CLICKHOUSE_DB
              value: cloki
            - name: CLICKHOUSE_TSDB
              value: cloki
            - name: FASTIFY_METRICS
              value: 'true'
            - name: DEBUG
              value: 'true'
            - name: FASTIFY_BODYLIMIT
              value: '52428800'
          image: qxip/qryn:latest
          name: cloki
          ports:
            - containerPort: 3100
          resources: {}
      restartPolicy: Always
status: {}
```

cloki-service.yml
```yaml
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    io.metrico.service: cloki
  name: cloki
spec:
  ports:
    - name: "3100"
      port: 3100
      targetPort: 3100
  selector:
    io.metrico.service: cloki
status:
  loadBalancer: {}
```

```kubectl apply -f cloki-service.yaml,cloki-deployment.yaml -n ops```

#### ilogtai
ilogtail-configmap.yaml
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ilogtail-user-cm
  namespace: ops
data:
  loki_stdout.yaml: |
    enable: true
    inputs:
      - Type: service_docker_stdout
        Stderr: false
        Stdout: true                # 只采集标准输出
        IncludeK8sLabel:            # 采集nginx的日志，这里可以修改为label或者其他指定，具体看文档
          app: nginx
    processors:
      - Type: processor_default    # 默认不做数据处理
        SourceKey: content
    flushers:
      - Type: flusher_loki         #输出也可以改成stdout来测试，或者直接输出到clickhouse，具体看文档
        URL: http://cloki:3100/loki/api/v1/push
        TenantID: ilogtail
        StaticLabels:
          source: ilogtail

```

ilogtail-daemonset.yaml
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: ilogtail-ds
  namespace: ops
  labels:
    k8s-app: logtail-ds
spec:
  selector:
    matchLabels:
      k8s-app: logtail-ds
  template:
    metadata:
      labels:
        k8s-app: logtail-ds
    spec:
      tolerations:
        - operator: Exists                    # deploy on all nodes
      containers:
        - name: logtail
          env:
            - name: ALIYUN_LOG_ENV_TAGS       # add log tags from env
              value: _node_name_|_node_ip_
            - name: _node_name_
              valueFrom:
                fieldRef:
                  apiVersion: v1
                  fieldPath: spec.nodeName
            - name: _node_ip_
              valueFrom:
                fieldRef:
                  apiVersion: v1
                  fieldPath: status.hostIP
            - name: cpu_usage_limit           # iLogtail's self monitor cpu limit
              value: "1"
            - name: mem_usage_limit           # iLogtail's self monitor mem limit
              value: "512"
          image: >-
            sls-opensource-registry.cn-shanghai.cr.aliyuncs.com/ilogtail-community-edition/ilogtail:latest
          imagePullPolicy: IfNotPresent
          resources:
            limits:
              cpu: 1000m
              memory: 1Gi
            requests:
              cpu: 400m
              memory: 384Mi
          volumeMounts:
            - mountPath: /var/run                       # for container runtime socket
              name: run
            - mountPath: /logtail_host                  # for log access on the node
              mountPropagation: HostToContainer
              name: root
              readOnly: true
            - mountPath: /usr/local/ilogtail/checkpoint # for checkpoint between container restart
              name: checkpoint
            - mountPath: /usr/local/ilogtail/user_yaml_config.d # mount config dir
              name: user-config
              readOnly: true
      dnsPolicy: ClusterFirstWithHostNet
      hostNetwork: true
      volumes:
        - hostPath:
            path: /var/run
            type: Directory
          name: run
        - hostPath:
            path: /
            type: Directory
          name: root
        - hostPath:
            path: /etc/ilogtail-ilogtail-ds/checkpoint
            type: DirectoryOrCreate
          name: checkpoint
        - configMap:
            defaultMode: 420
            name: ilogtail-user-cm
          name: user-config
```

>部署完后ilogtail就作为daemonset开始采集nginx的日志并输出到cloki里啦，因为loki是可以直接与grafana集成的，所以只需要在grafana里把cloki作为数据源加上，就可以直接可视化查询了！  
