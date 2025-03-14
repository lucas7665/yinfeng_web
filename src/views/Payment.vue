<template>
  <div class="payment-container">
    <div class="payment-card">
      <h1>升级会员</h1>
      
      <div class="price-section">
        <h2>¥99.00</h2>
        <p>每月</p>
      </div>

      <div class="benefits-section">
        <h3>会员权益</h3>
        <ul>
          <li>每月500条对话额度</li>
          <li>优先客服支持</li>
          <li>高级AI模型使用权限</li>
          <li>自定义知识库</li>
        </ul>
      </div>

      <button class="payment-button" @click="handlePayment">
        立即开通
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Payment',
  methods: {
    handlePayment() {
      // TODO: 实现支付逻辑
      alert('支付功能开发中...')
    }
  }
}
</script>

<style scoped>
.payment-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.payment-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.price-section {
  text-align: center;
  margin-bottom: 30px;
}

.price-section h2 {
  font-size: 36px;
  color: #2c3e50;
  margin: 0;
}

.price-section p {
  color: #666;
  margin: 5px 0 0;
}

.benefits-section {
  margin-bottom: 30px;
}

.benefits-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.benefits-section ul {
  list-style: none;
  padding: 0;
}

.benefits-section li {
  padding: 10px 0;
  color: #666;
  position: relative;
  padding-left: 25px;
}

.benefits-section li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #42b983;
}

.payment-button {
  width: 100%;
  padding: 15px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.payment-button:hover {
  background-color: #3aa876;
}
</style> 