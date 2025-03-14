<template>
  <div class="payment-container">
    <div class="payment-card">
      <h2>升级会员</h2>
      <div class="price-info">
        <div class="price">¥99.00</div>
        <div class="price-description">永久会员，无限对话</div>
      </div>
      <div class="benefits">
        <h3>会员特权</h3>
        <ul>
          <li>无限次数的AI对话</li>
          <li>优先响应服务</li>
          <li>专属客服支持</li>
          <li>更多功能持续更新</li>
        </ul>
      </div>
      <div class="payment-button">
        <button @click="handlePayment" class="pay-btn">立即开通</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Payment',
  methods: {
    handlePayment() {
      // TODO: 实现微信支付逻辑
      this.$message.info('支付功能开发中，敬请期待！');
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
  padding: 30px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.price-info {
  text-align: center;
  margin-bottom: 30px;
}

.price {
  font-size: 36px;
  color: #f60;
  font-weight: bold;
}

.price-description {
  color: #666;
  margin-top: 10px;
}

.benefits {
  margin-bottom: 30px;
}

.benefits h3 {
  color: #333;
  margin-bottom: 15px;
}

.benefits ul {
  list-style: none;
  padding: 0;
}

.benefits li {
  padding: 10px 0;
  color: #666;
  position: relative;
  padding-left: 20px;
}

.benefits li:before {
  content: "✓";
  color: #4CAF50;
  position: absolute;
  left: 0;
}

.payment-button {
  text-align: center;
}

.pay-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 40px;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.pay-btn:hover {
  background: #45a049;
}
</style> 