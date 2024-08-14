// function compose(f, g) {
// const compose = (...fns) => (arg) => fns.reduceRight((acc, fn) => fn(acc), arg);

function compose(f, g) {
  return function (x) {
    return g(f(x));
  };
}

const cloneElement = (element) => element.cloneNode(true);

const changeStyle = (element, styleObj, hoverStyles = {}, transitionDuration = '0.3s') => {
  const newElement = cloneElement(element);
  const originalStyles = { ...element.style };

  Object.assign(newElement.style, styleObj);
  if (Object.keys(hoverStyles).length > 0) {

    newElement.onmouseover = function () {
      Object.assign(this.style, { ...hoverStyles, transition: `all ${transitionDuration}` });
    };

    newElement.onmouseleave = function () {
      Object.assign(this.style, originalStyles);
    };
  }

  return newElement;

};


const replaceElement = (newElement, oldElement) => {
  const parent = oldElement.parentNode;
  if (parent) {
    parent.replaceChild(newElement, oldElement);
  } else {
    console.error("Parent node not found for the element.");
  }
};

function changeElementStyle(oldElement, styleObj, hoverObj = {}) {
  return compose(
    (element) => changeStyle(element, styleObj, hoverObj),
    (element) => replaceElement(element, oldElement),
  )
}

// hide element
const hideElement = (element) => changeElementStyle(element, { opacity: '0', 'pointer-events': 'none' })(element);

// show element
const showElement = (element) => changeElementStyle(element, { opacity: '1', 'pointer-events': 'visible', })(element);

function checkStop() {
  return new Promise((resolve) => {
    document.addEventListener('click', (event) => {
      if (event.target.matches('.option')) {
        resolve(true);
      }
    })
  })
}

// timer
function timer(duration, checkStop) {
  const timer = document.getElementById('timer');
  const timeLineElm = document.getElementById('time_line');
  let counter = 0;
  const amount = (550 / 15);
  const updateTimer = (duration, stop = false) => {
    // base case
    if (stop) {
      return;
    }
    if (duration < 0) {
      eventTriggerTimer('timerOver');
      return;
    }
    timer.textContent = duration;
    timeLineElm.style.width = `${counter}px`;
    counter += amount;
    checkStop().then((res) => { stop = res });
    setTimeout(() => updateTimer(duration - 1, stop), 1000);

  };
  updateTimer(duration);
}

function createEventDispatcher(btn) {
  return (event) => {
    btn.dispatchEvent(new Event(event));
  };
}

const eventTriggerQuizBox = createEventDispatcher(document.getElementById('quiz_box'));

const eventTriggerTimer = createEventDispatcher(document.getElementById('timer'));

const eventTriggerResultBox = createEventDispatcher(document.getElementById('result_box'));

function createQuestionGenerator() {
  const questionsList = [
    {
      questionTitle: 'What does HTML stand for?',
      choices: [
        'Hyper Text Preprocessor',
        'Hyper Text Markup language',
        'Hyper Text Multiple language',
        'Hyper Tool Multiple language'
      ],
      answer: 'Hyper Text Markup language',
    },
    {
      questionTitle: 'What does CSS stand for',
      choices: [
        'Common Style Sheet',
        'Colorful Style Sheet',
        'Computer Style Sheet',
        'Cascading Style Sheet'
      ],
      answer: 'Cascading Style Sheet',
    },
    {
      questionTitle: 'What does PHP stand for',
      choices: [
        'Hypertext PreProcessor',
        'Hypertext Programming',
        'Hypertext Preprogramming',
        'Hometext Preprocessor'
      ],
      answer: 'Hypertext PreProcessor',
    },
    {
      questionTitle: 'What does SQL stand for',
      choices: [
        'Stylish Question Language',
        'Stylesheet Query Language',
        'Statement Question Language',
        'Structured Query Language'
      ],
      answer: 'Structured Query Language',
    },
  ];

  let currentQuestionIndex = 0;

  const getCurrentQuestion = () =>
    questionsList[currentQuestionIndex] ?
      { ...questionsList[currentQuestionIndex], questionNumber: currentQuestionIndex + 1, } :
      null;

  const getNextQuestion = () =>
    currentQuestionIndex < questionsList.length - 1 ?
      { ...questionsList[++currentQuestionIndex], questionNumber: currentQuestionIndex + 1, } :
      null;

  const resetCounter = () => currentQuestionIndex = 0;

  const getTotalQuestions = () => questionsList.length;

  return {
    getCurrentQuestion,
    getNextQuestion,
    resetCounter,
    getTotalQuestions
  };
}

