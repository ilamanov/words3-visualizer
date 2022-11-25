import { useRef, useState, useEffect } from "react";
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

export default function Home({ txns, bounds }) {
  const Viewer = useRef(null);
  const Container = useRef(null);
  const [tool, setTool] = useState(TOOL_NONE);
  const [value, setValue] = useState(
    fitSelection(INITIAL_VALUE, -10, -10, 20, 20)
  );

  const viewBox = {
    x: bounds.min[0] - 1,
    y: bounds.min[1] - 1,
    w: bounds.max[0] - bounds.min[0] + 3,
    h: bounds.max[1] - bounds.min[1] + 3,
  };

  console.log(viewBox.w, viewBox.h);

  const grid = [];
  for (let dy = 0; dy < viewBox.h; dy++) {
    const row = [];
    for (let dx = 0; dx < viewBox.w; dx++) {
      row.push(null);
    }
    grid.push(row);
  }

  const states = [
    {
      grid: JSON.parse(JSON.stringify(grid)),
      tx: null,
    },
  ];
  for (let tx of txns) {
    for (let i = 0; i < tx.word.length; i++) {
      if (tx.word[i] !== "_") {
        let thisPosition = [tx.position[0], tx.position[1]];
        if (tx.direction === 0) {
          thisPosition[0] += i;
        } else {
          thisPosition[1] += i;
        }
        grid[thisPosition[1] - viewBox.y][thisPosition[0] - viewBox.x] =
          tx.word[i];
      }
    }
    states.push({
      grid: JSON.parse(JSON.stringify(grid)),
      tx,
    });
  }

  useEffect(() => {
    Viewer.current.fitToViewer();
  }, []);

  const _zoomOnViewerCenter1 = () => Viewer.current.zoomOnViewerCenter(1.1);
  const _fitSelection1 = () => Viewer.current.fitSelection(40, 40, 200, 200);
  const _fitToViewer1 = () => Viewer.current.fitToViewer();

  /* keep attention! handling the state in the following way doesn't fire onZoom and onPam hooks */
  const _zoomOnViewerCenter2 = () => setValue(zoomOnViewerCenter(value, 1.1));
  const _fitSelection2 = () => setValue();
  const _fitToViewer2 = () => setValue(fitToViewer(value));

  const rects = [
    <text x={0} y={0} class="small">
      My
    </text>,
  ];
  for (let dy = 0; dy < viewBox.h; dy++) {
    for (let dx = 0; dx < viewBox.w; dx++) {
      const letter = states[5].grid[dy][dx];
      if (letter) {
        rects.push(
          // <text x={20*(dx + viewBox.x)} y={20*(dy + viewBox.y)} class="small">
          //   My
          // </text>
          <rect
            x={20 * (dx + viewBox.x)}
            y={20 * (dy + viewBox.y)}
            width="1"
            height="1"
            fill={"red"}
            // stroke={"#FBE14C"}
            // strokeWidth={true ? 2 : 0}
          />
        );
      } else {
        rects.push(
          <rect
            x={20 * (dx + viewBox.x)}
            y={20 * (dy + viewBox.y)}
            width="20"
            height="20"
            fill={"#bfe2ff"}
            // stroke={"#FBE14C"}
            // strokeWidth={true ? 2 : 0}
          />
        );
      }
    }
  }

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

        <Button onClick={() => _zoomOnViewerCenter1()}>
          Zoom on center (mode 1)
        </Button>
        <Button onClick={() => _fitSelection1()}>
          Zoom area 200x200 (mode 1)
        </Button>
        <Button onClick={() => _fitToViewer1()}>Fit (mode 1)</Button>

        <Button onClick={() => _zoomOnViewerCenter2()}>
          Zoom on center (mode 2)
        </Button>
        <Button onClick={() => _fitSelection2()}>
          Zoom area 200x200 (mode 2)
        </Button>
        <Button onClick={() => _fitToViewer2()}>Fit (mode 2)</Button>

        <div className="w-full h-[80vh]" ref={Container}>
          <ReactSVGPanZoom
            ref={Viewer}
            width={Container.current ? Container.current.clientWidth : 1500}
            height={Container.current ? Container.current.clientHeight : 1000}
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
              width="100%"
              height="1000px"
              viewBox={`${20 * viewBox.x} ${20 * viewBox.y} ${20 * viewBox.w} ${
                20 * viewBox.h
              }`}
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              {rects}
            </svg>
          </ReactSVGPanZoom>
        </div>

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

function Button({ onClick, children }) {
  return (
    <button className="p-1 border border-vs-code-text" onClick={onClick}>
      {children}
    </button>
  );
}

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

export async function getStaticProps(context) {
  const provider = new ethers.providers.EtherscanProvider(
    NETWORK,
    process.env.ETHERSCAN_API_KEY
  );
  const iface = new ethers.utils.Interface(gameContractAbi.abi);
  const history = (await provider.getHistory(GAME_CONTRACT_ADDRESS)).slice(3); // we skip first 3 txns because they are for setting up the game

  const gameContractAddress = ethers.utils.getAddress(GAME_CONTRACT_ADDRESS);
  const historyFormatted = [
    {
      hash: null,
      from: null,
      value: null,
      word: "INFINITE",
      position: [0, 0],
      direction: 0,
    },
  ];
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

  const bounds = getBounds(historyFormatted);

  return {
    props: {
      txns: historyFormatted,
      bounds: bounds,
    },
    revalidate: 5,
  };
}
