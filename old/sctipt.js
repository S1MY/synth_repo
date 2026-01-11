// ======================
// НАСТРОЙКИ
// ======================
const TOTAL_FRAMES = 499;
let currentFrame = 0;
let isInitialLoad = true;

// Соответствие кадров и секций
const SECTION_FRAMES = {
    hero: { start: 0, end: 92 },        // Кадры 0-99
    formul: { start: 93, end: 185 },   // Кадры 100-199
    termo: { start: 186, end: 265 },    // Кадры 200-299
    protect: { start: 266, end: 315 },  // Кадры 300-399
    friction: { start: 316, end: 480 }  // Кадры 400-499
};

// ======================
// ПРОСТОЙ КЭШ
// ======================
const frameCache = new Map();
let preloadedFrames = 0;
const PRELOAD_COUNT = 25; // Первые 50 кадров грузим сразу

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
        </div>
    `;
    document.body.appendChild(preloader);
    
    // Стили для прелоадера
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
        }
    `;
    document.head.appendChild(style);
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

// ======================
// ПРЕДЗАГРУЗКА КАДРОВ
// ======================
async function preloadFrames() {
    console.log('🔄 Начинаем предзагрузку кадров...');
    showPreloader();
    
    // Загружаем первые 50 кадров сразу
    const batchSize = 5; // Грузим по 5 кадров за раз
    const totalToPreload = Math.min(PRELOAD_COUNT, TOTAL_FRAMES);
    
    for (let i = 0; i < totalToPreload; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, totalToPreload);
        const promises = [];
        
        for (let j = i; j < batchEnd; j++) {
            promises.push(loadFrameToCache(j));
        }
        
        await Promise.all(promises);
        preloadedFrames = batchEnd;
        updatePreloaderProgress(batchEnd, totalToPreload);
        
        // Пауза между батчами чтобы не нагружать
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`✅ Предзагружено ${preloadedFrames} кадров`);
    hidePreloader();
    
    // Фоновая загрузка остальных кадров
    setTimeout(() => backgroundLoadFrames(), 1000);
}

async function loadFrameToCache(frameNumber) {
    if (frameCache.has(frameNumber)) return;
    
    const url = getFrameUrl(frameNumber);
    
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        
        img.onload = () => {
            frameCache.set(frameNumber, img);
            // console.log(`✅ Кэширован кадр ${frameNumber}`);
            resolve(img);
        };
        
        img.onerror = () => {
            console.warn(`⚠️ Ошибка загрузки кадра ${frameNumber}`);
            resolve(null);
        };
    });
}

