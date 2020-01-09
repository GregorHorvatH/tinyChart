class Chart {
  constructor(selector, points = [], options = {}) {
    if (!selector || typeof selector !== 'string') {
      throw new Error('Chart selector is mandatory, e.g. "#tinyChart"');
    }

    // constants
    this.DEFAULT_HEIGHT = 250;
    this.MARGIN_LEFT = 55;
    this.MARGIN_RIGHT = 10;
    this.MARGIN_TOP = 15;
    this.MARGIN_BOTTOM = 60;

    // set variables
    this.rawPoints = points;
    this.options = options;
    this.colors = options.colors || ['#ffbf96', '#4d50ab', '#47915a'];
    this.ratio = window.devicePixelRatio || 1;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    const buttonWrapper = document.createElement('div');
    const chartWrapper = document.createElement('div');
    const resetButton = document.createElement('button');
    resetButton.innerText = 'Reset';
    buttonWrapper.appendChild(resetButton);
    chartWrapper.appendChild(this.canvas);

    this.parent = document.querySelector(selector);
    this.parent.appendChild(buttonWrapper);
    this.parent.appendChild(chartWrapper);

    this.clientRect = this.canvas.getBoundingClientRect();

    this.isPressed = false;
    this.zoom = false;

    this.linesY = 4;
    this.linesX = 7;
  
    this.recX1 = 0;
    this.recX2 = 0;

    // set styles
    buttonWrapper.style.display = 'flex';
    buttonWrapper.style.flexDirection = 'column';
    resetButton.style.marginRight = `${this.MARGIN_RIGHT}px`;

    // init
    this.draw();

    // event listeners
    window.addEventListener('resize', this.draw);

    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);

    this.canvas.addEventListener('touchstart', this.onTouchStart);
    this.canvas.addEventListener('touchmove', this.onTouchMove);
    this.canvas.addEventListener('touchend', this.onMouseUp);

    resetButton.addEventListener('click', this.resetPoints);
  }

  onMouseDown = ({ clientX }) => {
    this.isPressed = true;
    this.recX1 = ~~clientX - this.clientRect.left;
    this.recX1 = this.recX1 < this.MARGIN_LEFT
      ? this.MARGIN_LEFT
      : this.recX1;
    this.recX1 = this.recX1 > this.ctxWidth - this.MARGIN_RIGHT
      ? this.ctxWidth - this.MARGIN_RIGHT
      : this.recX1;
    this.recX2 = this.recX1;
  }

  onMouseUp = () => {
    this.isPressed = false;
    this.zoom = true;
    this.filterPoints();
    this.draw();
  }

  onMouseMove = ({ clientX }) => {
    if (this.isPressed) {
      this.recX2 = ~~clientX - this.clientRect.left;
      this.recX2 = this.recX2 < this.MARGIN_LEFT
        ? this.MARGIN_LEFT
        : this.recX2;
      this.recX2 = this.recX2 > this.ctxWidth - this.MARGIN_RIGHT
      ? this.ctxWidth - this.MARGIN_RIGHT
      : this.recX2;

      this.drawBackground();
      this.draw(this.ctx, this.points, this.colors);
      this.drawSelector();
    }
  }

  onTouchStart = ({ touches }) => {
    this.isPressed = true;
    this.onMouseDown({ clientX: touches[0].clientX });
  }

  onTouchMove = ({ touches }) => {
    if (this.isPressed) {
      this.onMouseMove({ clientX: touches[0].clientX });
    }
  }

  draw = () => {
    this.setBackgroundSize();
    this.drawBackground();

    this.points = this.calcPoints(this.zoom ? this.points : this.rawPoints);
    this.drawChart();
  }

  setBackgroundSize = () => {
    this.width = (this.options.width || this.parent.clientWidth) * this.ratio;
    this.height = (this.options.height || this.DEFAULT_HEIGHT) * this.ratio;
    this.ctxWidth = this.width / this.ratio;
    this.ctxHeight = this.height / this.ratio;

    this.canvas.style.width = `${this.parent.clientWidth}px`;
    this.canvas.style.height = `${this.DEFAULT_HEIGHT}px`;

    this.canvas.setAttribute('width', this.width);
    this.canvas.setAttribute('height', this.height);
    this.ctx.scale(this.ratio, this.ratio);
  }

  drawBackground = () => {
    this.stepX = (this.ctxWidth - this.MARGIN_LEFT - this.MARGIN_RIGHT) / (this.linesX - 1);
    this.stepY = (this.ctxHeight - this.MARGIN_TOP - this.MARGIN_BOTTOM) / (this.linesY - 1);

    // clean context
    this.ctx.clearRect(0, 0, this.ctxWidth, this.ctxHeight);

    // vertical description
    const textX = (this.DEFAULT_HEIGHT - this.MARGIN_BOTTOM) / -2;
    const textY = this.MARGIN_LEFT - 39;

    this.ctx.fillStyle = '#000';
    this.ctx.save();
    this.ctx.rotate(270 * Math.PI / 180);
    this.ctx.textAlign = 'center';
    this.ctx.font = "20px sans-serif";
    this.ctx.fillText('Temperature °C', textX, textY);
    this.ctx.restore();

    // horizontal lines
    this.ctx.font = "12px sans-serif";
    for (let i = 0; i < this.linesY; i++) {
      const y = this.MARGIN_TOP + this.stepY * i;

      this.ctx.beginPath();
      this.ctx.lineWidth = i < (this.linesY - 1) ? .2 : 1;
      this.ctx.moveTo(this.MARGIN_LEFT - 7, y);
      this.ctx.lineTo(this.ctxWidth - this.MARGIN_RIGHT, y);
      this.ctx.stroke();
      this.ctx.closePath();
    }

    // vertical lines
    for (let i = 0; i < this.linesX; i ++) {
      const x = this.MARGIN_LEFT + this.stepX * i;

      this.ctx.beginPath();
      this.ctx.lineWidth = i > 0 ? .2 : 1;
      this.ctx.moveTo(x, this.MARGIN_TOP);
      this.ctx.lineTo(x, this.ctxHeight - this.MARGIN_BOTTOM);
      this.ctx.stroke();
      this.ctx.closePath();
    }
  }

  drawSelector = () => {
    this.ctx.beginPath();
    this.ctx.fillStyle = 'rgba(0, 0, 255, .1)';
    this.ctx.fillRect(
      this.recX1,
      this.MARGIN_TOP,
      this.recX2 - this.recX1,
      this.ctxHeight - this.MARGIN_BOTTOM - this.MARGIN_TOP
    );
    this.ctx.stroke();
    this.ctx.closePath();
  }

  drawChart = () => {
    // draw lines
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.points[0].y.length; i++) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.colors[i] || '#000';
      this.ctx.moveTo(this.points[0].x, this.points[0].y[i]);
      this.points.forEach(point => {
        this.ctx.lineTo(point.x, point.y[i]);
      });
      this.ctx.stroke();
      this.ctx.closePath();
    }

    // circles
    this.points.forEach(point => {
      point.y.forEach((y, i) => {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors[i] || '#000';
        this.ctx.fillStyle = this.colors[i] || '#000';
        this.ctx.arc(point.x, y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();
      });
    });

    this.ctx.strokeStyle = '#000';
    this.ctx.fillStyle = '#000';

    // y data
    this.ctx.beginPath();
    const stepYValue = (this.maxY - this.minY) / this.linesY;
    for (let i = 0; i < this.linesY; i++) {
      const text = ~~(this.minY + stepYValue * i);
      this.ctx.fillText(`${text}°C`, this.MARGIN_LEFT - 30, this.ctxHeight - this.MARGIN_BOTTOM - this.stepY * i);
    }
    this.ctx.stroke();
    this.ctx.closePath();

    // x data
    const stepXValue = (this.points[this.points.length - 1].time - this.points[0].time) / (this.linesX - 1);
    for (let i = 0; i < this.linesX; i ++) {
      const date = new Date(this.points[0].time + ~~(stepXValue * i));
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.translate(this.MARGIN_LEFT - 35 + (i * this.stepX), this.ctxHeight);
      this.ctx.rotate(300 * Math.PI / 180);
      this.ctx.fillText(this.formatDate(date, true), 0, 0);
      this.ctx.fillText(this.formatDate(date, false), 25, 12);
      this.ctx.stroke();
      this.ctx.closePath();
      this.ctx.restore();    
    }
  }

  resetPoints = () => {
    this.points = this.rawPoints;
    this.zoom = false;
    this.draw();
  }

  filterPoints = () => {
    const x1 = this.recX1 < this.recX2 ? this.recX1 : this.recX2;
    const x2 = this.recX1 > this.recX2 ? this.recX1 : this.recX2;

    const newPoints = this.points
      .filter(point => point.x >= x1 && point.x <= x2);
    
    this.points = newPoints.length ? newPoints : this.points;
  }

  calcPoints = (points) => {
    const newPoints = [];
    const xRange = points[points.length - 1].time - points[0].time;

    this.minY = points[0].value[0];
    this.maxY = points[0].value[0];

    // calc 'x' and get min/max value
    points.forEach(point => {
      const { time, value: values } = point;
  
      newPoints.push({
        ...point,
        x: this.MARGIN_LEFT + 15 + ~~((time - points[0].time) * (this.ctxWidth - this.MARGIN_LEFT - this.MARGIN_RIGHT - 30) / xRange),
      });
  
      values.forEach(value => {
        if (value < this.minY) {
          this.minY = value;
        }
        if (value > this.maxY) {
          this.maxY = value;
        }
      });
    });
  
    // calc 'y'
    const yRange = (this.maxY - this.minY);
    newPoints.forEach(point => {
      const { value: values } = point;
      point.y = [];

      values.forEach(value => {
        point.y.push(this.ctxHeight - ~~((value - this.minY) * (this.ctxHeight - this.MARGIN_TOP - this.MARGIN_BOTTOM) / yRange) - this.MARGIN_BOTTOM);
      });
    });

    return newPoints;
  }

  /**
   * Formatting timestamp to date or time
   * @param {timestamp} date
   * @param {boolean} isDate: true - date, false - time
   */
  formatDate = (date, isDate = true) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    // return ;
    return isDate
      ? `${year}/${month}/${day}`
      : `${hours}:${minutes}:${seconds}`;
  }
}


// =========== DEMO ===========
const points = [
  {time: 1576276373606, value: [3, 15, 8]},
  {time: 1576276497992, value: [6, 17, 7]},
  {time: 1576276606154, value: [4, 13, 8]},
  {time: 1576276823890, value: [7, 8, 9]},
  {time: 1576277296946, value: [6, 9, 10]},
  {time: 1576277414295, value: [0, 7, 15]},
  {time: 1576277727236, value: [-2, 11, 13]},
  {time: 1576278727236, value: [5, 15, 12]},
  {time: 1576279500737, value: [-5, 17, 11]},
  {time: 1576280540169, value: [0, 13, 10]},
];

const chart = new Chart('#tinyChart', points);
