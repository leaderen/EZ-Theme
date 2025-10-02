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
            <!-- 装饰灯泡 -->
            <div class="decorative-lights">
              <div v-for="i in 16" :key="i" class="light" :style="{ transform: `rotate(${i * 22.5}deg)` }"></div>
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
              <div class="reward-content">
                <div class="cartoon-character" :class="reward.character">
                  {{ reward.emoji }}
                </div>
                <div class="reward-text" :style="{ transform: `rotate(-${index * 45}deg)` }">
                  {{ reward.text }}
                </div>
              </div>
            </div>
            
            <!-- 中心圆盘 -->
            <div class="wheel-center">
              <div class="center-text">每日签到</div>
              <div class="center-subtitle">获得流量</div>
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
    
    // 奖励配置 - 卡通风格
    const rewards = ref([
      { 
        text: '10MB', 
        color: '#ff6b6b', 
        value: 10 * 1024 * 1024,
        emoji: '🎁',
        character: 'character-1'
      },
      { 
        text: '20MB', 
        color: '#ffa726', 
        value: 20 * 1024 * 1024,
        emoji: '🎉',
        character: 'character-2'
      },
      { 
        text: '30MB', 
        color: '#ff6b6b', 
        value: 30 * 1024 * 1024,
        emoji: '🎊',
        character: 'character-3'
      },
      { 
        text: '50MB', 
        color: '#ffa726', 
        value: 50 * 1024 * 1024,
        emoji: '🎈',
        character: 'character-4'
      },
      { 
        text: '70MB', 
        color: '#ff6b6b', 
        value: 70 * 1024 * 1024,
        emoji: '🎯',
        character: 'character-5'
      },
      { 
        text: '100MB', 
        color: '#4fc3f7', 
        value: 100 * 1024 * 1024,
        emoji: '🏆',
        character: 'character-6'
      },
      { 
        text: '80MB', 
        color: '#ffa726', 
        value: 80 * 1024 * 1024,
        emoji: '⭐',
        character: 'character-7'
      },
      { 
        text: '60MB', 
        color: '#ff6b6b', 
        value: 60 * 1024 * 1024,
        emoji: '🎪',
        character: 'character-8'
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
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.1);
  border: 8px solid #ff6b6b;
  overflow: hidden;
}

.wheel-background.spinning {
  transform: rotate(1800deg);
}

.decorative-lights {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  z-index: 1;
}

.light {
  position: absolute;
  top: 0;
  left: 50%;
  width: 12px;
  height: 12px;
  background: #ffd700;
  border-radius: 50%;
  transform-origin: 0 144px;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
  animation: twinkle 2s ease-in-out infinite alternate;
}

.light:nth-child(odd) {
  animation-delay: 0.5s;
}

@keyframes twinkle {
  0% { opacity: 0.6; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1.2); }
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: #ff6b6b;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 24px rgba(255, 107, 107, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.2);
  border: 4px solid #ffd700;
  z-index: 3;
}

.center-text {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
  text-align: center;
}

.center-subtitle {
  font-size: 8px;
  font-weight: 600;
  color: #ffd700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  margin-top: 2px;
}

.wheel-pointer {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
}

.pointer-arrow {
  width: 0;
  height: 0;
  border-left: 16px solid transparent;
  border-right: 16px solid transparent;
  border-bottom: 32px solid #ffd700;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3));
  position: relative;
}

.pointer-arrow::after {
  content: '';
  position: absolute;
  top: 4px;
  left: -12px;
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 24px solid #ffffff;
}

.reward-segment {
  position: absolute;
  top: 0;
  left: 50%;
  width: 140px;
  height: 140px;
  transform-origin: 0 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 0 140px 140px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.reward-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transform: translateY(25px);
}

.cartoon-character {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  animation: bounce 2s ease-in-out infinite;
}

.cartoon-character:nth-child(odd) {
  animation-delay: 0.3s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.reward-text {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  letter-spacing: 0.5px;
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
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
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8a80 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 
    0 12px 32px rgba(255, 107, 107, 0.4),
    0 6px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  letter-spacing: 0.5px;
  min-width: 160px;
  border: 3px solid #ffd700;
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
    0 16px 40px rgba(255, 107, 107, 0.5),
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
    width: 240px;
    height: 240px;
  }
  
  .wheel-center {
    width: 70px;
    height: 70px;
  }
  
  .center-text {
    font-size: 10px;
  }
  
  .center-subtitle {
    font-size: 7px;
  }
  
  .reward-segment {
    width: 120px;
    height: 120px;
    transform-origin: 0 120px;
  }
  
  .reward-content {
    transform: translateY(20px);
  }
  
  .cartoon-character {
    font-size: 20px;
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
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 24px solid #ffd700;
  }
  
  .pointer-arrow::after {
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 20px solid #ffffff;
    left: -10px;
  }
}
</style>
