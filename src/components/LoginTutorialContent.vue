<script setup>
import lottie from 'lottie-web'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const authAnimationRef = ref(null)
const activeCarouselIndex = ref(0)
let authAnimationInstance = null

const carouselImages = [
  {
    src: '/aliyun-coupon-check-step-1.png',
    alt: '阿里云页面中查看领券入口的截图',
  },
  {
    src: '/aliyun-coupon-check-step-2.png',
    alt: '阿里云卡券页面中查看 300 元优惠券的截图',
  },
]

function initAuthAnimation() {
  if (!authAnimationRef.value || authAnimationInstance) {
    return
  }
  authAnimationInstance = lottie.loadAnimation({
    container: authAnimationRef.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: '/blue-working-cat-animation.json',
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid meet',
    },
  })
}

function destroyAuthAnimation() {
  authAnimationInstance?.destroy()
  authAnimationInstance = null
}

function selectCarouselItem(index) {
  if (index < 0 || index >= carouselImages.length) {
    return
  }
  activeCarouselIndex.value = index
}

onMounted(() => {
  initAuthAnimation()
})

onBeforeUnmount(() => {
  destroyAuthAnimation()
})
</script>

<template>
  <div class="login-tutorial">
    <div class="login-animation" aria-hidden="true">
      <div ref="authAnimationRef" class="login-animation__canvas" />
      <p class="login-animation__caption">分享你的Tokens给其他人</p>
    </div>

    <div class="login-guide">
      <img
        class="login-guide__image"
        src="/aliyun-student-coupon.png"
        alt="阿里云学生优惠券领取页面截图"
      />
      <div class="login-guide__content">
        <p class="login-guide__text">1. 领取阿里云学生优惠券</p>
        <p class="login-guide__desc">
          阿里云赠送了学生300的优惠券，这个优惠券可以当作余额使用。在消耗Tokens时，优惠券额度会实时抵扣。需要注意的是，每个模型有免费额度，而优惠券抵扣的额度，实际上是付费额度。
        </p>
      </div>
    </div>

    <section class="login-guide-carousel" aria-label="优惠券领取检查示意图">
      <div
        class="login-guide-carousel__stage"
        :class="`is-active-${activeCarouselIndex}`"
      >
        <button
          v-for="(image, index) in carouselImages"
          :key="image.src"
          type="button"
          class="login-guide-carousel__item"
          :class="{ 'is-active': activeCarouselIndex === index }"
          @click="selectCarouselItem(index)"
        >
          <span class="login-guide-carousel__media">
            <img
              class="login-guide-carousel__image"
              :src="image.src"
              :alt="image.alt"
            />
          </span>
        </button>
      </div>
      <p class="login-guide-carousel__caption">可以通过这里，检查券是否领取完成</p>
    </section>

    <div class="login-guide login-guide--secondary">
      <img
        class="login-guide__image"
        src="/aliyun-api-key-guide.png"
        alt="阿里云百炼平台创建 API KEY 的页面截图"
      />
      <div class="login-guide__content">
        <p class="login-guide__text">2. 在此处创建一个API_KEY</p>
        <p class="login-guide__desc">
          进入阿里云百炼平台，通过右上角的齿轮，进入API KEY的设置，创建一个KEY，业务空间选择默认即可。
        </p>
      </div>
    </div>

    <div class="login-guide-pair">
      <img
        class="login-guide-pair__image"
        src="/aliyun-key-created-result.png"
        alt="创建后显示 API Key 与 API Host 的结果截图"
      />
      <div class="login-guide-pair__arrow" aria-hidden="true">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path d="M332.501333 183.168a42.666667 42.666667 0 0 1 57.621334-2.496l2.709333 2.496 298.666667 298.666667a42.666667 42.666667 0 0 1 2.496 57.621333l-2.496 2.709333-298.666667 298.666667a42.666667 42.666667 0 0 1-62.826667-57.621333l2.496-2.709334L600.96 512 332.501333 243.498667a42.666667 42.666667 0 0 1-2.496-57.621334l2.496-2.709333z" fill="currentColor" />
        </svg>
      </div>
      <img
        class="login-guide-pair__image"
        src="/aliyun-key-form-fields.png"
        alt="填写 API Key 与 API Host 的表单截图"
      />
    </div>

    <div class="login-guide-step">
      <p class="login-guide-step__title">3. 将API_KEY 与 API_HOST填入网站</p>
      <p class="login-guide-step__desc">网站会将你的tokens通过API调用的方式，分享给有需要的人</p>
    </div>
  </div>
</template>