// Фоновая загрузка остальных кадров
async function backgroundLoadFrames() {
    console.log('🔄 Фоновая загрузка остальных кадров...');
    
    // Загружаем остальные кадры порциями
    for (let i = PRELOAD_COUNT; i < TOTAL_FRAMES; i += 10) {
        const batchEnd = Math.min(i + 10, TOTAL_FRAMES);
        const promises = [];
        
        for (let j = i; j < batchEnd; j++) {
            promises.push(loadFrameToCache(j));
        }
        
        await Promise.all(promises);
        
        // Большая пауза чтобы не мешать основной анимации
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✅ Все кадры загружены в кэш');
}

// Предзагрузка диапазона вокруг текущего кадра
function preloadAroundCurrent(currentFrame) {
    const start = Math.max(0, currentFrame - 10);
    const end = Math.min(TOTAL_FRAMES, currentFrame + 30);
    
    for (let i = start; i < end; i++) {
        if (!frameCache.has(i)) {
            loadFrameToCache(i);
        }
    }
}

// ======================
// ОБНОВЛЕННАЯ ФУНКЦИЯ ПОЛУЧЕНИЯ КАДРА
// ======================
function getFrameUrl(frameNumber) {
    const paddedNumber = frameNumber.toString().padStart(5, '0');
    return `assets/frames/syntx+_${paddedNumber}.png`;
}

// Обновленная функция обновления кадра
function updateFrame(frameNum) {
    if (frameNum === currentFrame) return;
    
    currentFrame = frameNum;
    
    const frameImg = document.getElementById('frame-img');
    
    // Если кадр есть в кэше - берем оттуда
    if (frameCache.has(frameNum)) {
        const cachedImg = frameCache.get(frameNum);
        frameImg.src = cachedImg.src;
    } else {
        // Если нет в кэше - грузим и кэшируем
        const url = getFrameUrl(frameNum);
        frameImg.src = url;
        
        // Фоновая загрузка в кэш
        setTimeout(() => loadFrameToCache(frameNum), 0);
    }
    
    // Предзагружаем кадры вокруг текущего
    preloadAroundCurrent(frameNum);
}

// ======================
// ИНИЦИАЛИЗАЦИЯ GSAP
// ======================
gsap.registerPlugin(ScrollTrigger);

// Создаем дебаг панель
const debugInfo = document.createElement('div');
debugInfo.className = 'debug-info';
debugInfo.innerHTML = `
    <div>Прогресс: <span id="debug-progress">0%</span></div>
    <div>Кадр: <span id="debug-frame">1</span>/500</div>
    <div>Секция: <span id="debug-section">hero</span></div>
    <div>Кэш: <span id="cache-info">0</span> кадров</div>
`;

// Стили для дебаг панели
const debugStyle = document.createElement('style');
debugStyle.textContent = `
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
`;
document.head.appendChild(debugStyle);
document.body.appendChild(debugInfo);

// Функция обновления информации о кэше
function updateCacheInfo() {
    const cacheInfo = document.getElementById('cache-info');
    if (cacheInfo) {
        cacheInfo.textContent = `${frameCache.size}`;
    }
}

// ======================
// ОСНОВНАЯ АНИМАЦИЯ
// ======================
function initAnimation() {
    const stickySection = document.querySelector('.sticky-section');
    const stickyContainer = document.querySelector('.sticky-container');
    const textSections = document.querySelectorAll('.text-section');
    
    // Создаем таймлайн для анимации
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: stickySection,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            pin: stickyContainer,
            anticipatePin: 1,
            markers: false,
            onUpdate: updateAnimation,
            onEnter: () => console.log("✴️ Вошли в sticky-зону"),
            onLeave: () => console.log("⬇️ Вышли из sticky-зоны"),
            onEnterBack: () => console.log("⬆️ Вернулись в sticky-зону"),
        }
    });
    
    // Анимация текстовых секций
    textSections.forEach((section, index) => {
        const sectionId = section.id;
        const range = SECTION_FRAMES[sectionId];
        const sectionProgress = range.start / TOTAL_FRAMES;
        
        // Показываем секцию на ее диапазоне кадров
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
    
    console.log('Анимация инициализирована');
}

// ======================
// ОБНОВЛЕНИЕ АНИМАЦИИ ПРИ СКРОЛЛЕ
// ======================
function updateAnimation(self) {
    const progress = self.progress;
    const frame = Math.floor(progress * TOTAL_FRAMES);
    
    updateFrame(frame);
    updateActiveSection(frame);
    
    document.getElementById('debug-progress').textContent = 
        `${(progress * 100).toFixed(1)}%`;
    document.getElementById('debug-frame').textContent = frame + 1;
    
    // Обновляем информацию о кэше
    updateCacheInfo();
}

// ======================
// ОБНОВЛЕНИЕ АКТИВНОЙ СЕКЦИИ
// ======================
function updateActiveSection(frameNum) {
    const textSections = document.querySelectorAll('.text-section');
    
    // Скрываем все секции
    textSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Находим активную секцию по диапазону кадров
    let activeSectionId = 'hero';
    
    for (const [sectionId, range] of Object.entries(SECTION_FRAMES)) {
        if (frameNum >= range.start && frameNum <= range.end) {
            activeSectionId = sectionId;
            break;
        }
    }
    
    // Показываем активную секцию
    const activeSection = document.getElementById(activeSectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    document.getElementById('debug-section').textContent = activeSectionId;
}

// ======================
// ОБНОВЛЕНИЕ ДЕБАГ ИНФОРМАЦИИ
// ======================
function updateDebugInfo(progress, frame) {
    document.getElementById('debug-progress').textContent = 
        `${(progress * 100).toFixed(1)}%`;
    document.getElementById('debug-frame').textContent = frame + 1;
}

function replayAnimation() {
    document.querySelector('.sticky-section').scrollIntoView({
        behavior: 'smooth'
    });
    
    setTimeout(() => {
        updateFrame(0);
    }, 500);
    
    gsap.fromTo('.btn-replay',
        { scale: 0.9 },
        { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" }
    );
}

// ======================
// ЗАПУСК ПРИ ЗАГРУЗКЕ
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Документ загружен!');
    
    // 1. Предзагружаем первые 50 кадров
    await preloadFrames();
    
    // 2. Устанавливаем первый кадр из кэша
    updateFrame(0);
    
    // 3. Инициализируем анимацию
    initAnimation();
    
    // 4. Добавляем обработчик кнопки воспроизведения
    const replayBtn = document.querySelector('.btn-replay');
    if (replayBtn) {
        replayBtn.addEventListener('click', replayAnimation);
    }
    
    // Обновляем информацию о кэше
    setInterval(updateCacheInfo, 1000);
});

// ======================
// КОМАНДЫ ДЛЯ ТЕСТИРОВАНИЯ
// ======================
window.showFrame = function(frame) {
    if (frame >= 1 && frame <= TOTAL_FRAMES) {
        updateFrame(frame - 1);
        console.log(`Показан кадр ${frame}`);
    }
};

window.jumpToSection = function(sectionId) {
    const range = SECTION_FRAMES[sectionId];
    if (range) {
        const frame = range.start;
        const progress = frame / TOTAL_FRAMES;
        const stickySection = document.querySelector('.sticky-section');
        const scrollY = stickySection.offsetTop + (stickySection.offsetHeight * progress);
        window.scrollTo({ top: scrollY, behavior: 'smooth' });
    }
};

window.clearCache = function() {
    frameCache.clear();
    console.log('Кэш очищен');
    updateCacheInfo();
};

window.getCacheInfo = function() {
    console.log(`Загружено в кэш: ${frameCache.size} кадров`);
    console.log(`Текущий кадр: ${currentFrame}`);
};

console.log(`
===========================================
🛠️ КОМАНДЫ ДЛЯ ТЕСТИРОВАНИЯ В КОНСОЛИ:
===========================================
showFrame(250) - показать кадр 250
jumpToSection('formul') - перейти к секции "формула"
clearCache() - очистить кэш
getCacheInfo() - информация о кэше
===========================================
`);


// old script.js
// ======================
// НАСТРОЙКИ
// ======================

// ======================
// ИНИЦИАЛИЗАЦИЯ GSAP
// ======================
gsap.registerPlugin(ScrollTrigger);

// Создаем индикатор прогресса
const progressBar = document.createElement('div');
progressBar.className = 'progress-bar';
document.body.appendChild(progressBar);

// Создаем панель дебага
const debugInfo = document.createElement('div');
debugInfo.className = 'debug-info';
debugInfo.innerHTML = `
    <div>Прогресс: <span id="debug-progress">0%</span></div>
    <div>Кадр: <span id="debug-frame">1</span></div>
`;
document.body.appendChild(debugInfo);

// ======================
// 1. ПРЕДЗАГРУЗКА КАДРОВ
// ======================
function preloadFrames() {
    console.log('Начинаем предзагрузку кадров...');
    
    // Загружаем первые 50 кадров для мгновенного отображения
    for (let i = 1; i <= 50; i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
    }
}

// ======================
// 2. ОСНОВНАЯ АНИМАЦИЯ
// ======================
function initAnimation() {
    const stickySection = document.querySelector('.sticky-section');
    const stickyContainer = document.querySelector('.sticky-container');
    
    // ======================
    // АНИМАЦИЯ СЛОЕВ
    // ======================
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: stickySection,
            start: "top top",     // Когда верх stickySection достигнет верха viewport
            end: "bottom bottom", // Когда низ stickySection достигнет низа viewport
            scrub: 1,            // Привязка анимации к скроллу
            pin: stickyContainer, // Фиксируем контейнер
            anticipatePin: 1,
            markers: false,       // ВКЛЮЧИТЕ ДЛЯ ВИЗУАЛИЗАЦИИ!
            onUpdate: updateAnimation,
            onEnter: () => console.log("✴️ Вошли в sticky-зону"),
            onLeave: () => console.log("⬇️ Вышли из sticky-зоны"),
            onEnterBack: () => console.log("⬆️ Вернулись в sticky-зону"),
        }
    });
    
    // Анимация слоя 1 (движение вправо)
    tl.to('.box1', {
        x: 400,
        rotation: 360,
        duration: 2
    }, 0);
    
    // Анимация слоя 2 (движение влево и увеличение)
    tl.to('.box2', {
        x: -400,
        scale: 1.5,
        duration: 2
    }, 0);
    
    // Анимация слоя 3 (движение вверх)
    tl.to('.box3', {
        y: -300,
        duration: 2
    }, 0);
    
    // ======================
    // ТЕКСТОВЫЕ ШАГИ
    // ======================
    const textSteps = document.querySelectorAll('.text-step');
    
    // Шаг 1 появляется на 0.2 прогресса
    tl.to('.step1', {
        opacity: 1,
        y: 0,
        duration: 0.3
    }, 0.2);
    
    // Шаг 2 появляется на 0.4 прогресса
    tl.to('.step2', {
        opacity: 1,
        y: 0,
        duration: 0.3
    }, 0.4);
    
    // Шаг 1 исчезает на 0.5 прогресса
    tl.to('.step1', {
        opacity: 0,
        y: -50,
        duration: 0.3
    }, 0.5);
    
    // Шаг 3 появляется на 0.6 прогресса
    tl.to('.step3', {
        opacity: 1,
        y: 0,
        duration: 0.3
    }, 0.6);
    
    // Шаг 2 исчезает на 0.7 прогресса
    tl.to('.step2', {
        opacity: 0,
        y: -50,
        duration: 0.3
    }, 0.7);
    
    // Шаг 4 появляется на 0.8 прогресса
    tl.to('.step4', {
        opacity: 1,
        y: 0,
        duration: 0.3
    }, 0.8);
    
    // Шаг 3 исчезает на 0.9 прогресса
    tl.to('.step3', {
        opacity: 0,
        y: -50,
        duration: 0.3
    }, 0.9);
    
    console.log('Анимация инициализирована!');
}

