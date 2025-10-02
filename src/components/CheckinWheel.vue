<template>
  <div class="checkin-wheel-container">
    <div class="checkin-wheel-card">
      <div class="card-header">
        <div class="header-content">
          <div class="title-section">
            <div class="title-icon">
              <IconGift :size="24"/>
            </div>
            <div class="title-text">
              <h2 class="card-title">{{ $t('dashboard.dailyCheckin') }}</h2>
              <p class="card-subtitle">每日签到，随机获得 10MB-100MB 流量</p>
            </div>
          </div>
          <div class="header-badge">
            <IconCalendar :size="16"/>
            <span>每日一次</span>
          </div>
        </div>
      </div>
      
      <div class="card-body">
        <div class="checkin-wheel-wrapper">
          <!-- 转盘背景 -->
          <div class="wheel-background" :class="{ 'spinning': isSpinning }">
            <!-- 奖励区域 -->
            <div 
              v-for="(reward, index) in rewards" 
              :key="index"
              class="reward-segment"
              :style="{ 
                transform: `rotate(${index * 45}deg)`,
                background: reward.gradient 
              }"
            >
              <div class="reward-content">
                <div class="reward-icon">
                  <IconGift :size="18"/>
                </div>
                <div class="reward-text" :style="{ transform: `rotate(-${index * 45}deg)` }">
                  {{ reward.text }}
                </div>
              </div>
            </div>
            
            <!-- 中心圆盘 -->
            <div class="wheel-center">
              <div class="center-logo">
                <IconGift :size="28"/>
              </div>
              <div class="center-text">签到</div>
            </div>
            
            <!-- 指针 -->
            <div class="wheel-pointer">
              <div class="pointer-arrow"></div>
            </div>
          </div>
          
          <!-- 转盘按钮 -->
          <div class="wheel-button-container">
            <button 
              class="wheel-button"
              :class="{ 'disabled': isSpinning || hasCheckedIn }"
              :disabled="isSpinning || hasCheckedIn"
              @click="spinWheel"
            >
              <div class="button-content">
                <IconRefreshCw v-if="isSpinning" :size="20" class="spinning-icon"/>
                <IconGift v-else :size="20"/>
                <span>{{ buttonText }}</span>
              </div>
              <div class="button-glow"></div>
            </button>
          </div>
        </div>
        
        <!-- 签到状态 -->
        <div v-if="hasCheckedIn" class="checkin-status success">
          <IconCheck :size="16"/>
          <span>{{ $t('dashboard.alreadyCheckedIn') }}</span>
        </div>
        
        <!-- 签到结果 -->
        <div v-if="checkinResult" class="checkin-result" :class="checkinResult.success ? 'success' : 'error'">
          <IconCheck v-if="checkinResult.success" :size="16"/>
          <IconX v-else :size="16"/>
          <span>{{ checkinResult.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { standardCheckin } from '@/api/user'
import { IconGift, IconRefreshCw, IconCheck, IconX, IconCalendar } from '@tabler/icons-vue'

export default {
  name: 'CheckinWheel',
  components: {
    IconGift,
    IconRefreshCw,
    IconCheck,
    IconX,
    IconCalendar
  },
  setup() {
    const { t } = useI18n()
    
    // 响应式数据
    const isSpinning = ref(false)
    const hasCheckedIn = ref(false)
    const checkinResult = ref(null)
    
    // 奖励配置 - 更新为10-100MB范围
    const rewards = ref([
      { 
        text: '10MB', 
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        value: 10 * 1024 * 1024 
      },
      { 
        text: '20MB', 
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
        value: 20 * 1024 * 1024 
      },
      { 
        text: '30MB', 
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
        value: 30 * 1024 * 1024 
      },
      { 
        text: '50MB', 
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
        value: 50 * 1024 * 1024 
      },
      { 
        text: '70MB', 
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 
        value: 70 * 1024 * 1024 
      },
      { 
        text: '100MB', 
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', 
        value: 100 * 1024 * 1024 
      },
      { 
        text: '80MB', 
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', 
        value: 80 * 1024 * 1024 
      },
      { 
        text: '60MB', 
        gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', 
        value: 60 * 1024 * 1024 
      }
    ])
    
    // 计算属性
    const buttonText = computed(() => {
      if (isSpinning.value) return t('dashboard.spinning')
      if (hasCheckedIn.value) return t('dashboard.checkedIn')
      return t('dashboard.checkinNow')
    })
    
    // 转盘旋转
    const spinWheel = async () => {
      if (isSpinning.value || hasCheckedIn.value) return
      
      try {
        isSpinning.value = true
        checkinResult.value = null
        
        // 执行签到
        const response = await standardCheckin()
        
        if (response.data) {
          // 签到成功
          hasCheckedIn.value = true
          checkinResult.value = {
            success: true,
            message: response.message
          }
          
          // 模拟转盘停止在随机位置
          setTimeout(() => {
            isSpinning.value = false
          }, 2000)
        } else {
          // 签到失败
          checkinResult.value = {
            success: false,
            message: response.message
          }
          isSpinning.value = false
        }
      } catch (error) {
        console.error('签到失败:', error)
        checkinResult.value = {
          success: false,
          message: error.response?.data?.message || t('dashboard.checkinFailed')
        }
        isSpinning.value = false
      }
    }
    
    // 检查今日是否已签到
    const checkCheckinStatus = () => {
      // 这里可以调用API检查签到状态
      // 暂时设为false，实际应该从后端获取
      hasCheckedIn.value = false
    }
    
    onMounted(() => {
      checkCheckinStatus()
    })
    
    return {
      isSpinning,
      hasCheckedIn,
      checkinResult,
      rewards,
      buttonText,
      spinWheel
    }
  }
}
</script>

<style scoped>
.checkin-wheel-container {
  margin-bottom: 24px;
}

.checkin-wheel-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
  backdrop-filter: blur(25px);
  border-radius: 28px;
  padding: 28px;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.12),
    0 12px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.25);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.checkin-wheel-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.15),
    0 15px 30px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.checkin-wheel-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-radius: 28px;
  z-index: -1;
}

