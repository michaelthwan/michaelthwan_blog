/**
 * S&P 500 Historical Charts — Chart.js Implementation
 * Three era charts with event annotations showing how major events drove market performance.
 */

/* ============================================
   S&P 500 HISTORICAL DATA
   Approximate monthly/quarterly data for key periods, annual otherwise.
   Format: [year_decimal, sp500_price]
   ============================================ */

const SP500_DATA = [
    // 1926-1929: Roaring Twenties
    [1926.0, 13.5], [1926.5, 14.2], [1927.0, 15.3], [1927.5, 16.8],
    [1928.0, 17.5], [1928.3, 19.0], [1928.5, 20.5], [1928.8, 23.0],
    [1929.0, 24.4], [1929.3, 27.0], [1929.5, 29.5], [1929.7, 31.9],
    [1929.8, 25.0], [1929.9, 21.5],

    // 1930-1932: Great Depression
    [1930.0, 21.1], [1930.2, 25.9], [1930.5, 22.0], [1930.8, 16.5],
    [1931.0, 15.8], [1931.2, 18.4], [1931.5, 14.5], [1931.8, 9.3],
    [1932.0, 8.3], [1932.2, 6.2], [1932.4, 4.4],
    [1932.6, 7.7], [1932.8, 7.0],

    // 1933-1937: New Deal & Recovery
    [1933.0, 8.5], [1933.2, 7.8], [1933.5, 11.2], [1933.8, 10.0],
    [1934.0, 10.5], [1934.2, 11.8], [1934.5, 9.4], [1934.8, 9.5],
    [1935.0, 10.0], [1935.3, 10.6], [1935.5, 11.5], [1935.8, 12.5],
    [1936.0, 13.7], [1936.3, 14.8], [1936.5, 15.5], [1936.8, 17.0],
    [1937.0, 17.6], [1937.2, 18.7],
    [1937.5, 15.5], [1937.7, 12.5], [1937.9, 10.6],

    // 1938-1942: Roosevelt Recession & WW2
    [1938.0, 11.5], [1938.2, 8.5],
    [1938.5, 12.0], [1938.8, 13.2],
    [1939.0, 12.5], [1939.4, 11.3], [1939.7, 12.5],
    [1940.0, 12.3], [1940.3, 11.0], [1940.5, 10.2], [1940.8, 10.6],
    [1941.0, 10.6], [1941.3, 9.8], [1941.5, 9.5], [1941.9, 8.7],
    [1942.0, 8.4], [1942.3, 7.5],
    [1942.5, 8.5], [1942.8, 9.8],

    // 1943-1949: WW2 Recovery
    [1943.0, 10.1], [1943.5, 12.0], [1944.0, 11.9], [1944.5, 12.7],
    [1945.0, 13.5], [1945.3, 15.2], [1945.6, 17.5],
    [1946.0, 18.5], [1946.2, 19.3], [1946.5, 15.7], [1946.8, 14.5],
    [1947.0, 15.2], [1947.5, 15.0], [1948.0, 15.7], [1948.5, 15.5],
    [1949.0, 14.8], [1949.5, 14.3],

    // 1950-1958: Post-war boom
    [1950.0, 17.0], [1950.5, 18.4],
    [1951.0, 22.0], [1951.5, 23.5], [1952.0, 26.6], [1952.5, 25.5],
    [1953.0, 26.2], [1953.5, 24.5],
    [1954.0, 26.1], [1954.5, 31.5],
    [1955.0, 36.8], [1955.5, 43.0],
    [1956.0, 44.2], [1956.5, 47.0],
    [1957.0, 45.4], [1957.4, 49.1],
    [1957.8, 39.0],
    [1958.0, 41.7], [1958.3, 44.5], [1958.6, 47.5], [1958.9, 55.2],

    // 1959-1962
    [1959.0, 55.5], [1959.5, 57.5], [1960.0, 59.9], [1960.5, 55.5],
    [1961.0, 59.5], [1961.3, 64.0], [1961.6, 67.5], [1961.9, 71.6],
    [1962.0, 71.1],
    [1962.3, 60.0], [1962.5, 52.3],
    [1962.7, 56.5], [1962.9, 62.0],

    // 1963-1970: Go-Go Years & Vietnam
    [1963.0, 63.1], [1963.5, 70.0], [1964.0, 75.0], [1964.5, 82.5],
    [1965.0, 84.8], [1965.5, 88.5],
    [1966.0, 92.4], [1966.1, 94.1],
    [1966.5, 83.5], [1966.8, 73.2],
    [1967.0, 80.3], [1967.3, 89.0], [1967.6, 92.0],
    [1968.0, 96.5], [1968.3, 98.0], [1968.6, 103.0], [1968.9, 108.4],
    [1969.0, 103.9], [1969.3, 101.0], [1969.6, 97.0], [1969.9, 93.0],
    [1970.0, 90.3], [1970.2, 78.0], [1970.4, 69.3],
    [1970.6, 78.0], [1970.9, 92.2],

    // 1971-1982: Oil Shock & Stagflation
    [1971.0, 95.0], [1971.5, 99.0], [1972.0, 102.1], [1972.5, 110.0],
    [1973.0, 118.1], [1973.1, 120.2],
    [1973.5, 105.0], [1973.8, 95.0],
    [1974.0, 97.6], [1974.3, 86.0], [1974.5, 80.0],
    [1974.8, 62.3],
    [1975.0, 70.2], [1975.5, 88.0],
    [1976.0, 90.2], [1976.5, 101.5],
    [1977.0, 107.5], [1977.5, 98.0],
    [1978.0, 95.1], [1978.5, 98.0],
    [1979.0, 96.1], [1979.5, 103.0],
    [1980.0, 107.9], [1980.2, 102.1],
    [1980.5, 115.0], [1980.8, 128.0],
    [1981.0, 135.8], [1981.5, 128.0],
    [1982.0, 122.6], [1982.5, 102.4],
    [1982.7, 115.0], [1982.9, 133.0],

    // 1983-1991: Reaganomics & Black Monday
    [1983.0, 140.6], [1983.5, 165.0],
    [1984.0, 164.9], [1984.5, 160.0],
    [1985.0, 167.2], [1985.5, 190.0],
    [1986.0, 211.3], [1986.5, 236.0],
    [1987.0, 242.2], [1987.3, 290.0], [1987.6, 337.9],
    [1987.75, 224.8],
    [1987.9, 247.1],
    [1988.0, 250.5], [1988.5, 265.0],
    [1989.0, 277.7], [1989.3, 300.0], [1989.6, 340.0], [1989.8, 359.8],
    [1990.0, 339.0], [1990.3, 350.0], [1990.5, 355.0],
    [1990.8, 295.5],
    [1991.0, 312.5], [1991.3, 370.0], [1991.5, 380.0], [1991.9, 417.1],

    // 1992-2000: Roaring Nineties
    [1992.0, 420.0], [1992.5, 415.0],
    [1993.0, 435.7], [1993.5, 450.0],
    [1994.0, 466.5], [1994.5, 458.0],
    [1995.0, 459.3], [1995.5, 560.0],
    [1996.0, 615.9], [1996.5, 680.0],
    [1997.0, 740.7], [1997.5, 900.0],
    [1998.0, 970.4], [1998.3, 1100.0], [1998.5, 1186.8],
    [1998.6, 957.3],
    [1998.8, 1050.0], [1999.0, 1229.2], [1999.5, 1350.0],
    [2000.0, 1469.3], [2000.2, 1527.5],
    [2000.5, 1450.0], [2000.8, 1350.0],

    // 2001-2009: Dot-com bust & Housing
    [2001.0, 1320.3], [2001.3, 1170.0], [2001.5, 1200.0],
    [2001.7, 1040.0],
    [2002.0, 1148.1], [2002.3, 1070.0], [2002.5, 990.0],
    [2002.8, 776.8],
    [2003.0, 855.7], [2003.3, 920.0], [2003.5, 990.0], [2003.8, 1050.0],
    [2004.0, 1111.9], [2004.5, 1140.0],
    [2005.0, 1211.9], [2005.5, 1220.0],
    [2006.0, 1248.3], [2006.5, 1340.0],
    [2007.0, 1418.3], [2007.5, 1503.0], [2007.8, 1565.2],
    [2008.0, 1380.0], [2008.3, 1330.0], [2008.5, 1280.0],
    [2008.7, 1200.0], [2008.85, 900.0],
    [2009.0, 826.0], [2009.2, 666.8],
    [2009.5, 920.0], [2009.8, 1050.0],

    // 2010-2024: Recovery & Modern Era
    [2010.0, 1115.1], [2010.3, 1170.0], [2010.5, 1050.0], [2010.8, 1180.0],
    [2011.0, 1257.6], [2011.3, 1363.6],
    [2011.5, 1280.0], [2011.7, 1120.0], [2011.8, 1099.2],
    [2012.0, 1257.6], [2012.5, 1360.0],
    [2013.0, 1426.2], [2013.5, 1680.0],
    [2014.0, 1848.4], [2014.5, 1975.0],
    [2015.0, 2058.9], [2015.5, 2100.0], [2015.7, 1880.0],
    [2016.0, 2043.9], [2016.2, 1830.0], [2016.5, 2100.0],
    [2017.0, 2238.8], [2017.5, 2470.0],
    [2018.0, 2673.6], [2018.5, 2790.0], [2018.7, 2930.8],
    [2018.9, 2351.1],
    [2019.0, 2507.0], [2019.3, 2800.0], [2019.5, 2950.0], [2019.8, 3140.0],
    [2020.0, 3257.0], [2020.1, 3386.2],
    [2020.22, 2237.4],
    [2020.5, 3100.0], [2020.8, 3500.0],
    [2021.0, 3756.1], [2021.3, 4020.0], [2021.5, 4400.0], [2021.8, 4700.0],
    [2022.0, 4796.6],
    [2022.3, 4530.0], [2022.5, 3900.0], [2022.7, 4100.0],
    [2022.8, 3577.0],
    [2023.0, 3925.0], [2023.3, 4100.0], [2023.5, 4450.0], [2023.8, 4550.0],
    [2024.0, 4770.0], [2024.3, 5100.0], [2024.5, 5350.0], [2024.8, 5900.0]
];

