const weatherIconMapping = {
    "0": "unknown.svg",
    "1000": "clear_day.svg",
    "1001": "cloudy.svg",
    "1100": "mostly_clear_day.svg",
    "1101": "partly_cloudy_day.svg",
    "1102": "mostly_cloudy.svg",
    "2000": "fog.svg",
    "2100": "light_fog.svg",
    "3000": "light_wind.jpg",
    "3001": "wind.png",
    "3002": "strong_wind.png",
    "4000": "drizzle.svg",
    "4001": "rain.svg",
    "4200": "light_rain.svg",
    "4201": "heavy_rain.svg",
    "5000": "snow.svg",
    "5001": "flurries.svg",
    "5100": "light_snow.svg",
    "5101": "heavy_snow.svg",
    "6000": "freezing_drizzle.svg",
    "6001": "freezing_rain.svg",
    "6200": "light_freezing_rain.svg",
    "6201": "heavy_freezing_rain.svg",
    "7000": "ice_pellets.svg",
    "7101": "heavy_ice_pellets.svg",
    "7102": "light_ice_pellets.svg",
    "8000": "thunderstorm.svg"
};

const weatherTextMapping = {
    "0": "Unknown",
    "1000": "Clear",
    "1100": "Mostly Clear",
    "1101": "Partly Cloudy",
    "1102": "Mostly Cloudy",
    "1001": "Cloudy",
    "2000": "Fog",
    "2100": "Light Fog",
    "4000": "Drizzle",
    "4001": "Rain",
    "4200": "Light Rain",
    "4201": "Heavy Rain",
    "5000": "Snow",
    "5001": "Flurries",
    "5100": "Light Snow",
    "5101": "Heavy Snow",
    "6000": "Freezing Drizzle",
    "6001": "Freezing Rain",
    "6200": "Light Freezing Rain",
    "6201": "Heavy Freezing Rain",
    "7000": "Ice Pellets",
    "7101": "Heavy Ice Pellets",
    "7102": "Light Ice Pellets",
    "8000": "Thunderstorm"
};

window.onload = function() {
    document.getElementById("errorBlock").style.display = "none";
};


