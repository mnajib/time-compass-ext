// Time Compass Extension JavaScript
document.addEventListener('DOMContentLoaded', () => {
  const svg = document.getElementById('clockSvg');
  if (!svg) return;

  // Initialize settings panel
  initializeSettings();

  // Initialize extension storage
  browser.storage.local.get(
    {
      show12Hour: true,
      show24Hour: true,
      showCompassDirections: true,
      timezone: 'auto'
    },
    (items) => {
      initializeClock(svg, items);
    }
  );
});

// Settings panel functionality
function initializeSettings() {
  const settingsBtn = document.querySelector('.settings-btn');
  const settingsPanel = document.querySelector('.settings-panel');
  const show12HourToggle = document.getElementById('show12Hour');
  const show24HourToggle = document.getElementById('show24Hour');
  const showCompassDirectionsToggle = document.getElementById('showCompassDirections');

  if (settingsBtn && settingsPanel && show12HourToggle && show24HourToggle && showCompassDirectionsToggle) {
    // Initialize toggles with stored values
    browser.storage.local.get({
      show12Hour: true,
      show24Hour: true,
      showCompassDirections: true
    }, (items) => {
      show12HourToggle.checked = items.show12Hour;
      show24HourToggle.checked = items.show24Hour;
      showCompassDirectionsToggle.checked = items.showCompassDirections;
    });
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsPanel.classList.toggle('open');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsPanel.classList.remove('open');
      }
    });

    // Helper function to redraw the clock
    const redrawClock = () => {
      const svg = document.getElementById('clockSvg');
      if (svg) {
        // Clear existing content
        while (svg.firstChild) {
          svg.removeChild(svg.firstChild);
        }
        // Reinitialize with new settings
        initializeClock(svg, {
          show12Hour: show12HourToggle.checked,
          show24Hour: show24HourToggle.checked,
          showCompassDirections: showCompassDirectionsToggle.checked,
          timezone: 'auto'
        });
      }
    };

    // Event listener for 12Hour toggle
    show12HourToggle.addEventListener('change', (e) => {
      e.stopPropagation();
      const show12Hour = e.target.checked;
      browser.storage.local.set({ show12Hour });
      redrawClock();
    });

    // Event listener for 24Hour toggle
    show24HourToggle.addEventListener('change', (e) => {
      e.stopPropagation();
      const show24Hour = e.target.checked;
      browser.storage.local.set({ show24Hour });
      redrawClock();
    });

    // Event listener for Compass Directions toggle
    showCompassDirectionsToggle.addEventListener('change', (e) => {
      e.stopPropagation();
      const showCompassDirections = e.target.checked;
      browser.storage.local.set({ showCompassDirections });
      redrawClock();
    });

  }
} // End of initializeSettings() { ... }

// Compass and Clock Configuration
const COMPASS_CONFIG = {
  radius: 200,
  lineDiagonal: 212,
  centerCircle: 90,
  labelRadius: 180,
  textBlock: {
    lineSpacing: 20,
    totalLines: 4
  }
};

const DIRECTION_STYLE = {
  arabic: { size: 22, lang: "arab" },
  //malay: { size: 22, weight: "700" },
  malay: { size: 18, weight: "700" },
  english: { size: 18, style: "italic" },
  //degree: { size: 12 }
  degree: { size: 14 }
};

const COMPASS_DIRECTIONS = [
  [0, "شَمَال", "Utara", "North", 0],
  [90, "شَرْق", "Timur", "East", 90],
  [180, "جَنُوب", "Selatan", "South", 180],
  [270, "غَرْب", "Barat", "West", 270],
  [45, "شَمَال شَرْق", "Timur Laut", "Northeast", 45],
  [135, "جَنُوب شَرْق", "Tenggara", "Southeast", 135],
  [225, "جَنُوب غَرْب", "Barat Daya", "Southwest", 225],
  [315, "شَمَال غَرْب", "Barat Laut", "Northwest", 315]
];

