---
layout: '../../layouts/MarkdownPost.astro'
title: '如何使用Clickhouse的索引'
pubDate: 2023-10-18
description: '用clickhouse的索引来提高检索效率'
author: 'ike'
cover:
    url: '\static\images\IMG_6615.JPG.JPG'
    square: '\static\images\IMG_6615.JPG.JPG'
    alt: 'cover'
tags: ["技术", "运维", "clickhouse", "index"]
theme: 'light'
featured: false
---

## 简介
&ensp;&ensp;&ensp;&ensp;影响ClickHouse查询性能的因素很多。在大多数情况下，关键因素是ClickHouse在计算查询WHERE子句条件时是否可以使用主键。因此，选择适用于最常见查询模式的主键对于有效的表设计至关重要。
&ensp;&ensp;&ensp;&ensp;用户通常依赖ClickHouse获取时间序列类型的数据，但他们通常希望根据其他业务维度(如客户id、网站URL或产品编号)分析相同的数据。在这种情况下，查询性能可能会相当差，因为可能需要对每个列值进行完整扫描才能应用WHERE子句条件。虽然ClickHouse在这些情况下仍然相对较快，但评估数百万或数十亿个单独的值将导致“非索引”查询的执行速度比基于主键的查询慢得多。
&ensp;&ensp;&ensp;&ensp;ClickHouse提供了一种不同类型的索引，在特定情况下可以显著提高查询速度。这些结构被标记为“跳过(Skip)”索引，因为它们使ClickHouse能够跳过读取保证没有匹配值的重要数据块。

## 介绍
>Clickhouse索引的特点为: 排序索引+稀疏索引+列式存储, 因此相应的Clickhouse最合适的场景就是基于排序字段的范围过滤后的聚合查询。
>>因为排序索引, 所有基于排序字段的查询会明显由于MR类型计算, 否则Hive/Spark这类动态资源的更优
>>由于稀疏索引, 点查询的效率可能没有KV型数据库高, 因此适合相对大范围的过滤条件
>>因为列式存储, 数据压缩率高, 对应做聚合查询效率也会更高.


## 实践
因为表索引不好在创建表后再进行创建，所以最好在创建表的时候就计划好并创建，例如cloki的表主要是samples_v3和time_series_gin表是用作主要查询的，所以可以
对于cloki.time_series_gin表：
对key列进行索引：**ALTER TABLE cloki.time_series_gin_ ADD INDEX idx_key(key) TYPE minmax GRANULARITY 8192;**
对val列进行索引：**ALTER TABLE cloki.time_series_gin_ ADD INDEX idx_val(val) TYPE minmax GRANULARITY 8192;**
对fingerprint列进行索引：**ALTER TABLE cloki.time_series_gin_ ADD INDEX idx_fingerprint(fingerprint) TYPE minmax GRANULARITY 8192;**

对于cloki.samples_v3表：
对timestamp_ns列进行索引：**ALTER TABLE cloki.samples_v3_ ADD INDEX idx_timestamp_ns(timestamp_ns) TYPE minmax GRANULARITY 8192;**
对fingerprint列进行索引：**ALTER TABLE cloki.samples_v3_ ADD INDEX idx_fingerprint(fingerprint) TYPE minmax GRANULARITY 8192;**
对string列进行索引：**ALTER TABLE cloki.samples_v3_ ADD INDEX idx_string(string) TYPE minmax GRANULARITY 8192;**

如果需要对已有的数据也进行索引，需要 **ALTER TABLE cloki.samples_v3_ MATERIALIZE INDEX idx_timestamp_ns;** 数据量较大，会非常慢。

 ## 参考
[官方文档](https://clickhouse.com/docs/en/optimize/skipping-indexes)
[深入浅出clickhouse-index](https://saintbacchus.github.io/2021/08/15/%E6%B7%B1%E5%85%A5%E6%B5%85%E5%87%BAClickhouse-%E7%B4%A2%E5%BC%95%E7%BB%93%E6%9E%84%E8%AE%BE%E8%AE%A1/)