// ======================
// 3. ОБНОВЛЕНИЕ АНИМАЦИИ ПРИ СКРОЛЛЕ
// ======================
function updateAnimation(self) {
    // Обновляем прогресс бар
    const progress = self.progress;
    progressBar.style.width = `${progress * 100}%`;
    
    // Обновляем кадр анимации (1-500)
    const frame = Math.max(1, Math.floor(progress * TOTAL_FRAMES));
    updateFrame(frame);
    
    // Обновляем дебаг информацию
    document.getElementById('debug-progress').textContent = 
        `${(progress * 100).toFixed(1)}%`;
    document.getElementById('debug-frame').textContent = frame;
}

// ======================
// 4. ОБНОВЛЕНИЕ КАДРА
// ======================
function updateFrame(frameNum) {
    if (frameNum === currentFrame) return;
    
    currentFrame = frameNum;
    
    // Обновляем номер кадра
    document.getElementById('frame-num').textContent = frameNum;
    
    const frameImg = document.getElementById('frame-img');
    frameImg.src = getFrameUrl(frameNum);
    
}

// ======================
// 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================
function getFrameUrl(frameNumber) {
    const paddedNumber = frameNumber.toString().padStart(5, '0');
    return `assets/frames/syntx+_${paddedNumber}.png`;
}

