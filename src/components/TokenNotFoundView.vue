<template>
  <div class="flex flex-col items-center justify-center h-full text-center px-4">
    <div class="mb-6">
      <i class="ri-database-2-line text-5xl text-yellow-500"></i>
    </div>
    <h2 class="text-xl font-semibold text-white mb-2">{{ formattedSymbol }} 数据未找到</h2>
    <p class="text-gray-300 mb-6">该代币尚未在我们的数据库中，点击下方按钮获取最新数据</p>
    
    <button
      class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium mb-4 w-full max-w-xs transition-colors duration-200 flex items-center justify-center"
      @click="handleRefresh"
      :disabled="isRefreshingLocal || isRefreshingExternal"
    >
      <span v-if="isRefreshingLocal || isRefreshingExternal" class="flex items-center justify-center">
        <span class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
        正在获取最新市场数据...
      </span>
      <span v-else class="flex items-center justify-center">
        <i class="ri-refresh-line mr-2"></i>
        获取最新市场数据
      </span>
    </button>
    
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  symbol: string
  isRefreshing?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

// 计算属性：格式化显示的交易对符号
const formattedSymbol = computed(() => {
  // 如果已经包含USDT后缀，则直接返回
  if (props.symbol.toUpperCase().endsWith('USDT')) {
    return props.symbol
  }
  // 否则添加USDT后缀
  return `${props.symbol}/USDT`
})

const isRefreshingLocal = ref(false)
const showHelp = ref(true)

// 当外部刷新状态变化时，更新本地状态
watch(() => props.isRefreshing, (newVal) => {
  if (newVal === false) {
    // 如果外部刷新完成，也重置本地状态
    isRefreshingLocal.value = false
  }
})

const handleRefresh = () => {
  isRefreshingLocal.value = true
  emit('refresh')
  
  // 超时处理：如果60秒后仍在刷新状态，则重置
  setTimeout(() => {
    isRefreshingLocal.value = false
  }, 60000)
}

// 计算属性，表示是否正在刷新（本地或外部）
const isRefreshingExternal = computed(() => props.isRefreshing === true)
</script>
