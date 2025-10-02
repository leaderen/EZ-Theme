<template>
  <div class="lucky-checkin-container">
    <div class="lucky-checkin-card">
      <div class="card-header">
        <div class="header-content">
          <div class="title-section">
            <div class="title-icon">
              <IconDice :size="24"/>
            </div>
            <div class="title-text">
              <h2 class="card-title">运气签到</h2>
              <p class="card-subtitle">输入流量数值，随机获得或扣除流量</p>
            </div>
          </div>
          <div class="header-badge">
            <IconAlertTriangle :size="16"/>
            <span>有风险</span>
          </div>
        </div>
      </div>
      
      <div class="card-body">
        <!-- 玩法说明 -->
        <div class="game-rules">
          <div class="rules-header">
            <IconInfo :size="18"/>
            <span>玩法说明</span>
          </div>
          <div class="rules-content">
            <div class="rule-item">
              <div class="rule-icon">🎯</div>
              <div class="rule-text">
                <strong>输入范围：</strong>1 到您当前剩余流量
              </div>
            </div>
            <div class="rule-item">
              <div class="rule-icon">🎲</div>
              <div class="rule-text">
                <strong>结果范围：</strong>-输入值 到 +输入值
              </div>
            </div>
            <div class="rule-item">
              <div class="rule-icon">⚠️</div>
              <div class="rule-text">
                <strong>风险提示：</strong>可能获得流量，也可能被扣除流量
              </div>
            </div>
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="input-section">
          <div class="input-group">
            <label class="input-label">输入流量数值</label>
            <div class="input-wrapper">
              <input 
                v-model="inputValue"
                type="number"
                class="traffic-input"
                placeholder="请输入数值"
                :disabled="isSpinning || hasCheckedIn"
                min="1"
                :max="maxInputValue"
              />
              <select 
                v-model="selectedUnit"
                class="unit-select"
                :disabled="isSpinning || hasCheckedIn"
              >
                <option value="MB">MB</option>
                <option value="GB">GB</option>
              </select>
            </div>
            <div class="input-hint">
              最大可输入：{{ formatTraffic(maxInputValue) }}
            </div>
          </div>
        </div>
        
        <!-- 转盘区域 -->
        <div class="wheel-section">
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
                  <IconDice :size="16"/>
                </div>
                <div class="reward-text" :style="{ transform: `rotate(-${index * 45}deg)` }">
                  {{ reward.text }}
                </div>
              </div>
            </div>
            
            <!-- 中心圆盘 -->
            <div class="wheel-center">
              <div class="center-logo">
                <IconDice :size="24"/>
              </div>
              <div class="center-text">运气</div>
            </div>
            
            <!-- 指针 -->
            <div class="wheel-pointer">
              <div class="pointer-arrow"></div>
            </div>
          </div>
        </div>
        
        <!-- 转盘按钮 -->
        <div class="wheel-button-container">
          <button 
            class="wheel-button"
            :class="{ 'disabled': isSpinning || hasCheckedIn || !canSpin }"
            :disabled="isSpinning || hasCheckedIn || !canSpin"
            @click="spinWheel"
          >
            <div class="button-content">
              <IconRefreshCw v-if="isSpinning" :size="20" class="spinning-icon"/>
              <IconDice v-else :size="20"/>
              <span>{{ buttonText }}</span>
            </div>
            <div class="button-glow"></div>
          </button>
        </div>
        
        <!-- 签到状态 -->
        <div v-if="hasCheckedIn" class="checkin-status success">
          <IconCheck :size="16"/>
          <span>今日已进行运气签到</span>
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
import { luckyCheckin } from '@/api/user'
import { 
  IconDice, 
  IconRefreshCw, 
  IconCheck, 
  IconX, 
  IconAlertTriangle,
  IconInfo
} from '@tabler/icons-vue'

