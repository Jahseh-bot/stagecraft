# 今日事项：个人任务看板

目标：构建真实可部署的本机个人任务管理应用，不是静态原型。Vue 3 + Vite 前端，Fastify/Node.js 后端，PostgreSQL 数据库；Vitest 测试。根目录单个 npm 项目管理依赖与 scripts。中文界面，桌面/窄屏可用，有明确视觉层次与真实交互。

范围：新增标题（1–120 字，去掉首尾空白）、列出最新任务、完成/撤销完成、删除任务（确认后执行）、全部/待办/已完成筛选，显示数量、空态、加载及错误状态。API 使用 /api/tasks。数据保存在 PostgreSQL，服务/容器重启后保留。单人本机使用，不需要登录、分享、外部服务、AI 或支付。不确定的产品决定请给建议并提问。

后端：参数化 SQL、输入验证、错误状态码、数据库约束。GET /health 只有数据库可连接时返回 200 JSON 含 status=ok。幂等建表或简单幂等迁移，不能删除用户数据。应用在生产模式同源提供前端 dist 和 API，支持 HOST/PORT/DATABASE_URL。

测试：Vitest 包含真正连接 PostgreSQL 的 API CRUD/校验/过滤测试，以及 Vue 组件行为测试。禁止将数据库全部 mock。测试使用独立 schema 或隔离数据库，清理只限测试创建的记录。验收文件必须列全并冻结。npm run build 真实编译 Vue。HTTP 烟测检查 /health 与数据库连接。

已授权的测试环境：本机已启动隔离 PostgreSQL 15 容器 stagecraft-prd-db，端口127.0.0.1:55439，库 taskboard_test，用户 stagecraft，测试专用密码 stagecraft_test_only。测试与本机烟测可使用 postgresql://stagecraft:stagecraft_test_only@127.0.0.1:55439/taskboard_test。烟测 app 端口43192，生产部署 app 端口43193。

运行器环境：实施阶段可创建文件和安装本项目 npm 依赖；沙箱可能无法连接 Docker/监听端口，最终测试由运行器在实际环境执行，不得为沙箱错误删减真实测试。测试数据库由演练宿主提供，不要求 Agent 启动 Docker。npm 依赖必须保存 lockfile。配置与代码只放当前项目，禁止写运行器 state/log。

部署目标：本机 OrbStack context=orbstack，Compose projectName=stagecraft-taskboard，只发布127.0.0.1:43193。部署 app 与 PostgreSQL 两个服务，数据库使用专属 named volume 且不发布宿主端口，app healthcheck 要验证数据库。只使用演练专用凭据，示例可写入 Compose；不能复用测试数据库作为部署存储。保留运行服务供验证，提供 scoped down 命令且不带 -v。在实现阶段不要部署，运行器验证成功后会进入配置生成/部署阶段。

人工确认：关键业务歧义、测试/架构计划、具体部署文件草稿和发布计划。其余任务自动推进。交付包括代码、测试、运行说明、真实部署访问地址和持久化验证。
