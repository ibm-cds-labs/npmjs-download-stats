/* global d3, SimpleDataVis */

/**
 *  - Pie Chart visualization for the SimpleDataVis JavaScript module
 */
(function (datavis) {
  datavis.register({
    type: 'pie-chart',

    canRender: function (donutchartdata) {
      var data = donutchartdata ? (donutchartdata.data || donutchartdata) : []
      // an array of 1 - 20 objects with key/value
      return Object.prototype.toString.call(data) === '[object Array]' &&
        data.length &&
        data.length > 0 &&
        data.length <= 20 &&
        data[0].hasOwnProperty('key') &&
        data[0].hasOwnProperty('value') &&
        !isNaN(parseInt(data[0].value, 10))
    },

    render: function (selection, donutchartdata, options, callbacks) {
      var percent = d3.format('.0%')

      var opts = options || {}
      var data = donutchartdata ? (donutchartdata.data || donutchartdata) : []
      var keys = donutchartdata.keys && donutchartdata.keys.length
        ? donutchartdata.keys
        : data.map(function (d) { return d.key })

      keys.sort(function (a, b) { return a > b })

      var box = selection.node().getBoundingClientRect()
      var width = (box.width || 600)
      var height = (box.height || 600)
      // var width = Math.max(400, box.width)
      // var height = Math.max(400, (20 * data.length))
      var outerRadius = Math.min(height, width) / 2 - 20
      var innerRadius = opts.donut ? outerRadius / 3 : 1
      // var cornerRadius = 10

      var arc = d3.svg.arc()
      var color = d3.scale.category10().domain(keys)
      var pie = d3.layout.pie()
        .padAngle(0.01)
        .value(function (d) { return d.value })
        .sort(null)

      arc.padRadius(outerRadius)
        .innerRadius(innerRadius)

      function arcExplode (outerRadius, delay) {
        d3.select(this).transition().delay(delay).attrTween('d', function (d) {
          var i = d3.interpolate(d.outerRadius, outerRadius)
          return function (t) {
            d.outerRadius = i(t)
            return arc(d)
          }
        })
      }

      function arcResize (a) {
        var i = d3.interpolate(this._current, a)
        this._current = i(0)
        return function (t) {
          return arc(i(t))
        }
      }

      // setup the svg element
      var svg = selection.selectAll('svg').data([data])
      svg.enter().append('svg')
      svg.attr('width', width)
        .attr('height', height)

      var graph = svg.selectAll('g').data([data])
      graph.enter().append('g')
      graph.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

      // pie chart arcs
      var arcs = graph.selectAll('path').data(pie)

      // add new arcs
      arcs.enter().append('path')
        .each(function (d) {
          d.outerRadius = outerRadius - 20
          this._current = d
        })
        .attr('d', arc)

      // update arcs
      arcs.transition().attrTween('d', arcResize)
        .each('end', function (d) {
          d.outerRadius = outerRadius - 20
          this._current = d
          d3.select(this)
            .attr('fill', function (d, i) {
              return color(d.data.key)
            })
            .on('mouseover', function (d, i) {
              SimpleDataVis.tooltip.mouseover(d, i, opts)
              arcExplode.call(this, outerRadius, 0)
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', function (d, i) {
              SimpleDataVis.tooltip.mouseout(d, i)
              arcExplode.call(this, outerRadius - 20, 150)
            })
        })

      // remove old arcs
      arcs.exit().transition()
        .style('opacity', 0)
        .remove()

      // legend key
      var legendkey = svg.selectAll('rect.legend').data(keys)

      // add new keys
      legendkey.enter().append('rect')
        .attr('class', 'legend')
        // .attr('opacity', 0)
        .attr('x', 0)
        .attr('y', function (d, i) { return i * 20 })
        .attr('width', 18)
        .attr('height', 18)

      // update keys
      legendkey.transition()
        .style('fill', function (d) { return color(d) })

      // remove old keys
      legendkey.exit().transition()
        .attr('opacity', 0)
        .remove()

      // legend label
      var total = d3.sum(data, function (d) { return d.value })
      var legendlabel = svg.selectAll('text.legend').data(keys)

      // add new labels
      legendlabel.enter().append('text')
        .attr('class', 'legend')
        .attr('x', 24)
        .attr('y', function (d, i) { return (i * 20 + 9) })
        .attr('dy', '.35em')

      // update labels
      legendlabel.transition()
        .text(function (d) {
          var current = data.filter(function (_d) { return _d.key === d })
          var v = current.length > 0 ? current[0].value : 0
          return d + ': ' + percent(v / total)
        })

      // remove old labels
      legendlabel.exit().transition()
        .attr('opacity', 0)
        .remove()
    }
  })
}(SimpleDataVis))
