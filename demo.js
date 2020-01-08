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
    
    this.linesY = 4;
    this.linesX = 7;
  
    this.minY = 0;
    this.maxY = 0;

    this.recX1 = 0;
    this.recX2 = 0;

    // set variables
    this.rawPoints = points;
    this.options = options;
    this.colors = options.colors || ['#ffbf96', '#4d50ab', '#47915a'];
    this.ratio = window.devicePixelRatio || 1;
    this.parent = document.querySelector(selector);
    this.background = document.createElement('canvas');
    this.backgroundCtx = this.background.getContext('2d');
    this.parent.appendChild(this.background);
    this.clientRect = this.background.getBoundingClientRect();
    this.isPressed = false;

    // init
    this.setBackgroundSize();
    this.drawBackground();

    this.points = this.calcPoints(this.rawPoints);
    this.draw(this.backgroundCtx, this.points, this.colors);

    // event listeners
    window.addEventListener('resize', () => {
      this.setBackgroundSize();
      this.drawBackground();

      this.points = this.calcPoints(this.rawPoints);
      this.draw(this.backgroundCtx, this.points, this.colors);
    });

    this.background.addEventListener('mousedown', this.onMouseDown);
    this.background.addEventListener('mousemove', this.onMouseMove);
    this.background.addEventListener('mouseup', this.onMouseUp);

    this.background.addEventListener('touchstart', this.onTouchStart);
    this.background.addEventListener('touchmove', this.onTouchMove);
    this.background.addEventListener('touchend', this.onMouseUp);
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
      this.draw(this.backgroundCtx, this.points, this.colors);
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

  setBackgroundSize = () => {
    this.width = (this.options.width || this.parent.clientWidth) * this.ratio;
    this.height = (this.options.height || this.DEFAULT_HEIGHT) * this.ratio;
    this.ctxWidth = this.width / this.ratio;
    this.ctxHeight = this.height / this.ratio;

    this.background.style.width = `${this.parent.clientWidth}px`;
    this.background.style.height = `${this.DEFAULT_HEIGHT}px`;
    // this.background.style.border = '1px solid black';

    this.background.setAttribute('width', this.width);
    this.background.setAttribute('height', this.height);
    this.backgroundCtx.scale(this.ratio, this.ratio);
  }

  drawBackground = () => {
    this.stepX = (this.ctxWidth - this.MARGIN_LEFT - this.MARGIN_RIGHT) / (this.linesX - 1);
    this.stepY = (this.ctxHeight - this.MARGIN_TOP - this.MARGIN_BOTTOM) / (this.linesY - 1);

    // clean context
    this.backgroundCtx.clearRect(0, 0, this.ctxWidth, this.ctxHeight);

    // vertical description
    const textX = (this.DEFAULT_HEIGHT - this.MARGIN_BOTTOM) / -2;
    const textY = this.MARGIN_LEFT - 39;

    this.backgroundCtx.fillStyle = '#000';
    this.backgroundCtx.save();
    this.backgroundCtx.rotate(270 * Math.PI / 180);
    this.backgroundCtx.textAlign = 'center';
    this.backgroundCtx.font = "20px sans-serif";
    this.backgroundCtx.fillText('Temperature °C', textX, textY);
    this.backgroundCtx.restore();

    // horizontal lines
    this.backgroundCtx.font = "12px sans-serif";
    for (let i = 0; i < this.linesY; i++) {
      const y = this.MARGIN_TOP + this.stepY * i;

      this.backgroundCtx.beginPath();
      this.backgroundCtx.lineWidth = i < (this.linesY - 1) ? .2 : 1;
      this.backgroundCtx.moveTo(this.MARGIN_LEFT - 7, y);
      this.backgroundCtx.lineTo(this.ctxWidth - this.MARGIN_RIGHT, y);
      this.backgroundCtx.stroke();
      this.backgroundCtx.closePath();
    }

    // vertical lines
    for (let i = 0; i < this.linesX; i ++) {
      const x = this.MARGIN_LEFT + this.stepX * i;

      this.backgroundCtx.beginPath();
      this.backgroundCtx.lineWidth = i > 0 ? .2 : 1;
      this.backgroundCtx.moveTo(x, this.MARGIN_TOP);
      this.backgroundCtx.lineTo(x, this.ctxHeight - this.MARGIN_BOTTOM);
      this.backgroundCtx.stroke();
      this.backgroundCtx.closePath();
    }
  }

  drawSelector = () => {
    this.backgroundCtx.beginPath();
    this.backgroundCtx.fillStyle = 'rgba(0, 0, 255, .1)';
    this.backgroundCtx.fillRect(
      this.recX1,
      this.MARGIN_TOP,
      this.recX2 - this.recX1,
      this.ctxHeight - this.MARGIN_BOTTOM - this.MARGIN_TOP
    );
    this.backgroundCtx.stroke();
    this.backgroundCtx.closePath();

    // console.log('selector', this.recX1, this.recX2);
  }

  calcPoints = (points) => {
    const newPoints = [];
    const xRange = points[points.length - 1].time - points[0].time;

    // calc 'x' and get min/max value
    points.forEach(point => {
      const { time, value: values } = point;
  
      newPoints.push({
        ...point,
        x: this.MARGIN_LEFT + ~~((time - points[0].time) * (this.ctxWidth - this.MARGIN_LEFT - this.MARGIN_RIGHT) / xRange),
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

  draw = (ctx, points, color) => {
    // draw lines
    ctx.lineWidth = 1;
    for (let i = 0; i < points[0].y.length; i++) {
      ctx.beginPath();
      ctx.strokeStyle = color[i] || '#000';
      ctx.moveTo(points[0].x, points[0].y[i]);
      points.forEach(point => {
        ctx.lineTo(point.x, point.y[i]);
      });
      ctx.stroke();
      ctx.closePath();
    }

    // circles
    points.forEach(point => {
      point.y.forEach((y, i) => {
        ctx.beginPath();
        ctx.strokeStyle = color[i] || '#000';
        ctx.fillStyle = color[i] || '#000';
        ctx.arc(point.x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
      });
    });

    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';

    // y data
    ctx.beginPath();
    const stepYValue = (this.maxY - this.minY) / this.linesY;
    for (let i = 0; i < this.linesY; i++) {
      const text = ~~(this.minY + stepYValue * i);
      ctx.fillText(`${text}°C`, this.MARGIN_LEFT - 30, this.ctxHeight - this.MARGIN_BOTTOM - this.stepY * i);
    }
    ctx.stroke();
    ctx.closePath();

    // x data
    const stepXValue = (points[points.length - 1].time - points[0].time) / this.linesX;
    for (let i = 0; i < this.linesX; i ++) {
      const date = new Date(points[0].time + ~~(stepXValue * i));
      ctx.save();
      ctx.beginPath();
      ctx.translate(this.MARGIN_LEFT - 35 + (i * this.stepX), this.ctxHeight);
      ctx.rotate(300 * Math.PI / 180);
      ctx.fillText(this.formatDate(date, true), 0, 0);
      ctx.fillText(this.formatDate(date, false), 25, 12);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();    
    }
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
