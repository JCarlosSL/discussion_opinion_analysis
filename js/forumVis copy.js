/**
 * Created by gshanmugaiah on 10/14/14.
 */
'use strict';
var COLLECTIVEI = COLLECTIVEI || {};
COLLECTIVEI.CHART = COLLECTIVEI.CHART || {};
COLLECTIVEI.CHART.WIDGET = COLLECTIVEI.CHART.WIDGET || {};
COLLECTIVEI.CHART.WIDGET.forumVisWidget = function (options) {

    if (!options) throw 'options can not be null';
    else if (options && !options.element) throw 'options.element can not be null';

    var defaultVal = {
        transitionDuration:500,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        events: {
            onMouseOver: null
        },
        colorList:['#04B45F','#DF3A01','#BDBDBD'],
        threadRadius:130,
        peopleNodeMaxOpa:.6,
        maxArcHeight:20,
        minArcHeight:5,
        packRadiusRate:0.8
    };

    function ForumVis(options) {
        var self = this;
        self.d3Ele = d3.select(options.element);
        self.element = options.element;
        self.data = options.data;  
        self.threadData = options.data.threadData;
        self.opinionMeta = options.data.opinionMeta;
        self.maxReply = options.data.maxReply;
        self.settings = $.extend({}, defaultVal, options);
        self.threadRadius_small_max = 0;
    }

    ForumVis.prototype = {
        init: function () {
            this._initChart();
            this._generateChart(this.data);
        },
        redraw:function(data){
          if(data){
            this.data = data;
          }
          this._generateChart(this.data);
        },
        resize:function(){
        },
        _calculateSize:function(){
          var self = this;
          self.chartHeight = $(self.element).find('[data-id=chartView]').height() - self.settings.margin.top - self.settings.margin.bottom;
          self.chartWidth = $(self.element).find('[data-id=chartView]').width() - self.settings.margin.left - self.settings.margin.right;

          self.threadRadius_small_max = (self.chartWidth*0.5/self.threadData.length)*0.8;
          self.threadRadius_small_min = self.threadRadius_small_max*0.6;

          self.threadRadius = self.chartWidth*0.8/2;
          self.settings.threadRadius = self.threadRadius_small_max;
          var postRange = d3.extent(self.threadData,function(d){
              return d.post.length;
            });
          self.threadMiniRadiusScale = d3.scale.linear().domain([postRange[0], postRange[1]]).range([self.threadRadius_small_min, self.threadRadius_small_max]);                
          self.threadData.forEach(function(d){
            d.miniRadius = self.threadMiniRadiusScale(d.post.length);
            d.miniRadiusPack = d.miniRadius * self.settings.packRadiusRate;
          });
        },
        _initChart:function(){
            var self = this;
            self._calculateSize();

            self.opinionColor = {};
            for(var i=0;i<self.opinionMeta.length;i+=1){
              self.opinionColor[self.opinionMeta[i]] = self.settings.colorList[i];
            }

            self.chord = d3.layout.chord()
            .padding(.05)
            .sortGroups(d3.ascending );  

            self.diagonal = d3.svg.diagonal.radial();

            self.peopleNodeOpaScale = d3.scale.pow().domain([0, 1]).range([0, self.settings.peopleNodeMaxOpa]);                              
            self.arcHeightScale = d3.scale.linear().domain([0, self.maxReply]).range([self.settings.minArcHeight, self.settings.maxArcHeight]);    
        },       
        _generateChart:function (data) {
            var self = this;

            $(self.element).find('[data-id=chartView]').html('');
            self.chart = self.d3Ele.select('[data-id=chartView]').append('svg')
                .attr("id","forumVis")
                .attr('width', self.chartWidth  + self.settings.margin.left + self.settings.margin.right)
                .attr('height', self.chartHeight + self.settings.margin.top + self.settings.margin.bottom)
                .append("g")
                .attr('transform','translate('+self.settings.margin.left+','+self.settings.margin.top+')');

            self._drawThreadRing();
            //self._drawPeople();
            //self._drawLinks();

        },
          _createLinks:function(post,chord, thread) {
            var self = this;
            var target={};
            var source={};
            var link={};
            var link2={};
            var source2={};
            
              
            var relatedChord=chord.source;
            var relatedNode=thread.peopleNodeDict[post.user_id];
            //var r=linkRadius;
            //var r = self.threadRadius;
            var r = thread.miniRadius;
            var packRadius = thread.miniRadiusPack;

            var currX=(r * Math.cos(relatedChord.currentLinkAngle-1.57079633));
            var currY=(r * Math.sin(relatedChord.currentLinkAngle-1.57079633));

            var a=relatedChord.currentLinkAngle-1.57079633; //-90 degrees
            relatedChord.currentLinkAngle=relatedChord.currentLinkAngle+relatedChord.postAngle;
            var a1=relatedChord.currentLinkAngle-1.57079633;

            source.x=(r * Math.cos(a));
            source.y=(r * Math.sin(a));
            target.x = relatedNode.x-packRadius;
            target.y=relatedNode.y-packRadius;

            //target.x=relatedNode.x-(chordsTranslate-nodesTranslate);
            //target.y=relatedNode.y-(chordsTranslate-nodesTranslate);
            source2.x=(r * Math.cos(a1));
            source2.y=(r * Math.sin(a1));
            link.source=source;
            link.target=target;
            link2.source=target;
            link2.target=source2;
            return [link,link2];
        },
        _drawLinks:function(){
          var self = this;
         
          var diagonal = self.diagonal;
          //draw arc
          self.threads.each(function(thread){
             var innerRadius = thread.miniRadius;
            d3.select(this).selectAll('.clusterArc').each(function(arc){
               var currentAngle = arc.source.startAngle;

               var clusterData =thread.clusters[arc.source.index];
               var pAngle =  (arc.source.endAngle - arc.source.startAngle)/clusterData.post.length;
               arc.source.currentLinkAngle = currentAngle;
               arc.source.postAngle = pAngle;

               var enter = d3.select(this).selectAll('.postArc').data(clusterData.post).enter();

               enter.append('path').attr('class','post')
               .attr('id',function(d){
                return 'post_'+d.thread_id+'_'+d.post_id;
               })
               .attr("d", function (d,i) {
                var newArc={};
                newArc.startAngle=currentAngle;
                currentAngle+=pAngle;
                newArc.endAngle=currentAngle;
                var arcHeight = self.arcHeightScale(d.fromReply.length);
                var arc=d3.svg.arc(d,i).innerRadius(innerRadius).outerRadius(innerRadius+arcHeight);
                return arc(newArc,i);
               })
               .style('fill',function(d){
                return self.opinionColor[d.opinion];
               })
              .on("mouseover", function (d) { self._onMouseOverPost(d);})
              .on("mouseout", function (d) {self._onMouseOut(d); });


               enter.append('path').attr('class','postLink')
               .attr('id',function(d){
                return 'postLink_'+d.thread_id+'_'+d.post_id;
               })
               .attr("d", function (d,i) {
                d.links=self._createLinks(d, arc, thread);
                var diag = diagonal(d.links[0],i);
                diag += "L" + String(diagonal(d.links[1],i)).substr(1);
                diag += "A" + (innerRadius) + "," + (innerRadius) + " 0 0,0 " +  d.links[0].source.x + "," + d.links[0].source.y;
                return diag;
              }).style('fill',function(d){
                return self.opinionColor[d.opinion];
              }).on("mouseover", function (d) { self._onMouseOverLink(d);})
              .on("mouseout", function (d) {self._onMouseOut(d); });

            });   
          });
        },
        _drawPeople:function(){
          var self = this;
          self.threads.each(function(thread){
            var radius = thread.miniRadius;
            var packRadius =thread.miniRadiusPack; 

            var bubble = d3.layout.pack()
            .sort(null)
            .size([packRadius*2, packRadius*2])
            .value(function(d) { return d.size; })
            .padding(1.5);


            var nodes = bubble.nodes(thread.peopleNodes);
            var peopleArea = d3.select(this).append('g')
            .attr('transform','translate('+(0-packRadius)+','+(0-packRadius)+')');
            var drawNodes = nodes.filter(function(d){
              return d.depth>1;
            });
            thread.peopleNodeDict = {};
            drawNodes.forEach(function(d){
             thread.peopleNodeDict[d.id]=d;
            });

            var peopleNode = peopleArea.selectAll('.peopleNode')
            .data(drawNodes).enter().append('g')
            .attr('class','peopleNode').attr('id',function(d){
              return 'peopleNode_'+d.id;
            })
            .attr('transform',function(d){
              return 'translate('+d.x+','+d.y+')';
            })
            .on("mouseover", function (d) { self._onMouseOverPeople(d);})
            .on("mouseout", function (d) {self._onMouseOut(d); });

            peopleNode.append('circle').attr('class','peopleCircle')
            .attr('r', function(d){
              return d.r;
            }).style('fill',function(d){
              return self.opinionColor[d.opinion];
            }).style('fill-opacity',function(d){
              return self.peopleNodeOpaScale(d.rate);
            })
            .style('stroke', function(d){
              return self.opinionColor[d.opinion];
            });
          });
        },
        _drawThread:function(g){
          var t=0;
          g.each(function(){
            var tt=0;
          });
        }
        ,
        _drawThreadRing:function(){
          var self = this;
          var cellWidth = self.chartWidth/self.threadData.length;

          self.threads = self.chart.selectAll('.threadRing').data(self.threadData).enter()
          .append('g').attr('class','threadRing').attr('id',function(d){
            return 'thread_'+d.id;
          })
          .attr('transform',function(d,i){
            return 'translate('+(cellWidth/2+i*cellWidth)+','+cellWidth/2+')';
          });
          self.threads.call(self._drawThread);
          /*
          self.threads.each(function(d){
            d3.select(this).call(self._drawThread);
          });*/
/*
          self.threads.each(function(thread){
            self.chord.matrix(thread.clMatrix); 
            var chords = self.chord.chords();
            var radius = thread.miniRadius;

            thread.chordDict = {};
            chords.forEach(function(d,i){
              d.clId = thread.clusters[i].clId;
              thread.chordDict[d.clId] = d;
            });
            thread.chords = chords;

            var arcGroup = d3.select(this).selectAll(".clusterArc")
            .data(chords);

            var enter =arcGroup.enter().append("g").attr("class","clusterArc");
          
            enter.append("path").attr('class', function(d,i){
              return i%2===0?'clusterArcBorder even':'clusterArcBorder odd';
            })
                .attr("d", function (d,i) {
                var arc=d3.svg.arc(d,i).innerRadius(radius).outerRadius(radius);
                return arc(d.source,i);
            });

          });

          //draw Pie
          self.threads.each(function(thread){

          var color = d3.scale.ordinal()
         .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

            var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d; });
            var arc = d3.svg.arc()
            .outerRadius(thread.miniRadius)
            .innerRadius(0);
                var g  = d3.select(this).selectAll(".pieArc")
                  .data(function(d){
                    return pie(d.opinionPostCount);
                  })
                 .enter().append("g")
                  .attr("class", "pieArc");
            
                g.append("path")
                .attr("d", arc)
                .style("fill", function(d,i) { return self.opinionColor[self.opinionMeta[i]]; });

             });*/
          /*
          var color = d3.scale.ordinal()
         .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

          var pie = d3.layout.pie()
              .sort(null)
              .value(function(d) { return d; });
          var arc = d3.svg.arc()
          .outerRadius(self.settings.threadRadius - 10)
          .innerRadius(0);

          var g  = threads.selectAll(".arc2")
            .data(function(d){
              return pie(d.opinionPostCount);
            })
           .enter().append("g")
            .attr("class", "arc2");
      
          g.append("path")
          .attr("d", arc)
          .style("fill", function(d,i) { return color(i); }); */
                    
        },
        _highlightPost:function(p){
              p.classed('fade',false);
              p.classed('highlight',true);
        },
        _onMouseOverPost:function(d){
          //'postLink_'+d.thread_id+'_'+d.post_id;
          var self = this;
          var thread = self.chart.selectAll('#thread_'+d.thread_id);
          thread.selectAll('.post').classed('fade',true);
          var selectPostArc = thread.selectAll('#post_'+d.thread_id+'_'+d.post_id);
          self._highlightPost(selectPostArc);

          var replyTo = [];
          var replyFrom  = [];
          selectPostArc.each(function(d){
            d.toReply.forEach(function(r){
              var rp = thread.selectAll('#post_'+d.thread_id+'_'+r);
              self._highlightPost(rp);
            });
            d.fromReply.forEach(function(r){
              var rp = thread.selectAll('#post_'+d.thread_id+'_'+r);
              self._highlightPost(rp);
            });
          })


          var postLink = thread.selectAll('#postLink_'+d.thread_id+'_'+d.post_id).classed('highlight', true);
          thread.selectAll('.peopleNode').classed('fade',true);
          thread.selectAll('#peopleNode_'+d.user_id).classed('fade',false);
          
          
        },
        _onMouseOut:function(d){
          var self = this;
          var thread = self.chart.selectAll('#thread_'+d.thread_id);  
          thread.selectAll('.post').classed('highlight',false);
          thread.selectAll('.post').classed('fade',false);
          thread.selectAll('.postLink').classed('highlight', false);
          thread.selectAll('.peopleNode').classed('fade',false);           
          /*
          thread.selectAll('#post_'+d.thread_id+'_'+d.post_id).classed('highlight',false);
          thread.selectAll('#postLink_'+d.thread_id+'_'+d.post_id).classed('highlight', false);
          thread.selectAll('.peopleNode').classed('fade',false);*/
        },
        _onMouseOverPeople:function(d){
          var self = this;
          var thread = self.chart.selectAll('#thread_'+d.thread_id);
          d.post.forEach(function(post){
              thread.selectAll('#post_'+d.thread_id+'_'+post.post_id).classed('highlight',true);
              thread.selectAll('#postLink_'+d.thread_id+'_'+post.post_id).classed('highlight', true);
          });
        },
        _onMouseOverLink:function(d){
          var self = this;
           self._onMouseOverPost(d);

        }

    };
    var forumVis = new ForumVis(options);
    forumVis.init();
    return {
        options: forumVis.settings,
        redraw: function () {
            forumVis.redraw.apply(forumVis, arguments);
        },
        resize:function(){
            forumVis.resize.apply(forumVis, arguments);
        }
    };
};