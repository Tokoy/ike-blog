---
layout: '../../layouts/MarkdownPost.astro'
title: '如何修改git commit记录'
pubDate: 2023-06-07
description: 'git修改github里不小心泄露的账号密码和私钥'
author: 'ike'
cover:
    url: '\static\images\4774.jpg'
    square: '\static\images\4774.jpg'
    alt: 'cover'
tags: ["运维", "实用", "git"]
theme: 'light'
featured: false
---
## 前言
不小心在github上传了个人隐私或者私钥密码之类的代码，虽然下次代码里已经修复了，但是！commit记录里还是会有的，如果遇到有心人去扫描或者查询还是会泄露的。
所以需要把以前的commit记录和历史都改掉！或者删掉，保护互联网个人信息，从你我做起！

## 修改历史commit的邮箱和用户名
用git filter-branch命令来修改：
>git filter-branch命令 让您通过重写<rev-list选项>中提到的分支来重写Git修订历史记录，并在每个修订版上应用自定义过滤器。这些过滤器可以修改每个树（例如，删除文件或对所有文件运行perl重写）或每个提交的信息。否则，将保留所有信息（包括原始提交时间或合并信息）。[详细概要](https://github.com/apachecn/git-doc-zh/blob/master/docs/59.md)

```shell
git filter-branch --env-filter '
OLD_EMAIL="你的旧邮箱"
CORRECT_NAME="你的新用户名"
CORRECT_EMAIL="你的新邮箱地址"
if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
```
等全部修改完成后用 ```git push --force```命令即可修改完毕

## 修改历史commit的文件
同样用git filterbranch命令来修改，先把代码git clone到本地后，然后
```shell
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/sensitive_info' --prune-empty --tag-name-filter cat -- --all
```
其中 `path/to/sensitive_info` 是要删除敏感信息的文件路径，可以使用通配符 `*` 删除所有文件中的敏感信息。

最后```git push --force```下就好啦，相关文件的提交记录就会全部删除。