/* ============================================
   EVENT ANNOTATIONS
   Each event has: year, price (on the line), label text, type (bull/bear),
   and dy (pixel offset: negative=above, positive=below)
   ============================================ */

const EVENTS_ERA1 = [
    { year: 1928.5, price: 20.5, label: 'Roaring Twenties +193%', type: 'bull', dy: -42 },
    { year: 1932.6, price: 7.7, label: 'Rebound +92%', type: 'bull', dy: -28 },
    { year: 1935.0, price: 10.0, label: 'New Deal +105%', type: 'bull', dy: -40 },
    { year: 1936.5, price: 15.5, label: 'GD Recovery +135%', type: 'bull', dy: -30 },
    { year: 1939.0, price: 12.5, label: 'GD Recovery II +65%', type: 'bull', dy: -28 },
    { year: 1945.6, price: 17.5, label: 'End of WW2 +210%', type: 'bull', dy: -38 },
    { year: 1955.0, price: 36.8, label: 'Post WW2 Bull +495%', type: 'bull', dy: -40 },
    { year: 1957.8, price: 39.0, label: 'Eisenhower Recession -15%', type: 'bear', dy: 22, dx: 30 },
    { year: 1930.5, price: 22.0, label: 'Great Depression -83%', type: 'bear', dy: 35 },
    { year: 1933.0, price: 8.5, label: '1932-33 Bear -30%', type: 'bear', dy: 28 },
    { year: 1934.5, price: 9.4, label: '1934 Bear -21%', type: 'bear', dy: 24 },
    { year: 1938.2, price: 8.5, label: 'Roosevelt Recession -50%', type: 'bear', dy: 26 },
    { year: 1942.3, price: 7.5, label: 'Start of WW2 -30%', type: 'bear', dy: 24 },
    { year: 1946.5, price: 15.7, label: 'Post WW2 Bear -22%', type: 'bear', dy: 26 },
];

