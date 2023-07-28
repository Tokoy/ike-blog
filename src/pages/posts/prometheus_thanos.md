---
layout: '../../layouts/MarkdownPost.astro'
title: '快速部署thanos架构'
pubDate: 2023-07-21
description: '如何快速部署thanos，修改你的prometheus联邦架构变成thanos架构'
author: 'ike'
cover:
    url: '\static\images\47619.png'
    square: '\static\images\47619.png'
    alt: 'cover'
tags: ["运维", "实用", "thanos", "prometheus"]
theme: 'light'
featured: false
---
## 介绍
Thanos 是一个用于扩展 Prometheus 的开源项目，通过将多个 Prometheus 实例和其他数据源组合在一起，实现了跨多个集群和地理位置的高可用性、长期存储和查询功能。Thanos 架构可以被描述为以下四个组件：  
  
* Prometheus：Thanos 使用 Prometheus 作为数据源，用于收集、存储和查询监控数据。Prometheus 是一个功能强大的开源监控系统，可以监控各种应用程序、服务和网络基础设施。  
* Thanos Sidecar：Thanos Sidecar 是一个负责将 Prometheus 数据推送到远程存储桶的代理。它可以将 Prometheus 实例的数据集成到 Thanos 系统中，通过使用 Thanos Store API，使得 Prometheus 实例的数据在 Thanos 中可查询。  
* Thanos Store Gateway：Thanos Store Gateway 是一个用于跨多个 Prometheus 实例聚合、存储和查询数据的组件。它可以将 Prometheus 实例和远程存储桶中的数据作为一个整体进行查询，提供了一个统一的数据视图。  
* Thanos Query：Thanos Query 是一个用于查询 Thanos Store Gateway 中存储的数据的组件。它提供了一个类似于 Prometheus 的查询语言，并能够跨多个 Prometheus 实例和存储桶进行查询，以提供全局的监控数据视图。  
  
通过以上四个组件的协作，Thanos 架构实现了扩展性和高可用性，能够有效地存储和查询大量的监控数据。Thanos 还提供了许多其他的功能，例如数据压缩、数据分片、数据去重、数据合并等，可以进一步提高数据存储和查询的效率。

ps：thanos的receive模式这里就先不讲了，有兴趣的可以百度或者[官网](https://github.com/thanos-io/thanos)查看

## 前因  
网上检索thanos大部分是简介或者架构啥的，部署也都是容器部署，不够简单上手，其实基础的thanos架构搭建很容易。

## 安装
[github地址](https://github.com/thanos-io/thanos/releases/)  
下载后直接放到linux目录下就好了，每个prometheus节点都要部署一个！  

## 部署
先直接上service文件：
**thanos-query.service**
```bash
[Unit]
Description=Thanos Query
After=network-online.target

[Service]
Restart=on-failure
# --query.replica-label "replica" --query.replica-label "datacenter" --> 加上后，thanos query 查询同一节点的数据时，会自动去重
ExecStart=/opt/thanos/thanos query --http-address 0.0.0.0:19192 --grpc-address=0.0.0.0:11901 --store=10.0.0.1:19090,10.0.0.2:19090

[Install]
WantedBy=multi-user.target
```

**thanos-sidecar.service**  
```bash
[Unit]
Description=Thanos Sidecar
After=network-online.target

[Service]
Restart=on-failure
# --prometheus.url 配置对应的prometheus 地址
# --tsdb.path 配置对应的prometheus 数据目录
ExecStart=/opt/thanos/thanos sidecar --prometheus.url=http://localhost:9090 --tsdb.path=/data/prometheus-data --grpc-address=0.0.0.0:19090 --http-address=0.0.0.0:19091

[Install]
WantedBy=multi-user.target
```

## 步骤
service文件和thanos文件都放好后，只需要
1、修改prometheus的配置新增额外标签：  
```yaml
global:
  scrape_interval:     15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
  external_labels:
        datacenter: prometheus-02  #额外标签
rule_files:
   - "rules/*.yaml"
···下面配置省略···
```  
2、在prometheus节点上都启动sidecar的服务。  
3、在thanos节点上启动query的服务。  
4、确认服务都正常启动完毕。  

完毕！然后就可以访问thanos的http://10.0.0.1:19192 就可以访问thanos页面啦，点击Stores就可以看到有几个thanos节点正常连接了。

## 后续
如果你单个prometheus太大了，也可以使用thanos的架构来进行水平分片，把job_name多分几个，降低单个prometheus负载。
如果还是会超时或者负载严重，可以换成receive模式，相当于prometheus把数据直接远程写入到thanos，然后thanos直接从本地数据里进行指标拉取。