function replay() {
    // Прокручиваем к началу sticky секции
    document.querySelector('.sticky-section').scrollIntoView({
        behavior: 'smooth'
    });
    
    // Сбрасываем кадр
    setTimeout(() => {
        updateFrame(1);
    }, 500);
    
    // Анимация кнопки
    gsap.fromTo('.outro button',
        { scale: 0.9 },
        { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" }
    );
}

// ======================
// 6. ЗАПУСК ВСЕГО ПРИ ЗАГРУЗКЕ
// ======================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Документ загружен!');
    
    // Предзагружаем кадры
    preloadFrames();
    
    // Инициализируем анимацию
    initAnimation();
    
    // Добавляем обработчик для кнопки воспроизведения
    document.querySelector('.outro button').addEventListener('click', replay);
});

// ======================
// 7. ФУНКЦИИ ДЛЯ ТЕСТИРОВАНИЯ (в консоли)
// ======================
window.showFrame = function(frame) {
    if (frame >= 1 && frame <= TOTAL_FRAMES) {
        updateFrame(frame);
        console.log(`Показан кадр ${frame}`);
    }
};

window.jumpToProgress = function(percent) {
    const stickySection = document.querySelector('.sticky-section');
    const scrollY = stickySection.offsetTop + (stickySection.offsetHeight * percent / 100);
    window.scrollTo({ top: scrollY, behavior: 'smooth' });
};

