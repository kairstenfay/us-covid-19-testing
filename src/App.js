import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import * as d3 from "d3";
import gh from "./img/gh.png"
import twitter from "./img/twitter.png"
import styled from "styled-components"

const parseDate = d3.timeParse("%Y%m%d")
const formatDate = d3.timeFormat("%m-%d")
const margin = ({top: 80, right: 120, bottom: 10, left: 100})
const BAR_WIDTH = 10  // todo programmatically determine width
const CIRCLE_RADIUS = 3  // todo programatically determine radius
const DEFAULT_STATE_VALUE = 'NY'
const MAX_MAP_WIDTH = 900
const MAX_MAP_HEIGHT = 400
const MAP_RATIO = MAX_MAP_HEIGHT / MAX_MAP_WIDTH
const LEGEND_PADDING = 5
const LEGEND_BAR_HEIGHT = 10

const SCATTERPLOT_RATIO = 0.4

const LegendDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  text-align: left;
  align-items: center;
`
const LegendUl = styled.ul`
  margin: 0;
  padding-left: ${LEGEND_PADDING}px
  `
  const LegendLi = styled.li`
  margin-top: -1px;
  list-style-type: none;
  line-height: ${LEGEND_BAR_HEIGHT + LEGEND_PADDING}px;
`

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
      d['total'] = d.total || 0
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

/**
 *
 * @param {*} data
 * @param {Object} dimensions {w: int, h: int}
 */
const scales = (data, dimensions) => {
  const dateRange = data.map(d => d.rawDate)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort()
    .map(d => parseDate(d))

  const x = d3.scaleTime()
      .domain([Math.min(...dateRange), Math.max(...dateRange)])
      .range([margin.left, dimensions.w - margin.right])

  const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 1]).nice()
      .range([dimensions.h - margin.bottom, margin.top])

  return {x, y}
}

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
  const [tooltipStyles, setTooltipStyles] = useState({
    display: "none"
  })
  const [tooltipText, setTooltipText] = useState()

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
      setDimensions({
        h: window.innerWidth * SCATTERPLOT_RATIO,
        w: window.innerWidth
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })

  const formatTooltipText = (datum) => {
    const totalDeaths = datum.death === 1
      ? 'was 1 total death'
      : `were ${datum.death} total deaths`

    return (
      <span>
        In {datum.state}, as of {datum.date},
        there {totalDeaths} from COVID-19.
      </span>
    )
  }

// Render legend
  const Legend = () => {
    const renderLegendBars = (barName, index) => (
      <rect className={`data ${barName}`}
        x={0}
        y={(10 + LEGEND_PADDING) * (index + 1)}
        width={BAR_WIDTH}
        height={LEGEND_BAR_HEIGHT} />
    )

    // Array('positive', 'negative').map((d, i) => addLegendBar(d, i))
    return (
      <>
        <p>Legend</p>
        <LegendDiv id="legend">
          <svg width={BAR_WIDTH} height={(LEGEND_BAR_HEIGHT + LEGEND_PADDING) * 3 }>
            <g>
              <circle className="data death"
                r={CIRCLE_RADIUS}
                cx={CIRCLE_RADIUS * 2}
                cy={LEGEND_PADDING} />
              { Array('positive', 'negative')
                  .map((barName, i) => renderLegendBars(barName, i)) }
            </g>
          </svg>
          <LegendUl>
            <LegendLi>Deaths</LegendLi>
            <LegendLi>Positive</LegendLi>
            <LegendLi>Negative</LegendLi>
          </LegendUl>
        </LegendDiv>
      </>
    )
  }

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
        .attr("cx", d => BAR_WIDTH / 2 + CIRCLE_RADIUS / 3 + x(parseDate(d.rawDate)))
        .attr("cy", d => y(d.death))
          .attr("r", CIRCLE_RADIUS)
          .on("mouseover", function(d) {
            setTooltipText(formatTooltipText(d))
            setTooltipStyles({
              position: "absolute",
              left: `${d3.event.pageX + 5}px`,
              top: `${d3.event.pageY - 32}px`
            })
          })
          .on("mouseout", function(d) {
            setTooltipStyles({
              display: "none"
            })
            setTooltipText()
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
            .attr("y", d => y(d[barName]))
            .attr("height", d => d[`${barName}-height`])
            .attr("width", BAR_WIDTH)
      )

      // Axes
      const xAxis = g => g
        .attr("transform", `translate(${BAR_WIDTH / 2},${dimensions.h - margin.bottom})`)
        .call(d3.axisBottom(x)
                .tickFormat(i => formatDate(i))
                .tickSizeOuter(0))
        .call(g => g.append("text")
          .attr("x", dimensions.w / 2)
          .attr("y", margin.bottom * 4)
          .attr("fill", "black")
          .attr("text-anchor", "middle")
          .text("Date (mm-dd)"))
        .classed("xAxis", true)

      const yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        // Remove the axis line
        .call(g => g.select(".domain").remove())
        // Add axis title
        .call(g => g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", 0 - dimensions.h / 2)
          .attr("y", 0 - margin.left / 2)
          .attr("fill", "black")
          .attr("text-anchor", "middle")
          .text('Cumulative total'))
        .classed("yAxis", true)

      data = data.filter(d => d.state === state)

      // Create scales after filtering data
      const {x, y} = scales(data, dimensions)

      data.forEach(d => {
        d['positive-height'] = y(0) - y(d.positive)
        d['negative-height'] = y(d.positive) - y(d.negative)
        d['pending-height'] = y(d.positive) - y(d.negative) - y(d.pending)
      })

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
    const mapWidth = Math.min(dimensions.w, MAX_MAP_WIDTH)
    const mapHeight = Math.min(dimensions.h, MAX_MAP_HEIGHT)
    const svg = d3.select(mapRef.current)

    const projection = d3.geoAlbers()
      .scale(mapWidth * .4)
      .translate([mapWidth / 4, mapHeight * .6])

    const path = d3.geoPath().projection(projection)
    const us = getGeojson()

    us.then(us => {
      svg.selectAll("g").remove()

      svg.append("g")
          .classed("states", true)
        .selectAll("path")
        .data(us.features)
        .enter().append("path")
          .attr("d", path)
          // .attr("state-fips", (d, i) => us.objects.states.geometries[i].id)

      svg.append("path")
          .classed("state-borders", true)
          .attr("d", path)
    })

  }, [dimensions])

  const Header = () => (
    <header className="App-header">
      <h1>COVID-19 Testing Progress</h1>
      <p>U.S. States and Territories</p>
      <span>
        <a href="https://github.com/kairstenfay/us-covid-19-testing">
          <img className="logo" id="gh" src={gh} alt="GitHub" /> GitHub
        </a>
        <a href="https://twitter.com/databae_">
          <img className="logo" id="twitter" src={twitter} alt="Twitter" /> Twitter
        </a>
      </span>
    </header>
  )

  const Selector = () => (
    <select id="state-selector"
      value={state}
      onChange={handleSelectorClick}>

      {stateList.map(state => (
        <option key={state} value={state}>{state}</option>
        ))}
    </select>
  )

  const VizTitle = () => (
    <h2 ref={descriptionRef}>
      Currently viewing {state}
    </h2>
  )

  return (
    <div className="App">
      <Header />

      <p id="rotate-device">Please rotate your device</p>

      <div id="viz-controls">
        <p>
          Select a state from the map or the dropdown below.
          <br />
          <Selector />
        </p>
        <svg ref={mapRef}
          width={Math.min(dimensions.w, MAX_MAP_WIDTH)}
          height={Math.min(dimensions.h, MAX_MAP_HEIGHT)}
          onClick={handleMapClick} />
        <br />
      </div>

      <div id="data-viz">
        <VizTitle />
        <Legend />
        <svg ref={scatterplotRef}
          width={dimensions.w}
          height={dimensions.w / 2} />
        <p id="tooltip" style={tooltipStyles}>
            {tooltipText}
        </p>
      </div>
    </div>
  );
}



export default App;
