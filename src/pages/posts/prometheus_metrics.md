---
layout: '../../layouts/MarkdownPost.astro'
title: 'Prometheus Metrics精简优化'
pubDate: 2023-04-04
description: 'Prometheus Metrics精简，优化Metrics数量，减少prometheus负载'
author: 'ike'
cover:
    url: '\static\images\prometheus.png'
    square: '\static\images\prometheus.png'
    alt: 'cover'
tags: ["运维", "实用", "prometheus", "metrics"]
theme: 'light'
featured: false
---
*Prometheus*的**TSDB Status**里可以查看TOP10的指标：__Top 10 series count by metric names__,参考这个来优化指标吧！

## 筛选
推荐使用**metric_relabel_configs**  
```yaml
#保留
  metric_relabel_configs: 
  - source_labels: [__name__]
    regex: etcd_disk_backend_commit_duration_seconds_bucket|up
    action: keep   
#去除
  metric_relabel_configs:
  - source_labels: [__name__]
    regex: nginx_filter_.*
    action: drop 
```

或者使用**whitelist_regex**或者**blacklist_regex**
举例：
```yaml
# 只监控以http开头的指标
whitelist_regex: ^http.*

# 不监控以http开头的指标
blacklist_regex: ^http.*
```

## 合并
*kube-apiserver*的**apiserver_request_duration_seconds_bucket**指标数量太多尝试进行合并：
>将0.1、0.2、0.5、1、2、5、10、30和+Inf的桶(bucket)合并为0.1的桶(bucket)，将0.3、0.6、1.5、3、6、15、30、60、120、300、600、1800、3600和+Inf的桶(bucket)合并为0.3的桶(bucket)，以此类推。
```yaml
    relabel_configs:													
      - source_labels: [le]
        regex: "0\\.1|0\\.2|0\\.5|1|2|5|10|30|\\+Inf"
        action: replace
        target_label: le
        replacement: "0.1"
      - source_labels: [le]
        regex: "0\\.3|0\\.6|1\\.5|3|6|15|30|60|120|300|600|1800|3600|\\+Inf"
        action: replace
        target_label: le
        replacement: "0.3"
      - source_labels: [le]
        regex: "0\\.4|0\\.7|2\\.5|4|7|25|50|100|250|500|1000|1800|3600|\\+Inf"
        action: replace
        target_label: le
        replacement: "0.4"
      - source_labels: [le]
        regex: "1\\.5|5|15|30|60|300|1800|3600|\\+Inf"
        action: replace
        target_label: le
        replacement: "1.5"
```