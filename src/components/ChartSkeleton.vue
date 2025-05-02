<template>
  <div class="h-full w-full rounded-lg overflow-hidden bg-[#0F2A5A] shadow-lg flex flex-col items-center justify-center p-4">
    <!-- 顶部加载动画 - 与图表加载动画保持一致 -->
    <div class="loading-dots flex space-x-2 mb-3">
      <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
      <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
      <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
    </div>

    <!-- 骨架线条 - 模拟图表 -->
    <div class="w-full h-[100px] relative overflow-hidden">
      <!-- 背景渐变 -->
      <div class="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-blue-500/5"></div>

      <!-- 模拟图表线条 -->
      <svg class="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
        <!-- 静态路径 -->
        <path
          d="M0,35 Q10,30 20,25 T40,20 T60,15 T80,25 T100,20"
          fill="none"
          stroke="rgba(91, 158, 255, 0.4)"
          stroke-width="2"
        />

        <!-- 动画扫描效果 -->
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(91, 158, 255, 0)" />
          <stop offset="50%" stop-color="rgba(91, 158, 255, 0.5)" />
          <stop offset="100%" stop-color="rgba(91, 158, 255, 0)" />
        </linearGradient>
        <rect x="-100" y="0" width="100" height="40" fill="url(#chartGradient)" opacity="0.5" class="scanning-animation">
        </rect>
      </svg>

      <!-- 模拟图表点 - 减少数量，避免过于繁忙 -->
      <div class="absolute top-1/3 left-1/2 w-2 h-2 rounded-full bg-blue-400/50 animate-pulse"></div>
    </div>

    <!-- 加载文本 -->
    <p class="text-gray-400 text-sm mt-3">{{ loadingText }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps({
  loadingText: {
    type: String,
    default: '正在加载价格数据...'
  }
})
</script>

<style scoped>
/* 脉冲动画 */
@keyframes pulse {
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 0.3;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 扫描动画 */
@keyframes scanning {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.scanning-animation {
  animation: scanning 3s ease-in-out infinite;
}

/* 旋转动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
