"use strict";(self["webpackChunkhealth_app"]=self["webpackChunkhealth_app"]||[]).push([[335],{5335:function(e,a,l){l.r(a),l.d(a,{default:function(){return X}});l(4114);var t=l(6768),n=l(4232),s=l(144),o=l(715),i=l(1387),u=l(4373);const c={class:"plan-page"},v={class:"content"},r={class:"plan-section"},d={class:"plan-title"},p={class:"plan-info"},m={class:"plan-time"},k={class:"action-buttons"},g={class:"pagination-wrapper"},h={class:"content"},f={class:"plan-section"},y={class:"plan-title"},b={class:"plan-info"},w={class:"plan-time"},C={class:"action-buttons"},L={class:"pagination-wrapper"},_={class:"preview-container"},K=["src"],F={key:1,class:"plan-preview"},R={class:"plan-content"},$=10,U=10;var z={__name:"Plan",setup(e){const a=(0,i.rd)(),l=(0,s.KR)("my"),z=(0,s.KR)([]),E=(0,s.KR)(!1),P=(0,s.KR)(1),X=(0,s.KR)(0),I=(0,s.KR)(!1),W=(0,s.KR)(null),T=(0,s.KR)(""),V=(0,s.KR)(!1),D=(0,s.KR)(!1),S=(0,s.KR)(null),A=(0,s.KR)([]),q=(0,s.KR)(!1),B=(0,s.KR)(1),H=(0,s.KR)(0),M=u.A.create({baseURL:"https://lgj-8082.colorstoneai.com",timeout:6e4,headers:{"Content-Type":"application/json"}});M.interceptors.request.use((e=>{const a=localStorage.getItem("token");return a&&(e.headers.Authorization=`Bearer ${a}`),e}));const Q=async()=>{if(!E.value)try{E.value=!0,(0,o.D0)({message:"加载中...",forbidClick:!0});const e=await M.get("/api/health-plan/list",{params:{page:P.value,size:$,planType:1}});0===e.data.code?(z.value=e.data.data||[],X.value=e.data.total||0):(0,o.P0)(e.data.message||"获取列表失败")}catch(e){console.error("请求失败:",e),403===e.response?.status?((0,o.P0)("登录已过期，请重新登录"),localStorage.removeItem("token"),a.push("/login")):(0,o.P0)("获取列表失败")}finally{E.value=!1,(0,o.cQ)()}},j=async()=>{if(!q.value)try{q.value=!0,(0,o.D0)({message:"加载中...",forbidClick:!0});const e=await M.get("/api/health-plan/list",{params:{page:B.value,size:U,planType:2}});0===e.data.code?(A.value=e.data.data||[],H.value=e.data.total||0):(0,o.P0)(e.data.message||"获取列表失败")}catch(e){console.error("获取他人方案列表失败:",e),403===e.response?.status?((0,o.P0)("登录已过期，请重新登录"),localStorage.removeItem("token"),a.push("/login")):(0,o.P0)("获取列表失败")}finally{q.value=!1,(0,o.cQ)()}};(0,t.wB)(l,(()=>{P.value=1,Q()}));const x=e=>{P.value=e,Q()},N=e=>(P.value-1)*$+e+1,Y=e=>(B.value-1)*U+e+1,G=(e,a)=>{W.value=e;const l=2===e.planType;T.value=l?`第${Y(a)}次健康方案`:`第${N(a)}次健康方案`,e.pdfUrl?W.value={...e,content:null,pdfUrl:e.pdfUrl}:W.value={...e,content:`\n基本信息：\n${e.basicInfo||"无"}\n\n鸡尾酒疗法：\n${e.cocktailTherapy||"无"}\n\n抗衰老疗法：\n${e.antiAging||"无"}\n\n口服营养：\n${e.oralNutrition||"无"}\n\n生活方式指导：\n${e.lifestyleGuide||"无"}\n\n心灵疗愈：\n${e.mentalHealing||"无"}\n\n设备干预：\n${e.equipmentIntervention||"无"}\n\n总结：\n${e.summary||"无"}\n      `.trim()},I.value=!0},J=e=>new Date(e).toLocaleDateString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit"}),O=e=>{e.preventDefault();const a=document.querySelector(".preview-dialog"),l=a.offsetHeight,t=e.clientY,n=e=>{const n=e.clientY-t,s=Math.min(Math.max(l+n,400),.95*window.innerHeight);a.style.height=`${s}px`},s=()=>{document.removeEventListener("mousemove",n),document.removeEventListener("mouseup",s)};document.addEventListener("mousemove",n),document.addEventListener("mouseup",s)},Z=e=>{S.value=e,D.value=!0},ee=async()=>{if(S.value)try{(0,o.D0)({message:"删除中...",forbidClick:!0});const e=await M.delete(`/api/v1/reports/healpth/${S.value.id}`);0===e.data.code?((0,o.P0)("删除成功"),1===z.value.length&&P.value>1&&P.value--,Q()):(0,o.P0)(e.data.message||"删除失败")}catch(e){console.error("删除失败:",e),403===e.response?.status||401===e.response?.status?((0,o.P0)("登录已过期，请重新登录"),localStorage.removeItem("token"),a.push("/login")):(0,o.P0)("删除失败，请重试")}finally{(0,o.cQ)(),S.value=null}},ae=e=>{B.value=e,j()};return(0,t.wB)(l,(e=>{"others"===e&&0===A.value.length&&j()})),(0,t.sV)((()=>{"my"===l.value?Q():"others"===l.value&&j()})),(e,a)=>{const s=(0,t.g2)("van-empty"),o=(0,t.g2)("van-button"),i=(0,t.g2)("van-cell"),u=(0,t.g2)("van-cell-group"),S=(0,t.g2)("van-pagination"),M=(0,t.g2)("van-tab"),Q=(0,t.g2)("van-tabs"),j=(0,t.g2)("van-dialog");return(0,t.uX)(),(0,t.CE)("div",c,[(0,t.bF)(Q,{active:l.value,"onUpdate:active":a[2]||(a[2]=e=>l.value=e),sticky:""},{default:(0,t.k6)((()=>[(0,t.bF)(M,{title:"我的方案",name:"my"},{default:(0,t.k6)((()=>[(0,t.Lk)("div",v,[(0,t.Lk)("div",r,[E.value||z.value.length?((0,t.uX)(),(0,t.CE)(t.FK,{key:1},[(0,t.bF)(u,{inset:""},{default:(0,t.k6)((()=>[((0,t.uX)(!0),(0,t.CE)(t.FK,null,(0,t.pI)(z.value,((e,l)=>((0,t.uX)(),(0,t.Wv)(i,{key:e.id},{title:(0,t.k6)((()=>[(0,t.Lk)("div",d," 第"+(0,n.v_)(N(l))+"次健康方案 ",1)])),label:(0,t.k6)((()=>[(0,t.Lk)("div",p,[(0,t.Lk)("span",m,"生成时间："+(0,n.v_)(J(e.createTime)),1)])])),"right-icon":(0,t.k6)((()=>[(0,t.Lk)("div",k,[(0,t.bF)(o,{type:"primary",size:"small",onClick:a=>G(e,l),class:"view-btn"},{default:(0,t.k6)((()=>a[6]||(a[6]=[(0,t.eW)(" 查看 ")]))),_:2},1032,["onClick"]),(0,t.bF)(o,{type:"danger",size:"small",onClick:a=>Z(e),class:"delete-btn"},{default:(0,t.k6)((()=>a[7]||(a[7]=[(0,t.eW)(" 删除 ")]))),_:2},1032,["onClick"])])])),_:2},1024)))),128))])),_:1}),(0,t.Lk)("div",g,[(0,t.bF)(S,{modelValue:P.value,"onUpdate:modelValue":a[0]||(a[0]=e=>P.value=e),"total-items":X.value,"items-per-page":$,"show-page-size":3,"force-ellipses":"",onChange:x},null,8,["modelValue","total-items"])])],64)):((0,t.uX)(),(0,t.Wv)(s,{key:0,description:"暂无健康方案"}))])])])),_:1}),(0,t.bF)(M,{title:"他人方案",name:"others"},{default:(0,t.k6)((()=>[(0,t.Lk)("div",h,[(0,t.Lk)("div",f,[q.value||A.value.length?((0,t.uX)(),(0,t.CE)(t.FK,{key:1},[(0,t.bF)(u,{inset:""},{default:(0,t.k6)((()=>[((0,t.uX)(!0),(0,t.CE)(t.FK,null,(0,t.pI)(A.value,((e,l)=>((0,t.uX)(),(0,t.Wv)(i,{key:e.id},{title:(0,t.k6)((()=>[(0,t.Lk)("div",y," 第"+(0,n.v_)(Y(l))+"次健康方案 ",1)])),label:(0,t.k6)((()=>[(0,t.Lk)("div",b,[(0,t.Lk)("span",w,"生成时间："+(0,n.v_)(J(e.createTime)),1)])])),"right-icon":(0,t.k6)((()=>[(0,t.Lk)("div",C,[(0,t.bF)(o,{type:"primary",size:"small",onClick:a=>G(e,l),class:"view-btn"},{default:(0,t.k6)((()=>a[8]||(a[8]=[(0,t.eW)(" 查看 ")]))),_:2},1032,["onClick"]),(0,t.bF)(o,{type:"danger",size:"small",onClick:a=>Z(e),class:"delete-btn"},{default:(0,t.k6)((()=>a[9]||(a[9]=[(0,t.eW)(" 删除 ")]))),_:2},1032,["onClick"])])])),_:2},1024)))),128))])),_:1}),(0,t.Lk)("div",L,[(0,t.bF)(S,{modelValue:B.value,"onUpdate:modelValue":a[1]||(a[1]=e=>B.value=e),"total-items":H.value,"items-per-page":U,"show-page-size":3,"force-ellipses":"",onChange:ae},null,8,["modelValue","total-items"])])],64)):((0,t.uX)(),(0,t.Wv)(s,{key:0,description:"暂无健康方案"}))])])])),_:1})])),_:1},8,["active"]),(0,t.bF)(j,{show:I.value,"onUpdate:show":a[3]||(a[3]=e=>I.value=e),title:T.value,class:"preview-dialog",closeable:"","close-icon":"close"},{default:(0,t.k6)((()=>[(0,t.Lk)("div",_,[(0,t.Lk)("div",{class:"resize-handle",onMousedown:O},null,32),W.value?.pdfUrl?((0,t.uX)(),(0,t.CE)("iframe",{key:0,src:W.value.pdfUrl,frameborder:"0",class:"pdf-preview"},null,8,K)):((0,t.uX)(),(0,t.CE)("div",F,[(0,t.Lk)("div",R,(0,n.v_)(W.value?.content||"暂无内容"),1)]))])])),_:1},8,["show","title"]),(0,t.bF)(j,{show:D.value,"onUpdate:show":a[4]||(a[4]=e=>D.value=e),title:"删除确认","show-cancel-button":"",onConfirm:ee},{default:(0,t.k6)((()=>a[10]||(a[10]=[(0,t.Lk)("div",{class:"delete-confirm-content"}," 确定要删除这份健康方案吗？此操作不可恢复。 ",-1)]))),_:1},8,["show"]),(0,t.bF)(j,{show:V.value,"onUpdate:show":a[5]||(a[5]=e=>V.value=e),title:"方案详情",class:"plan-dialog"},null,8,["show"])])}}},E=l(1241);const P=(0,E.A)(z,[["__scopeId","data-v-7c36892b"]]);var X=P}}]);
//# sourceMappingURL=335.d437479f.js.map