import React from "react";

const formatTooltipText = (datum, dataName) => {
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

export { formatTooltipText }