export default {
  name: 'LuckyCheckinWheel',
  components: {
    IconDice,
    IconRefreshCw,
    IconCheck,
    IconX,
    IconAlertTriangle,
    IconInfo
  },
  setup() {
    const { t } = useI18n()
    
    // 响应式数据
    const isSpinning = ref(false)
    const hasCheckedIn = ref(false)
    const checkinResult = ref(null)
    const inputValue = ref('')
    const selectedUnit = ref('GB')
    const userTraffic = ref({
      transfer_enable: 0,
      u: 0,
      d: 0
    })
    
    // 奖励配置 - 显示可能的正负结果
    const rewards = ref([
      { 
        text: '-100%', 
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
        value: -1 
      },
      { 
        text: '-50%', 
        gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
        value: -0.5 
      },
      { 
        text: '-25%', 
        gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', 
        value: -0.25 
      },
      { 
        text: '0%', 
        gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', 
        value: 0 
      },
      { 
        text: '+25%', 
        gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
        value: 0.25 
      },
      { 
        text: '+50%', 
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
        value: 0.5 
      },
      { 
        text: '+100%', 
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
        value: 1 
      },
      { 
        text: '+200%', 
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', 
        value: 2 
      }
    ])
    
    // 计算属性
    const maxInputValue = computed(() => {
      const remainingTraffic = userTraffic.value.transfer_enable - (userTraffic.value.u + userTraffic.value.d)
      if (selectedUnit.value === 'GB') {
        return Math.floor(remainingTraffic / (1024 * 1024 * 1024))
      } else {
        return Math.floor(remainingTraffic / (1024 * 1024))
      }
    })
    
    const canSpin = computed(() => {
      const value = parseFloat(inputValue.value)
      return value > 0 && value <= maxInputValue.value
    })
    
    const buttonText = computed(() => {
      if (isSpinning.value) return '转盘中...'
      if (hasCheckedIn.value) return '今日已签到'
      if (!canSpin.value) return '请输入有效数值'
      return '开始运气签到'
    })
    
    // 格式化流量显示
    const formatTraffic = (bytes) => {
      if (bytes >= 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB'
      } else {
        return (bytes / (1024 * 1024)).toFixed(0) + 'MB'
      }
    }
    
    // 转盘旋转
    const spinWheel = async () => {
      if (isSpinning.value || hasCheckedIn.value || !canSpin.value) return
      
      try {
        isSpinning.value = true
        checkinResult.value = null
        
        // 构建输入字符串
        const inputString = inputValue.value + selectedUnit.value
        
        // 执行运气签到
        const response = await luckyCheckin(inputString)
        
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
        console.error('运气签到失败:', error)
        checkinResult.value = {
          success: false,
          message: error.response?.data?.message || '运气签到失败，请重试'
        }
        isSpinning.value = false
      }
    }
    
    // 获取用户流量信息
    const getUserTraffic = async () => {
      try {
        // 这里应该调用API获取用户流量信息
        // 暂时使用模拟数据
        userTraffic.value = {
          transfer_enable: 100 * 1024 * 1024 * 1024, // 100GB
          u: 20 * 1024 * 1024 * 1024, // 已用20GB
          d: 10 * 1024 * 1024 * 1024  // 已用10GB
        }
      } catch (error) {
        console.error('获取用户流量信息失败:', error)
      }
    }
    
    // 检查今日是否已签到
    const checkCheckinStatus = () => {
      // 这里可以调用API检查签到状态
      // 暂时设为false，实际应该从后端获取
      hasCheckedIn.value = false
    }
    
    onMounted(() => {
      getUserTraffic()
      checkCheckinStatus()
    })
    
    return {
      isSpinning,
      hasCheckedIn,
      checkinResult,
      inputValue,
      selectedUnit,
      rewards,
      maxInputValue,
      canSpin,
      buttonText,
      formatTraffic,
      spinWheel
    }
  }
}
</script>

<style scoped>
.lucky-checkin-container {
  margin-bottom: 24px;
}

.lucky-checkin-card {
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

.lucky-checkin-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.15),
    0 15px 30px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.lucky-checkin-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%);
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
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
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
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.game-rules {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.rules-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.rules-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rule-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.rule-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.input-section {
  margin-bottom: 24px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.input-wrapper {
  display: flex;
  gap: 8px;
}

.traffic-input {
  flex: 1;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 16px;
  transition: all 0.3s ease;
}

.traffic-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.traffic-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.unit-select {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.unit-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.unit-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-hint {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.8;
}

.wheel-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.wheel-background {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  transition: transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.2),
    0 8px 16px rgba(0, 0, 0, 0.15),
    inset 0 2px 0 rgba(255, 255, 255, 0.3);
  border: 4px solid rgba(255, 255, 255, 0.4);
}

.wheel-background.spinning {
  transform: rotate(1800deg);
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 3px solid rgba(255, 255, 255, 0.9);
  z-index: 3;
}

.center-logo {
  color: #8b5cf6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}

.center-text {
  font-size: 9px;
  font-weight: 700;
  color: #8b5cf6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.wheel-pointer {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
}

.pointer-arrow {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 20px solid #ef4444;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  position: relative;
}

.pointer-arrow::after {
  content: '';
  position: absolute;
  top: 2px;
  left: -8px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 16px solid #ffffff;
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
  border-radius: 0 0 100px 100px;
  overflow: hidden;
}

.reward-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transform: translateY(15px);
}

.reward-icon {
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.reward-text {
  font-size: 10px;
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
  padding: 16px 32px;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 
    0 12px 32px rgba(139, 92, 246, 0.4),
    0 6px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  letter-spacing: 0.5px;
  min-width: 180px;
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
    0 16px 40px rgba(139, 92, 246, 0.5),
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
  .lucky-checkin-card {
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
  
  .game-rules {
    padding: 16px;
  }
  
  .rules-content {
    gap: 10px;
  }
  
  .rule-text {
    font-size: 13px;
  }
  
  .input-wrapper {
    flex-direction: column;
  }
  
  .wheel-background {
    width: 180px;
    height: 180px;
  }
  
  .wheel-center {
    width: 50px;
    height: 50px;
  }
  
  .center-text {
    font-size: 8px;
  }
  
  .reward-segment {
    width: 90px;
    height: 90px;
    transform-origin: 0 90px;
  }
  
  .reward-content {
    transform: translateY(12px);
  }
  
  .reward-text {
    font-size: 9px;
  }
  
  .wheel-button {
    padding: 14px 28px;
    font-size: 14px;
    min-width: 160px;
  }
  
  .pointer-arrow {
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 16px solid #ef4444;
  }
  
  .pointer-arrow::after {
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 12px solid #ffffff;
    left: -6px;
  }
}
</style>
