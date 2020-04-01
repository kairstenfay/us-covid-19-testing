import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import * as d3 from "d3";
import gh from "./img/gh.png"
import twitter from "./img/twitter.png"
import styled from "styled-components"

const parseDate = d3.timeParse("%Y%m%d")
const formatDate = d3.timeFormat("%m-%d")
const margin = ({top: 10, right: 90, bottom: 10, left: 100})
const BAR_WIDTH = 10  // todo programmatically determine width
const CIRCLE_RADIUS = 3  // todo programatically determine radius
const DEFAULT_STATE_VALUE = 'NY'
const MAX_MAP_WIDTH = 900
const MAX_MAP_HEIGHT = 400
const MAX_BARCHART_WIDTH = 1000
const MAP_RATIO = MAX_MAP_HEIGHT / MAX_MAP_WIDTH
const LEGEND_PADDING = 5
const LEGEND_BAR_HEIGHT = 10
const TOOLTIP_WIDTH = 125

const SCATTERPLOT_RATIO = 0.4

const foregroundStyling = `
  background-color: white;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #c7c7c7;
`
const VizControls = styled.p`
  ${foregroundStyling}
`
const LegendDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  text-align: left;
  align-items: center;
  max-width: 200px;
  ${foregroundStyling}
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
const ToolTip = styled.p`
  margin: 0;
  padding: 5px;
  text-align: left;
  width: ${TOOLTIP_WIDTH}px;
  opacity: 90%;
  ${foregroundStyling}
}
`
const IntroText = styled.div`
  width: 80%;
  font-size: calc(10px + 1vmin);
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

  const formatTooltipText = (datum, dataName) => {
    return (
      <table>
        <tr>
          <th>state</th>
          <td>{datum.state}</td>
        </tr>
        <tr>
          <th>date</th>
          <td>{datum.date}</td>
        </tr>
        <tr>
          <th>{dataName}s</th>
          <td>{datum[dataName]}</td>
        </tr>
      </table>
    )
  }

// Render legend
  const Legend = () => {
    const renderLegendBars = (barName, index) => (
      <rect className={`data ${barName}`}
        x={LEGEND_PADDING}
        y={(LEGEND_BAR_HEIGHT + LEGEND_PADDING) * index + 4}
        width={BAR_WIDTH}
        height={LEGEND_BAR_HEIGHT} />
    )

    // Array('positive', 'negative').map((d, i) => addLegendBar(d, i))
    return (
      <LegendDiv id="legend">
        <h3>Legend</h3>
        <svg
          width={BAR_WIDTH + LEGEND_PADDING}
          height={(LEGEND_BAR_HEIGHT + LEGEND_PADDING) * 3 }>
          <g>
            { Array('negative', 'positive')
                .map((barName, i) => renderLegendBars(barName, i)) }
            <circle className="data death"
              r={CIRCLE_RADIUS}
              cx={LEGEND_PADDING + CIRCLE_RADIUS * 2}
              cy={3 * LEGEND_BAR_HEIGHT + LEGEND_PADDING + 3} />
          </g>
        </svg>
        <LegendUl>
          <LegendLi>Negative</LegendLi>
          <LegendLi>Positive</LegendLi>
          <LegendLi>Deaths</LegendLi>
        </LegendUl>
      </LegendDiv>
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
          setTooltipText(formatTooltipText(d, 'death'))
          setTooltipStyles({
            position: "absolute",
            left: `${d3.event.pageX - (TOOLTIP_WIDTH + BAR_WIDTH) / 2}px`,
            top: `${d3.event.pageY - 100}px`
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
          .on("mouseover", function(d) {
            setTooltipText(formatTooltipText(d, barName))
            setTooltipStyles({
              position: "absolute",
              left: `${d3.event.pageX - (TOOLTIP_WIDTH + BAR_WIDTH) / 2}px`,
              top: `${d3.event.pageY - 100}px`
            })
          })
          .on("mouseout", function(d) {
            setTooltipStyles({
              display: "none"
            })
            setTooltipText()
          })
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
    // TODO: using barchart dimensions for map. is that desirable?
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

  const Intro = () => (
    <IntroText>
      <p>
        How many COVID-19 tests have U.S. states and territories administered?
        These answers are surprisingly hard to find, as the CDC does not
        currently report the number of people tested or test results.
      </p>
      <p>
        These data are sourced from state public health authorities
        by <a href="https://covidtracking.com/">The COVID Tracking Project</a>.
        The site notes that <a href="https://covidtracking.com/about-tracker/">
        not all states report numbers consistently</a>.
      </p>
      <p>
        Because there are so much missing data, especially from states early in
        the outbreak, I am casting <code>null</code> values to 0 here.
      </p>
    </IntroText>
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

      <p id="rotate-device">Please rotate your device</p>
      <div className="App-body">
        <Intro />
        <div id="viz-controls">
          <VizControls>
            Select a state from the map or the dropdown below.
            <br />
            <Selector />
          </VizControls>
          <svg ref={mapRef}
            width={Math.min(dimensions.w, MAX_MAP_WIDTH)}
            height={Math.min(dimensions.h, MAX_MAP_HEIGHT)}
            onClick={handleMapClick} />
          <br />
        </div>

        <div id="data-viz">
          <VizHeader />
          <svg ref={scatterplotRef}
            width={dimensions.w}
            height={dimensions.w / 2} />
          <ToolTip id="tooltip" style={tooltipStyles}>
              {tooltipText}
          </ToolTip>
        </div>
      </div>
    </div>
  );
}



export default App;
