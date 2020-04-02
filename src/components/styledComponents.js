import styled from "styled-components"
import { LEGEND_BAR_HEIGHT, LEGEND_PADDING, TOOLTIP_WIDTH } from "../constants"

const IntroText = styled.div`
  width: 70%;
  font-size: calc(10px + 1vmin);
  padding: 25px;
  text-align: left;
`
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
const ToolTip = styled.div`
  margin: 0;
  padding: 5px;
  text-align: left;
  opacity: 90%;
  ${foregroundStyling}
}
`

export { IntroText, VizControls, LegendDiv, LegendUl, LegendLi, ToolTip }
