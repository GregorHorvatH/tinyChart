export default class Chart {
  constructor(selector, points = [], options = {}) {
    if (!selector || typeof selector !== 'string') {
      throw new Error('Chart selector is mandatory, e.g. "#tinyChart"');
    }

    // set variables
    this.rawPoints = points;
    this.options = options;
    this.options.colors = options.colors || [];
    this.colors = [
      ...this.options.colors,
      '#00458B', // blue (strong)
      '#FB8122', // orange (strong)
      '#3EB650', // green (strong)
      '#5626C4', // violet (middle)
      '#2CCCC3', // ocean (middle)
      '#FCC133', // yellow (middle)
      '#E5BACE', // pink (light)
      '#8DA242', // olive (light)
      '#7DA2A9', // grey (light)
    ];
    this.labels = options.labels || [];
    this.symbols = options.symbols || [];
    this.chartTypes = options.chartTypes || [];
    this.delimiters = options.delimiters || [];

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

    this.pointerX = 0;
    this.linesY = 4;
    this.linesX = 7;
    this.recX1 = 0;
    this.recX2 = 0;
    this.zeroY = 0;

    // constants
    this.DEFAULT_HEIGHT = 300;
    this.MARGIN_LEFT = this.ctx.measureText(this.symbols[0]).width + 45;
    this.MARGIN_RIGHT = 10;
    this.MARGIN_TOP = 15;
    this.MARGIN_BOTTOM = 80;

    // set styles
    buttonWrapper.style.display = 'flex';
    buttonWrapper.style.flexDirection = 'column';
    resetButton.style.marginRight = `${this.MARGIN_RIGHT}px`;
    resetButton.style.marginLeft = `${this.MARGIN_LEFT}px`;

    // init
    this.draw();

    // event listeners
    window.addEventListener('resize', this.draw);

    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);

    this.canvas.addEventListener('touchstart', this.onTouchStart);
    this.canvas.addEventListener('touchmove', this.onTouchMove);
    this.canvas.addEventListener('touchend', this.onTouchEnd);

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
    this.filterPoints();
    this.draw();
  }

  onMouseMove = ({ clientX, clientY }) => {
    if (this.isPressed) {
      this.zoom = true;
    }
    this.pointerX = ~~(clientX - this.clientRect.left);
    this.pointerY = ~~(clientY - this.clientRect.top);

    if (this.isPressed) {
      this.recX2 = this.pointerX < this.MARGIN_LEFT
        ? this.MARGIN_LEFT
        : this.pointerX;
      this.recX2 = this.recX2 > this.ctxWidth - this.MARGIN_RIGHT
        ? this.ctxWidth - this.MARGIN_RIGHT
        : this.recX2;

      this.draw(this.ctx, this.points, this.colors);
      this.drawSelector();
    } else {
      this.draw(this.ctx, this.points, this.colors);
    }
  }

  onTouchStart = ({ touches }) => {
    this.onMouseDown({ clientX: touches[0].clientX });
  }

  onTouchMove = ({ touches }) => {
    this.onMouseMove({ clientX: touches[0].clientX, clientY: touches[0].clientY });
  }

  onTouchEnd = () => {
    this.onMouseUp();
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
    const textY = 15;

    this.ctx.fillStyle = '#000';
    this.ctx.save();
    this.ctx.rotate(270 * Math.PI / 180);
    this.ctx.textAlign = 'center';
    this.ctx.font = "20px sans-serif";
    this.ctx.fillStyle = '#00458B';
    this.ctx.fillText(this.options.description || '', textX, textY);
    this.ctx.restore();

    // horizontal lines
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
    // draw chart lines
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.points[0].y.length; i++) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.colors[i] || '#000';
      this.ctx.moveTo(this.points[0].x, this.points[0].y[i]);

      for (let j = 0; j < this.points.length; j++) {
        if (!j) {
          continue;
        }
        switch (this.chartTypes[i]) {
          case (1):
            this.ctx.lineTo(this.points[j].x, this.points[j - 1].y[i]);
            this.ctx.lineTo(this.points[j].x, this.points[j].y[i]);
            break;
          default:
            this.ctx.lineTo(this.points[j].x, this.points[j].y[i]);
            break;
        }
      }
      this.ctx.stroke();
      this.ctx.closePath();
    }

    // draw zero line
    if (this.zeroY < this.ctxHeight - this.MARGIN_BOTTOM) {
      this.ctx.beginPath();
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = '#4aa8ff';
      this.ctx.setLineDash([5, 10]);
      this.ctx.moveTo(this.MARGIN_LEFT + 1, this.zeroY);
      this.ctx.lineTo(this.ctxWidth - this.MARGIN_RIGHT - 1, this.zeroY);
      this.ctx.stroke();
      this.ctx.closePath();
      this.ctx.setLineDash([]);
    }

    // draw chart selected line
    this.points.forEach(point => {
      if (point.isSelected) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#ebc1be';
        this.ctx.moveTo(point.x, this.MARGIN_TOP + 1);
        this.ctx.lineTo(point.x, this.ctxHeight - this.MARGIN_BOTTOM - 1);
        this.ctx.stroke();
        this.ctx.closePath();
      }
    });

    // draw chart circles
    this.ctx.lineWidth = 1;
    this.points.forEach(point => {
      point.y.forEach((y, i) => {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors[i] || '#000';
        this.ctx.fillStyle = this.colors[i] || '#000';
        this.ctx.arc(point.x, y, point.isSelected ? 6 : 4, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();
      });
    });

    this.ctx.strokeStyle = '#000';
    this.ctx.fillStyle = '#000';

    // y data
    this.ctx.font = "12px sans-serif";
    this.ctx.beginPath();
    const stepYValue = (this.maxY - this.minY) / (this.linesY - 1);
    for (let i = 0; i < this.linesY; i++) {
      const text = ~~(this.minY + stepYValue * i);
      const label = `${text}${this.symbols[0] || ''}`;
      this.ctx.fillText(
        label,
        this.MARGIN_LEFT - this.ctx.measureText(label).width - 3,
        this.ctxHeight - this.MARGIN_BOTTOM - this.stepY * i
      );
    }
    this.ctx.stroke();
    this.ctx.closePath();

    // x data
    this.ctx.font = "12px sans-serif";
    const stepXValue = (this.points[this.points.length - 1].time - this.points[0].time) / (this.linesX - 1);
    for (let i = 0; i < this.linesX; i ++) {
      const date = new Date(this.points[0].time + ~~(stepXValue * i));
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.translate(
        this.MARGIN_LEFT - 35 + (i * this.stepX),
        this.ctxHeight - this.MARGIN_BOTTOM + 60
      );
      this.ctx.rotate(300 * Math.PI / 180);
      this.ctx.fillText(this.formatDateTime(date, true), 0, 0);
      this.ctx.fillText(this.formatDateTime(date), 25, 12);
      this.ctx.stroke();
      this.ctx.closePath();
      this.ctx.restore();    
    }

    // footer (history)
    const line = 50;
    let boxSize = 0;
    let textX = 0;

    this.ctx.font = "bold 14px sans-serif";
    for (let i = 0; i < this.points[0].value.length; i++) {
      const label = `${this.labels[i] || 'input ' + (i + 1)}`;
      boxSize += this.ctx.measureText(label).width + line;
      this.labels[i] = this.labels[i] || `input ${i + 1}`
    }

    const boxX = (this.ctxWidth - boxSize) / 2;
    for (let i = 0; i < this.points[0].value.length; i++) {
      const marginLeft = 10;
      const marginRight = 5;
      textX += i ? this.ctx.measureText(this.labels[i - 1]).width + line : line;

      this.ctx.beginPath();
      this.ctx.lineWidth = 1;
      this.ctx.fillStyle = '#000';
      this.ctx.fillText(
        this.labels[i],
        boxX + textX,
        this.ctxHeight - 4
      );

      this.ctx.lineWidth = 3;
      this.ctx.fillStyle = this.colors[i] || '#000';
      this.ctx.strokeStyle = this.colors[i] || '#000';
      this.ctx.moveTo(boxX + textX - line + marginLeft, this.ctxHeight - 8);
      this.ctx.lineTo(boxX + textX - marginRight, this.ctxHeight - 8);
      this.ctx.arc(
        boxX + textX - line + marginLeft + ((line - marginLeft - marginRight) / 2),
        this.ctxHeight - 8,
        4, 0, 2 * Math.PI);
      this.ctx.fill();

      this.ctx.stroke();
      this.ctx.closePath();
    }

    // draw info box
    this.points.forEach(point => {
      if (point.isSelected) {
        const { time, value: values } = point;
        const marginTop = 10;
        const boxWidth = 140;
        const lineHeight = 20;
        const height = point.y.length * lineHeight + lineHeight + marginTop;
        const x = this.pointerX > this.ctxWidth - this.MARGIN_RIGHT - boxWidth
          ? -5 - boxWidth
          : 10;
        const date = new Date(time);
        const headerY = this.pointerY + marginTop + lineHeight;
        let valueY = this.pointerY + marginTop + lineHeight * 2;

        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = '#0000ff';
        this.ctx.fillStyle = 'rgba(255, 255, 255, .9)';
        this.ctx.fillRect(this.pointerX + x, this.pointerY + 10, boxWidth, height);
        this.ctx.rect(this.pointerX + x, this.pointerY + 10, boxWidth, height);

        // header
        this.ctx.fillStyle = '#000';
        this.ctx.font = "14px sans-serif";
        this.ctx.fillText(this.formatDateTime(date, true), this.pointerX + x + 5, headerY);

        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = "bold 14px sans-serif";
        this.ctx.fillText(this.formatDateTime(date), this.pointerX + x + 80, headerY);

        // values
        values
          .map((value, i) => ({
            value,
            color: this.colors[i] || '#000',
            label: `${this.labels[i] || 'input ' + (i + 1)}`,
            symbol: this.symbols[i] || ''
          }))
          .sort((a, b) => b.value - a.value)
          .forEach(({ value, color, label, symbol }) => {
            const lw = this.ctx.measureText(label).width + 10;

            this.ctx.fillStyle = color;
            this.ctx.font = "14px sans-serif";

            this.ctx.shadowColor = '#777777';
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            this.ctx.shadowBlur = 1;
            this.ctx.fillText(`${label}:`, this.pointerX + x + 5, valueY);

            this.ctx.fillStyle = '#000';
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            this.ctx.font = "bold 14px sans-serif";
            this.ctx.fillText(`${value} ${symbol}`, this.pointerX + x + lw, valueY);
            valueY += lineHeight;
          });

        this.ctx.stroke();
        this.ctx.closePath();
      }
    });
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

    // calc 'x' and get minY/maxY value
    points.forEach(point => {
      const { time, value: values } = point;
      const x = this.MARGIN_LEFT + 15 + ~~((time - points[0].time) * (this.ctxWidth - this.MARGIN_LEFT - this.MARGIN_RIGHT - 30) / xRange);
  
      newPoints.push({
        ...point,
        isSelected: this.pointerX >= x - 10 && this.pointerX <= x + 10,
        x,
      });
  
      values.forEach((value, i) => {
        const delimiter = this.delimiters[i] || 1;
        const newValue = value / delimiter;

        if (newValue < this.minY) {
          this.minY = newValue;
        }
        if (newValue > this.maxY) {
          this.maxY = newValue;
        }
      });
    });
  
    // calc 'y'
    this.zeroY = this.calcY(0);
    newPoints.forEach(point => {
      const { value: values } = point;
      point.y = [];

      values.forEach((value, i) => {
        const delimiter = this.delimiters[i] || 1;
        point.y.push(this.calcY(value / delimiter));
      });
    });

    return newPoints;
  }

  calcY = (value) => {
    const yRange = (this.maxY - this.minY);

    return this.ctxHeight - ~~((value - this.minY) * (this.ctxHeight - this.MARGIN_TOP - this.MARGIN_BOTTOM) / yRange) - this.MARGIN_BOTTOM;
  }

  /**
   * Formatting timestamp to date or time
   * @param {timestamp} date
   * @param {boolean} isDate: true - date, false - time
   */
  formatDateTime = (date, isDate = false) => {
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
