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
  { label: '领取学生优惠券', hint: '打开阿里云活动页，领取学生 300 元优惠券。' },
  { label: '创建 API_KEY（电脑）', hint: '在电脑上打开百炼平台，创建一个 API Key。' },
  { label: '填入网站', hint: '把 API Key 和 API Host 填到本站「百炼 Key」页。' },
  { label: '注意事项（重要）', hint: '免费额度将尽时不要操作。优惠券抵扣的是付费额度。' },
  { label: '如何多拿10块钱', hint: '开启 50 节省计划，并在 5 分钟内购买 25 元节省计划。' },
]

const activeStep = ref(0)

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

function selectStep(index) {
  if (index < 0 || index >= steps.length) return
  activeStep.value = index
  if (index === 3) {
    nextTick(() => {
      updateQuotaWires()
      window.requestAnimationFrame(updateQuotaWires)
    })
  }
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
  window.addEventListener('resize', handleResize)
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
    <div class="tutorial-stepper" aria-label="步骤导航">
      <template v-for="(step, index) in steps" :key="step.label">
        <button
          type="button"
          class="step"
          :class="{ completed: index < activeStep, active: index === activeStep }"
          @click="selectStep(index)"
        >
          <span class="step-indicator">
            <svg v-if="index < activeStep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span v-else>{{ index + 1 }}</span>
          </span>
          <span class="step-text">{{ step.label }}</span>
          <span class="step-tooltip">
            <strong>步骤 {{ index + 1 }}：{{ step.label }}</strong><br>
            {{ step.hint }}
          </span>
        </button>
        <div v-if="index < steps.length - 1" class="step-connector" :class="{ completed: index < activeStep }"></div>
      </template>
    </div>
    <div v-show="activeStep === 0" class="login-tutorial__panel">
    <div class="login-guide">
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
    </div>

    <div v-show="activeStep === 1" class="login-tutorial__panel">
    <div class="login-guide login-guide--secondary">
      <img
        class="login-guide__image"
        src="/aliyun-api-key-guide.png"
        alt="阿里云百炼平台创建 API KEY 的页面截图"
      />
      <div class="login-guide__content">
        <p class="login-guide__text"><span class="login-guide__marker">2. 在此处创建一个API_KEY</span></p>
        <p class="login-guide__need-pc">
          <span>这一步需要在电脑上操作</span>
        </p>
        <p class="login-guide__desc">
          在电脑上打开<a
            class="login-guide__link"
            href="https://bailian.console.aliyun.com/cn-beijing?tab=model#/model-market"
            target="_blank"
            rel="noopener noreferrer"
          >阿里云百炼平台</a>，通过右上角的齿轮，进入API KEY的设置，创建一个KEY，业务空间选择默认即可。
        </p>
      </div>
    </div>
    </div>

    <div v-show="activeStep === 2" class="login-tutorial__panel">
    <div class="login-guide-step">
      <p class="login-guide-step__title"><span class="login-guide__marker">3. 将API_KEY 与 API_HOST填入网站</span></p>
      <p class="login-guide-step__desc">打开本站「百炼 Key」页，把阿里云创建好的 API Key 和 API Host 填进去。网站会将你的 tokens 通过 API 调用的方式，分享给有需要的人。</p>
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

    <section
      v-show="activeStep === 3"
      class="login-guide-quota login-tutorial__panel"
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

    <section v-show="activeStep === 4" class="login-guide-step login-guide-earn login-tutorial__panel">
      <p class="login-guide-step__title"><span class="login-guide__marker">5. 如何多拿 10 块钱</span></p>
      <p class="login-guide-earn__warn">
        按下面步骤操作，开启后5分钟内购买<br>
        剩下最后25-30元余额再买<br>
        <strong>千万不要只开不买！！！</strong><br>
        <strong>千万不要只开不买！！！</strong><br>
        <strong>千万不要只开不买！！！</strong>
      </p>
      <div class="login-guide-earn__row">
        <img
          class="login-guide-earn__shot"
          src="/savings50-key.png"
          alt="百炼 Key 页：在 50节省 一列点击未开启"
        />
        <p class="login-guide-earn__label"><span class="login-guide__marker">1. 先开启</span></p>
      </div>
      <p class="login-guide-step__desc">
        请在
        <a
          class="login-guide__link"
          href="https://university.aliyun.com/buycenter/?spm=5176.28623341.J_dE6iKTQZWCaqh5bpcaeTX.2.61d13180Oo9OhV"
          target="_blank"
          rel="noopener noreferrer"
        >此处</a>
        购买「大模型服务」中的【高校】入门型 AI 通用节省计划，点「立即购买」。
      </p>
      <div class="login-guide-earn__row">
        <img
          class="login-guide-earn__shot"
          src="/savings50-buy.png"
          alt="云工开物学生权益页：先点顶部学生权益，再在大模型服务里购买入门型 AI 通用节省计划"
        />
        <p class="login-guide-earn__label"><span class="login-guide__marker">2. 再购买</span></p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-tutorial {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tutorial-stepper {
  --stepper-text-primary: #56301e;
  --stepper-text-secondary: #9ca3af;
  --stepper-active-text: hsl(19, 69.9%, 40.4%);
  --stepper-completed-bg: hsl(19, 69.9%, 40.4%);
  --stepper-tooltip-bg: rgba(255, 255, 255, 0.92);
  --stepper-tooltip-border: hsla(19, 69.9%, 40.4%, 0.18);
  --stepper-tooltip-shadow: 0 8px 32px rgba(86, 48, 30, 0.12);
  --stepper-pulse-start: hsla(19, 69.9%, 40.4%, 0.45);
  --stepper-pulse-end: hsla(19, 69.9%, 40.4%, 0);
  --stepper-connector-bg: hsla(19, 69.9%, 40.4%, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 8px;
  width: min(100%, 1120px);
  min-height: 36px;
  margin: 0 auto 28px;
  padding: 2px 12px;
  box-sizing: border-box;
}

.step {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 0 0 auto;
  box-sizing: border-box;
  min-height: 28px;
  padding: 3px 8px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--stepper-text-secondary);
  cursor: pointer;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
}

.step:not(.active):not(.completed) .step-indicator,
.step:not(.active):not(.completed) .step-text {
  opacity: 0.5;
}

.step.active {
  background: hsla(19, 69.9%, 40.4%, 0.08);
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: transparent;
  color: var(--stepper-text-secondary);
  font-size: 10px;
  font-weight: 600;
}

.step.active .step-indicator {
  background: var(--stepper-active-text);
  color: #fff;
  animation: tutorial-pulse-ring 2s infinite;
}

.step.completed .step-indicator {
  background: var(--stepper-completed-bg);
  color: #fff;
}

.step-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--stepper-text-secondary);
  white-space: nowrap;
}

