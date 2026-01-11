// ======================
// НАСТРОЙКИ
// ======================
const TOTAL_FRAMES = 499;
let currentFrame = 0;
let currentSprite = 0;
let isInitialLoad = true;

// Соответствие кадров и секций
const SECTION_FRAMES = {
    hero: { start: 0, end: 92 },        // Кадры 0-99
    formul: { start: 93, end: 185 },   // Кадры 100-199
    termo: { start: 186, end: 265 },    // Кадры 200-299
    protect: { start: 266, end: 315 },  // Кадры 300-399
    friction: { start: 316, end: 480 }  // Кадры 400-499
};

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
    
    
    const frameDiv = document.getElementById('frame-img');

    frameDiv.style.width = `1305px`;
    frameDiv.style.height = `1305px`;

    const spriteIndex = Math.floor(frameNum/100);
    const f = frameNum % 100;

    const row = Math.floor(f/10);
    const col = f % 10;

    const positionX = -(col * 1024);
    const positionY = -(row * 1024);

    if( spriteIndex !== currentSprite ){
        frameDiv.style.backgroundImage = `url('${SPRITES[spriteIndex]}')`;
        currentSprite = spriteIndex;
    }

    frameDiv.style.backgroundPosition = `${positionX}px ${positionY}px`;

    currentFrame = frameNum;
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