console.log(`
=====================================
🛠️ КОМАНДЫ ДЛЯ ТЕСТИРОВАНИЯ В КОНСОЛИ:
=====================================
showFrame(250) - показать кадр 250
jumpToProgress(50) - перейти к 50% прогресса
ScrollTrigger.getAll()[0].progress - текущий прогресс
=====================================
`);


// old js2.js

// ======================
// НАСТРОЙКИ
// ======================
// const TOTAL_FRAMES = 499;
// let currentFrame = 0;
// let currentSprite = 0;
// let isInitialLoad = true;

// // Соответствие кадров и секций
// const SECTION_FRAMES = {
//     hero: { start: 0, end: 92 },        // Кадры 0-99
//     formul: { start: 93, end: 185 },   // Кадры 100-199
//     termo: { start: 186, end: 265 },    // Кадры 200-299
//     protect: { start: 266, end: 315 },  // Кадры 300-399
//     friction: { start: 316, end: 480 }  // Кадры 400-499
// };

const SPRITES = [
    './assets/sprite/sprite1.png',
    './assets/sprite/sprite2.png'
]

// ======================
// ИНИЦИАЛИЗАЦИЯ GSAP
// ======================
gsap.registerPlugin(ScrollTrigger);

// Создаем дебаг панель
const debugInfo = document.createElement('div');
debugInfo.className = 'debug-info';
debugInfo.innerHTML = `
    <div>Прогресс: <span id="debug-progress">0%</span></div>
    <div>Кадр: <span id="debug-frame">1</span>/500</div>
    <div>Секция: <span id="debug-section">hero</span></div>
`;
document.body.appendChild(debugInfo);

