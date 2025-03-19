// 登录方式配置
export const loginConfig = {
  // 密码登录配置
  password: {
    enabled: false, // 是否启用
    title: '账号密码登录',
    usernameLabel: '用户名',
    usernamePlaceholder: '请输入用户名',
    passwordLabel: '密码',
    passwordPlaceholder: '请输入密码',
    submitText: '登录'
  },
  // 短信登录配置
  sms: {
    enabled: false, // 默认关闭短信登录
    title: '验证码登录',
    phoneLabel: '手机号',
    phonePlaceholder: '请输入手机号',
    codeLabel: '验证码',
    codePlaceholder: '请输入验证码',
    getCodeText: '获取验证码',
    submitText: '登录'
  },
  // 微信登录配置
  wechat: {
    enabled: true, // 启用微信登录
    dividerText: '',
    buttonText: '微信登录',
    buttonColor: '#07c160'
  }
} 