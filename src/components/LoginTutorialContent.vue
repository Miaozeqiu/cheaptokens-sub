<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const activeCarouselIndex = ref(0)

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

const steps = [
  { label: '领取学生优惠券' },
  { label: '创建 API_KEY' },
  { label: '填入网站' },
]

const activeStep = ref(0)
const navVisible = ref(false)
const stepEls = ref([])

function setStepRef(el, index) {
  if (el) {
    stepEls.value[index] = el
  }
}

function updateActiveStep() {
  const docEl = document.documentElement
  const scrollBottom = window.scrollY + window.innerHeight
  if (scrollBottom >= docEl.scrollHeight - 8) {
    activeStep.value = steps.length - 1
    return
  }
  const threshold = window.innerHeight * 0.4
  let current = 0
  stepEls.value.forEach((el, i) => {
    if (!el) {
      return
    }
    if (el.getBoundingClientRect().top <= threshold) {
      current = i
    }
  })
  activeStep.value = current
}

function handleScroll() {
  navVisible.value = window.scrollY > 280
  updateActiveStep()
}

function scrollToStep(index) {
  const el = stepEls.value[index]
  if (!el) {
    return
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

function selectCarouselItem(index) {
  if (index < 0 || index >= carouselImages.length) {
    return
  }
  activeCarouselIndex.value = index
}

</script>

<template>
  <div class="login-tutorial">
    <nav class="login-tutorial__nav" :class="{ 'is-visible': navVisible }" aria-label="步骤导航">
      <button
        v-for="(step, index) in steps"
        :key="index"
        type="button"
        class="login-tutorial__nav-item"
        :class="{ 'is-active': activeStep === index }"
        @click="scrollToStep(index)"
      >
        <span class="login-tutorial__nav-num">{{ index + 1 }}</span>
        <span class="login-tutorial__nav-label">{{ step.label }}</span>
      </button>
    </nav>
    <p class="login-tutorial__intro">
      阿里云赠送了学生300的优惠券，领取后可以按照下面的步骤进行变现
    </p>
    <div class="login-guide" :ref="(el) => setStepRef(el, 0)" data-step="0">
      <img
        class="login-guide__image"
        src="/aliyun-student-coupon.png"
        alt="阿里云学生优惠券领取页面截图"
      />
      <div class="login-guide__content">
        <p class="login-guide__text"><span class="login-guide__marker">1. 领取阿里云学生优惠券</span></p>
        <p class="login-guide__desc">
          <a
            class="login-guide__link"
            href="https://www.cheaptokens.shop/aff"
            target="_blank"
            rel="noopener noreferrer"
          >阿里云活动链接</a>
          <br>需要注意的是，每个模型有免费额度，而优惠券抵扣的额度，实际上是付费额度。
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

    <div class="login-guide login-guide--secondary" :ref="(el) => setStepRef(el, 1)" data-step="1">
      <img
        class="login-guide__image"
        src="/aliyun-api-key-guide.png"
        alt="阿里云百炼平台创建 API KEY 的页面截图"
      />
      <div class="login-guide__content">
        <p class="login-guide__text"><span class="login-guide__marker">2. 在此处创建一个API_KEY</span></p>
        <p class="login-guide__desc">
          进入<a
            class="login-guide__link"
            href="https://bailian.console.aliyun.com/cn-beijing?tab=model#/model-market"
            target="_blank"
            rel="noopener noreferrer"
          >阿里云百炼平台</a>，通过右上角的齿轮，进入API KEY的设置，创建一个KEY，业务空间选择默认即可。
        </p>
      </div>
    </div>

    <div class="login-guide-step" :ref="(el) => setStepRef(el, 2)" data-step="2">
      <p class="login-guide-step__title"><span class="login-guide__marker">3. 将API_KEY 与 API_HOST填入网站</span></p>
      <p class="login-guide-step__desc">网站会将你的tokens通过API调用的方式，分享给有需要的人</p>
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
  </div>
</template>

<style scoped>
.login-tutorial {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-tutorial__nav {
  position: fixed;
  left: 28px;
  top: 50%;
  transform: translateY(-50%) translateX(-12px);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.32s ease, transform 0.32s ease;
}

.login-tutorial__nav.is-visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-50%) translateX(0);
}

.login-tutorial__nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  border-radius: 0;
  cursor: pointer;
  transition: color 0.2s ease;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
}

