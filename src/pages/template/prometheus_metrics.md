---
layout: '../../layouts/MarkdownPost.astro'
title: 'Prometheus Metrics精简优化'
pubDate: 2023-04-04
description: 'Prometheus Metrics精简，优化Metrics数量，减少prometheus负载'
author: 'ike'
cover:
    url: 'https://i1.100024.xyz/2023/03/10/qrisw0.webp'
    square: 'https://i1.100024.xyz/2023/03/10/qrisw0.webp'
    alt: 'cover'
tags: ["运维", "实用", "prometheus", "metrics"]
theme: 'light'
featured: false
---
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