const EVENTS_ERA2 = [
    { year: 1960.5, price: 55.5, label: 'Cold War +105%', type: 'bull', dy: -36 },
    { year: 1964.0, price: 75.0, label: '1962-65 Bull +90%', type: 'bull', dy: -32 },
    { year: 1967.6, price: 92.0, label: 'Go-Go Years +52%', type: 'bull', dy: -32 },
    { year: 1972.5, price: 110.0, label: 'Nifty Fifty +76%', type: 'bull', dy: -36 },
    { year: 1979.5, price: 103.0, label: 'Oil Shock Recovery +198%', type: 'bull', dy: -36 },
    { year: 1986.0, price: 211.3, label: 'Reaganomics +282%', type: 'bull', dy: -40 },
    { year: 1989.6, price: 340.0, label: 'Black Monday Recovery +71%', type: 'bull', dy: -36 },
    { year: 1962.5, price: 52.3, label: 'Kennedy Slide -22%', type: 'bear', dy: 30 },
    { year: 1966.5, price: 83.5, label: '1966 Bear -16%', type: 'bear', dy: 26 },
    { year: 1970.4, price: 69.3, label: 'Vietnam & Inflation -29%', type: 'bear', dy: 28 },
    { year: 1974.8, price: 62.3, label: 'Oil Shock -43%', type: 'bear', dy: 26 },
    { year: 1980.2, price: 102.1, label: 'Volcker Disinflation -17%', type: 'bear', dy: 26 },
    { year: 1987.75, price: 224.8, label: 'Black Monday -30%', type: 'bear', dy: 28 },
    { year: 1990.8, price: 295.5, label: 'Gulf War -15%', type: 'bear', dy: 24, dx: 20 },
];