<style scoped>
.login-tutorial {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-animation {
  width: min(100%, 520px);
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  pointer-events: none;
}

.login-animation__canvas {
  width: 100%;
  height: clamp(220px, 28vw, 320px);
  position: relative;
  z-index: 0;
}

.login-animation__caption {
  margin: 0;
  text-align: center;
  font-size: 64px;
  font-weight: 900;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
  line-height: 1.4;
  font-family: var(--font-cjk-serif);
  position: relative;
  z-index: 1;
}

.login-guide {
  width: min(100%, 900px);
  display: grid;
  grid-template-columns: minmax(0, 1.72fr) minmax(220px, 0.9fr);
  align-items: center;
  gap: 24px;
  margin-top: 8px;
}

.login-guide--secondary {
  margin-top: 18px;
}

.login-guide-pair {
  width: min(100%, 1120px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 22px;
  margin-top: 72px;
}

.login-guide-pair__image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
}

.login-guide-pair__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  color: #9ca3af;
}

.login-guide-pair__arrow svg {
  display: block;
  width: 52px;
  height: 52px;
}

.login-guide-step {
  width: min(100%, 1120px);
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.login-guide-step__title,
.login-guide-step__desc {
  margin: 0;
  text-align: center;
}

.login-guide-step__title {
  font-size: 24px;
  line-height: 1.45;
  color: var(--text-primary);
  font-family: var(--font-cjk-serif);
}

.login-guide-step__desc {
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.login-guide__image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.1);
}

.login-guide__content {
  display: grid;
  gap: 14px;
}

.login-guide__text {
  margin: 0;
  font-size: 24px;
  line-height: 1.45;
  color: var(--text-primary);
  font-family: var(--font-cjk-serif);
}

.login-guide__desc {
  margin: 0;
  font-size: 18px;
  line-height: 1.8;
  color: var(--text-secondary);
  font-family: var(--font-cjk-serif);
}

.login-guide-carousel {
  width: min(100%, 920px);
  margin-top: 32px;
  margin-bottom: 64px;
  display: grid;
  gap: 2px;
}

.login-guide-carousel__stage {
  display: grid;
  grid-template-columns: minmax(0, 0.74fr) minmax(0, 1.26fr);
  align-items: flex-end;
  gap: 20px;
  height: clamp(320px, 44vw, 460px);
  box-sizing: border-box;
  padding: 28px 0 6px;
  transition: grid-template-columns 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.login-guide-carousel__stage.is-active-0 {
  grid-template-columns: minmax(0, 1.42fr) minmax(0, 0.58fr);
}

.login-guide-carousel__stage.is-active-1 {
  grid-template-columns: minmax(0, 0.58fr) minmax(0, 1.42fr);
}

.login-guide-carousel__item {
  width: 100%;
  margin: 0;
  align-self: end;
  border: 0;
  background: transparent;
  transition:
    opacity 0.24s ease,
    filter 0.24s ease,
    margin 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0.56;
  filter: saturate(0.88);
  margin-top: 72px;
}

.login-guide-carousel__item.is-active {
  opacity: 1;
  filter: saturate(1);
  margin-top: 0;
}

.login-guide-carousel__media {
  display: block;
  width: 100%;
  aspect-ratio: 2055 / 1248;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
}

.login-guide-carousel__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-guide-carousel__caption {
  margin: 0;
  text-align: center;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
  font-family: var(--font-cjk-sans);
}

@media (max-width: 640px) {
  .login-animation {
    width: min(100%, 420px);
    margin-top: 6px;
    gap: 10px;
  }

  .login-animation__caption {
    font-size: 26px;
  }

  .login-guide {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 6px;
  }

  .login-guide--secondary {
    margin-top: 14px;
  }

  .login-guide-pair {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 16px;
  }

  .login-guide-pair__image {
    height: auto;
  }

  .login-guide-pair__arrow {
    width: 100%;
    transform: rotate(90deg);
  }

  .login-guide-step {
    margin-top: 14px;
    gap: 8px;
  }

  .login-guide-step__title {
    font-size: 22px;
  }

  .login-guide-step__desc {
    font-size: 15px;
    text-align: center;
  }

  .login-guide__text {
    font-size: 22px;
    text-align: center;
  }

  .login-guide__content {
    gap: 10px;
  }

  .login-guide__desc {
    font-size: 16px;
    line-height: 1.75;
    text-align: center;
  }

  .login-guide-carousel {
    margin-top: 12px;
    gap: 10px;
  }

  .login-guide-carousel__stage,
  .login-guide-carousel__stage.is-active-0,
  .login-guide-carousel__stage.is-active-1 {
    grid-template-columns: 1fr;
    gap: 12px;
    height: auto;
    padding: 10px 0 18px;
  }

  .login-guide-carousel__item {
    height: auto;
    opacity: 0.9;
  }

  .login-guide-carousel__item.is-active {
    opacity: 1;
  }

  .login-guide-carousel__caption {
    font-size: 16px;
    line-height: 1.45;
  }
}
</style>
