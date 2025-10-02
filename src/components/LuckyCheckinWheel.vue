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
              <div class="center-text">运气签到</div>
              <div class="center-subtitle">有风险</div>
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
    
    // 奖励配置 - 卡通风格的正负结果
    const rewards = ref([
      { 
        text: '-100%', 
        color: '#ef4444', 
        value: -1,
        emoji: '😢',
        character: 'character-1'
      },
      { 
        text: '-50%', 
        color: '#f97316', 
        value: -0.5,
        emoji: '😟',
        character: 'character-2'
      },
      { 
        text: '-25%', 
        color: '#eab308', 
        value: -0.25,
        emoji: '😐',
        character: 'character-3'
      },
      { 
        text: '0%', 
        color: '#6b7280', 
        value: 0,
        emoji: '😶',
        character: 'character-4'
      },
      { 
        text: '+25%', 
        color: '#22c55e', 
        value: 0.25,
        emoji: '😊',
        character: 'character-5'
      },
      { 
        text: '+50%', 
        color: '#3b82f6', 
        value: 0.5,
        emoji: '😄',
        character: 'character-6'
      },
      { 
        text: '+100%', 
        color: '#8b5cf6', 
        value: 1,
        emoji: '🎉',
        character: 'character-7'
      },
      { 
        text: '+200%', 
        color: '#ec4899', 
        value: 2,
        emoji: '🏆',
        character: 'character-8'
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
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.1);
  border: 8px solid #8b5cf6;
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
  width: 10px;
  height: 10px;
  background: #ffd700;
  border-radius: 50%;
  transform-origin: 0 124px;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
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
  width: 70px;
  height: 70px;
  background: #8b5cf6;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 24px rgba(139, 92, 246, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.2);
  border: 4px solid #ffd700;
  z-index: 3;
}

.center-text {
  font-size: 10px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
  text-align: center;
}

.center-subtitle {
  font-size: 7px;
  font-weight: 600;
  color: #ffd700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  margin-top: 2px;
}

.wheel-pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
}

.pointer-arrow {
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-bottom: 28px solid #ffd700;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3));
  position: relative;
}

.pointer-arrow::after {
  content: '';
  position: absolute;
  top: 4px;
  left: -11px;
  width: 0;
  height: 0;
  border-left: 11px solid transparent;
  border-right: 11px solid transparent;
  border-bottom: 22px solid #ffffff;
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
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.reward-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transform: translateY(20px);
}

.cartoon-character {
  font-size: 20px;
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
  font-size: 11px;
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
  padding: 16px 32px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
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
    width: 200px;
    height: 200px;
  }
  
  .wheel-center {
    width: 60px;
    height: 60px;
  }
  
  .center-text {
    font-size: 9px;
  }
  
  .center-subtitle {
    font-size: 6px;
  }
  
  .reward-segment {
    width: 100px;
    height: 100px;
    transform-origin: 0 100px;
  }
  
  .reward-content {
    transform: translateY(15px);
  }
  
  .cartoon-character {
    font-size: 16px;
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
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 20px solid #ffd700;
  }
  
  .pointer-arrow::after {
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 16px solid #ffffff;
    left: -8px;
  }
}
</style>
