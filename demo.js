import Chart from './tinyChart.js';

const points = [
  {time: 1576276373606, value: [3, 15, 8, 40]},
  {time: 1576276497992, value: [6, 17, 7, 80]},
  {time: 1576276606154, value: [4, 13, 8, 40]},
  {time: 1576276823890, value: [12, 8, 9, 80]},
  {time: 1576277296946, value: [6, 9, 10, 40]},
  {time: 1576277414295, value: [0, 7, 15, 80]},
  {time: 1576277727236, value: [-2, 11, 13, 40]},
  {time: 1576278727236, value: [5, 15, 12, 80]},
  {time: 1576279500737, value: [-5, 17, 11, 40]},
  {time: 1576280540169, value: [0, 13, 10, 80]},
];

new Chart('#tinyChart1', points, {
  description: 'Temperature °C',
  labels: ['temp 1', 'temp 2', 'temp 3', 'Watt'],
  symbols: ['°C', '°C', '°C', 'W'],
  chartTypes: [0, 0, 0, 1],
  delimiters: [1, 1, 1, 2],
});

new Chart('#tinyChart2', points, {
  description: 'Temperature °C',
  labels: ['temp 1', 'temp 2', 'temp 3'],
  symbols: ['°C', '°C', '°C'],
});
