var width = 430,
    height = 400,
    bar_width = 50,
    circle_width = 50;

var columns = [
    'year',
    'prevalence',
    'burden',
    'publication',
    'trial',
    'patent'
]

var years,
    color,
    radius,
    bubbledata,
    confdata,
    newdict = {};

var filter = 2;

//separate color for years
//continuous color for years
// var color = d3.scale.ordinal().range(["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"]);
var color = d3.scale.ordinal().range([
    'rgb(110, 64, 170)','rgb(133, 62, 177)','rgb(157, 61, 179)','rgb(182, 60, 177)','rgb(205, 61, 170)','rgb(226, 64, 159)','rgb(243, 69, 144)','rgb(255, 77, 127)','rgb(255, 88, 109)','rgb(255, 101, 90)','rgb(255, 116, 74)','rgb(255, 134, 60)','rgb(249, 152, 50)','rgb(235, 172, 46)','rgb(219, 191, 48)','rgb(203, 209, 56)','rgb(188, 226, 71)'
])

d3.json('newsfiles/ROI/ROI_data/conf', function(conf){
    confdata = conf;
    years = conf.year;
    color.domain(conf.year);
    radius = {"pos":d3.scale.linear().domain([0, conf.max]).range([0, 50]),
        "nag":d3.scale.linear().domain([0, -conf.min]).range([0, 50])}
    d3.json('newsfiles/ROI/ROI_data/json', function(data){
        // create code look up table
        for (i in data){
            newdict[data[i].code] = data[i]
        }
        bubbledata = data;
        //initial fuzzy search
        var fuzzyhound = new FuzzySearch({
            output_limit: 6,
            keys:"label",
            source: $.map(data, function(k){return {
                label: k.name,
                value: k.code
            }})
        });

        $('.disease_search').autocomplete({
            source: function (request, response) {
                response(fuzzyhound.search(request.term));
            },
            delay: 0,
            minLength: 2,
            focus: function( event, ui ) {
                $( '.disease_search' ).val( ui.item.label );
                return false;
            },
            select: function( event, ui ) {
                select_node( ui.item.value);
                return false;
            }
        });
        draw('pos');
        draw('nag');
    })
});

function draw(root){
    drawbubbles(root);
    drawYearMeter(root);
    drawCircleLegend(root);
}

var current_year = -1;
function drawYearMeter(root){
    var step = height / years.length;

    var bar = d3.select("#"+root+" div[name='bar']").append('svg').attr('width', bar_width).attr('height',height)
        .selectAll('years').data(years).enter()
        .append('g')
        .attr("transform", function(d,i){return "translate(0,"+i*step+")"})
        .on("click", function(year){
            if (year == current_year){
                d3.selectAll('.yearcircle').attr('opacity', 1);
                d3.selectAll('.yearlegend').attr('opacity', 1)
            }
            else{
                current_year = year;
                d3.selectAll('.yearcircle').attr('opacity', function(d){
                    return 1 - Math.min(Math.abs(d.year - year), 2)/2
                });
                d3.selectAll('.yearlegend').attr('opacity', function(d){
                    return 1 - Math.min(Math.abs(d - year), 2)/2
                })
            }
        });

    bar.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr("class","yearlegend")
        .attr('width', bar_width)
        .attr('height', step)
        .attr('fill', function(d){return color(d);});

    bar.append('text')
        .style("text-anchor", "middle")
        .attr("transform", "translate("+[bar_width/2, step/2+4]+")")
        .text(function(d){return d})
}

function drawCircleLegend(root){
    if (root == "pos")
        var circle_data = [20, 15, 10, 5, 1];
    else
        var circle_data = [-15, -10, -10, -5, -1];

    var circle = d3.select("#"+root+" div[name='circle']").append('svg').attr('width', circle_width).attr('height',height)
        .append('g')
        .attr("transform", "translate("+circle_width/2+",50)")
        .selectAll('circle').data(circle_data).enter()
        .append('g')
        .attr('transform', function(d,i){return 'translate(0, '+i*height/circle_data.length+')'})

    circle.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", function(d){
            if (root == "pos")
                return radius[root](d)*scale[root];
            else
                return radius[root](-d)*scale[root]
        })
        .attr('stroke','black')
        .attr('fill', 'white')
        .attr('opacity', 0.5);

    circle.append("text")
        .style("text-anchor", "middle")
        .text(function(d){return d})
}

var scale = {'pos':1, 'nag':1},
    pack = d3.layout.pack()
        .sort(function(a,b){
            //hybrid layout
            var threshold = 2;
            if (a.base > threshold && b.base > threshold)
                return b.base-a.base;
            else
                return 1
        })
        .size([width, height])
        .value(function(d){return d.base * d.base;});

