import React from "react"
import { LegendDiv, LegendLi, LegendUl } from "./styledComponents"
import {
    BAR_WIDTH, CIRCLE_RADIUS, LEGEND_BAR_HEIGHT, LEGEND_PADDING
    } from "../constants"

// Render legend
const Legend = () => {
    const renderLegendBars = (barName, index) => (
      <rect key={barName} className={`data ${barName}`}
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

export { Legend }
