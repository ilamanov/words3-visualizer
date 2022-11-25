import { useLayoutEffect, useRef, useState, useEffect } from "react";
import Head from "next/head";
import { ethers } from "ethers";
import gameContractAbi from "/lib/gameContractAbi.json";
import {
  INITIAL_VALUE,
  ReactSVGPanZoom,
  TOOL_NONE,
  fitSelection,
  zoomOnViewerCenter,
  fitToViewer,
} from "react-svg-pan-zoom";

const NETWORK = "optimism";
const GAME_CONTRACT_ADDRESS = "0x1b16b25dbdc8ae5775290101332a5e7379eecf9f";
const LETTERS = [
  "_",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

function getBounds(txns) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let tx of txns) {
    if (tx.position[0] < minX) {
      minX = tx.position[0];
    }
    if (tx.position[1] < minY) {
      minY = tx.position[1];
    }
    if (tx.direction === 0) {
      const lastX = tx.position[0] + tx.word.length - 1;
      if (lastX > maxX) {
        maxX = lastX;
      }
      if (tx.position[1] > maxY) {
        maxY = tx.position[1];
      }
    } else {
      const lastY = tx.position[1] + tx.word.length - 1;
      if (lastY > maxY) {
        maxY = lastY;
      }
      if (tx.position[0] > maxX) {
        maxX = tx.position[0];
      }
    }
  }
  return { min: [minX, minY], max: [maxX, maxY] };
}

