import React, { useState, useEffect, useCallback, useReducer } from "react";
import reducer from "../../reducers/reducer"
import Grid from "./Grid";
import History from "./History";
import "./Edit.css";
import { Button } from "semantic-ui-react";
import html2canvas from "html2canvas";

//control panel components
import ColorPicker from "./control-panel/ColorPicker";
import PixelSizeButtons from "./control-panel/PixelSizeButtons";
import RowColumnButtons from "./control-panel/RowColumnButtons";
import TextInputs from "./control-panel/TextInputs";
import MoveImageToggle from "./control-panel/MoveImageToggle";

//imports for image overlay/drag and drop
import ImageOverlay from "./image-overlay/ImageOverlay";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";


export default function Edit(props) {
  
  //default array for rendering grid
  const blankPattern = [];
  for (let i = 0; i < 25; i++) {
    blankPattern.push([]);
    for (let j = 0; j < 25; j++) {
      blankPattern[i].push("#ffffff00");
    }
  }

  const initialState = {
    pattern: props.setClickedView.colours || blankPattern,
    color: "#9B9B9B"
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const [pixelSize, setPixelSize] = useState("medium");

  useEffect(() => {
    if (props.thisPattern === undefined) {
      // clears grid if user leaves and then returns to edit page
      dispatch({ type: "reset", value: blankPattern });
      props.setHistory([]);
    }
  }, []);

  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [imageURL, setImageURL] = useState("");

  // used to show/hide the history tab
  const [history, viewHistory] = useState("hide");
  let historyTab;

  // image overlay
  const [moveImage, setMoveImage] = useState(false);
  const [zIndex, setzIndex] = useState(1000);
  const toggle = useCallback(() => setMoveImage(!moveImage), [moveImage]);

  // useEffect for image overlay
  useEffect(() => {
    if (moveImage) {
      setzIndex(1000);
    } else {
      setzIndex(0);
    }
  }, [moveImage]);

  function toggleHistory() {
    if (history === "hide") {
      viewHistory("show");
    } else {
      viewHistory("hide");
    }
  }

  if (history === "hide") {
    historyTab = <div></div>;
  } else {
    historyTab = (
      <History
        setPage={props.setPage}
        setCheckpoint={props.setCheckpoint}
        setHistoryView={props.setHistoryView}
        history={props.checkpointHistory}
      />
    );
  }

  function createImage() {
    let input = document.getElementById("capture");
    return html2canvas(input, {
      backgroundColor: "black"
    }).then(canvas => {
      return canvas.toDataURL("image/png");
    });
  }

  //creates new pattern or checkpoint in the database when save is clicked
  function save(title, description) {
    return createImage().then(image => {
      let saveData = {
        description: description,
        title: title,
        colours: state.pattern,
        image_url: image
      };
      props.saveHandler(saveData);
    });
  }

  function setSize(input) {
    setPixelSize(input);
  }

  function handleTitleChange(event) {
    setTitle(event.target.value);
  }

  function handleDescriptionChange(event) {
    setDescription(event.target.value);
  }

  return (
    <section className="edit">
      <div className="grid-history" style={{ zIndex: "100" }}>
        <DndProvider backend={Backend}>
          <ImageOverlay imageURL={imageURL} zIndex={zIndex} />
        </DndProvider>
        <Grid
          pattern={state.pattern}
          updateColor={input => dispatch({ type: "paint", location: input })}
          size={pixelSize}
        />
        {historyTab}
      </div>
      <div className="controls" style={{ backgroundColor: state.color }}>
        <TextInputs
          handleTitleChange={handleTitleChange}
          handleDescriptionChange={handleDescriptionChange}
          setImageURL={setImageURL}
        />
        <MoveImageToggle moveImage={moveImage} toggle={toggle} />
        <ColorPicker
          color={state.color}
          onChangeComplete={input =>
            dispatch({ type: "setColor", value: input.hex })
          }
        />
        <div className="size-controls">
          <RowColumnButtons
            patternRows={state.pattern.length}
            patternColumns={state.pattern[0].length}
            addRowTop={() => dispatch({ type: "addRowTop" })}
            deleteRowTop={() => dispatch({ type: "deleteRowTop" })}
            addRowBottom={() => dispatch({ type: "addRowBottom" })}
            deleteRowBottom={() => dispatch({ type: "deleteRowBottom" })}
            addColumnLeft={() => dispatch({ type: "addColumnLeft" })}
            deleteColumnLeft={() => dispatch({ type: "deleteColumnLeft" })}
            addColumnRight={() => dispatch({ type: "addColumnRight" })}
            deleteColumnRight={() => dispatch({ type: "deleteColumnRight" })}
          />
          <PixelSizeButtons setSize={setSize} />
        </div>
        <Button content="Version history" onClick={toggleHistory} />
        <Button
          onClick={() => {
            save(title, description);
          }}
        >
          Save
        </Button>
      </div>
    </section>
  );
}