.card-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.title-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.title-text {
  flex: 1;
}

.card-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.8;
}

.header-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.checkin-wheel-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.wheel-background {
  position: relative;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.2),
    0 12px 24px rgba(0, 0, 0, 0.15),
    inset 0 2px 0 rgba(255, 255, 255, 0.3);
  border: 5px solid rgba(255, 255, 255, 0.4);
}

.wheel-background.spinning {
  transform: rotate(1800deg);
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.2),
    inset 0 2px 0 rgba(255, 255, 255, 0.9);
  border: 4px solid rgba(255, 255, 255, 0.95);
  z-index: 3;
}

.center-logo {
  color: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}

.center-text {
  font-size: 10px;
  font-weight: 700;
  color: #667eea;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.wheel-pointer {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
}

.pointer-arrow {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 24px solid #ff6b6b;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  position: relative;
}

.pointer-arrow::after {
  content: '';
  position: absolute;
  top: 2px;
  left: -10px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 20px solid #ffffff;
}

.reward-segment {
  position: absolute;
  top: 0;
  left: 50%;
  width: 120px;
  height: 120px;
  transform-origin: 0 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 0 120px 120px;
  overflow: hidden;
}

.reward-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transform: translateY(20px);
}

.reward-icon {
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.reward-text {
  font-size: 11px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.wheel-button-container {
  display: flex;
  justify-content: center;
}

.wheel-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 
    0 12px 32px rgba(102, 126, 234, 0.4),
    0 6px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  letter-spacing: 0.5px;
  min-width: 160px;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.button-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-radius: 50px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.wheel-button:hover:not(.disabled) {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 
    0 16px 40px rgba(102, 126, 234, 0.5),
    0 10px 24px rgba(0, 0, 0, 0.2);
}

.wheel-button:hover:not(.disabled) .button-glow {
  opacity: 1;
}

.wheel-button:active:not(.disabled) {
  transform: translateY(-2px) scale(0.98);
}

.wheel-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinning-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.checkin-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.checkin-status.success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.checkin-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 16px;
}

.checkin-result.success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.checkin-result.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .checkin-wheel-card {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .title-section {
    gap: 12px;
  }
  
  .title-icon {
    width: 40px;
    height: 40px;
  }
  
  .card-title {
    font-size: 18px;
  }
  
  .card-subtitle {
    font-size: 13px;
  }
  
  .wheel-background {
    width: 220px;
    height: 220px;
  }
  
  .wheel-center {
    width: 60px;
    height: 60px;
  }
  
  .center-text {
    font-size: 9px;
  }
  
  .reward-segment {
    width: 110px;
    height: 110px;
    transform-origin: 0 110px;
  }
  
  .reward-content {
    transform: translateY(18px);
  }
  
  .reward-text {
    font-size: 10px;
  }
  
  .wheel-button {
    padding: 14px 28px;
    font-size: 14px;
    min-width: 140px;
  }
  
  .pointer-arrow {
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 20px solid #ff6b6b;
  }
  
  .pointer-arrow::after {
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 16px solid #ffffff;
    left: -8px;
  }
}
</style>