export default function Home({ txns }) {
  const bounds = getBounds(txns);
  console.log("bounds", bounds);

  const svgRef = useRef(null);
  const svgContainerRef = useRef(null);

  const Viewer = useRef(null);
  const [tool, setTool] = useState(TOOL_NONE);
  const [value, setValue] = useState(INITIAL_VALUE);

  useEffect(() => {
    Viewer.current.fitToViewer();
  }, []);

  const _zoomOnViewerCenter1 = () => Viewer.current.zoomOnViewerCenter(1.1);
  const _fitSelection1 = () => Viewer.current.fitSelection(40, 40, 200, 200);
  const _fitToViewer1 = () => Viewer.current.fitToViewer();

  /* keep attention! handling the state in the following way doesn't fire onZoom and onPam hooks */
  const _zoomOnViewerCenter2 = () => setValue(zoomOnViewerCenter(value, 1.1));
  const _fitSelection2 = () => setValue(fitSelection(value, 40, 40, 200, 200));
  const _fitToViewer2 = () => setValue(fitToViewer(value));

  const [viewBox, setViewBox] = useState({
    x: bounds.min[0] - 1,
    y: bounds.min[1] - 1,
    w: bounds.max[0] - bounds.min[0] + 3,
    h: bounds.max[1] - bounds.min[1] + 3,
  });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  // useEffect(() => {
  //   function handleWheel(e) {
  //     e.preventDefault();
  //     const dw = -viewBox.w * Math.sign(e.deltaY) * 0.05;
  //     const dh = -viewBox.h * Math.sign(e.deltaY) * 0.05;
  //     // console.log("dw, dh", dw, dh);
  //     // const rect = e.target.getBoundingClientRect();
  //     // const mx = e.clientX - rect.left; //mouse x
  //     // const my = e.clientY - rect.top;
  //     const mx = e.clientX; //mouse x
  //     const my = e.clientY;
  //     // console.log("mx, my", mx, my);
  //     const dx = (dw * mx) / svgRef.current.clientWidth;
  //     const dy = (dh * my) / svgRef.current.clientHeight;
  //     // console.log("dx, dy", dx, dy);
  //     const tmpViewBox = {
  //       x: viewBox.x + dx,
  //       y: viewBox.y + dy,
  //       w: viewBox.w - dw,
  //       h: viewBox.h - dh,
  //     };
  //     setScale(svgRef.current.clientWidth / tmpViewBox.w);
  //     setViewBox(tmpViewBox);
  //   }
  //   svgContainerRef.current.addEventListener("wheel", handleWheel, {
  //     passive: false,
  //   });
  //   return function cleanup() {
  //     svgContainerRef.current.removeEventListener("wheel", handleWheel, {
  //       passive: false,
  //     });
  //   };
  // });

  return (
    <div className="py-5">
      <Head>
        <title>words3 visualizer</title>
        <meta name="description" content="Visualize actions on words3.xyz" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="text-center text-3xl font-semibold text-vs-code-blue w-full ">
          words3 visualizer
        </h1>

        {/* <div
          ref={svgContainerRef}
          onMouseDown={(e) => {
            setIsPanning(true);
            setStartPoint({ x: e.clientX, y: e.clientY });
          }}
          onMouseMove={(e) => {
            if (isPanning) {
              const tmpEndPoint = { x: e.clientX, y: e.clientY };
              setEndPoint(tmpEndPoint);
              var dx = (startPoint.x - tmpEndPoint.x) / scale;
              var dy = (startPoint.y - tmpEndPoint.y) / scale;
              setViewBox({
                x: viewBox.x + dx,
                y: viewBox.y + dy,
                w: viewBox.w,
                h: viewBox.h,
              });
            }
          }}
          onMouseUp={(e) => {
            if (isPanning) {
              const tmpEndPoint = { x: e.clientX, y: e.clientY };
              setEndPoint(tmpEndPoint);
              var dx = (startPoint.x - tmpEndPoint.x) / scale;
              var dy = (startPoint.y - tmpEndPoint.y) / scale;
              setViewBox({
                x: viewBox.x + dx,
                y: viewBox.y + dy,
                w: viewBox.w,
                h: viewBox.h,
              });
              setIsPanning(false);
            }
          }}
          onMouseLeave={(e) => {
            setIsPanning(false);
          }}
        > */}
        <button className="btn" onClick={() => _zoomOnViewerCenter1()}>
          Zoom on center (mode 1)
        </button>
        <button className="btn" onClick={() => _fitSelection1()}>
          Zoom area 200x200 (mode 1)
        </button>
        <button className="btn" onClick={() => _fitToViewer1()}>
          Fit (mode 1)
        </button>
        <hr />

        <button className="btn" onClick={() => _zoomOnViewerCenter2()}>
          Zoom on center (mode 2)
        </button>
        <button className="btn" onClick={() => _fitSelection2()}>
          Zoom area 200x200 (mode 2)
        </button>
        <button className="btn" onClick={() => _fitToViewer2()}>
          Fit (mode 2)
        </button>
        <hr />

        <ReactSVGPanZoom
          ref={Viewer}
          width={500}
          height={500}
          tool={tool}
          onChangeTool={setTool}
          value={value}
          onChangeValue={setValue}
          onZoom={(e) => console.log("zoom")}
          onPan={(e) => console.log("pan")}
          onClick={(event) =>
            console.log("click", event.x, event.y, event.originalEvent)
          }
        >
          <svg
            ref={svgRef}
            width="100%"
            height="1000px"
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x={10}
              y={10}
              width="10"
              height="10"
              fill={"#bfe2ff"}
              // stroke={"#FBE14C"}
              // strokeWidth={true ? 2 : 0}
            />
          </svg>
        </ReactSVGPanZoom>

        {txns.map((txn) => (
          <div>
            {txn.hash} {txn.word} {txn.position} {txn.direction}
          </div>
        ))}
      </main>

      <footer></footer>
    </div>
  );
}

export async function getStaticProps(context) {
  const provider = new ethers.providers.EtherscanProvider(
    NETWORK,
    process.env.ETHERSCAN_API_KEY
  );
  const iface = new ethers.utils.Interface(gameContractAbi.abi);
  const history = (await provider.getHistory(GAME_CONTRACT_ADDRESS)).slice(3); // we skip first 3 txns because they are for setting up the game

  const gameContractAddress = ethers.utils.getAddress(GAME_CONTRACT_ADDRESS);
  const historyFormatted = [];
  for (let txn of history) {
    if (ethers.utils.getAddress(txn.to) !== gameContractAddress) {
      continue;
    }

    const parsed = iface.parseTransaction({ data: txn.data, value: txn.value });
    if (parsed.name !== "executeTyped") {
      continue;
    }

    const word = parsed.args.word.map((idx) => LETTERS[idx]).join("");
    const position = parsed.args.position;
    const direction = parsed.args.direction;

    historyFormatted.push({
      hash: txn.hash,
      from: txn.from,
      value: txn.value.toString(),
      word,
      position,
      direction,
    });
  }

  return {
    props: {
      txns: historyFormatted,
    },
    revalidate: 5,
  };
}