function initializeClock(svg, settings) {
  const SVG_CONFIG = {
    width: 900,
    height: 900,
    center: {
      x: 450,
      y: 450
    }
  };

  // Clock Radii Configuration (from inner to outer)
  const CLOCK_RADII = {
    hour12: 280,
    hour24: 280 + 70,
    minute: 280 + 70 + 70
  };

  /* NOTE: This is copied here for temporary ref
    if (show12Hour) {
      drawHand(angles.hour12, CLOCK_RADII.hour12 - 35, CLOCK_HANDS.hour12, 'hour12');
    }
    if (show24Hour) {
      drawHand(angles.hour24, CLOCK_RADII.hour24 - 40, CLOCK_HANDS.hour24, 'hour24');
    }
    drawHand(angles.minute, CLOCK_RADII.minute - 20, CLOCK_HANDS.minute, 'minute');
    drawHand(angles.second, CLOCK_RADII.minute - 15, CLOCK_HANDS.second, 'second');
  */

  // Clock hands configuration
  const CLOCK_HANDS = {
    hour24: { color: "red", width: 9 },
    hour12: { color: "green", width: 7 },
    minute: { color: "blue", width: 5 },
    second: { color: "purple", width: 3 }
  };

  let show12Hour = settings.show12Hour;
  let show24Hour = settings.show24Hour;
  let showCompassDirections = settings.showCompassDirections;
  let timezone = settings.timezone;

  // SVG Element Creation Utilities
  function createSVGElement(type, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    return el;
  }

  //
  //    id: 'arrowheadMinute', color: 'blue', fillcolor: 'none'
  //    id: 'arrowheadSecond', color: 'purple, fillcolor: 'none'
  //    id: 'arrowheadHour24', color: 'red', fillcolor: 'none'
  //    id: 'arrowheadHour12', color: 'green', fillcolor: 'none'
  //

  function initializeArrowheads() {
    const defs = createSVGElement('defs');

    const arrowheadConfigs = [
        {
            id: 'arrowheadMinute',
            color: CLOCK_HANDS.minute.color,
            fillcolor: 'none',
            path: 'M0,0 L5,2.5 L0,5 Z',
            size: { width: 8, height: 8, refX: 5, refY: 2.5 }
        },
        {
            id: 'arrowheadSecond',
            color: CLOCK_HANDS.second.color,
            fillcolor: 'none',
            path: 'M0,1 L4,2.5 L0,4 L1,2.5 Z', // Diamond shape
            size: { width: 6, height: 6, refX: 4, refY: 2.5 }
        },
        {
            id: 'arrowheadHour24',
            color: CLOCK_HANDS.hour24.color,
            fillcolor: 'rgba(255,0,0,0.2)',
            path: 'M0,0 L6,3 L0,6 Z',
            size: { width: 10, height: 10, refX: 6, refY: 3 }
        },
        {
            id: 'arrowheadHour12',
            color: CLOCK_HANDS.hour12.color,
            fillcolor: 'rgba(0,255,0,0.2)',
            path: 'M0,0 L6,3 L0,6 Z',
            size: { width: 10, height: 10, refX: 6, refY: 3 }
        }
    ];

    arrowheadConfigs.forEach(config => {
        const marker = createSVGElement('marker', {
            id: config.id,
            markerWidth: config.size.width,
            markerHeight: config.size.height,
            refX: config.size.refX,
            refY: config.size.refY,
            orient: 'auto-start-reverse'
        });

        const path = createSVGElement('path', {
            d: config.path,
            fill: config.fillcolor,
            stroke: config.color,
            'stroke-width': 1
        });

        marker.appendChild(path);
        defs.appendChild(marker);
    });

    // Replace existing defs or add new ones
    const existingDefs = svg.querySelector('defs');
    if (existingDefs) {
        svg.replaceChild(defs, existingDefs);
    } else {
        svg.insertBefore(defs, svg.firstChild);
    }
}

  //---------------------------------------------------------
  // Subject to deletion
  //---------------------------------------------------------
  // Create and append arrowhead marker
  function initializeArrowhead() {
    const marker = createSVGElement('marker', {
      id: 'arrowhead',
      markerWidth: '10',
      markerHeight: '10',
      //refX: '5',
      refX: '0',
      refY: '2.5',
      orient: 'auto-start-reverse'
    });

    const path = createSVGElement('path', {
      d: 'M0,0 L5,2.5 L0,5 Z',
      fill: 'black'
      //fill: 'rgba(255, 0, 0, 0.50)'
    });

    marker.appendChild(path);
    const defs = createSVGElement('defs');
    defs.appendChild(marker);
    svg.insertBefore(defs, svg.firstChild);
  }
  //---------------------------------------------------------

  function drawTimeCircles() {
    const circles = [
      { radius: CLOCK_RADII.minute, color: "blue", strokewidth: '1', fillcolor: 'none' },
      //{ radius: CLOCK_RADII.minute, color: "blue", strokewidth: '1', fillcolor: '#dddddd' },
      //{ radius: CLOCK_RADII.hour24, color: "red", strokewidth: '5', fillcolor: 'none' },
      { radius: CLOCK_RADII.hour24, color: "black", strokewidth: '5', fillcolor: 'none' },
      { radius: CLOCK_RADII.hour12, color: "green", strokewidth: '1', fillcolor: 'none' }
    ];

    circles.forEach(({ radius, color, strokewidth, fillcolor }) => {
      const circle = createSVGElement('circle', {
        cx: SVG_CONFIG.center.x,
        cy: SVG_CONFIG.center.y,
        r: radius,
        stroke: color,
        //'stroke-width': '1',
        'stroke-width': strokewidth,
        //fill: 'none'
        //fill: '#000099'
        fill: fillcolor
      });
      svg.appendChild(circle);
    });
  }

//---------------------------------------------------------
// Subject to deletion
//---------------------------------------------------------
/*
  function drawClockHands() {
    const now = getCurrentTime();
    const angles = calculateClockAngles(now);

    // Remove previous hands
    Array.from(svg.querySelectorAll('.clock-hand')).forEach(hand => hand.remove());

    if (show12Hour) {
      //drawHand(angles.hour12, CLOCK_RADII.hour12, CLOCK_HANDS.hour12);
      drawHand(angles.hour12, CLOCK_RADII.hour12 - 35, CLOCK_HANDS.hour12);
    }
    if (show24Hour) {
      //drawHand(angles.hour24, CLOCK_RADII.hour24, CLOCK_HANDS.hour24);
      drawHand(angles.hour24, CLOCK_RADII.hour24 - 40, CLOCK_HANDS.hour24);
    }
    //drawHand(angles.minute, CLOCK_RADII.minute, CLOCK_HANDS.minute);
    //drawHand(angles.second, CLOCK_RADII.minute, CLOCK_HANDS.second);
    drawHand(angles.minute, CLOCK_RADII.minute - 20, CLOCK_HANDS.minute);
    drawHand(angles.second, CLOCK_RADII.minute - 15, CLOCK_HANDS.second);
  }

  function drawHand(angle, length, style) {
    const { x: centerX, y: centerY } = SVG_CONFIG.center;
    const startX = centerX + Math.cos(angle) * 90; // Inner circle radius
    const startY = centerY + Math.sin(angle) * 90;
    const endX = centerX + Math.cos(angle) * length;
    const endY = centerY + Math.sin(angle) * length;

    const hand = createSVGElement('line', {
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY,
      stroke: style.color,
      'stroke-width': style.width,
      'marker-end': 'url(#arrowhead)',
      class: 'clock-hand'
    });
    svg.appendChild(hand);
  }
*/
//---------------------------------------------------------

  function drawHand(angle, length, style, handType) {
    const { x: centerX, y: centerY } = SVG_CONFIG.center;
    const startX = centerX + Math.cos(angle) * 90; // Inner circle radius
    const startY = centerY + Math.sin(angle) * 90;
    const endX = centerX + Math.cos(angle) * length;
    const endY = centerY + Math.sin(angle) * length;

    // Determine which arrowhead marker to use based on handType
    const markerId = `arrowhead${handType.charAt(0).toUpperCase() + handType.slice(1)}`;

    const hand = createSVGElement('line', {
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY,
      stroke: style.color,
      'stroke-width': style.width,
      'marker-end': `url(#${markerId})`,
      class: 'clock-hand'
    });
    svg.appendChild(hand);
  }

  function drawClockHands() {
    const now = getCurrentTime();
    const angles = calculateClockAngles(now);

    // Remove previous hands
    Array.from(svg.querySelectorAll('.clock-hand')).forEach(hand => hand.remove());

    if (show12Hour) {
      drawHand(angles.hour12, CLOCK_RADII.hour12 - 35, CLOCK_HANDS.hour12, 'hour12');
    }
    if (show24Hour) {
      drawHand(angles.hour24, CLOCK_RADII.hour24 - 40, CLOCK_HANDS.hour24, 'hour24');
    }
    drawHand(angles.minute, CLOCK_RADII.minute - 20, CLOCK_HANDS.minute, 'minute');
    drawHand(angles.second, CLOCK_RADII.minute - 15, CLOCK_HANDS.second, 'second');
  }

  function calculateClockAngles(now) {
    const minutes = now.getMinutes();
    const minuteFraction = minutes / 60;
    const hours = now.getHours();

    return {
      second: (now.getSeconds() / 60) * 2 * Math.PI - Math.PI / 2,
      minute: minuteFraction * 2 * Math.PI - Math.PI / 2,
      hour12: ((hours % 12 + minuteFraction) / 12) * 2 * Math.PI - Math.PI / 2,
      hour24: ((hours + minuteFraction) / 24) * 2 * Math.PI - Math.PI / 2
    };
  }

  function getCurrentTime() {
    if (timezone === 'UTC') {
      const now = new Date();
      return new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    }
    return new Date();
  }

  function updateDigitalClock() {
    const now = getCurrentTime();

    // Get or create SVG text elements
    let timeText = svg.querySelector('.digital-time');
    let dateText = svg.querySelector('.digital-date');
    let dayText = svg.querySelector('.digital-day');

    if (!timeText) {
      timeText = createSVGElement('text', {
        x: SVG_CONFIG.center.x,
        y: SVG_CONFIG.center.y - 20,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-size': '24',
        'font-weight': 'bold',
        class: 'digital-time',
        fill: '#000'
      });
      svg.appendChild(timeText);
    }

    if (!dateText) {
      dateText = createSVGElement('text', {
        x: SVG_CONFIG.center.x,
        //y: SVG_CONFIG.center.y + 15,
        y: SVG_CONFIG.center.y + 35,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-size': '16',
        'font-weight': 'bold',
        class: 'digital-date',
        fill: '#000'
      });
      svg.appendChild(dateText);
    }

    if (!dayText) {
      dayText = createSVGElement('text', {
        x: SVG_CONFIG.center.x,
        y: SVG_CONFIG.center.y + 55,  // Moved down to make room for month
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-size': '14',
        'font-weight': 'bold',
        class: 'digital-day',
        fill: '#333'
      });
      svg.appendChild(dayText);
    }

    // Update the text content
    timeText.textContent = now.toLocaleTimeString(undefined, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    dateText.textContent = `${year}-${month}-${day}`;

    const monthName = now.toLocaleString('en-US', { month: 'long' });
    const weekDay = now.toLocaleString('en-US', { weekday: 'long' });
    dayText.textContent = `${weekDay}`;  // Only weekday

    // Create or update month text
    let monthText = svg.querySelector('.digital-month');
    if (!monthText) {
      monthText = createSVGElement('text', {
        x: SVG_CONFIG.center.x,
        //y: SVG_CONFIG.center.y + 35,
        y: SVG_CONFIG.center.y + 15,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-size': '14',
        class: 'digital-month',
        fill: '#333'
      });
      svg.appendChild(monthText);
    }
    monthText.textContent = monthName;
  } // End of updateDigitalClock() { ... }

  // Draw diameter lines
  function drawDiameterLines() {
    const offset = CLOCK_RADII.minute;
    const { x, y } = SVG_CONFIG.center;

    // Draw the main diameter lines
    ['horizontal', 'vertical', 'diagonal1', 'diagonal2'].forEach(direction => {
      let x1, y1, x2, y2;

      if (direction === 'horizontal') {
        [x1, y1, x2, y2] = [x - offset, y, x + offset, y];
      } else if (direction === 'vertical') {
        [x1, y1, x2, y2] = [x, y - offset, x, y + offset];
      } else {
        const diagOffset = offset / Math.sqrt(2);
        if (direction === 'diagonal1') {
          [x1, y1, x2, y2] = [x - diagOffset, y - diagOffset, x + diagOffset, y + diagOffset];
        } else {
          [x1, y1, x2, y2] = [x - diagOffset, y + diagOffset, x + diagOffset, y - diagOffset];
        }
      }

      const line = createSVGElement('line', {
        x1, y1, x2, y2,
        stroke: 'gray',
        'stroke-width': '1',
        'stroke-dasharray': '4 2'
      });
      svg.appendChild(line);
    });
  } // End of drawDiameterLines() { ... }

  // Draw tick marks and numbers
  function drawTicks() {

    // Minute ticks
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
      const isHour = i % 5 === 0;
      const length = isHour ? 15 : 10;

      const x1 = SVG_CONFIG.center.x + Math.cos(angle) * CLOCK_RADII.minute;
      const y1 = SVG_CONFIG.center.y + Math.sin(angle) * CLOCK_RADII.minute;
      const x2 = SVG_CONFIG.center.x + Math.cos(angle) * (CLOCK_RADII.minute - length);
      const y2 = SVG_CONFIG.center.y + Math.sin(angle) * (CLOCK_RADII.minute - length);

      const tick = createSVGElement('line', {
        x1, y1, x2, y2,
        stroke: 'blue',
        'stroke-width': isHour ? '2' : '1'
      });
      svg.appendChild(tick);

      // Add minute numbers (every 5 minutes)
      if (isHour) {
        const textX = SVG_CONFIG.center.x + Math.cos(angle) * (CLOCK_RADII.minute - 30);
        const textY = SVG_CONFIG.center.y + Math.sin(angle) * (CLOCK_RADII.minute - 30);
        const text = createSVGElement('text', {
          x: textX,
          y: textY,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          'font-size': '14',
          fill: 'blue',
          'font-weight': 'bold'
        });
        text.textContent = i === 0 ? '60' : i;
        svg.appendChild(text);
      }
    }

    // 24-hour ticks
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
      const isMainTick = i % 3 === 0;
      //const length = isMainTick ? 12 : 8;
      const length = isMainTick ? 12 : 12;

      const x1 = SVG_CONFIG.center.x + Math.cos(angle) * CLOCK_RADII.hour24;
      const y1 = SVG_CONFIG.center.y + Math.sin(angle) * CLOCK_RADII.hour24;
      const x2 = SVG_CONFIG.center.x + Math.cos(angle) * (CLOCK_RADII.hour24 - length);
      const y2 = SVG_CONFIG.center.y + Math.sin(angle) * (CLOCK_RADII.hour24 - length);

      const tick = createSVGElement('line', {
        x1, y1, x2, y2,
        //stroke: 'red',
        stroke: 'black',
        //'stroke-width': isMainTick ? '2' : '1'
        //'stroke-width': isMainTick ? '8' : '4'
        'stroke-width': isMainTick ? '8' : '8'
      });
      svg.appendChild(tick);
    }

    // 12-hour ticks
    if (show12Hour) {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
        const length = 10;

        const x1 = SVG_CONFIG.center.x + Math.cos(angle) * CLOCK_RADII.hour12;
        const y1 = SVG_CONFIG.center.y + Math.sin(angle) * CLOCK_RADII.hour12;
        const x2 = SVG_CONFIG.center.x + Math.cos(angle) * (CLOCK_RADII.hour12 - length);
        const y2 = SVG_CONFIG.center.y + Math.sin(angle) * (CLOCK_RADII.hour12 - length);

        const tick = createSVGElement('line', {
          x1, y1, x2, y2,
          stroke: 'green',
          'stroke-width': '2'
        });
        svg.appendChild(tick);
      }
    }

    // 24-hour numbers
    for (let i = 0; i < 24; i++) {
      if (i % 3 === 0) { // Show every 3 hours
        const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
        //const x = SVG_CONFIG.center.x + Math.cos(angle) * (CLOCK_RADII.hour24 - 20);
        //const y = SVG_CONFIG.center.y + Math.sin(angle) * (CLOCK_RADII.hour24 - 20);
        const x = SVG_CONFIG.center.x + Math.cos(angle) * (CLOCK_RADII.hour24 - 35);
        const y = SVG_CONFIG.center.y + Math.sin(angle) * (CLOCK_RADII.hour24 - 35);

        const text = createSVGElement('text', {
          x, y,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          //'font-size': '16',
          //'font-size': '48',
          'font-size': '35',
          //fill: 'red',
          fill: 'black',
          'font-weight': 'bold'
        });
        text.textContent = i === 0 ? '24' : i;
        svg.appendChild(text);
      }
    }

    // 12-hour numbers
    if (show12Hour) {
      for (let i = 1; i <= 12; i++) {
        const angle = ((i - 3) / 12) * 2 * Math.PI;
        const x = SVG_CONFIG.center.x + Math.cos(angle) * (CLOCK_RADII.hour12 - 25);
        const y = SVG_CONFIG.center.y + Math.sin(angle) * (CLOCK_RADII.hour12 - 25);

        const text = createSVGElement('text', {
          x, y,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          //'font-size': '18',
          'font-size': '32',
          fill: 'green',
          'font-weight': 'bold'
        });
        text.textContent = i;
        svg.appendChild(text);
      }
    }

  } // End of function drawTicks() { ... }

  // Draw compass directions
  function drawCompassDirections() {
    // Only draw if the setting is enabled
    if (!showCompassDirections) {
      drawBranding();
      return;
    }

    COMPASS_DIRECTIONS.forEach(([angle, arab, malay, eng, deg]) => {
      const radian = (angle - 90) * Math.PI / 180;
      const x = SVG_CONFIG.center.x + Math.cos(radian) * COMPASS_CONFIG.labelRadius;
      const y = SVG_CONFIG.center.y + Math.sin(radian) * COMPASS_CONFIG.labelRadius;
      const spacing = COMPASS_CONFIG.textBlock.lineSpacing;

      // Arabic text
      const arabicText = createSVGElement('text', {
        x, y: y - spacing,
        'text-anchor': 'middle',
        'font-size': DIRECTION_STYLE.arabic.size,
        'direction': 'rtl',
        'unicode-bidi': 'bidi-override'
      });
      arabicText.textContent = arab;
      svg.appendChild(arabicText);

      // Malay text
      const malayText = createSVGElement('text', {
        x, y,
        'text-anchor': 'middle',
        'font-size': DIRECTION_STYLE.malay.size,
        'font-weight': DIRECTION_STYLE.malay.weight
      });
      malayText.textContent = malay;
      svg.appendChild(malayText);

      // English text
      const engText = createSVGElement('text', {
        x, y: y + spacing,
        'text-anchor': 'middle',
        'font-size': DIRECTION_STYLE.english.size,
        'font-style': DIRECTION_STYLE.english.style
      });
      engText.textContent = eng;
      svg.appendChild(engText);

      // Degree text
      const degText = createSVGElement('text', {
        x, y: y + spacing * 2,
        'text-anchor': 'middle',
        'font-size': DIRECTION_STYLE.degree.size
      });
      degText.textContent = deg + '°';
      svg.appendChild(degText);
    });
  }

  // Draw nighttime background (18:00 to 06:00)
  function drawNighttimeBackground() {
    const { x: cx, y: cy } = SVG_CONFIG.center;
    const innerRadius = CLOCK_RADII.hour12;
    const outerRadius = CLOCK_RADII.hour24;

    // Calculate angles for 18:00 and 06:00 on 24-hour clock
    // Using the same formula as in calculateClockAngles
    const hour18Angle = (18 / 24) * 2 * Math.PI - Math.PI / 2; // 18:00
    const hour06Angle = (6 / 24) * 2 * Math.PI - Math.PI / 2;  // 06:00

    // Calculate start and end points on both circles
    // Start at 18:00 on inner circle
    const startInnerX = cx + Math.cos(hour18Angle) * innerRadius;
    const startInnerY = cy + Math.sin(hour18Angle) * innerRadius;

    // End at 06:00 on inner circle
    const endInnerX = cx + Math.cos(hour06Angle) * innerRadius;
    const endInnerY = cy + Math.sin(hour06Angle) * innerRadius;

    // Start at 18:00 on outer circle
    const startOuterX = cx + Math.cos(hour18Angle) * outerRadius;
    const startOuterY = cy + Math.sin(hour18Angle) * outerRadius;

    // End at 06:00 on outer circle
    const endOuterX = cx + Math.cos(hour06Angle) * outerRadius;
    const endOuterY = cy + Math.sin(hour06Angle) * outerRadius;

    // Create path for the nighttime arc segment
    // The arc goes from 18:00 clockwise through midnight to 06:00 (which is 12 hours = 180 degrees)
    // Since we're going from 18:00 (π) to 06:00 (0), we cross over the top
    // We use largeArcFlag = 1 because we're spanning more than 180 degrees
    const largeArcFlag = 1;
    const sweepFlag = 1; // clockwise direction

    const pathData = [
      `M ${startInnerX} ${startInnerY}`,                                          // Move to 18:00 on inner circle
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} ${sweepFlag} ${endInnerX} ${endInnerY}`, // Arc to 06:00 on inner circle
      `L ${endOuterX} ${endOuterY}`,                                             // Line to 06:00 on outer circle
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${startOuterX} ${startOuterY}`, // Arc back to 18:00 on outer circle (counter-clockwise)
      `Z`                                                                         // Close path
    ].join(' ');

    const nightPath = createSVGElement('path', {
      d: pathData,
      //fill: 'rgba(0, 0, 0, 0.15)',  // Soft dark semi-transparent background
      fill: 'rgba(0, 0, 0, 0.25)',
      //fill: 'rgba(0, 0, 0, 0.50)',
      stroke: 'none'
    });

    svg.appendChild(nightPath);
  }

  // Draw center white circle
  function drawCenterCircle() {
    const circle = createSVGElement('circle', {
      cx: SVG_CONFIG.center.x,
      cy: SVG_CONFIG.center.y,
      r: COMPASS_CONFIG.centerCircle,
      stroke: 'black',
      'stroke-width': '2',
      fill: 'white'
    });
    svg.appendChild(circle);
  }

  // Draw background circle (behind everything else)
  function drawBackgroundCircle() {
    const backgroundRadius = CLOCK_RADII.minute + 25; // 25px gap from outermost circle
    const circle = createSVGElement('circle', {
      cx: SVG_CONFIG.center.x,
      cy: SVG_CONFIG.center.y,
      r: backgroundRadius,
      //fill: 'black',
      //fill: 'white',
      //fill: 'gray',
      fill: '#e0e0e0',
      stroke: 'none'
    });
    svg.appendChild(circle);
  }

  function drawBackgroundCircleMinute() {
    const backgroundRadius = CLOCK_RADII.minute;
    const circle = createSVGElement('circle', {
      cx: SVG_CONFIG.center.x,
      cy: SVG_CONFIG.center.y,
      r: backgroundRadius,
      //fill: 'black',
      //fill: '#6db6ff',
      //fill: '#b5dafe',
      fill: '#d1e9ff',
      stroke: 'none'
    });
    svg.appendChild(circle);
  }

  function drawBackgroundCircleHour24() {
    const backgroundRadius = CLOCK_RADII.hour24;
    const circle = createSVGElement('circle', {
      cx: SVG_CONFIG.center.x,
      cy: SVG_CONFIG.center.y,
      r: backgroundRadius,
      //fill: 'black',
      //fill: 'gray',
      fill: 'white',
      stroke: 'none'
    });
    svg.appendChild(circle);
  }

  function drawBackgroundCircleHour12() {
    const backgroundRadius = CLOCK_RADII.hour12;
    const circle = createSVGElement('circle', {
      cx: SVG_CONFIG.center.x,
      cy: SVG_CONFIG.center.y,
      r: backgroundRadius,
      //fill: 'black',
      //fill: '#b66dff',
      //fill: '#71c0a7',
      fill: '#cae7d3',
      stroke: 'none'
    });
    svg.appendChild(circle);
  }

  function drawBranding() {
    const { x: centerX, y: centerY } = SVG_CONFIG.center;

    // Position the branding below the center circle (adjust 120 as needed)
    const brandingY = centerY + COMPASS_CONFIG.centerCircle + 50;

    // Main brand name
    const brandText = createSVGElement('text', {
        x: centerX,
        y: brandingY,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-size': '20',
        'font-weight': 'bold',
        fill: '#000000', // Black color, change as needed
        class: 'brand-text'
    });
    //brandText.textContent = 'NJB1337';
    brandText.textContent = 'NAJIB';
    svg.appendChild(brandText);

    // "Made in Malaysia" text
    const madeInText = createSVGElement('text', {
        x: centerX,
        y: brandingY + 25, // Position below main brand
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-size': '14',
        fill: '#333333', // Dark gray color
        class: 'brand-subtext'
    });
    madeInText.textContent = 'Made in Malaysia';
    svg.appendChild(madeInText);
  }

  // Initialize clock
  //initializeArrowhead();
  //initializeArrowheads();
  drawBackgroundCircle();  // Draw background first (behind everything)
  drawBackgroundCircleMinute();
  drawBackgroundCircleHour24();
  drawBackgroundCircleHour12();
  drawDiameterLines();
  drawNighttimeBackground();  // Draw nighttime background before circles
  drawTimeCircles();
  drawTicks();
  drawCompassDirections();
  drawCenterCircle();
  //drawBranding();

  // Start the clocks
  updateDigitalClock();
  drawClockHands();

  // Store the interval ID so we can clear it when reinitializing
  window.clockInterval = window.clockInterval || null;

  // Clear any existing interval
  if (window.clockInterval) {
    clearInterval(window.clockInterval);
  }

  // Start new interval
  window.clockInterval = setInterval(() => {
    updateDigitalClock();
    drawClockHands();
  }, 1000);

  // Settings handlers - already handled in initializeSettings()
} // End of function initializeClock(svg, settings) { ... }
