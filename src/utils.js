import * as d3 from "d3";
import { MARGIN } from "./constants"


const parseDate = d3.timeParse("%Y%m%d")
const formatDate = d3.timeFormat("%m-%d")

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
        .range([MARGIN.left, dimensions.w - MARGIN.right])

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.totalTestResults) || 1]).nice()
        .range([dimensions.h - MARGIN.bottom, MARGIN.top])

    return {x, y}
  }

export { parseDate, formatDate, scales }