const EVENTS_ERA3 = [
    { year: 1996.0, price: 615.9, label: 'Roaring Nineties +355%', type: 'bull', dy: -38 },
    { year: 1999.0, price: 1229.2, label: 'Asian Crisis Recovery +63%', type: 'bull', dy: -32, dx: -10 },
    { year: 2006.5, price: 1340.0, label: 'Housing Bubble +100%', type: 'bull', dy: -36 },
    { year: 2012.0, price: 1257.6, label: 'GR Recovery +94%', type: 'bull', dy: -32 },
    { year: 2017.0, price: 2238.8, label: 'GR Recovery II +240%', type: 'bull', dy: -38 },
    { year: 2021.0, price: 3756.1, label: 'Pandemic Rally +90%', type: 'bull', dy: -36 },
    { year: 2024.5, price: 5350.0, label: 'Post Pandemic +38%', type: 'bull', dy: -34 },
    { year: 1998.6, price: 957.3, label: 'Asian Crisis -15%', type: 'bear', dy: 28 },
    { year: 2001.5, price: 1200.0, label: 'Dot-com Bubble -43%', type: 'bear', dy: 28 },
    { year: 2009.2, price: 666.8, label: 'Great Recession -51%', type: 'bear', dy: 28 },
    { year: 2011.8, price: 1099.2, label: '2011 Bear -16%', type: 'bear', dy: 26 },
    { year: 2020.22, price: 2237.4, label: 'Covid -20%', type: 'bear', dy: 24, dx: -25 },
    { year: 2022.8, price: 3577.0, label: 'Ukraine & Inflation -24%', type: 'bear', dy: 28, dx: 20 },
];

/* ============================================
   CHART.JS CUSTOM PLUGIN — Event Annotations
   Draws labeled markers on the chart canvas.
   ============================================ */