.step.completed .step-text {
  color: var(--stepper-text-primary);
}

.step.active .step-text {
  color: var(--stepper-active-text);
}

.step-tooltip {
  position: absolute;
  top: 130%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: var(--stepper-tooltip-bg);
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
  border: 1px solid var(--stepper-tooltip-border);
  box-shadow: var(--stepper-tooltip-shadow);
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--stepper-text-primary);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
  z-index: 20;
  line-height: 1.6;
  text-align: left;
  pointer-events: none;
}

.step-tooltip::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px;
  height: 8px;
  background: var(--stepper-tooltip-bg);
  border-left: 1px solid var(--stepper-tooltip-border);
  border-top: 1px solid var(--stepper-tooltip-border);
}

.step-tooltip strong {
  font-size: 13px;
  color: var(--stepper-active-text);
}

.step:hover .step-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.step-connector {
  width: 20px;
  height: 2px;
  background: var(--stepper-connector-bg);
  border-radius: 1px;
}

.step-connector.completed {
  background: var(--stepper-completed-bg);
}

@keyframes tutorial-pulse-ring {
  0% { box-shadow: 0 0 0 0 var(--stepper-pulse-start); }
  70% { box-shadow: 0 0 0 5px var(--stepper-pulse-end); }
  100% { box-shadow: 0 0 0 0 var(--stepper-pulse-end); }
}

.login-tutorial__panel {
  width: min(100%, 1120px);
  min-width: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.login-guide {
  width: 100%;
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
  width: 100%;
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
  display: grid;
  gap: 14px;
  margin-top: 72px;
}

.login-guide-step.login-guide-earn {
  width: min(100%, 1120px);
  max-width: 1120px;
  min-width: 0;
  justify-items: center;
}

.login-guide-earn .login-guide-step__title,
.login-guide-earn .login-guide-step__desc,
.login-guide-earn__warn {
  width: min(100%, 640px);
  max-width: 640px;
  margin-inline: auto;
}

.login-guide-earn__row {
  width: min(100%, 860px);
  display: grid;
  grid-template-columns: minmax(0, 640px) auto;
  justify-content: center;
  align-items: center;
  gap: 24px;
}

.login-guide-earn__label {
  margin: 0;
  font-size: 24px;
  line-height: 1.45;
  color: var(--text-primary);
  font-family: var(--font-cjk-serif);
  white-space: nowrap;
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

.login-guide-earn__warn {
  margin: 0;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.7;
  color: var(--text-primary);
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
}

.login-guide-earn__warn strong {
  color: #c62828;
  font-weight: 800;
}

.login-guide-earn__shot {
  display: block;
  width: 100%;
  max-width: 640px;
  height: auto;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.login-guide__need-pc {
  margin: 0;
  display: flex;
  justify-content: flex-start;
}

.login-guide__need-pc span {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 999px;
  background: hsla(19, 69.9%, 40.4%, 0.12);
  color: hsl(19, 69.9%, 34%);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.4;
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
  width: 100%;
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
  max-width: 1120px;
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
  .tutorial-stepper {
    justify-content: flex-start;
    flex-wrap: nowrap;
    overflow-x: auto;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .step-text {
    display: none;
  }

  .step-connector {
    width: 12px;
  }

  .login-guide-earn__row {
    width: 100%;
    grid-template-columns: 1fr;
    justify-items: center;
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

  .login-guide__need-pc {
    justify-content: center;
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