function clearSelection(){
    $( '.disease_search' ).val('');
    d3.selectAll(".base").attr("opacity",1);
    d3.selectAll(".label").remove()
}
function select_node(code){
    clearSelection();
    var name = '';
    d3.selectAll(".base").attr("opacity",function(d){
        if (d.code == code){
            name = d.name;
            var label = d3.select(this.parentNode).append("g")
                .attr("class","label");

            var link = label.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('stroke','red')
                .attr('stroke-width', 2);

            var bg = label.append("rect")
                .attr("fill","white");

            var text = label.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .style("text-anchor", "middle")
                .text(name);
            var bbox = text.node().getBBox();

            bg.attr("width", bbox.width+20)
                .attr("height", bbox.height*2)
                .attr("x", -bbox.width/2-10)
                .attr("y", -bbox.height);

            //take one of the four options
            var trans = d3.transform(d3.select(this).attr('transform')).translate;
            var offy = -40,
                offx = 0;
            if (trans[0] - bbox.width/2 < 0){
                offx = bbox.width/2 - trans[0];
            }
            else if (trans[0] + bbox.width/2 > width){
                offx = width - (trans[0] + bbox.width/2);
            }

            link.attr('x2', -offx)
                .attr('y2', -offy);

            label.attr('transform','translate('+[trans[0]+offx, trans[1]+offy]+')');

            return 1;
        }
        else
            return 0.4
    });
    $( '.disease_search' ).val( name );

    //query demands and show detail info
    d3.selectAll("div[name='detail']").selectAll("div").remove();

    d3.json("newsfiles/ROI/ROI_data/code/"+code, function(info){
        //separate info to postive and negative
        var pos = $.map(info, function(d){
            if (d.hoi_prevalence > 0)
                return d;
            else
                return null
        });
        if (pos.length > 0){
            create_info_table('pos', pos)
        }
        var nag = $.map(info, function(d){
            if (d.hoi_prevalence < 0)
                return d;
            else
                return null
        });
        if (nag.length > 0){
            create_info_table('nag', nag)
        }
    })
}

function create_info_table(root, info){
    d3.select("#"+root+" div[name='detail']").append("div").html(name);
    var table = d3.select("#"+root+" div[name='detail']").append("div")
        .append("table")
        .attr("class","table table-hover");

    var thead = table.append("thead"),
        tbody = table.append("tbody");

    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(function(d) { return d; });

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(info)
        .enter()
        .append("tr");

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(row) {
            return columns.map(function(column) {
                return {column: column, value: row[column]};
            });
        })
        .enter()
        .append("td")
        .html(function(d) {
            return d3.round(d.value, 2);
        });
}

function drawbubbles(root){
    var canvas = d3.select("#"+root+" div[name='canvas']").append("svg").attr("width", width).attr("height", height);
    // create a new dataset for collison detection
    var newdata = [];
    for (var i in bubbledata){
        if (root == 'pos'){
            var weight = d3.max(bubbledata[i].val, function(d){return d.weight});
            if (weight > filter)
                newdata.push({
                    code: bubbledata[i].code,
                    name: bubbledata[i].name,
                    base: radius[root](weight)
                })
        }
        else if (root = "nag"){
            var weight = d3.min(bubbledata[i].val, function(d){return d.weight});
            if (weight < -filter)
                newdata.push({
                    code: bubbledata[i].code,
                    name: bubbledata[i].name,
                    base: radius[root](-weight)
                })
        }
    }
    var tmp = pack.nodes({children: newdata});
    var node = canvas.selectAll(".node")
        .data(tmp.slice(1))
        .enter()
        .append("g")
        .attr("class","base")
        .attr("transform", function(d){return "translate("+d.x+","+d.y+")"})

    //draw base color for clicking
    node.append('circle')
        .attr("class", "basecircle")
        .attr("id", function(d){return root+d.code})
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', function(d){
            scale[root] = d.r / d.base;
            return d.r
        })
        .attr('fill', 'white')

    //bond other bubble to base bubbles
    node.each(function(base){
        //data no less than 1
        tmp = newdict[base.code].val;
        yeardata = []
        for (i in tmp){
            if ((tmp[i].weight > filter && root=="pos")||(tmp[i].weight < -filter && root=="nag"))
                yeardata.push(tmp[i])
        }
        d3.select(this).selectAll('yearcircle').data(yeardata).enter()
            .append('circle')
            .attr("class", "yearcircle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("fill", "none")
            .attr("stroke", function(d){return color(d.year)})
            .attr("r", function(d){
                if (root == "pos")
                    return radius["pos"](d.weight)*scale[root];
                else (root == "nag")
                return radius["nag"](-d.weight)*scale[root];
            })
    });

    // //the hover label
    // var label = node.append("g")
    //     .attr("class","label")
    //     .attr("transform","translate(0,-40)").attr("visibility", "hidden")
    //     .each(function(d){
    //         bg = d3.select(this).append("rect")
    //             .attr("fill","white")
    //
    //         text = d3.select(this).append("text")
    //             .attr("x", 0)
    //             .attr("y", 0)
    //             .style("text-anchor", "middle")
    //             .text(function(d){
    //                 return d.name
    //             })
    //         bbox = text.node().getBBox();
    //
    //         bg.attr("width", bbox.width+20)
    //             .attr("height", bbox.height*2)
    //             .attr("x", -bbox.width/2-10)
    //             .attr("y", -bbox.height)
    //     })
    //
    // //put text above box
    // label.select('text').moveToFront();

    // interaction
    node.on("click", function(d){
        //fade all other bubbles
        select_node(d.code)
    })
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};