const eventAnnotationPlugin = {
    id: 'eventAnnotations',
    afterDraw(chart) {
        const events = chart.config.options.plugins.eventAnnotations;
        if (!events || !events.length) return;

        const { ctx } = chart;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        const meta = chart.getDatasetMeta(0);
        const renderedPoints = meta.data;
        const dataset = chart.data.datasets[0].data;

        events.forEach(event => {
            // Snap dot to the actual rendered line by finding nearest data point
            let nearestIdx = 0;
            let minDist = Infinity;
            for (let i = 0; i < dataset.length; i++) {
                const dist = Math.abs(dataset[i].x - event.year);
                if (dist < minDist) {
                    minDist = dist;
                    nearestIdx = i;
                }
            }
            // Use the rendered pixel position so the dot sits exactly on the line
            const xPixel = renderedPoints[nearestIdx].x;
            const yPixel = renderedPoints[nearestIdx].y;
            const isBull = event.type === 'bull';

            const textColor = isBull ? '#1b5e20' : '#b71c1c';
            const bgColor = isBull ? 'rgba(232,245,233,0.92)' : 'rgba(255,235,238,0.92)';
            const borderColor = isBull ? '#66bb6a' : '#ef5350';
            const dotColor = isBull ? '#2e7d32' : '#c62828';

            const dy = event.dy || (isBull ? -35 : 28);
            const dx = event.dx || 0;
            const labelX = xPixel + dx;
            const labelY = yPixel + dy;

            ctx.save();

            // Connecting line
            ctx.beginPath();
            ctx.setLineDash([2, 2]);
            ctx.moveTo(xPixel, yPixel);
            const lineEndY = dy < 0 ? labelY + 9 : labelY - 9;
            ctx.lineTo(labelX, lineEndY);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);

            // Dot at data point
            ctx.beginPath();
            ctx.arc(xPixel, yPixel, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = dotColor;
            ctx.fill();

            // Measure text
            ctx.font = '600 9.5px Inter, system-ui, sans-serif';
            const textWidth = ctx.measureText(event.label).width;
            const pad = 5;
            const boxW = textWidth + pad * 2;
            const boxH = 18;
            const boxX = labelX - boxW / 2;
            const boxY = labelY - boxH / 2;

            // Clamp to chart area
            const chartLeft = xScale.left;
            const chartRight = xScale.right;
            let clampedBoxX = boxX;
            if (clampedBoxX < chartLeft) clampedBoxX = chartLeft + 2;
            if (clampedBoxX + boxW > chartRight) clampedBoxX = chartRight - boxW - 2;

            // Label background
            ctx.fillStyle = bgColor;
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(clampedBoxX, boxY, boxW, boxH, 3);
            ctx.fill();
            ctx.stroke();

            // Label text
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(event.label, clampedBoxX + boxW / 2, labelY);

            ctx.restore();
        });
    }
};

/* ============================================
   CHART CREATION
   ============================================ */

function filterData(startYear, endYear) {
    return SP500_DATA
        .filter(d => d[0] >= startYear && d[0] <= endYear)
        .map(d => ({ x: d[0], y: d[1] }));
}

function createEraChart(canvasId, startYear, endYear, events, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const data = filterData(startYear, endYear);

    Chart.register(eventAnnotationPlugin);

    new Chart(canvas, {
        type: 'line',
        data: {
            datasets: [{
                data: data,
                borderColor: '#1565c0',
                backgroundColor: 'rgba(21, 101, 192, 0.06)',
                borderWidth: 2,
                fill: true,
                pointRadius: 0,
                pointHitRadius: 8,
                tension: 0.3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: title,
                    font: { size: 14, family: 'Inter, system-ui, sans-serif', weight: '600' },
                    color: '#333',
                    padding: { bottom: 16 }
                },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    titleColor: '#333',
                    bodyColor: '#555',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    titleFont: { family: 'Inter, system-ui, sans-serif', weight: '600' },
                    bodyFont: { family: 'Inter, system-ui, sans-serif' },
                    cornerRadius: 4,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        title(items) {
                            const yearVal = items[0].parsed.x;
                            const year = Math.floor(yearVal);
                            const month = Math.round((yearVal - year) * 12);
                            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                            return `${months[month] || 'Jan'} ${year}`;
                        },
                        label(item) {
                            return `S&P 500: ${item.parsed.y.toLocaleString(undefined, {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1
                            })}`;
                        }
                    }
                },
                eventAnnotations: events
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Year',
                        font: { size: 12, family: 'Inter, system-ui, sans-serif' },
                        color: '#777'
                    },
                    min: startYear,
                    max: endYear,
                    ticks: {
                        stepSize: 2,
                        font: { size: 10, family: 'Inter, system-ui, sans-serif' },
                        color: '#999',
                        callback: v => v % 2 === 0 ? v : ''
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.04)',
                        drawTicks: true
                    }
                },
                y: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'S&P 500',
                        font: { size: 12, family: 'Inter, system-ui, sans-serif' },
                        color: '#777'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.04)'
                    },
                    ticks: {
                        font: { size: 10, family: 'Inter, system-ui, sans-serif' },
                        color: '#999',
                        callback: function(value) {
                            const vals = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
                            if (vals.includes(value)) return value.toLocaleString();
                            // Also show nice intermediate values
                            if ([0.5, 0.1, 0.2, 4, 8, 15, 25, 40, 60, 80, 150, 250, 400, 600, 800, 1500, 2500, 3000, 4000, 6000].includes(value)) return value.toLocaleString();
                            return '';
                        }
                    }
                }
            }
        }
    });
}

