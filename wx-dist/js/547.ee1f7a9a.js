"use strict";(self["webpackChunkhealth_app"]=self["webpackChunkhealth_app"]||[]).push([[547],{2547:function(e,a,t){t.r(a),t.d(a,{default:function(){return m}});t(4114);var n=t(6768),s=t(4232),o=t(144),c=t(715),i=t(1387),l=t(4373);const r={class:"payment-container"},u={class:"payment-card"},p=["disabled"];var d={__name:"Payment",setup(e){const a=(0,i.rd)(),t=(0,o.KR)(!1),d=l.A.create({baseURL:"https://lgj-8082.colorstoneai.com",timeout:1e4,headers:{"Content-Type":"application/json"}});d.interceptors.request.use((e=>{const a=localStorage.getItem("token");return a&&(e.headers.Authorization=`Bearer ${a}`),e}));const h=()=>{const e=navigator.userAgent.toLowerCase();return-1!==e.indexOf("micromessenger")},k=async()=>{try{const e=window.location.href.split("#")[0],a=await d.get("/api/auth/wechat/jsapi-config",{params:{url:e}});if(0===a.data.code){const e=a.data.data;wx.config({debug:!1,appId:e.appId,timestamp:e.timestamp,nonceStr:e.nonceStr,signature:e.signature,jsApiList:["chooseWXPay"]}),wx.ready((()=>{console.log("微信配置成功")})),wx.error((e=>{console.error("微信配置失败:",e),(0,c.P0)("微信配置失败，请刷新页面重试")}))}}catch(e){console.error("初始化微信配置失败:",e),(0,c.P0)("初始化失败，请刷新页面重试")}},m=async()=>{if(!t.value)if(h()){t.value=!0;try{const e=await d.post("/api/auth/wechat/payment/jsapi");if(0===e.data.code){const t=e.data.data;wx.chooseWXPay({timestamp:t.timeStamp,nonceStr:t.nonceStr,package:t.package,signType:t.signType,paySign:t.paySign,success:function(){(0,c.P0)("支付成功"),a.push("/assistant")},fail:function(e){console.error("支付失败:",e),(0,c.P0)("支付失败，请重试")},cancel:function(){(0,c.P0)("已取消支付")}})}else(0,c.P0)(e.data.message||"创建支付订单失败")}catch(e){console.error("支付失败:",e),(0,c.P0)("支付失败，请稍后重试")}finally{t.value=!1}}else(0,c.P0)("请在微信浏览器中打开")};return(0,n.sV)((()=>{h()&&k()})),(e,a)=>((0,n.uX)(),(0,n.CE)("div",r,[(0,n.Lk)("div",u,[a[0]||(a[0]=(0,n.Lk)("h1",null,"升级会员",-1)),a[1]||(a[1]=(0,n.Lk)("div",{class:"price-section"},[(0,n.Lk)("h2",null,"¥99.00"),(0,n.Lk)("p",null,"每月")],-1)),a[2]||(a[2]=(0,n.Lk)("div",{class:"benefits-section"},[(0,n.Lk)("h3",null,"会员权益"),(0,n.Lk)("ul",null,[(0,n.Lk)("li",null,"每月500条对话额度"),(0,n.Lk)("li",null,"优先客服支持"),(0,n.Lk)("li",null,"高级AI模型使用权限"),(0,n.Lk)("li",null,"自定义知识库")])],-1)),(0,n.Lk)("button",{class:"payment-button",onClick:m,disabled:t.value},(0,s.v_)(t.value?"处理中...":"立即开通"),9,p)])]))}},h=t(1241);const k=(0,h.A)(d,[["__scopeId","data-v-e02cc5e4"]]);var m=k}}]);
//# sourceMappingURL=547.ee1f7a9a.js.map