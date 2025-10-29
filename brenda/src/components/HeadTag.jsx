import { useEffect } from "react";

const HeadTag = ({title}) => {
    useEffect(() => {
        document.title = title;
    }, [title]);

    return null;
}

export default HeadTag;