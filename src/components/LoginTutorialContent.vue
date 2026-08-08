<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

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
  { label: '注意事项（重要）' },
]

const activeStep = ref(0)
const navVisible = ref(false)
const stepEls = ref([])

const quotaSceneRef = ref(null)
const freePinRef = ref(null)
const debtPinRef = ref(null)
const freeImageRef = ref(null)
const debtImageRef = ref(null)
const wireViewBox = ref('0 0 1 1')
const freeWirePath = ref('')
const debtWirePath = ref('')
const freeWireEnds = ref(null)
const debtWireEnds = ref(null)

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

function pinOnMeterInScene(el, sceneRect) {
  const rect = el.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2 - sceneRect.left,
    // Sit on the bottom edge of the meter track.
    y: rect.top + rect.height / 2 - sceneRect.top,
  }
}

function imageTopInScene(el, sceneRect) {
  const rect = el.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2 - sceneRect.left,
    y: rect.top - sceneRect.top,
  }
}

function buildWirePath(start, end, kind, narrow) {
  const dy = Math.max(end.y - start.y, 1)
  // Sweep sideways first so the stroke clears the annotation stack under the pin.
  const side = kind === 'free' ? -1 : 1
  const clear = narrow
    ? kind === 'free'
      ? 110
      : 72
    : kind === 'free'
      ? 128
      : 84
  const clearX = start.x + side * clear
  const dropY = start.y + Math.min(Math.max(dy * 0.42, 56), dy * 0.62)

  return [
    `M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`,
    `C ${(start.x + side * 18).toFixed(1)} ${(start.y + 6).toFixed(1)}, ${clearX.toFixed(1)} ${(start.y + 18).toFixed(1)}, ${clearX.toFixed(1)} ${dropY.toFixed(1)}`,
    `S ${(end.x + side * 12).toFixed(1)} ${(end.y - 18).toFixed(1)}, ${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
  ].join(' ')
}

function updateQuotaWires() {
  const scene = quotaSceneRef.value
  const freePin = freePinRef.value
  const debtPin = debtPinRef.value
  const freeImage = freeImageRef.value
  const debtImage = debtImageRef.value
  if (!scene || !freePin || !debtPin || !freeImage || !debtImage) {
    return
  }

  const sceneRect = scene.getBoundingClientRect()
  if (sceneRect.width <= 0 || sceneRect.height <= 0) {
    return
  }

  wireViewBox.value = `0 0 ${sceneRect.width} ${sceneRect.height}`
  const narrow = window.innerWidth <= 640
  const freeStart = pinOnMeterInScene(freePin, sceneRect)
  const debtStart = pinOnMeterInScene(debtPin, sceneRect)
  const freeEnd = imageTopInScene(freeImage, sceneRect)
  const debtEnd = imageTopInScene(debtImage, sceneRect)
  freeWirePath.value = buildWirePath(freeStart, freeEnd, 'free', narrow)
  debtWirePath.value = buildWirePath(debtStart, debtEnd, 'debt', narrow)
  freeWireEnds.value = { start: freeStart, end: freeEnd }
  debtWireEnds.value = { start: debtStart, end: debtEnd }
}

function handleResize() {
  updateQuotaWires()
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize)
  handleScroll()
  await nextTick()
  updateQuotaWires()
  window.requestAnimationFrame(updateQuotaWires)
  ;[freeImageRef.value, debtImageRef.value].forEach((img) => {
    if (!img) return
    if (img.complete) return
    img.addEventListener('load', updateQuotaWires, { once: true })
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
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
            href="https://university.aliyun.com"
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

    <section
      class="login-guide-quota"
      :ref="(el) => setStepRef(el, 3)"
      data-step="3"
      aria-label="免费额度与欠款说明"
    >
      <div class="login-guide-quota__divider" aria-hidden="true" />
      <h3 class="login-guide-quota__title">
        <span class="login-guide__marker">关于免费额度、付费额度与欠款</span>
      </h3>
      <p class="login-guide-quota__lead">
        <span>添加 KEY 后不用管任何短信、任何事</span>
      </p>
      <div class="login-guide-quota__copy">
        <p>
          <strong>免费额度</strong>：每个模型自带的免费调用额度。快耗尽时，阿里云会发短信提醒即将转入按量付费。<strong class="login-guide-quota__warn-inline">此时千万不要进行任何操作！</strong>
        </p>
        <p>
          <strong>付费额度</strong>：学生优惠券等抵扣的是付费额度，不是上面的免费额度。本站变现主要消耗的是优惠券对应的付费额度。
        </p>
        <p>
          <strong>欠款</strong>：按量付费后若账户余额不足，会出现欠费并停止百炼推理服务，你可以在券额度消耗将尽时删除KEY，防止欠款。这个欠款其实无关紧要，阿里云账号与支付宝独立，不会强制扣款，不会对你支付宝造成任何影响，并且欠款额度一般只在2-3块。
        </p>
      </div>

      <div ref="quotaSceneRef" class="login-guide-quota__scene">
        <div class="login-guide-quota__meter" aria-label="额度消耗进度示意">
          <div class="login-guide-quota__meter-track" role="presentation">
            <div class="login-guide-quota__meter-seg is-free" style="--seg-width: 28%">
              <span>免费额度</span>
            </div>
            <div class="login-guide-quota__meter-seg is-paid" style="--seg-width: 40%">
              <span>付费额度（优惠券）</span>
            </div>
            <div class="login-guide-quota__meter-seg is-debt" style="--seg-width: 16%">
              <span>欠款</span>
            </div>
            <div class="login-guide-quota__meter-seg is-key" style="--seg-width: 16%">
              <span>KEY无法使用</span>
            </div>
          </div>

          <div class="login-guide-quota__pins" aria-hidden="true">
            <span class="login-guide-quota__pin is-free" style="--pin-left: 28%">
              <i ref="freePinRef" class="login-guide-quota__wire-anchor" />
              <em>免费额度将尽</em>
              <strong class="login-guide-quota__warn">千万不要进行任何操作！</strong>
            </span>
            <span class="login-guide-quota__pin is-paid" style="--pin-left: 68%">
              <em class="is-wrap">开始消耗账户余额<br />（此时随时可以删除KEY，<br />我们也建议你删除）</em>
            </span>
            <span class="login-guide-quota__pin is-debt" style="--pin-left: 84%">
              <i ref="debtPinRef" class="login-guide-quota__wire-anchor" />
              <em>达到欠款</em>
            </span>
          </div>
        </div>

        <svg
          class="login-guide-quota__wires"
          :viewBox="wireViewBox"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            v-if="freeWirePath"
            class="login-guide-quota__wire"
            :d="freeWirePath"
            fill="none"
          />
          <path
            v-if="debtWirePath"
            class="login-guide-quota__wire"
            :d="debtWirePath"
            fill="none"
          />
          <template v-if="freeWireEnds">
            <circle
              class="login-guide-quota__wire-dot"
              :cx="freeWireEnds.start.x"
              :cy="freeWireEnds.start.y"
              r="3.25"
            />
            <circle
              class="login-guide-quota__wire-dot"
              :cx="freeWireEnds.end.x"
              :cy="freeWireEnds.end.y"
              r="3.25"
            />
          </template>
          <template v-if="debtWireEnds">
            <circle
              class="login-guide-quota__wire-dot"
              :cx="debtWireEnds.start.x"
              :cy="debtWireEnds.start.y"
              r="3.25"
            />
            <circle
              class="login-guide-quota__wire-dot"
              :cx="debtWireEnds.end.x"
              :cy="debtWireEnds.end.y"
              r="3.25"
            />
          </template>
        </svg>

        <div class="login-guide-quota__figures">
          <figure class="login-guide-quota__figure is-free">
            <img
              ref="freeImageRef"
              class="login-guide-quota__image"
              src="/aliyun-free-quota-warning.png"
              alt="阿里云短信：免费额度即将耗尽提醒"
            />
            <figcaption>免费额度快要消耗光时</figcaption>
          </figure>
          <figure class="login-guide-quota__figure is-debt">
            <img
              ref="debtImageRef"
              class="login-guide-quota__image"
              src="/aliyun-arrears-notice.png"
              alt="阿里云短信：百炼服务因欠费已停止"
            />
            <figcaption>达到欠款、服务已停止时</figcaption>
          </figure>
        </div>
      </div>
    </section>
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
  font-size: 14px;
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
  width: min(100%, 820px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  margin-top: 18px;
}

.login-guide-pair__image {
  display: block;
  width: 100%;
  max-width: 360px;
  height: auto;
  margin-inline: auto;
  object-fit: contain;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
}

.login-guide-pair__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  color: #9ca3af;
}

.login-guide-pair__arrow svg {
  display: block;
  width: 40px;
  height: 40px;
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
  font-size: 14px;
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
  font-size: 14px;
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
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  font-weight: 400;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
}

.login-guide-quota {
  width: min(100%, 1120px);
  margin-top: 72px;
  margin-bottom: 24px;
  display: grid;
  gap: 20px;
}

.login-guide-quota__divider {
  width: 100%;
  height: 0;
  border: 0;
  border-top: 1px solid var(--border-color, rgba(15, 23, 42, 0.12));
}

.login-guide-quota__title {
  margin: 0;
  text-align: center;
  font-size: 24px;
  line-height: 1.45;
  color: var(--text-primary);
  font-family: var(--font-cjk-serif);
  font-weight: 400;
}

.login-guide-quota__lead {
  margin: -2px auto 0;
  max-width: 760px;
  display: flex;
  justify-content: center;
  text-align: center;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
}

.login-guide-quota__lead span {
  position: relative;
  display: inline-block;
  max-width: 100%;
  padding: 8px 28px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    hsla(19, 69.9%, 40.4%, 0.08) 22%,
    hsla(19, 69.9%, 40.4%, 0.08) 78%,
    transparent 100%
  );
  color: hsl(19, 69.9%, 34%);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.6;
}

.login-guide-quota__lead span::before,
.login-guide-quota__lead span::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 22px;
  height: 1px;
  background: linear-gradient(90deg, transparent, hsla(19, 69.9%, 40.4%, 0.45));
}

.login-guide-quota__lead span::before {
  left: 4px;
  transform: translate(-100%, -50%);
}

.login-guide-quota__lead span::after {
  right: 4px;
  transform: translate(100%, -50%) scaleX(-1);
}

.login-guide-quota__copy {
  display: grid;
  gap: 12px;
  max-width: 760px;
  margin: 0 auto;
  text-align: left;
}

.login-guide-quota__copy p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
}

.login-guide-quota__copy strong {
  color: var(--text-primary);
  font-weight: 600;
}

.login-guide-quota__copy strong.login-guide-quota__warn-inline {
  margin-left: 4px;
  color: #c62828;
  font-weight: 700;
}

.login-guide-quota__scene {
  position: relative;
  width: min(100%, 820px);
  margin: 18px auto 0;
  display: grid;
  gap: 0;
  overflow: visible;
}

.login-guide-quota__meter {
  position: relative;
  z-index: 1;
  width: 100%;
  display: grid;
  gap: 0;
  padding-bottom: 72px;
}

.login-guide-quota__meter-track {
  position: relative;
  display: flex;
  width: 100%;
  height: 30px;
  overflow: hidden;
  border-radius: 8px;
  background: #f3f4f6;
  border: 1px solid rgba(15, 23, 42, 0.08);
  mask-image: linear-gradient(90deg, #000 0%, #000 86%, rgba(0, 0, 0, 0.55) 94%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 86%, rgba(0, 0, 0, 0.55) 94%, transparent 100%);
}

.login-guide-quota__meter-seg {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--seg-width);
  min-width: 0;
  padding: 0 8px;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
}

.login-guide-quota__meter-seg span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-guide-quota__meter-seg.is-free {
  background: #e8eef8;
  color: #4b6285;
}

.login-guide-quota__meter-seg.is-paid {
  background: hsla(19, 69.9%, 40.4%, 0.14);
  color: hsl(19, 69.9%, 34%);
  box-shadow: inset 1px 0 0 rgba(15, 23, 42, 0.06);
}

.login-guide-quota__meter-seg.is-debt {
  background: #f3e8e8;
  color: #8f4a4a;
  box-shadow: inset 1px 0 0 rgba(15, 23, 42, 0.06);
}

.login-guide-quota__meter-seg.is-key {
  background: linear-gradient(90deg, #efe0e0 0%, rgba(239, 224, 224, 0.45) 55%, rgba(239, 224, 224, 0) 100%);
  color: #8f4a4a;
  box-shadow: inset 1px 0 0 rgba(15, 23, 42, 0.06);
}

.login-guide-quota__meter-seg.is-key span {
  opacity: 0.72;
}

.login-guide-quota__pins {
  position: absolute;
  left: 0;
  right: 0;
  top: 30px;
  height: 0;
  z-index: 5;
  pointer-events: none;
}

.login-guide-quota__pin {
  position: absolute;
  left: var(--pin-left);
  top: 0;
  transform: translateX(-50%);
  display: grid;
  justify-items: center;
  gap: 2px;
}

.login-guide-quota__pin i,
.login-guide-quota__wire-anchor {
  width: 1px;
  height: 1px;
  margin-top: -4px;
  border-radius: 999px;
  background: transparent;
  border: 0;
  opacity: 0;
}

.login-guide-quota__pin em {
  margin-top: 2px;
  font-style: normal;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  color: var(--text-secondary);
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
}

.login-guide-quota__pin em.is-wrap {
  white-space: normal;
  max-width: 240px;
  text-align: center;
  line-height: 1.4;
}

.login-guide-quota__warn {
  margin-top: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, hsla(4, 78%, 48%, 0.12), hsla(4, 78%, 48%, 0.06));
  border: 1px solid hsla(4, 78%, 48%, 0.28);
  color: #c62828;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.35;
  white-space: nowrap;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
  box-shadow: 0 0 0 0 hsla(4, 78%, 48%, 0.35);
  animation: quota-warn-pulse 1.8s ease-in-out infinite;
}

@keyframes quota-warn-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 hsla(4, 78%, 48%, 0.28);
  }
  50% {
    box-shadow: 0 0 0 4px hsla(4, 78%, 48%, 0);
  }
}

.login-guide-quota__wires {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.login-guide-quota__wire {
  stroke: #8b5a3c;
  stroke-width: 1.5;
  stroke-dasharray: 5 4.5;
  stroke-linecap: butt;
  opacity: 0.9;
}

.login-guide-quota__wire-dot {
  fill: #8b5a3c;
}

.login-guide-quota__figures {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 240px));
  justify-content: space-between;
  gap: 20px;
  margin-top: 72px;
  padding: 0 4%;
}

.login-guide-quota__figure {
  margin: 0;
  display: grid;
  gap: 10px;
  justify-items: center;
}

.login-guide-quota__figure.is-free {
  justify-self: start;
}

.login-guide-quota__figure.is-debt {
  justify-self: end;
}

.login-guide-quota__image {
  display: block;
  width: 100%;
  max-width: 220px;
  height: auto;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.1);
  background: #111;
}

.login-guide-quota__figure figcaption {
  margin: 0;
  text-align: center;
  font-size: 14px;
  line-height: 1.45;
  color: var(--text-secondary);
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
    font-size: 14px;
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
    font-size: 14px;
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
    font-size: 14px;
    line-height: 1.6;
  }

  .login-guide-quota {
    margin-top: 36px;
    gap: 16px;
  }

  .login-guide-quota__title {
    font-size: 22px;
  }

  .login-guide-quota__lead span {
    padding: 8px 12px;
    letter-spacing: 0.02em;
    font-size: 14px;
  }

  .login-guide-quota__lead span::before,
  .login-guide-quota__lead span::after {
    display: none;
  }

  .login-guide-quota__copy {
    text-align: center;
  }

  .login-guide-quota__scene {
    width: min(100%, 420px);
  }

  .login-guide-quota__meter-seg {
    font-size: 11px;
    padding: 0 4px;
  }

  .login-guide-quota__pin em {
    font-size: 11px;
  }

  .login-guide-quota__pin em.is-wrap {
    max-width: 200px;
    font-size: 10px;
  }

  .login-guide-quota__warn {
    font-size: 11px;
    padding: 2px 6px;
  }

  .login-guide-quota__meter {
    padding-bottom: 72px;
  }

  .login-guide-quota__figures {
    grid-template-columns: minmax(0, 220px);
    justify-content: center;
    gap: 48px;
    margin-top: 28px;
    padding: 0;
  }

  .login-guide-quota__figure.is-free,
  .login-guide-quota__figure.is-debt {
    justify-self: center;
  }

  .login-guide-quota__image {
    max-width: 200px;
  }
}
</style>
