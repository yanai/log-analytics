var module = angular.module('Tikal.Fuseday', []);

module.controller('Tikal.MainCtrl', ['$scope',
    function($scope) {
        this.name = 'sss';
    }
]);

module.directive('chart', ['logAnalytics', 'chartService', '$interval',

    function(logAnalytics, chartService, $interval) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                type: '@'
            },
            link: function(scope, iElement, iAttrs) {

                function init() {
                    logAnalytics
                        .groupByDatesThenResponse()
                        .then(function(response) {
                            var chartServiceParams = [response.data];
                            if (chartService['draw' + scope.type]) {
                                chartService['draw' + scope.type].apply(chartService, chartServiceParams);
                            }
                        });
                        // .error(function(data) {
                        //     debugger;
                        // });
                }
                init();
                //$interval(init, 1000 * 10, false);
            }
        };
    }
]);

module.service('logAnalytics', ['$http',
    function($http) {


        return {
            groupByDatesThenResponse: function() {
                /*var url = 'http://192.168.2.142:8080/lastTweets/minutes/' + minutes + '?callback=JSON_CALLBACK';*/

                /*return $http.jsonp(url);*/
                /*var url = 'yanai-data.json';*/
                var url = 'http://localhost:8080/logs/grouping/datesThenResponse';
                return $http.get(url);
            },

            getTweetsBySecounds: function(secounds) {

            }
        };
    }
]);

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

module.service('chartService', ['$window',

    function($window) {

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
                jqWindow = angular.element($window),
                width = jqWindow.width()*(85/100) - margin.left - margin.right,
                height = jqWindow.height()*(85/100) - margin.top - margin.bottom;

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


                var groupsTitle = [],
                    itemsTitleInGroup = [],
                    maxCount = 0,
                    newData = [];

                angular.forEach(data, function(groupItem, groupTitle) {
                    var newItemData = {};
                    newItemData[groupTitle] = groupItem;
                    newData.push(newItemData)

                    var groupItemTitles = Object.keys(groupItem);
                    groupsTitle.push(groupTitle);

                    itemsTitleInGroup = itemsTitleInGroup
                                            .concat(groupItemTitles)
                                            .unique(); 


                    angular.forEach(groupItem, function(itemValue, itemTitle){
                        if(maxCount < itemValue){
                            maxCount = itemValue;
                        }
                    });

                });


                x0.domain(groupsTitle);

                x1
                    .domain(itemsTitleInGroup)
                    .rangeRoundBands([0, x0.rangeBand()]);

                y.domain([0, maxCount]);


                // X Axis
                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                //Y Axis
                //Y Axis Title in text
                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("Y Axis Title");



                var state = svg
                                .selectAll(".state")
                                .data(newData)
                                .enter()
                                .append("g")
                                .attr("class", "g")
                                .attr("transform", function(item){
                                    console.info(item);
                                    return "translate(" + x0(Object.keys(item)[0])  + ",0)";
                                });

               
                state.selectAll("rect")
                    .data(function(item) {
                        var newItem = [];
                        angular.forEach(item[Object.keys(item)[0]], function(value, name) {
                            newItem.push({name: name, value: value});
                        });
                        return newItem;
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
                    .data(itemsTitleInGroup.slice().reverse())
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



          

            }
        };
    }
])