.login-tutorial__nav-item:hover {
  background: transparent;
}

.login-tutorial__nav-item:hover .login-tutorial__nav-num,
.login-tutorial__nav-item:hover .login-tutorial__nav-label {
  color: var(--text-primary, #0f172a);
}

.login-tutorial__nav-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 0;
  background: transparent;
  color: #9ca3af;
  font-size: 15px;
  font-weight: 600;
  transition: color 0.2s ease, text-shadow 0.2s ease;
}

.login-tutorial__nav-label {
  font-size: 13px;
  line-height: 1.4;
  color: #9ca3af;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.login-tutorial__nav-item.is-active .login-tutorial__nav-num {
  color: hsl(19, 69.9%, 40.4%);
  text-shadow: 0 0 8px hsla(19, 69.9%, 40.4%, 0.85), 0 0 18px hsla(19, 69.9%, 40.4%, 0.45);
}

.login-tutorial__nav-item.is-active .login-tutorial__nav-label {
  color: hsl(19, 69.9%, 40.4%);
  font-weight: 600;
}

.login-tutorial__intro {
  margin: 0 0 24px;
  padding: 16px 24px;
  text-align: center;
  font-size: 22px;
  line-height: 1.6;
  font-weight: 400;
  color: hsl(19, 69.9%, 40.4%);
  background: hsla(19, 69.9%, 40.4%, 0.1);
  border-radius: 12px;
  font-family: -apple-system, 'Noto Sans', 'miui', 'SF Pro Text', sans-serif, 'PingFang SC', 'Lantinghei SC', 'Microsoft Yahei', 'Hiragino Sans GB', 'Microsoft Sans Serif', 'WenQuanYi Micro Hei';
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
  margin-top: 18px;
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
  gap: 14px;
  margin-top: 72px;
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
  line-height: 1.6;
  color: var(--text-secondary);
  font-weight: 400;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
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

.login-guide__marker {
  display: inline;
  padding: 0 8px;
  background-image: linear-gradient(
    100deg,
    rgba(255, 233, 95, 0) 2%,
    rgba(255, 233, 95, 0.6) 13%,
    rgba(255, 233, 95, 0.6) 87%,
    rgba(255, 233, 95, 0) 98%
  );
  background-size: 100% 0.55em;
  background-position: 0 78%;
  background-repeat: no-repeat;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

.login-guide__desc {
  margin: 0;
  padding-left: 16px;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-secondary);
  font-weight: 400;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
}

.login-guide__link {
  color: rgb(3, 169, 244);
  text-decoration: underline;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif;
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
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-secondary);
  font-weight: 400;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
}

@media (max-width: 1100px) {
  .login-tutorial__nav-label {
    display: none;
  }

  .login-tutorial__nav {
    left: 16px;
    padding: 10px 6px;
    gap: 10px;
  }
}

@media (max-width: 640px) {
  .login-tutorial__nav {
    display: none;
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
    margin-top: 14px;
  }

  .login-guide-pair__image {
    height: auto;
  }

  .login-guide-pair__arrow {
    width: 100%;
    transform: rotate(90deg);
  }

  .login-guide-step {
    margin-top: 16px;
    gap: 10px;
  }

  .login-guide-step__title {
    font-size: 22px;
    text-align: center;
  }

  .login-guide-step__desc {
    font-size: 16px;
    line-height: 1.75;
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
    padding-left: 0;
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
    line-height: 1.6;
  }
}
</style>
