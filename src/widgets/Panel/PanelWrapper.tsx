import React, { useState } from "react";
import ExtendedPanel from "./ExtendedPanel";
import DefaultPanel from "./DefaultPanel";

export const PanelWrapper = () => {
    const [expanded, setExpanded] = useState(false);

    const toggleWidth = () => {
        setExpanded(!expanded);
    };
    
    return (
        expanded ? <ExtendedPanel toggleWidth={toggleWidth}/> : <DefaultPanel toggleWidth={toggleWidth}/>
    )
}

export default PanelWrapper