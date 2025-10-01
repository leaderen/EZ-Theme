<template>
  <div class="checkin-wheel-container">
    <div class="checkin-wheel-card">
      <div class="card-header">
        <h2 class="card-title">
          <IconGift :size="20"/>
          {{ $t('dashboard.dailyCheckin') }}
        </h2>
      </div>
      <div class="card-body">
        <div class="checkin-wheel-wrapper">
          <!-- 转盘背景 -->
          <div class="wheel-background" :class="{ 'spinning': isSpinning }">
            <div class="wheel-center">
              <div class="wheel-pointer"></div>
            </div>
            <!-- 奖励区域 -->
            <div 
              v-for="(reward, index) in rewards" 
              :key="index"
              class="reward-segment"
              :style="{ 
                transform: `rotate(${index * 45}deg)`,
                background: reward.color 
              }"
            >
              <div class="reward-text" :style="{ transform: `rotate(-${index * 45}deg)` }">
                {{ reward.text }}
              </div>
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
              <IconRefreshCw v-if="isSpinning" :size="20" class="spinning-icon"/>
              <IconGift v-else :size="20"/>
              <span>{{ buttonText }}</span>
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
import { IconGift, IconRefreshCw, IconCheck, IconX } from '@tabler/icons-vue'

export default {
  name: 'CheckinWheel',
  components: {
    IconGift,
    IconRefreshCw,
    IconCheck,
    IconX
  },
  setup() {
    const { t } = useI18n()
    
    // 响应式数据
    const isSpinning = ref(false)
    const hasCheckedIn = ref(false)
    const checkinResult = ref(null)
    
    // 奖励配置
    const rewards = ref([
      { text: '10MB', color: '#ff6b6b', value: 10 * 1024 * 1024 },
      { text: '50MB', color: '#4ecdc4', value: 50 * 1024 * 1024 },
      { text: '100MB', color: '#45b7d1', value: 100 * 1024 * 1024 },
      { text: '200MB', color: '#96ceb4', value: 200 * 1024 * 1024 },
      { text: '500MB', color: '#feca57', value: 500 * 1024 * 1024 },
      { text: '1GB', color: '#ff9ff3', value: 1024 * 1024 * 1024 },
      { text: '200MB', color: '#54a0ff', value: 200 * 1024 * 1024 },
      { text: '100MB', color: '#5f27cd', value: 100 * 1024 * 1024 }
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
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-color);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkin-wheel-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.wheel-background {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(
    #ff6b6b 0deg 45deg,
    #4ecdc4 45deg 90deg,
    #45b7d1 90deg 135deg,
    #96ceb4 135deg 180deg,
    #feca57 180deg 225deg,
    #ff9ff3 225deg 270deg,
    #54a0ff 270deg 315deg,
    #5f27cd 315deg 360deg
  );
  transition: transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.wheel-background.spinning {
  transform: rotate(1800deg);
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: var(--card-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.wheel-pointer {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 16px solid var(--primary-color);
  transform: translateY(-2px);
}

.reward-segment {
  position: absolute;
  top: 0;
  left: 50%;
  width: 100px;
  height: 100px;
  transform-origin: 0 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reward-text {
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.wheel-button-container {
  display: flex;
  justify-content: center;
}

.wheel-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.wheel-button:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
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
  .wheel-background {
    width: 160px;
    height: 160px;
  }
  
  .reward-segment {
    width: 80px;
    height: 80px;
    transform-origin: 0 80px;
  }
  
  .reward-text {
    font-size: 10px;
  }
  
  .wheel-button {
    padding: 10px 20px;
    font-size: 14px;
  }
}
</style>
