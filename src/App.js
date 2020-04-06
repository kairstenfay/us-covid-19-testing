import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import * as d3 from "d3";
import { Intro, Header, RotateDevice } from "./components/hardcodedComponents"
import { ChartTooltip, MapTooltip, MapTooltipDiv } from "./components/Tooltip"
import { VizControls, ChartTooltipDiv } from "./components/styledComponents"
import { Legend } from "./components/Legend"
import { BAR_WIDTH, CIRCLE_RADIUS, MARGIN, TOOLTIP_WIDTH } from "./constants"
import { formatDate, parseDate, scales } from "./utils"

const DEFAULT_STATE_VALUE = 'NY'
const MAX_MAP_WIDTH = 900
const MAX_MAP_HEIGHT = 400
const MAX_BARCHART_WIDTH = 1000
const MAP_RATIO = MAX_MAP_HEIGHT / MAX_MAP_WIDTH

const SCATTERPLOT_RATIO = 0.4


async function getData() {
  const data = await d3.json("https://covidtracking.com/api/states/daily")

  data.forEach(d => {
      // Preserve raw date string
      d['rawDate'] = d.date
      d['date'] = formatDate(parseDate(d.date))

      d['positive'] = d.positive || 0
      d['negative'] = d.negative || 0
      d['pending'] = d.pending || 0
      d['death'] = d.death || 0
      d['totalTestResults'] = d.totalTestResults || 0
    })
  return data
}

async function getGeojson() {
  return await d3.json("https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json")
}

async function getFipsMapper() {
  return await d3.json('https://gist.githubusercontent.com/mbejda/4c62c7d64af5556b355a67d09cd3bf34/raw/d4ceb79eba71931e9d9fe43eb91eedd78f4fcc61/states_by_fips.json')
}

// async function getAbbrevMapper() {
//   return await d3.json('https://gist.github.com/mshafrir/2646763#file-states_hash-json')
// }


const t = d3.transition()
  .duration(750)
  .ease(d3.easeCubicOut)