const { getCurrentQuestion, getNextQuestion, resetCounter, getTotalQuestions } = createQuestionGenerator();

const getTextQuestion = (textType) => getCurrentQuestion()[textType];

function renderTextElements(elements, text) {
  const elementList = Array.isArray(elements) ? [...elements] : [elements];
  const textList = Array.isArray(text) ? [...text] : [text];
  elementList.forEach((element, index) => {
    return element.textContent = textList[index];
  });
  return elementList;
}

function renderStyleElements(elements, styleObject = {}, hoverObject = {}) {
  elements.forEach((element) => {
    element.style = '';
    changeElementStyle(element, styleObject, hoverObject)(element);
  });
}

function renderElement(element, textType, styleObject = {}, hoverObject = {}) {
  const renderedTextElements = renderTextElements(element, textType);
  const elementsWithoutIcons = removeIcons(renderedTextElements);
  return renderStyleElements(elementsWithoutIcons, styleObject, hoverObject);
}

const removeIcons = (elements) => {
  elements.forEach((element) => {
    const containsDivWithClass = element.querySelector('div.icon') !== null;

    if (containsDivWithClass) {
      // The parent <div> contains another <div> with the specified class
      const div = document.querySelector('.option .icon');
      div.remove();
    }
  });
  return elements;
}

const correctOption = (options) => {
  const { answer } = getCurrentQuestion();
  return options.find((option) => option.textContent.trim() === answer);
}

const isOptionsEqual = (correctOption, selectOption) => {
  return correctOption.id === selectOption.id ? true : false;
}

const isAnswerCorrect = (selectOption) => {
  return compose(
    (options) => correctOption(options),
    (correctOption) => isOptionsEqual(correctOption, selectOption)
  )
}

const addIcons = (option, classNameDiv, classNameIcon) => {
  // Create the main container div element
  const container = document.createElement('div');
  container.classList.add('icon', classNameDiv);

  // Create the i element for the font-awesome icon
  const icon = document.createElement('i');
  icon.classList.add('fa', classNameIcon);

  // Append the icon element to the container
  container.appendChild(icon);
  // Append the container to the document body or any desired parent element
  option.appendChild(container);
}

const renderCorrectQuestion = (option) => {
  addIcons(option, 'tick', 'fa-check');
  changeElementStyle(option, { 'background-color': '#adfe84', 'border-color': '#adfe84' })(option);
}

const renderWrongQuestion = (option) => {
  addIcons(option, 'cross', 'fa-times');
  changeElementStyle(option, { 'background-color': '#fe8484', 'border-color': '#fe8484' })(option);
}

const renderStyleAnswer = (options, selectOption) => {
  const isCorrect = isAnswerCorrect(selectOption)(options);
  const correctOptionElm = correctOption(options);
  if (isCorrect) {
    renderCorrectQuestion(selectOption);
    addPoint();
    return getOptions();
  }
  renderCorrectQuestion(correctOptionElm);
  renderWrongQuestion(selectOption);
  return getOptions();
}

const cancelEvent = (options) => {
  options.forEach((option) => {
    changeElementStyle(option, { 'pointer-events': 'none' })(option);
  })
}

const getOptions = () => [
  document.getElementById('option1'),
  document.getElementById('option2'),
  document.getElementById('option3'),
  document.getElementById('option4'),
]

function calcPoints() {
  let points = [];

  const addPoint = () => {
    points.push('point');
  }

  const pointCount = () => {
    return points.length;
  }

  const resetPoint = () => {
    points = [];
  }

  return {
    addPoint,
    pointCount,
    resetPoint
  }
}

const { addPoint, pointCount, resetPoint } = calcPoints();

function handleClickStartBtn(startBtn, infoBox) {
  hideElement(startBtn);
  showElement(infoBox);
}

function handleClickExitBtn(startBtn, infoBox) {
  hideElement(infoBox);
  showElement(startBtn);
}

function handleClickContinueBtn(infoBox, quizBox) {
  hideElement(infoBox);
  showElement(quizBox);
  eventTriggerQuizBox('renderQuestion');

}