// ======================
// ОСНОВНАЯ АНИМАЦИЯ
// ======================
function initAnimation() {
    const stickySection = document.querySelector('.sticky-section');
    const stickyContainer = document.querySelector('.sticky-container');
    const textSections = document.querySelectorAll('.text-section');
    
    // Создаем таймлайн для анимации
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: stickySection,
            start: "top top",     // Когда верх stickySection достигнет верха viewport
            end: "bottom bottom", // Когда низ stickySection достигнет низа viewport
            scrub: 1,            // Привязка анимации к скроллу
            pin: stickyContainer, // Фиксируем контейнер
            anticipatePin: 1,
            markers: false,       // ВКЛЮЧИТЕ ДЛЯ ВИЗУАЛИЗАЦИИ!
            onUpdate: updateAnimation,
            onEnter: () => console.log("✴️ Вошли в sticky-зону"),
            onLeave: () => console.log("⬇️ Вышли из sticky-зоны"),
            onEnterBack: () => console.log("⬆️ Вернулись в sticky-зону"),
        }
    });
    
    
    // Анимация текстовых секций
    textSections.forEach((section, index) => {
        const sectionId = section.id;
        const range = SECTION_FRAMES[sectionId];

        console.log(sectionId);

        const sectionProgress = range.start / TOTAL_FRAMES;
        
        // Показываем секцию на ее диапазоне кадров
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
    
    console.log('Анимация инициализирована');
}

// ======================
// ОБНОВЛЕНИЕ ВСЕХ ЭЛЕМЕНТОВ
// ======================
function updateAll(progress) {
    // Обновляем кадр
    const frame = Math.floor(progress * (TOTAL_FRAMES - 1));
    updateFrame(frame);
    
    // Обновляем активную секцию
    updateActiveSection(frame);
    
    // Обновляем дебаг информацию
    updateDebugInfo(progress, frame);
}

// ======================
// ОБНОВЛЕНИЕ КАДРА
// ======================
function updateFrame(frameNum) {
    if (frameNum === currentFrame) return;
    
    // Кэшируем вычисления для спрайтшита
    const spriteIndex = Math.floor(frameNum / 100);
    const f = frameNum % 100;
    const row = Math.floor(f / 10);
    const col = f % 10;
    
    // Вычисляем один раз
    const positionX = -(col * 1024);
    const positionY = -(row * 1024);
    
    // Используем requestAnimationFrame для плавности
    requestAnimationFrame(() => {
        const frameDiv = document.getElementById('frame-img');
        
        // Меняем спрайт только при необходимости
        if (spriteIndex !== currentSprite) {
            frameDiv.style.backgroundImage = url('${SPRITES[spriteIndex]}');
            currentSprite = spriteIndex;
        }
        
        // Применяем все изменения за один раз
        frameDiv.style.cssText = `
            width: 1305px;
            height: 1305px;
            background-image: url('${SPRITES[spriteIndex]}');
            background-position: ${positionX}px ${positionY}px;
        `;
        
        currentFrame = frameNum;
    });
}

// ======================
// 3. ОБНОВЛЕНИЕ АНИМАЦИИ ПРИ СКРОЛЛЕ
// ======================
function updateAnimation(self) {
    // Обновляем прогресс бар
    const progress = self.progress;
    // progressBar.style.width = `${progress * 100}%`;
    
    // Обновляем кадр анимации (1-500)
    const frame = Math.max(1, Math.floor(progress * TOTAL_FRAMES));
    updateFrame(frame);
    updateActiveSection(frame);
    
    // Обновляем дебаг информацию
    document.getElementById('debug-progress').textContent = 
        `${(progress * 100).toFixed(1)}%`;
    document.getElementById('debug-frame').textContent = frame;
}

// ======================
// ОБНОВЛЕНИЕ АКТИВНОЙ СЕКЦИИ
// ======================
function updateActiveSection(frameNum) {
    const textSections = document.querySelectorAll('.text-section');
    
    // Скрываем все секции
    textSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Находим активную секцию по диапазону кадров
    let activeSectionId = 'hero';
    
    for (const [sectionId, range] of Object.entries(SECTION_FRAMES)) {
        if (frameNum >= range.start && frameNum <= range.end) {
            activeSectionId = sectionId;
            break;
        }
    }
    
    // Показываем активную секцию
    const activeSection = document.getElementById(activeSectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Обновляем в дебаг информации
    document.getElementById('debug-section').textContent = activeSectionId;
}

// ======================
// ОБНОВЛЕНИЕ ДЕБАГ ИНФОРМАЦИИ
// ======================
function updateDebugInfo(progress, frame) {
    document.getElementById('debug-progress').textContent = 
        `${(progress * 100).toFixed(1)}%`;
    document.getElementById('debug-frame').textContent = frame + 1;
}

// ======================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================
function getFrameUrl(frameNumber) {
    
    return `assets/frames/syntx+_${frameNumber}.png`;
}

function replayAnimation() {
    // Прокручиваем к началу
    document.querySelector('.sticky-section').scrollIntoView({
        behavior: 'smooth'
    });
    
    // Сбрасываем кадр
    setTimeout(() => {
        updateFrame(0);
    }, 500);
    
    // Анимация кнопки
    gsap.fromTo('.btn-replay',
        { scale: 0.9 },
        { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" }
    );
}

// ======================
// ЗАПУСК ПРИ ЗАГРУЗКЕ
// ======================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Документ загружен!');
    
    // Инициализируем анимацию
    initAnimation();
    
    // Добавляем обработчик кнопки воспроизведения
    const replayBtn = document.querySelector('.btn-replay');
    if (replayBtn) {
        replayBtn.addEventListener('click', replayAnimation);
    }
});

// ======================
// КОМАНДЫ ДЛЯ ТЕСТИРОВАНИЯ
// ======================
window.showFrame = function(frame) {
    if (frame >= 1 && frame <= TOTAL_FRAMES) {
        updateFrame(frame - 1);
        console.log(`Показан кадр ${frame}`);
    }
};

window.jumpToSection = function(sectionId) {
    const range = SECTION_FRAMES[sectionId];
    if (range) {
        const frame = range.start;
        const progress = frame / TOTAL_FRAMES;
        const stickySection = document.querySelector('.sticky-section');
        const scrollY = stickySection.offsetTop + (stickySection.offsetHeight * progress);
        window.scrollTo({ top: scrollY, behavior: 'smooth' });
    }
};

console.log(`
===========================================
🛠️ КОМАНДЫ ДЛЯ ТЕСТИРОВАНИЯ В КОНСОЛИ:
===========================================
showFrame(250) - показать кадр 250
jumpToSection('formul') - перейти к секции "формула"
===========================================
`);