function App() {
  const [data] = useState(getData())
  const [fipsMapper] = useState(getFipsMapper())
  // const [abbrevMapper] = useState(getAbbrevMapper())

  // confusingly named 'state', but I mean U.S. state
  const [state, setState] = useState(DEFAULT_STATE_VALUE)
  const [stateList, setStateList] = useState([DEFAULT_STATE_VALUE])
  const [dimensions, setDimensions] = useState({
    h: window.innerWidth * SCATTERPLOT_RATIO,
    w: window.innerWidth
  })
  const [chartTooltipStyles, setChartTooltipStyles] = useState({
    display: "none"
  })

  const [chartTooltipText, setChartTooltipText] = useState()
  const [mapTooltipText, setMapTooltipText] = useState()

  const scatterplotRef = useRef()
  const mapRef = useRef()
  const descriptionRef = useRef()

  const scrollToViz = () => descriptionRef.current.scrollIntoView({ behavior: "smooth" })

  const handleMapClick = (event) => {
    const target = event.target.__data__
    if (target) {
      // Address known bug with Puerto Rico fips code in mapping data
      const fips = target.id === '72' ? '43' : target.id
      fipsMapper.then(mapper => setState(mapper[fips].abbreviation))
      scrollToViz()
    }
  }

  const handleSelectorClick = (event) => {
    setState(event.target.value)
    scrollToViz()
  }

  useEffect(() => {
    function handleResize() {
      const width = Math.min(window.innerWidth, MAX_BARCHART_WIDTH)
      setDimensions({
        h: width * SCATTERPLOT_RATIO,
        w: width
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })


// Render scatterplot
  useEffect(() => {
    data.then(data => {  // todo catch error
      setStateList(Array(...new Set(data.map(d => d.state))))

      const svg = d3.select(scatterplotRef.current)

      const addDataPoints = () => (
        svg
        .append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .classed('data death', true)
        .attr("data-state", d => d.state)
        .attr("cx", d => barWidth / 2 + CIRCLE_RADIUS / 3 + x(parseDate(d.rawDate)))
        .attr("cy", d => y(d.death))
          .attr("r", CIRCLE_RADIUS)
        .on("mouseover", function(d) {
          setChartTooltipText(ChartTooltip(d, 'death'))
          setChartTooltipStyles({
            position: "absolute",
            left: `${d3.event.pageX - (TOOLTIP_WIDTH + barWidth) / 2}px`,
            top: `${d3.event.pageY - 100}px`
          })
        })
        .on("mouseout", function(d) {
          setChartTooltipStyles({
            display: "none"
          })
          setChartTooltipText()
        })
      )

      const addBars = (barName) => (
        svg.append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
            .classed(`data ${barName}`, true)
            .attr("data-state", d => d.state)
            .attr("x", d => x(parseDate(d.rawDate)))
            .attr("y", d => d[`${barName}-y`])
            .attr("height", d => y(0) - y(d[barName]))
            .attr("width", barWidth)
          .on("mouseover", function(d) {
            setChartTooltipText(ChartTooltip(d, barName))
            setChartTooltipStyles({
              position: "absolute",
              left: `${d3.event.pageX - (TOOLTIP_WIDTH + BAR_WIDTH) / 2}px`,
              top: `${d3.event.pageY - 100}px`
            })
          })
          .on("mouseout", function(d) {
            setChartTooltipStyles({
              display: "none"
            })
            setChartTooltipText()
          })
      )

      // Axes
      const xAxis = g => g
        .attr("transform", `translate(${barWidth / 2},${dimensions.h - MARGIN.bottom})`)
        .call(d3.axisBottom(x)
                .ticks(5)
                .tickFormat(i => formatDate(i))
                .tickSizeOuter(0))
        .call(g => g.append("text")
          .attr("x", dimensions.w / 2)
          .attr("y", MARGIN.bottom * 4)
          .attr("fill", "black")
          .attr("text-anchor", "middle")
          .text("Date (mm-dd)"))
        .classed("xAxis", true)

      const yAxis = g => g
        .attr("transform", `translate(${MARGIN.left},0)`)
        .call(d3.axisLeft(y))
        // Remove the axis line
        .call(g => g.select(".domain").remove())
        // Add axis title
        .call(g => g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", 0 - dimensions.h / 2)
          .attr("y", 0 - MARGIN.left / 2)
          .attr("fill", "black")
          .attr("text-anchor", "middle")
          .text('Cumulative total'))
        .classed("yAxis", true)

      data = data.filter(d => d.state === state)

      // Create scales after filtering data
      const {x, y} = scales(data, dimensions)

      data.forEach(d => {
        d['positive-y'] = y(d.positive)
        d['negative-y'] = y(d.positive + d.negative)
      })
      const barWidth = (dimensions.w - MARGIN.left - MARGIN.right) / data.length

      svg.selectAll("circle").remove()
      svg.selectAll("g").remove()

      addBars('positive')
      addBars('negative')
      addDataPoints()

      svg.append("g")
        .call(xAxis)

      svg.append("g")
        .call(yAxis)

  })}, [state, data, dimensions])


// Render US States choropleth map
  useEffect(() => {
    const mapWidth = Math.min(window.innerWidth, MAX_MAP_WIDTH)
    const mapHeight = Math.min(window.innerHeight, MAX_MAP_HEIGHT)
    const svg = d3.select(mapRef.current)

    let scale = mapWidth * .9
    let translation = mapWidth * 0.5
    if (window.innerWidth >= 900) {
      scale -= TOOLTIP_WIDTH + 200
      translation -= TOOLTIP_WIDTH
    }

    const projection = d3.geoAlbers()
      .scale(scale)
      .translate([translation, mapHeight * .5])

    const path = d3.geoPath().projection(projection)
    const us = getGeojson()

    Promise.all([us, data, fipsMapper]).then((values) => {
      const us = values[0]
      const data = values[1]
      const fipsMapper = values[2]

      const maxValuesPerState = d3.nest()
        .key(d => d.fips)
        .rollup(d => d3.max(d, g => g.totalTestResults)
        ).entries(data)

      // Convert flattened arrays to object
      let mapData = {}
      maxValuesPerState.forEach(d => { mapData[d.key] = d.value })

      const colorScale = d3.scaleSequential(d3.interpolateWarm)
        .domain([
          d3.max(maxValuesPerState, d => Math.log(d.value)),
          d3.min(maxValuesPerState, d => Math.log(d.value))
        ])

      svg.selectAll("g").remove()

      svg.append("g")
          .classed("states", true)
        .selectAll("path")
        .data(us.features)
        .enter().append("path")
          .attr("d", path)
          .attr("fill", d => colorScale(Math.log(mapData[d.id])))
          .on("mouseover", function(d) {
            // Address known bug with Puerto Rico fips code in mapping data
            const fips = d.id === '72' ? '43' : d.id
            const state = fipsMapper[fips].abbreviation

            setMapTooltipText(MapTooltip(state, mapData[d.id]))
          })
          .on("mouseout", function(d) {
            setMapTooltipText()
          })

      svg.append("path")
          .classed("state-borders", true)
          .attr("d", path)
    })

  }, [data, dimensions, fipsMapper])


  const Selector = () => (
    <select id="state-selector"
      value={state}
      onChange={handleSelectorClick}>

      {stateList.map(state => (
        <option key={state} value={state}>{state}</option>
        ))}
    </select>
  )


  const VizHeader = () => (
    <div id="viz-header">
      <h2 ref={descriptionRef}>
        Currently viewing {state}
      </h2>
      <Legend />
    </div>
  )

  return (
    <div className="App">
      <Header />
      <RotateDevice />
      <div className="App-body">
        <Intro />
        <div id="viz-controls">
          <div className="viz-control text">
            <VizControls>
              Select a state from the map or the dropdown below.
              <br />
              <Selector />
            </VizControls>
              <MapTooltipDiv id="map-tooltip">
                {mapTooltipText}
              </MapTooltipDiv>
          </div>
          <svg ref={mapRef}
            width={Math.min(window.innerWidth, MAX_MAP_WIDTH)}
            height={Math.min(window.innerHeight, MAX_MAP_HEIGHT)}
            onClick={handleMapClick} />
          <br />
        </div>

        <div id="data-viz">
          <VizHeader />
          <svg ref={scatterplotRef}
            width={dimensions.w}
            height={dimensions.w / 2} />
          <ChartTooltipDiv id="chart-tooltip" style={chartTooltipStyles}>
              {chartTooltipText}
          </ChartTooltipDiv>
        </div>
      </div>
    </div>
  );
}



export default App;
