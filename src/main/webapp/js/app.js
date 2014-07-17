var module = angular.module('Tikal.Fuseday', []);

module.controller('Tikal.MainCtrl', ['$scope',
    function($scope) {
        this.name = 'sss';
    }
]);

module.directive('chart', ['logAnalysis', 'chartService', '$interval',

    function(logAnalysis, chartService, $interval) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                type: '@',
                url: '@'
            },
            link: function(scope, iElement, iAttrs) {

                function init() {
                    logAnalysis
                        .groupBy(scope.url)
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

module.service('logAnalysis', ['$http',
    function($http) {


        return {
            groupBy: function(url) {
                return $http.get(url);
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
                    newData = [];

                angular.forEach(data, function(groupItem, groupTitle) {

                    var newGroupItem = {};
                    newGroupItem[groupTitle] = groupItem;
                    newGroupItem.maxCount = 0;
                    newGroupItem.name = groupTitle;
                    newGroupItem.data = [];
                    angular.forEach(groupItem, function(itemValue, itemTitle){
                        if(itemsTitleInGroup.indexOf(itemTitle) === -1){
                            itemsTitleInGroup.push(itemTitle)
                        }
                        if(newGroupItem.maxCount < itemValue){
                            newGroupItem.maxCount = itemValue;
                        }
                        newGroupItem.data.push({name: itemTitle,value: itemValue});
                    });


                    newData.push(newGroupItem);

                });

                x0.domain(newData.map(function(item) {
                    //group name
                    return item.name;
                }));
                itemsTitleInGroup = itemsTitleInGroup.sort()
                console.info(itemsTitleInGroup);
                 //all hash tag title
                x1
                    .domain(itemsTitleInGroup)
                    .rangeRoundBands([0, x0.rangeBand()]);

                y.domain([0, d3.max(data, function(item) {
                    return item.maxCount;
                })]);

                y.domain([0, d3.max(newData, function(item) {
                    return item.maxCount;
                })]);


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
                                    return "translate(" + x0(item.name)  + ",0)";
                                });

                state.selectAll("rect")
                    .data(function(item) {
                        return item.data;
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