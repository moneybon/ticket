# LeanTicket

### 部署应用

LeanCloud 应用准备

1. 创建 LeanCloud 应用。
2. 调整应用选项：
   - 存储 -> 设置 -> 勾选「启用 LiveQuery」
3. 初始化数据表：将 `./resources/schema` 目录下表结构导入到存储服务中。然后在 Ticket 表新建一列，名为 `nid`，类型选择 `Number`，勾选「自增」。
4. 绑定云引擎域名：设置 -> 域名绑定 -> 云引擎、ClientEngine 域名
5. （国际版跳过此步）绑定 API 域名：设置 -> 域名绑定 -> API 访问域名，绑定成功后，添加云引擎环境变量 `LEANCLOUD_API_HOST`，值为 `https://your-api-domain.example.com`
6. （可选）添加云引擎环境变量 `HELP_EMAIL`，值为邮箱地址，报错页面等处会显示该邮箱。


获取应用源码：

```
git clone https://github.com/leancloud/ticket.git
cd ticket
```

使用 [命令行工具](https://leancloud.cn/docs/leanengine_cli.html) 关联代码到 LeanCloud 应用：

```
lean switch
```

根据提示选择刚才创建的 LeanCloud 应用。

然后部署：

```
lean deploy
```

部署完成后，访问 `https://<刚才绑定的自定义云引擎域名>` 即可访问。

### 开始使用

#### 注册管理员

应用注册的第一个账号默认会被设置为「管理员」和「客服」两种角色，之后可以使用该账号添加更多的账号到「客服」角色之中。

#### 添加客服

任何一个拥有「客服」角色的账号，都可以在 右上角点击用户名 -> 设置 -> 技术支持设置 -> 成员 页面添加其他客服账号，输入希望添加账号的用户名，点击「添加为技术支持人员」。

#### 添加工单分类

「客服」账号可以在 右上角点击用户名 -> 设置 -> 技术支持设置 -> 分类 页面来维护分类。

* 可以设置多个分类，如「账号问题」、「Android SDK」等，用户提交工单时可以选择对应的分类。
* 可以设置自己是否负责该分类，也可以看到其他客服负责的分类。
* 点击分类名称，可以设置「问题描述模板」，之后用户选择分类时模板自动填写，方便用户了解需要补充什么信息。
* **至少需要添加一个分类，否则无法新建工单。**

#### 提交工单

应用的账号都可以提交工单，点击右上角「新建工单」，填写相关信息点击提交即可。

#### 回复工单

工单产生后，应用会根据「工单分类」的负责人，并排除掉「请假」人员，选择工单负责人，该负责人可以在「客服工单列表」中检索到自己负责的工单列表。在工单详情页可以回复用户的问题。

工单状态会随着用户或者客服回复，在「等待客服回复」和「等待用户回复」之间切换。

工单详情页还可以修改工单的分类和负责人信息。

#### 解决或关闭工单

对工单的完结操作有两种「解决」和「关闭」，在工单页面右边可以操作。 
* 如果用户认为问题已经解决，点击「已解决」按钮，则工单状态变为「已解决」。
* 如果用户认为问题不需要解决，点击「关闭」按钮，则工单状态变为「已关闭」。
* 如果客服认为问题已经解决，点击「已解决」按钮，则工单状态变为「待确认解决」，此时用户可以看到一个确认信息来「确认已解决」或「未解决」，前者将工单状态变为「已解决」，后者将工单状态变为「等待客服回复」。
* 如果客服认为问题无法解决，点击「关闭」按钮，则工单状态变为「已关闭」。

#### 统计

应用会将工单的一些信息按周汇总统计，方便客服了解一些数据指标。

注意，统计数据以周五凌晨作为一周的开始，如果希望调整此项设置，请修改 `config.webapp.js` 中的 `offsetDays` 变量，例如，改为 `0` 代表以周一凌晨为一周的开始。

#### 客服个人设置

「客服」账号可以在 右上角点击用户名 -> 设置 -> 技术支持设置 -> 个人设置 页面进行设置。

可以设置企业微信号关联，这样有新的工单等信息时会收到响应的提醒。

如果客服无法处于工作状态，可以「请假」，工单不会分配给请假时间段内的客服。

### 开发环境

#### 安装依赖

```
npm install
```
依赖安装完毕会自动编译应用，如果以后需要手动编译请执行：

```
npm run build
```

#### 本地启动

启动服务端（确保已经和 LeanCloud 关联）：

```
lean up
```

启动客户端：

```
npm run dev:client
```
该命令依赖 [命令行工具](https://leancloud.cn/docs/leanengine_cli.html) ，因为需要 `lean env` 导出 appId 和 appKey。

#### 本地访问

访问 http://localhost:3000 即可。

**提示**：因为应用依赖较多的 [云函数](https://leancloud.cn/docs/leanengine_cloudfunction_guide-node.html#云函数) 和 [Hook 函数](https://leancloud.cn/docs/leanengine_cloudfunction_guide-node.html#Hook_函数) ，而本地运行时暂不能调用到本地应用的相关代码，所以需要先将应用部署到云端。

### Demo

为了方便大家体验 LeanTicket 的功能，我们部署了一个 Demo 应用（这个应用仅供测试，数据随时可能清空）。

[LeanTicket Demo](https://ticket-demo.avosapps.us/)

| 用户名 | 密码 | 角色 |
| - | - | - |
| demo | demo | 客服 |
| test | test | 用户 |

### LeanCloud 内部贡献

发布流程：

1. 特性和 bug 修复在合并到 master 分支后，将 master 分支发布到工单的预备环境测试（如有必要，改动未合并前也可临时在工单预备环境测试）。
2. 在预备环境充分测试后（比如一周后，具体时间视改动的大小和影响自行把握），发布到工单的生产环境，并在代码仓库打上 `lc-YYYYMMDD` 的 tag. 

另外，实现 LeanCloud 内部功能请加上 `enableLeanCloudIntegration` 开关。
