// ======================
// НАСТРОЙКИ
// ======================
const TOTAL_FRAMES = 499;
const AUTO_PLAY_TO = 40;
const PRELOAD_COUNT = 50;
let currentFrame = 0;
let isAutoPlaying = false;
let autoPlayComplete = false;
let scrollTriggerInstance = null;
let initialFrame = 0;

// Соответствие кадров и секций
const SECTION_FRAMES = {
    hero: { start: 0, end: 65 },
    formul: { start: 90, end: 145 },
    termo: { start: 185, end: 225 },
    protect: { start: 265, end: 315 },
    friction: { start: 335, end: 480 }
};

// ======================
// ПРОСТОЙ КЭШ
// ======================
const frameCache = new Map();

// ======================
// ПРЕЛОАДЕР
// ======================
function showPreloader() {
    const preloader = document.createElement('div');
    preloader.id = 'preloader';
    preloader.innerHTML = `
        <div class="preloader-content">
            <div class="loader"></div>
            <div class="progress-text">Загрузка анимации: <span id="preload-progress">0%</span></div>
            <div class="hint" id="preloader-hint">Загрузка...</div>
        </div>
    `;
    document.body.appendChild(preloader);
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => preloader.remove(), 500);
    }
}

function updatePreloaderProgress(loaded, total) {
    const progress = document.getElementById('preload-progress');
    if (progress) {
        const percent = Math.round((loaded / total) * 100);
        progress.textContent = `${percent}%`;
    }
}

function updatePreloaderHint(text) {
    const hint = document.getElementById('preloader-hint');
    if (hint) {
        hint.textContent = text;
    }
}

// ======================
// ОПРЕДЕЛЕНИЕ ПОЗИЦИИ ПРИ ЗАГРУЗКЕ
// ======================
function getInitialPosition() {
    const stickySection = document.querySelector('.sticky-section');
    if (!stickySection) return { shouldAutoPlay: true, startFrame: 0 };
    
    const sectionTop = stickySection.offsetTop;
    const scrollPosition = window.scrollY;
    
    // Если пользователь прокрутил дальше начала sticky секции
    if (scrollPosition > sectionTop + 100) {
        const sectionHeight = stickySection.offsetHeight;
        const scrollInSection = scrollPosition - sectionTop;
        const progress = Math.min(1, scrollInSection / sectionHeight);
        const frame = Math.floor(progress * TOTAL_FRAMES);
        
        console.log(`📍 Пользователь не в начале: кадр ${frame}, прогресс ${(progress * 100).toFixed(1)}%`);
        return {
            shouldAutoPlay: false,
            startFrame: frame,
            scrollProgress: progress,
            scrollPosition: scrollPosition
        };
    }
    
    return { shouldAutoPlay: true, startFrame: 0 };
}

// ======================
// ПРЕДЗАГРУЗКА КАДРОВ
// ======================
async function preloadFramesAround(frameNumber, count = 30) {
    const start = Math.max(0, frameNumber - Math.floor(count / 2));
    const end = Math.min(TOTAL_FRAMES, start + count);
    
    console.log(`📥 Предзагружаем кадры вокруг ${frameNumber} (${start}-${end})...`);
    
    const batchSize = 5;
    
    for (let i = start; i < end; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, end);
        const promises = [];
        
        for (let j = i; j < batchEnd; j++) {
            promises.push(loadFrameToCache(j));
        }
        
        await Promise.all(promises);
        
        const loaded = Math.min(i + batchSize, end) - start;
        const total = end - start;
        updatePreloaderProgress(loaded, total);
        
        await new Promise(resolve => setTimeout(resolve, 30));
    }
}

async function loadFrameToCache(frameNumber) {
    if (frameCache.has(frameNumber)) return;
    
    const url = getFrameUrl(frameNumber);
    
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        
        img.onload = () => {
            frameCache.set(frameNumber, img);
            resolve(img);
        };
        
        img.onerror = () => {
            console.warn(`⚠️ Ошибка загрузки кадра ${frameNumber}`);
            resolve(null);
        };
    });
}

// ======================
// ЗАГРУЗКА И ИНИЦИАЛИЗАЦИЯ
// ======================
async function loadAndInitAnimation() {
    console.log('🚀 Начинаем загрузку...');
    showPreloader();
    
    // Определяем начальную позицию
    const initialPosition = getInitialPosition();
    initialFrame = initialPosition.startFrame;
    
    if (initialPosition.shouldAutoPlay) {
        // Автоплей
        updatePreloaderHint('Автопроигрывание до кадра 40...');
        await preloadFramesAround(0, AUTO_PLAY_TO + 20);
        hidePreloader();
        await autoPlayAnimation();
    } else {
        // Восстановление позиции
        updatePreloaderHint(`Восстановление позиции (кадр ${initialPosition.startFrame})...`);
        await preloadFramesAround(initialPosition.startFrame, 60);
        hidePreloader();
        restorePosition(initialPosition);
    }
    
    // Фоновая загрузка
    backgroundLoadFrames();
}