/* ============================================
   FULL TIMELINE CHART (overview)
   ============================================ */

function createOverviewChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const data = SP500_DATA.map(d => ({ x: d[0], y: d[1] }));

    // Key events for the overview (fewer, only the biggest)
    const overviewEvents = [
        { year: 1929.7, price: 31.9, label: 'Great Depression', type: 'bear', dy: -30 },
        { year: 1932.4, price: 4.4, label: 'Bottom -83%', type: 'bear', dy: 22 },
        { year: 1942.3, price: 7.5, label: 'WW2 Low', type: 'bear', dy: 22 },
        { year: 1955.0, price: 36.8, label: 'Post-War Boom', type: 'bull', dy: -32 },
        { year: 1974.8, price: 62.3, label: 'Oil Crisis -43%', type: 'bear', dy: 24 },
        { year: 1987.75, price: 224.8, label: 'Black Monday', type: 'bear', dy: 24 },
        { year: 2000.2, price: 1527.5, label: 'Dot-com Peak', type: 'bear', dy: -30 },
        { year: 2009.2, price: 666.8, label: 'GFC Bottom -51%', type: 'bear', dy: 22 },
        { year: 2020.22, price: 2237.4, label: 'Covid -20%', type: 'bear', dy: 22 },
        { year: 2024.5, price: 5350.0, label: '~$5,900', type: 'bull', dy: -28 },
    ];

    Chart.register(eventAnnotationPlugin);

    new Chart(canvas, {
        type: 'line',
        data: {
            datasets: [{
                data: data,
                borderColor: '#1565c0',
                backgroundColor: 'rgba(21, 101, 192, 0.08)',
                borderWidth: 2,
                fill: true,
                pointRadius: 0,
                pointHitRadius: 8,
                tension: 0.3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', axis: 'x', intersect: false },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'S&P 500: 1926 — 2024  (Log Scale)',
                    font: { size: 15, family: 'Inter, system-ui, sans-serif', weight: '600' },
                    color: '#333',
                    padding: { bottom: 16 }
                },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    titleColor: '#333',
                    bodyColor: '#555',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    displayColors: false,
                    titleFont: { family: 'Inter, system-ui, sans-serif', weight: '600' },
                    bodyFont: { family: 'Inter, system-ui, sans-serif' },
                    cornerRadius: 4,
                    padding: 10,
                    callbacks: {
                        title(items) {
                            const yearVal = items[0].parsed.x;
                            const year = Math.floor(yearVal);
                            const month = Math.round((yearVal - year) * 12);
                            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                            return `${months[month] || 'Jan'} ${year}`;
                        },
                        label(item) {
                            return `S&P 500: ${item.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
                        }
                    }
                },
                eventAnnotations: overviewEvents
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 1926,
                    max: 2025,
                    title: {
                        display: true,
                        text: 'Year',
                        font: { size: 12, family: 'Inter, system-ui, sans-serif' },
                        color: '#777'
                    },
                    ticks: {
                        stepSize: 5,
                        font: { size: 10, family: 'Inter, system-ui, sans-serif' },
                        color: '#999',
                        callback: v => v % 10 === 0 ? v : ''
                    },
                    grid: { color: 'rgba(0,0,0,0.04)' }
                },
                y: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'S&P 500 (Log Scale)',
                        font: { size: 12, family: 'Inter, system-ui, sans-serif' },
                        color: '#777'
                    },
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: {
                        font: { size: 10, family: 'Inter, system-ui, sans-serif' },
                        color: '#999',
                        callback: function(value) {
                            const vals = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
                            if (vals.includes(value)) return value.toLocaleString();
                            return '';
                        }
                    }
                }
            }
        }
    });
}

/* ============================================
   INITIALIZATION
   ============================================ */

function initSP500Charts() {
    createOverviewChart('sp500-overview');
    createEraChart('sp500-era1', 1926, 1959, EVENTS_ERA1, 'S&P 500 Performance: 1926 — 1958');
    createEraChart('sp500-era2', 1959, 1992, EVENTS_ERA2, 'S&P 500 Performance: 1959 — 1991');
    createEraChart('sp500-era3', 1992, 2025, EVENTS_ERA3, 'S&P 500 Performance: 1992 — 2024');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSP500Charts);
} else {
    initSP500Charts();
}
