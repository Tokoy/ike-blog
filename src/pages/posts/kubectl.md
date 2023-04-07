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

### 一些Pod的yaml文件的资源清单和解释
```yaml
apiVersion: v1     #必选，版本号，例如v1
kind: Pod       　 #必选，资源类型，例如 Pod
metadata:       　 #必选，元数据
  name: string     #必选，Pod名称
  namespace: string  #Pod所属的命名空间,默认为"default"
  labels:       　　  #自定义标签列表
    - name: string      　          
spec:  #必选，Pod中容器的详细定义
  containers:  #必选，Pod中容器列表
  - name: string   #必选，容器名称
    image: string  #必选，容器的镜像名称
    imagePullPolicy: [ Always|Never|IfNotPresent ]  #获取镜像的策略 
    command: [string]   #容器的启动命令列表，如不指定，使用打包时使用的启动命令
    args: [string]      #容器的启动命令参数列表
    workingDir: string  #容器的工作目录
    volumeMounts:       #挂载到容器内部的存储卷配置
    - name: string      #引用pod定义的共享存储卷的名称，需用volumes[]部分定义的的卷名
      mountPath: string #存储卷在容器内mount的绝对路径，应少于512字符
      readOnly: boolean #是否为只读模式
    ports: #需要暴露的端口库号列表
    - name: string        #端口的名称
      containerPort: int  #容器需要监听的端口号
      hostPort: int       #容器所在主机需要监听的端口号，默认与Container相同
      protocol: string    #端口协议，支持TCP和UDP，默认TCP
    env:   #容器运行前需设置的环境变量列表
    - name: string  #环境变量名称
      value: string #环境变量的值
    resources: #资源限制和请求的设置
      limits:  #资源限制的设置
        cpu: string     #Cpu的限制，单位为core数，将用于docker run --cpu-shares参数
        memory: string  #内存限制，单位可以为Mib/Gib，将用于docker run --memory参数
      requests: #资源请求的设置
        cpu: string    #Cpu请求，容器启动的初始可用数量
        memory: string #内存请求,容器启动的初始可用数量
    lifecycle: #生命周期钩子
        postStart: #容器启动后立即执行此钩子,如果执行失败,会根据重启策略进行重启
        preStop: #容器终止前执行此钩子,无论结果如何,容器都会终止
    livenessProbe:  #对Pod内各容器健康检查的设置，当探测无响应几次后将自动重启该容器
      exec:       　 #对Pod容器内检查方式设置为exec方式
        command: [string]  #exec方式需要制定的命令或脚本
      httpGet:       #对Pod内个容器健康检查方法设置为HttpGet，需要制定Path、port
        path: string
        port: number
        host: string
        scheme: string
        HttpHeaders:
        - name: string
          value: string
      tcpSocket:     #对Pod内个容器健康检查方式设置为tcpSocket方式
         port: number
       initialDelaySeconds: 0       #容器启动完成后首次探测的时间，单位为秒
       timeoutSeconds: 0    　　    #对容器健康检查探测等待响应的超时时间，单位秒，默认1秒
       periodSeconds: 0     　　    #对容器监控检查的定期探测时间设置，单位秒，默认10秒一次
       successThreshold: 0
       failureThreshold: 0
       securityContext:
         privileged: false
  restartPolicy: [Always | Never | OnFailure]  #Pod的重启策略
  nodeName: <string> #设置NodeName表示将该Pod调度到指定到名称的node节点上
  nodeSelector: obeject #设置NodeSelector表示将该Pod调度到包含这个label的node上
  imagePullSecrets: #Pull镜像时使用的secret名称，以key：secretkey格式指定
  - name: string
  hostNetwork: false   #是否使用主机网络模式，默认为false，如果设置为true，表示使用宿主机网络
  volumes:   #在该pod上定义共享存储卷列表
  - name: string    #共享存储卷名称 （volumes类型有很多种）
    emptyDir: {}       #类型为emtyDir的存储卷，与Pod同生命周期的一个临时目录。为空值
    hostPath: string   #类型为hostPath的存储卷，表示挂载Pod所在宿主机的目录
      path: string      　　        #Pod所在宿主机的目录，将被用于同期中mount的目录
    secret:       　　　#类型为secret的存储卷，挂载集群与定义的secret对象到容器内部
      scretname: string  
      items:     
      - key: string
        path: string
    configMap:         #类型为configMap的存储卷，挂载预定义的configMap对象到容器内部
      name: string
      items:
      - key: string
        path: string

```

在kubernetes中基本所有资源的一级属性都是一样的，主要包含5部分：  
* apiVersion 版本，由kubernetes内部定义，版本号必须可以用 kubectl api-versions 查询到
* kind 类型，由kubernetes内部定义，版本号必须可以用 kubectl api-resources 查询到
* metadata 元数据，主要是资源标识和说明，常用的有name、namespace、labels等
* spec 描述，这是配置中最重要的一部分，里面是对各种资源配置的详细描述
* status 状态信息，里面的内容不需要定义，由kubernetes自动生成

**spec**描述是主要关注的：  
* containers <[]Object> 容器列表，用于定义容器的详细信息
* nodeName 根据nodeName的值将pod调度到指定的Node节点上
* nodeSelector <map[]> 根据NodeSelector中定义的信息选择将该Pod调度到包含这些label的Node 上
* hostNetwork 是否使用主机网络模式，默认为false，如果设置为true，表示使用宿主机网络
* volumes <[]Object> 存储卷，用于定义Pod上面挂在的存储信息
* restartPolicy 重启策略，表示Pod在遇到故障的时候的处理策略

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