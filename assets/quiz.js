// Interactive Quiz Component for Teaching Workspace
function initQuiz(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="quiz-section">
      <div class="quiz-question">${data.question}</div>
      <div class="quiz-options">
        ${data.options.map((opt, idx) => `
          <div class="quiz-option" data-index="${idx}">
            <span style="font-weight:700; width: 1.5rem;">${String.fromCharCode(65 + idx)}.</span>
            <span>${opt}</span>
          </div>
        `).join('')}
      </div>
      <div class="quiz-feedback" id="${containerId}-feedback"></div>
    </div>
  `;

  const optionEls = container.querySelectorAll('.quiz-option');
  const feedbackEl = container.querySelector(`#${containerId}-feedback`);

  optionEls.forEach(el => {
    el.addEventListener('click', () => {
      const selectedIndex = parseInt(el.getAttribute('data-index'));
      optionEls.forEach(opt => {
        opt.classList.remove('selected', 'correct', 'incorrect');
      });

      if (selectedIndex === data.correct) {
        el.classList.add('correct');
        feedbackEl.className = 'quiz-feedback show success';
        feedbackEl.innerHTML = `<strong>정답입니다!</strong> ${data.explanation}`;
      } else {
        el.classList.add('incorrect');
        optionEls[data.correct].classList.add('correct');
        feedbackEl.className = 'quiz-feedback show error';
        feedbackEl.innerHTML = `<strong>다시 생각해보세요.</strong> ${data.explanation}`;
      }
    });
  });
}
