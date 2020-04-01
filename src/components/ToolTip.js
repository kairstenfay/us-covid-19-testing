import React from "react";

const chartTooltipText = (datum, dataName) => {
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

const mapTooltipText = (state, value) => (
  <>
    <p>
      <strong>{state}</strong> has performed {value} COVID-19 tests.
    </p>
    <p>
      Tap or click for more details.
    </p>
  </>
)

export { chartTooltipText, mapTooltipText }