// Восстановление позиции
function restorePosition(position) {
    console.log(`🔧 Восстанавливаем позицию: кадр ${position.startFrame}`);
    
    // Устанавливаем кадр
    updateFrame(position.startFrame);
    updateActiveSection(position.startFrame);
    currentFrame = position.startFrame;
    
    // Обновляем дебаг
    document.getElementById('debug-progress').textContent = 
        `${((position.startFrame / TOTAL_FRAMES) * 100).toFixed(1)}%`;
    document.getElementById('debug-frame').textContent = position.startFrame + 1;
    document.getElementById('animation-status').textContent = '✅ Готово';
    document.getElementById('animation-status').style.color = '#00ff88';
    
    // ВАЖНО: Прокручиваем ДО включения ScrollTrigger
    if (position.scrollPosition) {
        // Сохраняем текущую позицию скролла
        const targetScroll = position.scrollPosition;
        
        // Ждем немного и прокручиваем
        setTimeout(() => {
            window.scrollTo({
                top: targetScroll,
                behavior: 'instant'
            });
            
            // ТОЛЬКО ПОСЛЕ прокрутки включаем ScrollTrigger
            setTimeout(() => {
                if (scrollTriggerInstance) {
                    // Принудительно устанавливаем прогресс в ScrollTrigger
                    scrollTriggerInstance.progress = position.scrollProgress || 0;
                    scrollTriggerInstance.enable();
                    console.log(`ScrollTrigger включен с прогрессом: ${scrollTriggerInstance.progress}`);
                }
            }, 50);
        }, 100);
    } else {
        // Если позиции нет, просто включаем
        if (scrollTriggerInstance) {
            scrollTriggerInstance.enable();
        }
    }
    
    // Разблокируем скролл
    enableScroll();
    autoPlayComplete = true;
}

