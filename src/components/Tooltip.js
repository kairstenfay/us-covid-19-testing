import React from "react";
import styled from "styled-components"


const ChartTooltip = (datum, dataName) => {
    return (
      <table>
        <tbody>
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
        </tbody>
      </table>
    )
  }

const MapTooltip = (state, value) => (
  <>
    <p>
      <strong>{state}</strong> has performed {value} COVID-19 tests.
    </p>
    <p>
      Tap or click for more details.
    </p>
  </>
)


const MapTooltipDiv = styled.div`
  height: 0;
`

export { ChartTooltip, MapTooltip, MapTooltipDiv }