document.getElementById("mainForm").addEventListener("submit", function(event) {
    event.preventDefault(); 

    const autoDetectChecked = document.getElementById("autoDetect").checked;

    if (autoDetectChecked) {
        fetch('https://ipinfo.io/json?token=28f772be3811cd')
            .then(response => response.json())
            .then(ipData => {
                return fetch("/get_weather_auto", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(ipData),
                });
            })
            .then(response => response.json())
            .then(data => {
                if (data.error || !data.location || !data.weatherCode) {
                    document.getElementById("errorBlock").style.display = "block";
                    document.getElementById("weatherInfo").style.display = "none";
                } else {
                    document.getElementById("errorBlock").style.display = "none";
                    displayWeatherInfo(data);
                }
            })
            
            .catch(error => {
                console.error('Error:', error);
                document.getElementById("errorBlock").style.display = "block";
                document.getElementById("weatherInfo").style.display = "none";
            });
            
    }
    
    else {
        let isFormValid = true;
        document.getElementById("streetError").style.display = "none";
        document.getElementById("cityError").style.display = "none";
        document.getElementById("stateError").style.display = "none";

        const street = document.getElementById("street").value.trim();
        const city = document.getElementById("city").value.trim();
        const state = document.getElementById("state").value;

        if (!street) {
            document.getElementById("streetError").style.display = "block";
            return;
        }

        if (!city) {
            document.getElementById("cityError").style.display = "block";
            return;
        }

        if (!state) {
            document.getElementById("stateError").style.display = "block";
            return;
        }

        const queryString = `street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`;
        fetch(`/get_weather?${queryString}`)
            .then(response => response.json())
            .then(data => {
                if (data.error || !data.location || !data.weatherCode) {
                    document.getElementById("errorBlock").style.display = "block";
                    document.getElementById("weatherInfo").style.display = "none"; 
                } else {
                    document.getElementById("errorBlock").style.display = "none";
                    displayWeatherInfo(data);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById("errorBlock").style.display = "block";
                document.getElementById("weatherInfo").style.display = "none";
            });
        
        const hourlyQueryString = `street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`;
        fetch(`/get_weather_hourly?${hourlyQueryString}`)
        .then(response => response.json())
        .then(data => {
            // console.log("after fetch, before display hourly");
            // console.log("Hourly: ", data);
            if (data.error) {
                document.getElementById("errorBlock").style.display = "block";
                document.getElementById("weatherInfo").style.display = "none"; 
            } else {
                // console.log("else hourly");
                document.getElementById("errorBlock").style.display = "none";
                displayHourlyWeatherInfo(data);
                window.meteogram = new Meteogram(data.hourly_forecast, 'chart2');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById("errorBlock").style.display = "block";
            document.getElementById("weatherInfo").style.display = "none";
        });
    }
});

function Meteogram(json, container) {
    this.humidity = [];
    this.windDirection = [];
    this.winds = [];
    this.temperatures = [];
    this.pressures = [];

    this.json = json;
    this.container = container;

    
    this.parseYrData();
}

/**
 * Handle the data. This part of the code is not Highcharts specific, but deals
 * with yr.no's specific data format
 */
Meteogram.prototype.parseYrData = function () {
    if (!this.json) {
        return this.error();
    }

    // Loop over hourly (or 6-hourly) forecasts
    this.json.forEach((node, i) => {
        const x = Date.parse(node.time);


        this.temperatures.push({
            x,
            y: node.temperature
            // custom options used in the tooltip formatter
        });

        this.humidity.push({
            x,
            y: node.humidity
        });


        this.winds.push({
            x,
            value: node.windSpeed,
            direction: node.windDirection
        });


        this.pressures.push({
            x,
            y: node.pressureSeaLevel
        });

    });
    console.log(this.pressures);
    console.log(this.temperatures);
    console.log(this.humidity);
    console.log(this.winds);

    // Create the chart when the data is loaded
    this.createChart();
};
// End of the Meteogram protype

Meteogram.prototype.drawBlocksForWindArrows = function (chart) {
    const xAxis = chart.xAxis[0];

    for (
        let pos = xAxis.min, max = xAxis.max, i = 0;
        pos <= max + 36e5; pos += 36e5,
        i += 1
    ) {

        // Get the X position
        const isLast = pos === max + 36e5,
            x = Math.round(xAxis.toPixels(pos)) + (isLast ? 0.5 : -0.5);

        // Draw the vertical dividers and ticks
        const isLong = this.resolution > 36e5 ?
            pos % this.resolution === 0 :
            i % 2 === 0;

        chart.renderer
            .path([
                'M', x, chart.plotTop + chart.plotHeight + (isLong ? 0 : 28),
                'L', x, chart.plotTop + chart.plotHeight + 32,
                'Z'
            ])
            .attr({
                stroke: chart.options.chart.plotBorderColor,
                'stroke-width': 1
            })
            .add();
    }

    // Center items in block
    chart.get('windbarbs').markerGroup.attr({
        translateX: chart.get('windbarbs').markerGroup.translateX + 8
    });

};

/**
 * Build and return the Highcharts options structure
 */
Meteogram.prototype.getChartOptions = function () {
    return {
        chart: {
            renderTo: this.container,
            marginBottom: 70,
            marginRight: 40,
            marginTop: 50,
            plotBorderWidth: 1,
            //height: 400,
            alignTicks: false,
            scrollablePlotArea: {
                minWidth: 720
            }
        },

        defs: {
            patterns: [{
                id: 'precipitation-error',
                path: {
                    d: [
                        'M', 3.3, 0, 'L', -6.7, 10,
                        'M', 6.7, 0, 'L', -3.3, 10,
                        'M', 10, 0, 'L', 0, 10,
                        'M', 13.3, 0, 'L', 3.3, 10,
                        'M', 16.7, 0, 'L', 6.7, 10
                    ].join(' '),
                    stroke: '#68CFE8',
                    strokeWidth: 1
                }
            }]
        },

        title: {
            text: 'Hourly Weather (For Next 5 Days)',
            align: 'center',
            style: {
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
            }
        },

        credits: {
            text: 'Forecast from <a href="https://yr.no">yr.no</a>',
            href: 'https://yr.no',
            position: {
                x: -40
            }
        },

        tooltip: {
            shared: true,
            useHTML: true,
            headerFormat:
                '<small>{point.x:%A, %b %e, %H:%M} - ' +
                '{point.point.to:%H:%M}</small><br>' +
                '<b>{point.point.symbolName}</b><br>'

        },

        xAxis: [{ // Bottom X axis
            type: 'datetime',
            tickInterval: 2 * 36e5, // two hours
            minorTickInterval: 36e5, // one hour
            tickLength: 0,
            gridLineWidth: 1,
            gridLineColor: 'rgba(128, 128, 128, 0.1)',
            startOnTick: false,
            endOnTick: false,
            minPadding: 0,
            maxPadding: 0,
            offset: 30,
            showLastLabel: true,
            labels: {
                format: '{value:%H}'
            },
            crosshair: true
        }, { // Top X axis
            linkedTo: 0,
            type: 'datetime',
            tickInterval: 24 * 3600 * 1000,
            labels: {
                format: '{value:<span style="font-size: 12px; font-weight: ' +
                    'bold">%a</span> %b %e}',
                align: 'left',
                x: 3,
                y: 8
            },
            opposite: true,
            tickLength: 20,
            gridLineWidth: 1
        }],

        yAxis: [{ // temperature axis
            title: {
                text: null
            },
            labels: {
                format: '{value}°',
                style: {
                    fontSize: '10px'
                },
                x: -3
            },
            plotLines: [{ // zero plane
                value: 0,
                color: '#BBBBBB',
                width: 1,
                zIndex: 2
            }],
            maxPadding: 0.3,
            minRange: 8,
            tickInterval: 1,
            gridLineColor: 'rgba(128, 128, 128, 0.1)'

        }, { // precipitation axis
            title: {
                text: null
            },
            labels: {
                enabled: false
            },
            gridLineWidth: 0,
            tickLength: 0,
            minRange: 10,
            min: 0

        }, { // Air pressure
            allowDecimals: false,
            title: { // Title on top of axis
                text: 'inHg',
                offset: 0,
                align: 'high',
                rotation: 0,
                style: {
                    fontSize: '10px',
                    color: Highcharts.getOptions().colors[2]
                },
                textAlign: 'left',
                x: 3
            },
            labels: {
                style: {
                    fontSize: '8px',
                    color: Highcharts.getOptions().colors[2]
                },
                y: 2,
                x: 3
            },
            gridLineWidth: 0,
            opposite: true,
            showLastLabel: false
        }],

        legend: {
            enabled: false
        },

        plotOptions: {
            series: {
                pointPlacement: 'between'
            }
        },


        series: [{
            name: 'Temperature',
            data: this.temperatures,
            type: 'spline',
            marker: {
                enabled: false,
                states: {
                    hover: {
                        enabled: true
                    }
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
                    ' ' +
                    '{series.name}: <b>{point.y}°F</b><br/>'
            },
            zIndex: 1,
            color: '#FF3333',
            negativeColor: '#48AFE8'
        }, {
            name: 'Precipitation',
            data: this.precipitationsError,
            type: 'column',
            color: 'url(#precipitation-error)',
            yAxis: 1,
            groupPadding: 0,
            pointPadding: 0,
            tooltip: {
                valueSuffix: ' mm',
                pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
                    ' ' +
                    '{series.name}: <b>{point.minvalue} mm - ' +
                    '{point.maxvalue} mm</b><br/>'
            },
            grouping: false,
            dataLabels: {
                enabled: this.hasPrecipitationError,
                filter: {
                    operator: '>',
                    property: 'maxValue',
                    value: 0
                },
                style: {
                    fontSize: '8px',
                    color: 'gray'
                }
            }
        }, {
            name: 'Humidity',
            data: this.humidity,
            type: 'column',
            color: '#68CFE8',
            yAxis: 1,
            groupPadding: 0,
            pointPadding: 0,
            grouping: false,
            dataLabels: {
                enabled: !this.hasPrecipitationError,
                filter: {
                    operator: '>',
                    property: 'y',
                    value: 0
                },
                style: {
                    fontSize: '8px',
                    color: '#666'
                }
            },
            tooltip: {
                valueSuffix: ' %'
            }
        }, {
            name: 'Air pressure',
            color: Highcharts.getOptions().colors[2],
            data: this.pressures,
            marker: {
                enabled: false
            },
            shadow: false,
            tooltip: {
                valueSuffix: ' inHg'
            },
            dashStyle: 'shortdot',
            yAxis: 2
        }, {
            name: 'Wind',
            type: 'windbarb',
            id: 'windbarbs',
            color: Highcharts.getOptions().colors[1],
            lineWidth: 1.5,
            data: this.winds,
            vectorLength: 18,
            yOffset: -15,
            tooltip: {
                valueSuffix: ' mph'
            }
        }]
    };
};

/**
 * Post-process the chart from the callback function, the second argument
 * Highcharts.Chart.
 */
Meteogram.prototype.onChartLoad = function (chart) {

    this.drawBlocksForWindArrows(chart);

};

/**
 * Create the chart. This function is called async when the data file is loaded
 * and parsed.
 */
Meteogram.prototype.createChart = function () {
    this.chart = new Highcharts.Chart(this.getChartOptions(), chart => {
        this.onChartLoad(chart);
    });
};

Meteogram.prototype.error = function () {
    document.getElementById('loading').innerHTML =
        '<i class="fa fa-frown-o"></i> Failed loading data, please try again ' +
        'later';
};

function displayHourlyWeatherInfo(data) {
    // console.log("Inside displayHourlyWeatherInfo");
    console.log("Hourly: ", data);

    // Clear any previous chart content
    document.getElementById("chart2").innerHTML = "";

    

    
}


function displayWeatherInfo(data) {
    console.log(data)
    document.getElementById("location").textContent = data.location;

    const iconFile = weatherIconMapping[data.weatherCode] || 'unknown.svg';
    const weatherIcon = document.createElement("img");
    weatherIcon.src = `/static/images/Weather Symbols for Weather Codes/${iconFile}`;
    weatherIcon.alt = `Weather code: ${data.weatherCode}`;
    weatherIcon.style.width = "100px";
    weatherIcon.style.height = "100px";

    const weatherText = weatherTextMapping[data.weatherCode] || "Unknown";
    const weatherCodeTextElement = document.getElementById("weatherCode");

    weatherCodeTextElement.innerHTML = weatherText;

    //const weatherCodeText = document.createElement("p");
    //weatherCodeText.innerHTML = ` ${weatherText}`;

    const weatherCodeContainer = document.getElementById("weatherCodeContainer");
    weatherCodeContainer.innerHTML = "";
    weatherCodeContainer.appendChild(weatherIcon);
    //weatherCodeContainer.appendChild(weatherCodeText);

    document.getElementById("temperature").textContent = Math.round(data.temperature) + '°';
    document.getElementById("humidity").textContent = data.humidity;
    document.getElementById("windSpeed").textContent = data.windSpeed;
    document.getElementById("visibility").textContent = data.visibility;
    document.getElementById("cloudCover").textContent = data.cloudCover;
    document.getElementById("uvIndex").textContent = data.uvIndex;
    document.getElementById("pressureSeaLevel").textContent = data.pressureSeaLevel || 'N/A';

    document.getElementById("weatherInfo").style.display = "block";
    //document.getElementById("detailedWeatherInfo").style.display = "none";

    const forecastTable = document.getElementById("forecastTableBody");
    forecastTable.innerHTML = "";

    data.forecast.forEach(day => {
        const iconFile = weatherIconMapping[day.weatherCode] || 'unknown.svg';
        const weatherText = weatherTextMapping[day.weatherCode] || "Unknown";
    
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = new Date(day.date).toLocaleDateString('en-US', dateOptions);
    
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td class="weather-code-cell hoverable"><img src="/static/images/Weather Symbols for Weather Codes/${iconFile}" alt="Weather Code" style="width: 55px; height: 55px; margin-right: 10px">${ weatherText}</td>
            <td>${day.temperatureMax}</td>
            <td>${day.temperatureMin}</td>
            <td>${day.windSpeed}</td>
        `;
        forecastTable.appendChild(row);
        row.querySelector('.weather-code-cell').addEventListener('click', function() {
            displayDetailedDayInfo(data, day, formattedDate);
        });
    });
    
}


function displayDetailedDayInfo(data, day, formattedDate) {
    console.log('data: ', data)
    const detailedCard = document.getElementById("detailedWeatherInfo");
    detailedCard.innerHTML = ""; 

    const label = document.createElement("p"); 
    label.className = "label";
    label.textContent = "Daily Weather Details"; 
    label.style.fontFamily = "'Lato', sans-serif";
    label.style.fontWeight = '200';

    const iconFile = weatherIconMapping[day.weatherCode] || 'unknown.svg';
    const weatherDescription = weatherTextMapping[day.weatherCode] || 'Unknown';

    function formatTime(isoString) {
        const date = new Date(isoString);
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        return date.toLocaleString('en-US', options);
    }

    const sunriseFormatted = formatTime(day.sunrise);
    const sunsetFormatted = formatTime(day.sunset);

    const detailedCardContent = `
    <div class="detailed-card">
        <div class="upper-section">
            <div class="left-section">
                <p>${formattedDate}</p>
                <p>${weatherDescription}</p>
                <p><strong>${day.temperatureMax}°F/${day.temperatureMin}°F</strong></p>
            </div>
            <div class="right-section">
                <img src="/static/images/Weather Symbols for Weather Codes/${iconFile}" alt="Weather Code" style="width: 150px; height: 150px; margin-right: 10px"; class="weather-icon">
            </div>
        </div>
        <div class="center-section">
            <div class="label-value-pair">
                <p><strong>Precipitation:</strong> <span class="value">${day.precipitation}</span></p>
            </div>
            <div class="label-value-pair">
                <p><strong>Chance of Rain:</strong> <span class="value">${day.chanceOfRain}%</span></p>
            </div>
            <div class="label-value-pair">
                <p><strong>Wind Speed:</strong> <span class="value">${day.windSpeed} mph</span></p>
            </div>
            <div class="label-value-pair">
                <p><strong>Humidity:</strong> <span class="value">${day.humidity}%</span></p>
            </div>
            <div class="label-value-pair">
                <p><strong>Visibility:</strong> <span class="value">${day.visibility} mi</span></p>
            </div>
            <div class="label-value-pair">
                <p><strong>Sunrise/Sunset:</strong> <span class="value">${sunriseFormatted}/${sunsetFormatted}</span></p>
            </div>
        </div>
    </div>
`;

    detailedCard.appendChild(label);
    detailedCard.innerHTML += detailedCardContent;

    const downArrowContainer = document.createElement("div");
    downArrowContainer.style.textAlign = "center"; 
    downArrowContainer.style.marginTop = "20px";   

    const downArrowLabel = document.createElement("p");
    downArrowLabel.textContent = "Weather Charts";
    downArrowLabel.style.fontFamily = "'Lato', sans-serif";
    downArrowLabel.className = "down-arrow-label"; 
    downArrowLabel.style.fontWeight= "100px";

    const arrowIcon = document.createElement("img");
    arrowIcon.src = "/static/images/point-down-512.png"; 
    arrowIcon.alt = "Down Arrow";
    arrowIcon.style.width = "40px"; 
    arrowIcon.style.height = "40px"; 

    downArrowContainer.appendChild(downArrowLabel);
    downArrowContainer.appendChild(arrowIcon);

    detailedCard.appendChild(downArrowContainer);

    arrowIcon.addEventListener("click", function () {
        const chartsSection = document.getElementById("charts");

        chartsSection.style.display = "block";
        chartsSection.scrollIntoView({ behavior: "smooth" });
    });



    const chartContainer = document.createElement("div");
    chartContainer.id = "chartContainer"; 
    chartContainer.style.height = "350px"; 

    
    const chartDiv = document.getElementById('chart1');
    chartDiv.appendChild(chartContainer); // Append the chart container

    // Chart1
    if (data) {
        const seriesData = [];

        data.forecast.forEach(forecastDay => {
            seriesData.push([
                new Date(forecastDay.date).getTime(), 
                forecastDay.temperatureMin, 
                forecastDay.temperatureMax
            ]);
        });


        Highcharts.chart('chartContainer', {
            chart: { type: 'arearange' },
            legend: {enabled: false},
            title: { text: 'Temperature Ranges (Min,Max)' },
            xAxis: { type: 'datetime' },
            yAxis: { title: { text: '' } },
            series: [{
                name: 'Temperatures',
                data: seriesData,
                color: {
                    linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                    stops: [[0, 'darkorange'], [1, '#7ed9fdcc']]
                }
            }]
        });
    }
    else{
        document.getElementById("errorBlock").style.display = "block";
    }    

    //Second Charts
    


    detailedCard.style.display = "block";
    document.getElementById("weatherInfo").style.display = "none";
    // document.getElementById("dailyWeatherDetails").style.display = "none";

    // Hide the charts section by default
    document.getElementById("charts").style.display = "none";

}

document.getElementById("up-arrow-icon").addEventListener("click", function () {
    const detailedCard = document.getElementById("detailedWeatherInfo");
    
    detailedCard.scrollIntoView({ behavior: "smooth" });

    document.getElementById("charts").style.display = "none";
});


document.querySelector(".clear-button").addEventListener("click", function(event) {
    event.preventDefault();

    document.getElementById("mainForm").reset();
    document.getElementById("streetError").style.display = "none";
    document.getElementById("cityError").style.display = "none";
    document.getElementById("stateError").style.display = "none";
  
    document.getElementById("errorBlock").style.display = "none";
    document.getElementById("weatherInfo").style.display = "none";
    document.getElementById("detailedWeatherInfo").style.display = "none";

    const autoDetectCheckbox = document.getElementById("autoDetect");
    autoDetectCheckbox.checked = false;

    document.getElementById("street").disabled = false;
    document.getElementById("city").disabled = false;
    document.getElementById("state").disabled = false;

    document.getElementById("charts").style.display = "none";

    autoDetectCheckbox.dispatchEvent(new Event('change'));
});


document.getElementById("autoDetect").addEventListener("change", function() {
    if (this.checked) {
        document.getElementById("street").value = "";
        document.getElementById("city").value = "";
        document.getElementById("state").value = "";

        document.getElementById("street").disabled = true;
        document.getElementById("city").disabled = true;
        document.getElementById("state").disabled = true;
    } else {
        document.getElementById("street").disabled = false;
        document.getElementById("city").disabled = false;
        document.getElementById("state").disabled = false;
    }
});

document.getElementById("autoDetect").addEventListener("change", function() {
    if (this.checked) {
        fetch('https://ipinfo.io/json?token=28f772be3811cd')
            .then(response => response.json())
            .then(ipinfoData => {
                fetch('/get_weather_hourly_auto', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ipinfoData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        document.getElementById("errorBlock").style.display = "block";
                        document.getElementById("weatherInfo").style.display = "none";
                    } else {
                        document.getElementById("errorBlock").style.display = "none";
                        displayHourlyWeatherInfo(data);
                        window.meteogram = new Meteogram(data.hourly_forecast, 'chart2');
                    }
                })
                .catch(error => {
                    console.error('Error fetching auto-location weather:', error);
                    document.getElementById("errorBlock").style.display = "block";
                });
            })
            .catch(error => {
                console.error('Error fetching IPinfo data:', error);
                document.getElementById("errorBlock").style.display = "block";
            });
    }
});