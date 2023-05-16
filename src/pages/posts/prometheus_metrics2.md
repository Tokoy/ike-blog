---
layout: '../../layouts/MarkdownPost.astro'
title: 'Prometheus Metrics精简优化2'
pubDate: 2023-05-16
description: '查询prometheus采集了哪些指标，用到了哪些指标以及那些没有用到'
author: 'ike'
cover:
    url: '\static\images\prometheus.png'
    square: '\static\images\prometheus.png'
    alt: 'cover'
tags: ["运维", "实用", "prometheus", "metrics"]
theme: 'light'
featured: false
---
## 前言
无意中看到一个可以查询当前prometheus有用到哪些指标的工具，感觉对大的prometheus集群应该蛮有用的，试试能不能降低一些prometheus负责吧。

## 工具
**mimirtool** 
>Mimirtool 是一个 CLI 工具，可用于涉及 Grafana Mimir 或 Grafana Cloud Metrics 的 Prometheus 兼容任务的各种操作。

## 下载方法
```shell
curl -fLo mimirtool https://github.com/grafana/mimir/releases/latest/download/mimirtool-linux-amd64
```

## 使用方法
1. 提取Grafana 仪表板中用到的指标：
```shell
mimirtool analyze grafana --address=http://localhost:3000 --key="${GRAFANA_API_TOKEN}"
```
grafana的apikey可以在grafana页面的设置里获取，生成一个admin的key就好啦,运行完上面的命令后就可以得到``metrics-in-grafana.json``文件，里面就是grafana用到了哪些指标。 

2. 提取prometheus中rules用到的指标：
```shell
./mimirtool analyze rule-file my-prometheus-rule.yaml
```
my-prometheus-rule.yaml文件是prometheus的rules里的规则集合，把所有的规则都汇总到了这个文件里，要注意格式正确。运行命令后就会生成``metrics-in-ruler.json``文件，里面是prometheus的规则用到了哪些指标。

3. 和当前prometheus采集的指标进行对比：
```shell
./mimirtool analyze prometheus --address=http://localhost:9090
```
运行后会生成``prometheus-metrics.json``文件，这个就是我们最终要的文件了，里面包含了哪些指标在用，哪些指标没有在用，然后就可以根据这些数据，修改prometheus的采集规则，筛选掉一些不用的指标。