function handleRenderQuestionEvent(titleQue, options, numberQue, nextQue, totalQues) {
  const styleObjQue = {
    'background-color': 'aliceblue',
    'border': '1px solid #84cffe'
  }
  const hoverStyleObjQue = {
    'color': '#004085',
    'background-color': '#cce5ff',
    'border-color': '#b8daff',
  }
  timer(15, checkStop);
  renderElement(titleQue, getTextQuestion('questionTitle'));
  renderElement(options, getTextQuestion('choices'), styleObjQue, hoverStyleObjQue);
  renderElement(numberQue, getTextQuestion('questionNumber'));
  renderElement(totalQues, getTotalQuestions());
  hideElement(nextQue);
}

function handleClickNextQueBtn(resultBox, quizBox) {
  const equstion = getNextQuestion();
  if (equstion != null) {
    eventTriggerQuizBox('renderQuestion');
    return;
  }
  showElement(resultBox);
  hideElement(quizBox);
  eventTriggerResultBox('resultBox');
}

function handleClickOption(options, nextQue, event,) {
  const selectOption = event.target;
  const modOptions = renderStyleAnswer(options, selectOption);
  cancelEvent(modOptions);
  showElement(nextQue);
}

function handleClickRestartBtn(resultBox, nextQue, quizBox,) {
  hideElement(resultBox);
  showElement(quizBox);
  hideElement(nextQue);
  resetCounter();
  resetPoint();
  eventTriggerQuizBox('renderQuestion');
}

function handleClickQuitBtn(resultBox, startBtn) {
  hideElement(resultBox);
  showElement(startBtn);
  resetCounter();
  resetPoint();
}

// 
function getHandleFuncs() {
  const startBtn = document.getElementById('start_btn');
  const infoBox = document.getElementById('info_box');
  const quizBox = document.getElementById('quiz_box');
  const nextQue = document.getElementById('next_btn');
  const resultBox = document.getElementById('result_box');
  const options = getOptions();

  // note: each function the event passed to it
  return [
    {
      eventTrigger: '#start_btn',
      handleEvent: handleClickStartBtn,
      params: [startBtn, infoBox]
    },
    {
      eventTrigger: '#exit_btn',
      handleEvent: handleClickExitBtn,
      params: [startBtn, infoBox]
    },
    {
      eventTrigger: '#continue_btn',
      handleEvent: handleClickContinueBtn,
      params: [infoBox, quizBox]
    },
    {
      eventTrigger: '#next_btn',
      handleEvent: handleClickNextQueBtn,
      params: [resultBox, quizBox,]
    },
    {
      eventTrigger: '.option',
      handleEvent: handleClickOption,
      params: [options, nextQue]
    },
    {
      eventTrigger: '#restart',
      handleEvent: handleClickRestartBtn,
      params: [resultBox, nextQue, quizBox]
    },
    {
      eventTrigger: '#quit_btn',
      handleEvent: handleClickQuitBtn,
      params: [resultBox, startBtn]
    },

  ];
}

// handle all events in app
document.addEventListener('click', function (event) {
  const events = getHandleFuncs();
  const matchingEvent = events.find(x => event.target.matches(x.eventTrigger));

  if (matchingEvent) {
    const parameterValues = [...matchingEvent.params, event];
    matchingEvent.handleEvent.apply(null, parameterValues);
  }
});

const quizBox = document.getElementById('quiz_box');
quizBox.addEventListener('renderQuestion', () => {
  const titleQue = document.getElementById('que_title');
  const numberQue = document.getElementById('number_que');
  const nextQue = document.getElementById('next_btn');
  const totalQues = document.getElementById('total_Questions');
  const options = getOptions();

  handleRenderQuestionEvent(titleQue, options, numberQue, nextQue, totalQues);
})

const timerr = document.getElementById('timer');
timerr.addEventListener('timerOver', () => {
  const options = getOptions();
  const nextQue = document.getElementById('next_btn');
  showElement(nextQue);
  const correctOptionElm = correctOption(options);
  renderCorrectQuestion(correctOptionElm);
})

const resultBox = document.getElementById('result_box');
resultBox.addEventListener('resultBox', () => {
  const totalPoint = document.getElementById('total_point');
  renderTextElements(totalPoint, pointCount());

  const totalQuestions = document.getElementById('total_Ques');
  renderTextElements(totalQuestions, getTotalQuestions());

  const resultStm = document.getElementById('result_statment');
  renderTextElements(resultStm, getResultStatment(pointCount()))

})

function getResultStatment(pointCount) {
  if (pointCount > 3) {
    return 'and congrats! 🎉, You got ';
  }
  else if (pointCount > 1) {
    return 'and nice 😎, You got ';
  }
  else {
    return 'and sorry 😐, You got only ';
  }
}

