var module = angular.module('Tikal.Fuseday', []);

module.controller('Tikal.MainCtrl', ['$scope',
    function($scope) {
        this.name = 'sss';
    }
]);

module.directive('chart', ['tikalFusedayTweets', 'chartService', '$interval',

    function(tikalFusedayTweets, chartService, $interval) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                type: '@'
            },
            link: function(scope, iElement, iAttrs) {

                function init() {
                    tikalFusedayTweets
                        //.getTweetsByMinutes(5)
                        .getTweetsBySecounds(5)
                        .then(function(response) {
                            var chartServiceParams = [response.data];
                            if (chartService['draw' + scope.type]) {
                                chartService['draw' + scope.type].apply(chartService, chartServiceParams);
                            }
                        })
                        .error(function(data) {
                            debugger;
                        })
                        ;
                }
                init();
                $interval(init, 1000 * 10, false);
            }
        };
    }
]);

module.service('tikalFusedayTweets', ['$http',
    function($http) {


        return {
            getTweetsByMinutes: function(minutes) {
                var url = 'http://localhost:8080/lastTweets/minutes/' + minutes;// + '?callback=JSON_CALLBACK';
                
                return $http.get(url);
                //return $http.jsonp(url);
                //return $http.get('data.json');
            },

            getTweetsBySecounds: function(seconds) {
            	var url = 'http://localhost:8080/lastTweets/seconds/' + seconds;// + '?callback=JSON_CALLBACK';
                
                return $http.get(url);
            }
        };
    }
]);

module.service('chartService', [

    function() {

        function getRandomColor() {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }
        var rangeOfColorsArr = [];
        for (var i = 0; i < 60; i++) {
            rangeOfColorsArr.push(getRandomColor());
        }
        return {
            drawPie: function() {

            },

            drawBar: function(data) {
                var margin = {
                    top: 20,
                    right: 20,
                    bottom: 30,
                    left: 40
                },
                    width = 960 - margin.left - margin.right,
                    height = 500 - margin.top - margin.bottom;


                var x0 = d3
                    .scale
                    .ordinal()
                    .rangeRoundBands([0, width], .1);

                var x1 = d3.scale.ordinal();
                var y = d3.scale.linear()
                    .range([height, 0]);

                var color = d3.scale.ordinal()
                    .range(rangeOfColorsArr /*["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]*/ );

                var xAxis = d3.svg.axis()
                    .scale(x0)
                    .orient("bottom");

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left")
                    .tickFormat(d3.format(".2s"));

                var svg = d3.select("body").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                //  d3.json("data.json", function(error, data) {
                var itemTweets = data[0][Object.keys(data[0])[0]];
                var hashTagsArr = Object.keys(itemTweets);

                data.forEach(function(item) {
                    var itemTime = Object.keys(item)[0],
                        itemTweets = item[itemTime];

                    angular.forEach(itemTweets, function(counts) {
                        if (angular.isUndefined(item.maxCount)) {
                            item.maxCount = 0;
                        }
                        if (item.maxCount < counts) {
                            item.maxCount = counts;
                        }
                    });

                    item.tweets = [];

                    angular.forEach(itemTweets, function(val, key) {
                        item.tweets.push({
                            name: key,
                            value: val
                        });
                    });
                    item.name = getFormattedTime(itemTime);
                })

                function getFormattedTime(unixTime) {
                    var ms = (unixTime * 1000),
                        d = new Date(ms);
                    return [
                        d.getHours(),
                        d.getMinutes(),
                        d.getSeconds()
                    ].join(':');
                }

                x0.domain(data.map(function(item) {
                    //group name
                    return getFormattedTime(Object.keys(item)[0]);
                }));

                //all hash tag title
                x1.domain(hashTagsArr).rangeRoundBands([0, x0.rangeBand()]);

                y.domain([0, d3.max(data, function(item) {
                    return item.maxCount;
                })]);

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("Popularity");

                var state = svg.selectAll(".state")
                    .data(data)
                    .enter().append("g")
                    .attr("class", "g")
                    .attr("transform", function(item) {
                        return "translate(" + x0(getFormattedTime(Object.keys(item)[0])) + ",0)";
                    });


                state.selectAll("rect")
                    .data(function(item) {
                        return item.tweets;
                    })
                    .enter()
                    .append("rect")
                    .attr("width", x1.rangeBand())
                    .attr("x", function(item) {
                        return x1(item.name);
                    })
                    .attr("y", function(item) {
                        return y(item.value);
                    })
                    .attr("height", function(item) {
                        return height - y(item.value);
                    })
                    .style("fill", function(item) {
                        return color(item.name);
                    });


                var legend = svg.selectAll(".legend")
                    .data(hashTagsArr.slice().reverse())
                    .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d, i) {
                        return "translate(0," + i * 20 + ")";
                    });

                legend.append("rect")
                    .attr("x", width - 18)
                    .attr("width", 18)
                    .attr("height", 18)
                    .style("fill", color);

                legend.append("text")
                    .attr("x", width - 24)
                    .attr("y", 9)
                    .attr("dy", ".35em")
                    .style("text-anchor", "end")
                    .text(function(d) {
                        return d;
                    });

                // });

            }
        };
    }
])