// ======================
// АВТОПРОИГРЫВАНИЕ
// ======================
async function autoPlayAnimation() {
    console.log('🎬 Начинаем автопроигрывание...');
    isAutoPlaying = true;
    
    const duration = 3000;
    const totalSteps = AUTO_PLAY_TO;
    const stepDuration = duration / totalSteps;
    
    for (let frame = 0; frame <= AUTO_PLAY_TO; frame++) {
        updateFrame(frame);
        updateActiveSection(frame);
        currentFrame = frame;
        
        document.getElementById('debug-progress').textContent = 
            `${((frame / AUTO_PLAY_TO) * 100).toFixed(1)}%`;
        document.getElementById('debug-frame').textContent = frame + 1;
        document.getElementById('animation-status').textContent = `🎬 Автопроигрывание... (${frame + 1}/${AUTO_PLAY_TO + 1})`;
        
        await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
    
    console.log('✅ Автопроигрывание завершено');
    isAutoPlaying = false;
    autoPlayComplete = true;
    
    // После автоплея устанавливаем скролл на позицию 40-го кадра
    const stickySection = document.querySelector('.sticky-section');
    const targetProgress = AUTO_PLAY_TO / TOTAL_FRAMES;
    const targetScroll = stickySection.offsetTop + (stickySection.offsetHeight * targetProgress);
    
    // Прокручиваем мгновенно
    window.scrollTo({
        top: targetScroll,
        behavior: 'instant'
    });
    
    // Включаем ScrollTrigger с правильным прогрессом
    setTimeout(() => {
        if (scrollTriggerInstance) {
            scrollTriggerInstance.progress = targetProgress;
            scrollTriggerInstance.enable();
            console.log(`ScrollTrigger включен с прогрессом: ${scrollTriggerInstance.progress}`);
        }
    }, 50);
    
    // Разблокируем скролл
    enableScroll();
    
    document.getElementById('animation-status').textContent = '✅ Готово к скроллу';
    document.getElementById('animation-status').style.color = '#00ff88';
}

// Фоновая загрузка
async function backgroundLoadFrames() {
    console.log('🔄 Фоновая загрузка остальных кадров...');
    
    for (let i = 0; i < TOTAL_FRAMES; i += 20) {
        const batchEnd = Math.min(i + 20, TOTAL_FRAMES);
        const promises = [];
        
        for (let j = i; j < batchEnd; j++) {
            if (!frameCache.has(j)) {
                promises.push(loadFrameToCache(j));
            }
        }
        
        if (promises.length > 0) {
            await Promise.all(promises);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    console.log('✅ Все кадры загружены');
}

// ======================
// ОСНОВНЫЕ ФУНКЦИИ
// ======================
function getFrameUrl(frameNumber) {
    const paddedNumber = frameNumber.toString().padStart(5, '0');
    return `assets/frames/syntx+_${paddedNumber}.webp`;
}

function updateFrame(frameNum) {
    if (frameNum === currentFrame) return;
    
    currentFrame = frameNum;
    
    const frameImg = document.getElementById('frame-img');
    
    if (frameCache.has(frameNum)) {
        const cachedImg = frameCache.get(frameNum);
        frameImg.src = cachedImg.src;
    } else {
        const url = getFrameUrl(frameNum);
        frameImg.src = url;
        setTimeout(() => loadFrameToCache(frameNum), 0);
    }
}

// ======================
// ИНИЦИАЛИЗАЦИЯ GSAP
// ======================
gsap.registerPlugin(ScrollTrigger);

const debugInfo = document.createElement('div');
debugInfo.className = 'debug-info';
debugInfo.innerHTML = `
    <div>Прогресс: <span id="debug-progress">0%</span></div>
    <div>Кадр: <span id="debug-frame">1</span>/500</div>
    <div>Секция: <span id="debug-section">hero</span></div>
    <div>Загружено: <span id="loaded-frames">0</span> кадров</div>
    <div>Статус: <span id="animation-status">⏳ Загрузка...</span></div>
`;
document.body.appendChild(debugInfo);

function updateDebugInfo() {
    const loadedFramesEl = document.getElementById('loaded-frames');
    if (loadedFramesEl) {
        loadedFramesEl.textContent = `${frameCache.size}`;
    }
}

// ======================
// ОСНОВНАЯ АНИМАЦИЯ
// ======================
function initAnimation() {
    const stickySection = document.querySelector('.sticky-section');
    const stickyContainer = document.querySelector('.sticky-container');
    const textSections = document.querySelectorAll('.text-section');
    
    disableScroll();
    
    // Создаем timeline с отключенным ScrollTrigger
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: stickySection,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            pin: stickyContainer,
            anticipatePin: 1,
            markers: false,
            onUpdate: updateAnimation,
            onEnter: () => console.log("✴️ Вошли в sticky-зону"),
            onLeave: () => console.log("⬇️ Вышли из sticky-зоны"),
            onEnterBack: () => console.log("⬆️ Вернулись в sticky-зону"),
            disabled: true
        }
    });
    
    // Анимация текстовых секций
    textSections.forEach((section, index) => {
        const sectionId = section.id;
        const range = SECTION_FRAMES[sectionId];
        const sectionProgress = range.start / TOTAL_FRAMES;
        
        tl.to(section, {
            opacity: 1,
            y: 0,
            duration: 0.01
        }, sectionProgress)
        .to(section, {
            opacity: 0,
            y: -30,
            duration: 0.01
        }, (range.end / TOTAL_FRAMES) - 0.01);
    });
    
    scrollTriggerInstance = tl.scrollTrigger;
    console.log('Анимация инициализирована (ScrollTrigger отключен)');
}

// Обновление анимации при скролле
function updateAnimation(self) {
    if (isAutoPlaying) return;
    
    const progress = self.progress;
    const frame = Math.floor(progress * TOTAL_FRAMES);
    
    updateFrame(frame);
    updateActiveSection(frame);
    
    document.getElementById('debug-progress').textContent = 
        `${(progress * 100).toFixed(1)}%`;
    document.getElementById('debug-frame').textContent = frame + 1;
}

// Обновление активной секции
function updateActiveSection(frameNum) {
    const textSections = document.querySelectorAll('.text-section');
    
    textSections.forEach(section => {
        section.classList.remove('active');
    });
    
    let activeSectionId = 'hero';
    
    for (const [sectionId, range] of Object.entries(SECTION_FRAMES)) {
        if (frameNum >= range.start && frameNum <= range.end) {
            activeSectionId = sectionId;
            break;
        }
    }
    
    const activeSection = document.getElementById(activeSectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    document.getElementById('debug-section').textContent = activeSectionId;
}

// Управление скроллом
function disableScroll() {
    document.body.style.overflow = 'hidden';
}

function enableScroll() {
    document.body.style.overflow = '';
}

// ======================
// ЗАПУСК ПРИ ЗАГРУЗКЕ
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Документ загружен!');
    
    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
        #preloader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        .preloader-content {
            text-align: center;
            color: white;
        }
        .loader {
            width: 50px;
            height: 50px;
            border: 5px solid #333;
            border-top: 5px solid #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .progress-text {
            font-family: monospace;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .hint {
            font-size: 12px;
            opacity: 0.7;
        }
        .debug-info {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
        }
        .debug-info div {
            margin: 2px 0;
        }
        .debug-info span {
            color: #00ff88;
        }
        #animation-status {
            color: #ff9900;
        }
    `;
    document.head.appendChild(style);
    
    initAnimation();
    await loadAndInitAnimation();
    setInterval(updateDebugInfo, 1000);
});