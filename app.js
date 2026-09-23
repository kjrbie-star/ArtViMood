(function () {
  'use strict';

  // Telegram.WebApp доступен только внутри Telegram. В браузере tg = undefined.
  var tg = window.Telegram && window.Telegram.WebApp;

  /* ------------------------------------------------------------------------
     Вопросы. Для вариантных вопросов у каждого ответа может быть `sentence` —
     готовое предложение, которое попадёт в итоговый текст.
  ------------------------------------------------------------------------ */
  var QUESTIONS = [
    {
      id: 'weather',
      block: 'Блок 1 · Что я чувствую сейчас',
      title: 'Если бы сегодняшнее настроение было погодой, что это?',
      options: [
        { label: '☀️ Солнечно', sentence: 'Ты сегодня как солнышко.' },
        { label: '⛅ Переменная облачность', sentence: 'Ты сегодня как переменная облачность.' },
        { label: '🌧️ Дождь', sentence: 'Ты сегодня как дождь.' },
        { label: '⛈️ Гроза', sentence: 'Ты сегодня как гроза.' },
        { label: '🌫️ Туман', sentence: 'Ты сегодня как туман.' }
      ]
    },
    {
      id: 'inner',
      block: 'Блок 1 · Что я чувствую сейчас',
      title: 'Что сейчас громче всего внутри?',
      options: [
        { label: '😌 Спокойствие' },
        { label: '😰 Тревога' },
        { label: '😞 Грусть' },
        { label: '😤 Раздражение' },
        { label: '🫥 Пустота' }
      ]
    },
    {
      id: 'body',
      block: 'Блок 1 · Что я чувствую сейчас',
      title: 'Как ощущается тело?',
      options: [
        { label: '💪 Бодро и легко' },
        { label: '🥱 Устало' },
        { label: '😣 Напряжено' },
        { label: '🫧 Тяжело' },
        { label: '🤒 Не очень' }
      ]
    },
    {
      id: 'remove',
      block: 'Блок 1 · Что я чувствую сейчас',
      title: 'Если бы можно было что-то убрать из головы прямо сейчас — что?',
      text: true,
      placeholder: 'Напиши, если хочется…',
      maxlen: 100
    },
    {
      id: 'energy',
      block: 'Блок 2 · Ресурсы и опора',
      title: 'На сколько тебя сейчас хватает?',
      options: [
        { label: '🔋 Полный заряд' },
        { label: '🔆 Хватит на день' },
        { label: '🪫 На пределе' },
        { label: '⚡ Почти разряжен(а)' }
      ]
    },
    {
      id: 'good',
      block: 'Блок 2 · Ресурсы и опора',
      title: 'Что сегодня было маленькой хорошей вещью?',
      text: true,
      placeholder: 'Например: тёплый кофе, солнце, сообщение…',
      maxlen: 100
    },
    {
      id: 'want',
      block: 'Блок 2 · Ресурсы и опора',
      title: 'Хочется сейчас…',
      options: [
        { label: '🤗 Обнимашек' },
        { label: '🗣️ Поговорить' },
        { label: '🤫 Помолчать вместе' },
        { label: '🚶 Побыть одному/одной' },
        { label: '🎧 Отвлечься' }
      ]
    },
    {
      id: 'wish',
      block: 'Блок 3 · Чего хочется и что дальше',
      title: 'Что ты хотел(а) бы, чтобы произошло?',
      options: [
        { label: '🌤️ Всё наладилось', sentence: 'Больше всего хочешь, чтобы всё наладилось.' },
        { label: '🧘 Стало спокойнее', sentence: 'Больше всего хочешь, чтобы стало спокойнее.' },
        { label: '💬 Мы поняли друг друга', sentence: 'Больше всего хочешь, чтобы мы поняли друг друга.' },
        { label: '😴 Просто выспаться', sentence: 'Больше всего хочешь просто выспаться.' },
        { label: '🪄 Что-то хорошее', sentence: 'Больше всего хочешь, чтобы случилось что-то хорошее.' }
      ]
    },
    {
      id: 'help',
      block: 'Блок 3 · Чего хочется и что дальше',
      title: 'Что сейчас помогло бы больше всего?',
      options: [
        { label: '👂 Чтобы выслушали', sentence: 'Хочешь, чтобы тебя просто выслушали.' },
        { label: '🫂 Чтобы просто были рядом', sentence: 'Хочешь, чтобы просто были рядом.' },
        { label: '💡 Совет', sentence: 'Хочешь получить совет.' },
        { label: '🕐 Время', sentence: 'Хочешь, чтобы тебе дали время.' },
        { label: '🚪 Ничего, спасибо', sentence: 'Сейчас тебе ничего не нужно.' }
      ]
    },
    {
      id: 'need',
      block: 'Блок 3 · Чего хочется и что дальше',
      title: 'Чего тебе сейчас не хватает от меня?',
      options: [
        { label: '👀 Внимания' },
        { label: '🤲 Терпения' },
        { label: '💛 Поддержки' },
        { label: '🤫 Тишины' },
        { label: '✍️ Свой вариант', custom: true, placeholder: 'Напиши, чего не хватает…', maxlen: 80 }
      ]
    }
  ];

  // answers[id]  — текст ответа (label для вариантов, введённый текст для полей)
  // picked[id]   — индекс выбранного варианта (для выяснения sentence)
  var answers = {};
  var picked = {};
  var current = 0;

  var app = document.getElementById('app');

  /* ------------------------------ Тема ------------------------------ */
  function applyTheme() {
    var root = document.documentElement;
    var tp = tg && tg.themeParams ? tg.themeParams : null;
    root.style.setProperty('--bg', (tp && tp.bg_color) || '#f6f2ea');
    root.style.setProperty('--bg-card', (tp && tp.secondary_bg_color) || '#ffffff');
    root.style.setProperty('--text', (tp && tp.text_color) || '#2c2822');
    root.style.setProperty('--hint', (tp && tp.hint_color) || '#8a8378');
    root.style.setProperty('--btn', (tp && tp.button_color) || '#d98e73');
    root.style.setProperty('--btn-text', (tp && tp.button_text_color) || '#ffffff');
    root.classList.toggle('dark', !!(tg && tg.colorScheme === 'dark'));
  }

  /* --------------------------- Хелперы DOM --------------------------- */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function haptic(method, style) {
    if (tg && tg.HapticFeedback && typeof tg.HapticFeedback[method] === 'function') {
      try {
        tg.HapticFeedback[method](style || 'light');
      } catch (e) { /* ignore */ }
    }
  }

  function questionById(id) {
    for (var i = 0; i < QUESTIONS.length; i++) {
      if (QUESTIONS[i].id === id) return QUESTIONS[i];
    }
    return null;
  }

  /* --------------------------- Логика вопросов --------------------------- */
  function canContinue() {
    var q = QUESTIONS[current];
    if (q.text) return true; // текстовые поля необязательные

    var idx = picked[q.id];
    if (idx == null) return false;

    // «Свой вариант» разрешает идти дальше, только если введён текст
    var opt = q.options[idx];
    if (opt && opt.custom) {
      return !!(answers[q.id] && answers[q.id].length > 0);
    }
    return !!answers[q.id];
  }

  function updateContinue() {
    var btn = app.querySelector('.btn-next');
    if (btn) btn.disabled = !canContinue();
  }

  function updateSelections(q, index) {
    var buttons = app.querySelectorAll('.option');
    for (var i = 0; i < q.options.length; i++) {
      if (buttons[i]) buttons[i].classList.toggle('picked', i === index);
    }
  }

  function ensureCustomField(q, opt) {
    var old = app.querySelector('.custom-field');
    if (old) old.remove();

    var wrap = el('div', 'custom-field');
    var input = el('input', 'text-input');
    input.type = 'text';
    input.placeholder = opt.placeholder || 'Напиши…';
    input.maxLength = opt.maxlen || 80;
    input.value = answers[q.id] || '';
    input.addEventListener('input', function () {
      answers[q.id] = input.value.trim();
      updateContinue();
    });
    wrap.appendChild(input);
    app.insertBefore(wrap, app.querySelector('.nav') || null);
    input.focus();
  }

  /* ------------------------------ Отрисовка ------------------------------ */
  function renderTop(total) {
    var wrap = el('div', 'top');

    var row = el('div', 'top-row');
    row.appendChild(el('span', 'step', (current + 1) + ' из ' + total));
    var b = QUESTIONS[current].block;
    if (b) row.appendChild(el('span', 'block-label', b));
    wrap.appendChild(row);

    var progress = el('div', 'progress');
    var fill = el('div', 'progress-fill');
    fill.style.width = Math.round((current / (total - 1)) * 100) + '%';
    progress.appendChild(fill);
    wrap.appendChild(progress);

    return wrap;
  }

  function renderTextInput(q) {
    var wrap = el('div', 'field');
    var input = el('input', 'text-input');
    input.type = 'text';
    input.placeholder = q.placeholder || '';
    input.maxLength = q.maxlen || 140;
    input.value = answers[q.id] || '';
    input.addEventListener('input', function () {
      answers[q.id] = input.value.trim();
      updateContinue();
    });
    wrap.appendChild(input);
    wrap.appendChild(el('p', 'hint-text', 'Можно пропустить — поле необязательное'));
    app.appendChild(wrap);
  }

  function renderOptions(q) {
    var wrap = el('div', 'options');

    q.options.forEach(function (opt, index) {
      var btn = el('button', 'option', opt.label);
      if (picked[q.id] === index) btn.classList.add('picked');

      btn.addEventListener('click', function () {
        if (opt.custom) {
          picked[q.id] = index;
          answers[q.id] = answers[q.id] || '';
          ensureCustomField(q, opt);
          updateSelections(q, index);
        } else {
          picked[q.id] = index;
          answers[q.id] = opt.label;
          var cf = app.querySelector('.custom-field');
          if (cf) cf.remove();
          updateSelections(q, index);
        }
        updateContinue();
        haptic('selectionChanged');
      });

      wrap.appendChild(btn);
    });

    app.appendChild(wrap);

    // Если вернулись назад на вопрос со «своим вариантом» — восстановить поле
    var customIdx = picked[q.id];
    if (customIdx != null && q.options[customIdx] && q.options[customIdx].custom) {
      ensureCustomField(q, q.options[customIdx]);
    }
  }

  function renderNav() {
    var nav = el('div', 'nav');

    if (current > 0) {
      var back = el('button', 'btn btn-back', '← Назад');
      back.addEventListener('click', function () {
        current--;
        renderQuestion();
        haptic('impactOccurred');
      });
      nav.appendChild(back);
    }

    var isLast = current === QUESTIONS.length - 1;
    var next = el('button', 'btn btn-next', isLast ? 'Посмотреть итог →' : 'Далее');
    next.disabled = !canContinue();
    next.addEventListener('click', function () {
      haptic('impactOccurred');
      if (isLast) {
        current = QUESTIONS.length;
        renderReview();
      } else {
        current++;
        renderQuestion();
      }
    });
    nav.appendChild(next);

    return nav;
  }

  function renderQuestion() {
    var q = QUESTIONS[current];
    app.innerHTML = '';

    app.appendChild(renderTop(QUESTIONS.length));
    app.appendChild(el('h1', 'q-title', q.title));

    if (q.text) {
      renderTextInput(q);
    } else {
      renderOptions(q);
    }

    app.appendChild(renderNav());
  }

  /* ------------------------------ Экран «Итог» ------------------------------ */
  function buildReport() {
    var lines = [];

    // Три «главных» предложения — как в примере от заказчика
    ['weather', 'wish', 'help'].forEach(function (id) {
      var q = questionById(id);
      var idx = picked[id];
      if (!q || idx == null) return;
      var opt = q.options[idx];
      if (opt.sentence) {
        lines.push(opt.sentence);
      } else if (answers[id]) {
        lines.push(answers[id] + '.');
      }
    });

    // Остальные ответы — списком
    var details = [];
    function add(name, id) {
      var v = answers[id];
      if (v && v.trim()) details.push(name + ': ' + v);
    }
    add('Громче всего внутри', 'inner');
    add('Тело', 'body');
    add('Энергия', 'energy');
    add('Хочется', 'want');
    add('Сейчас не хватает', 'need');
    add('Маленькая хорошая вещь', 'good');
    add('Убрать из головы', 'remove');

    if (details.length) {
      lines.push('');
      lines.push('Детали:');
      details.forEach(function (d) { lines.push('• ' + d); });
    }

    return lines.join('\n');
  }

  function renderReview() {
    app.innerHTML = '';

    var top = el('div', 'top');
    var row = el('div', 'top-row');
    row.appendChild(el('span', 'step', 'Итог'));
    row.appendChild(el('span', 'block-label', 'Отправь карту настроения'));
    top.appendChild(row);
    var progress = el('div', 'progress');
    var fill = el('div', 'progress-fill');
    fill.style.width = '100%';
    progress.appendChild(fill);
    top.appendChild(progress);
    app.appendChild(top);

    app.appendChild(el('h1', 'q-title', 'Так расскажет про тебя:'));
    var card = el('div', 'report', buildReport());
    app.appendChild(card);
    app.appendChild(el('p', 'hint-text', 'Нажав «Отправить», ты закроешь приложение — результат уйдёт партнёру.'));

    var nav = el('div', 'nav');
    var back = el('button', 'btn btn-back', '← Назад');
    back.addEventListener('click', function () {
      current = QUESTIONS.length - 1;
      renderQuestion();
    });
    nav.appendChild(back);

    var send = el('button', 'btn btn-next', '⬆️ Отправить');
    send.addEventListener('click', sendReport);
    nav.appendChild(send);

    app.appendChild(nav);
  }

  /* ------------------------------ Отправка ------------------------------ */
  function buildPayload() {
    var user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || null;

    var answersData = {};
    QUESTIONS.forEach(function (q) {
      if (answers[q.id] && answers[q.id].length) answersData[q.id] = answers[q.id];
    });

    return JSON.stringify({
      v: 1,
      user: user,
      report: buildReport(),
      answers: answersData
    });
  }

  function sendReport() {
    var payload = buildPayload();

    // В браузере sendData нет — покажем, что именно ушло бы.
    if (!tg || typeof tg.sendData !== 'function') {
      alert('Это работает только внутри Telegram.\n\nСодержимое:\n\n' + payload);
      return;
    }

    haptic('notificationOccurred', 'success');
    // sendData закрывает Mini App и шлёт данные боту как
    // message.web_app_data.data (JSON-строка, ≤ 4096 байт).
    tg.sendData(payload);
  }

  /* ------------------------------ Запуск ------------------------------ */
  function init() {
    if (tg) {
      try {
        tg.ready();               // показать контент и убрать лоадер Telegram
        tg.expand();              // открыть на весь экран
        if (tg.setHeaderColor && tg.themeParams && tg.themeParams.bg_color) {
          tg.setHeaderColor(tg.themeParams.bg_color); // сливаем шапку с фоном
        }
        if (typeof tg.disableVerticalSwipes === 'function') {
          tg.disableVerticalSwipes(); // чтобы случайный свайп не закрывал апп
        }
        if (tg.onEvent) tg.onEvent('themeChanged', applyTheme);
      } catch (e) { /* ignore */ }
    }
    applyTheme();
    renderQuestion();
  }

  document.addEventListener('DOMContentLoaded', init);
})();