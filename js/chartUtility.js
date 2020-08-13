var timeformat = d3.time.format("%b %d %Y")
function getTicks(chart, min, max){
    var chartHeight = 220;
    var tickSize=(chartHeight/nv.tickNumHeight);
    var scale = d3.scale.linear().domain([min,max]);
    var ticks=scale.ticks(tickSize);
    var len1=ticks.length;
    var maxTick=0;
    if(len1>1){
        maxTick=ticks[len1-1]*2-ticks[len1-2];
        if(maxTick!=0 && maxTick){
          ticks.push(maxTick);
        }
        if(ticks[0]>min){
          var minticks=ticks[0]-(ticks[len1-1]-ticks[len1-2]);
          ticks.splice(0, 0, minticks);
        }
    }
    return ticks;
}

function formatBigValue(val, needInt) {
    var f = (val < 1000 || needInt) ? d3.format('1f') : d3.format('.1f');
    var prefix = d3.formatPrefix(val);
    var symbol = prefix.symbol === 'G' ? 'B' : prefix.symbol;
    var t = f(prefix.scale(val));
    return f(prefix.scale(val)) + symbol;
}

function getRGBComponents (color) {
        var r = color.substring(1, 3);
        var g = color.substring(3, 5);
        var b = color.substring(5, 7);
        return {
            R: parseInt(r, 16),
            G: parseInt(g, 16),
            B: parseInt(b, 16)
        };
}


function idealTextColor (bgColor) {
        var nThreshold = 105;
        var components = getRGBComponents(bgColor);
        var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);
        return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
}

function getGrayScale(color){
        var components = getRGBComponents(color); 
        var grey = (components.R + components.G + components.B )/3;
        var c = "#"+rgbToHex(grey,grey,grey);
        return c;
}

function rgbToHex(R,G,B) {return toHex(R)+toHex(G)+toHex(B)}
function toHex(n) {
     n = parseInt(n,10);
     if (isNaN(n)) return "00";
     n = Math.max(0,Math.min(n,255));
     return "0123456789ABCDEF".charAt((n-n%16)/16)
          + "0123456789ABCDEF".charAt(n%16);
}

/* Since the IE browser (v10 & above) does not support the foreign object, 
     the wrap function is manually done with SVG function. The function splits 
     the SVG text into words vector and wraps them into lines within the constrained width.
     */
function wrapSVGText(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          y = Number(text.attr("y")),
          dy = parseFloat(text.attr("dy")),
          size =parseFloat(text.style("font-size")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y)

          var lineHeight=Number(size)*0.68;
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        //var tt=tspan.node().getComputedTextLength();
        if (tspan.node().getComputedTextLength() > width && line.length>1) {
          var t=++lineNumber*lineHeight+y;
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", 0).attr("y", ++lineNumber*lineHeight+y)
          .text(word);
        }
      }
    });
}

    function measureMaxTextSize (text, maxFontSize, width, height) {
        var words = text.split(/\s+/);
        words.sort(function(a,b){return b.length-a.length})
        var bigw=words[0];

        var lDiv = document.createElement('lDiv');
        lDiv.setAttribute("id", "Div1");
        document.body.appendChild(lDiv);
        lDiv.style.position = "absolute";
        lDiv.style.left = -1000;
        lDiv.style.top = -1000;
        lDiv.style.width = width+"px";
        var fontSize=maxFontSize;
        var textHeight;
        var textWidth;

        lDiv.innerHTML = text;
        do {
            lDiv.style.fontSize = "" + fontSize + "px";
            textHeight=$('#Div1').height();
            textWidth=$('#Div1').width();
            var t=lDiv.offsetWidth;
            fontSize = fontSize - 1;
        } while (textHeight>height&&fontSize>0);
        document.body.removeChild(lDiv);
        lDiv = null;

        var lDiv2 = document.createElement('lDiv');
        lDiv2.setAttribute("id", "Div2");
        document.body.appendChild(lDiv2);
        lDiv2.style.position = "absolute";
        lDiv2.style.left = -1000;
        lDiv2.style.top = -1000;
        lDiv2.innerHTML = bigw;
        lDiv2.style.fontSize = "" + fontSize + "px";
        var w=$('#Div2').width();
        if(w>width)
        {
           do {
              lDiv2.style.fontSize = "" + fontSize + "px";
              w=$('#Div2').width();
              fontSize = fontSize - 1;
          } while (w>width &&fontSize>0);
          fontSize+=1;         
        }
        document.body.removeChild(lDiv2);
        lDiv2 = null;

        return fontSize;
    }
