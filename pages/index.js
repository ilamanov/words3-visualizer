import { useState } from "react";
import Head from "next/head";
import { ethers } from "ethers";
import gameContractAbi from "/lib/gameContractAbi.json";

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

export default function Home({ states }) {
  const [txIdx, setTxIdx] = useState(states.length - 1);
  const [filterAddress, setFilterAddress] = useState("");

  let filteredStateIdxs = [...Array(states.length).keys()];
  if (filterAddress !== "" && ethers.utils.isAddress(filterAddress)) {
    filteredStateIdxs = [];
    for (let i = 0; i < states.length; i++) {
      if (
        states[i].tx &&
        ethers.utils.getAddress(states[i].tx.from) ===
          ethers.utils.getAddress(filterAddress)
      ) {
        filteredStateIdxs.push(i);
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

        <div className="sticky top-0 bg-vs-code-bg mt-4 pt-2 pb-8">
          <Slider
            txIdx={
              txIdx >= filteredStateIdxs.length
                ? filteredStateIdxs.length - 1
                : txIdx
            }
            setTxIdx={setTxIdx}
            maxVal={filteredStateIdxs.length - 1}
          />
          <div className="w-fit mx-auto pt-2">
            Filter by address:{" "}
            <input
              className={
                "text-inherit font-mono bg-inherit border border-[#d4d4d4] p-2"
              }
              type="string"
              placeholder="address"
              value={filterAddress}
              onChange={(e) => setFilterAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="text-center mx-auto w-fit">
          {states[
            filteredStateIdxs[
              txIdx >= filteredStateIdxs.length
                ? filteredStateIdxs.length - 1
                : txIdx
            ]
          ].grid.map((row, i) => (
            <div className="flex" key={i}>
              {row.map(({ letter, isNew }, j) => (
                <div
                  key={j}
                  className={
                    "w-[25px] h-[25px] border border-[#5c5c5c] pb-[2px] " +
                    (isNew ? "bg-success font-bold text-vs-code-bg" : "")
                  }
                >
                  {letter}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>

      <footer className="mt-8"></footer>
    </div>
  );
}

function Slider({ txIdx, setTxIdx, maxVal }) {
  const [intervalId, setIntervalId] = useState(null);

  return (
    <>
      <div className="text-center pt-8 pb-2">
        Transaction: {txIdx}/{maxVal}{" "}
        <span
          className="px-3 text-xl md:text-2x cursor-pointer"
          onClick={(e) => {
            if (intervalId) {
              clearInterval(intervalId);
              setIntervalId(null);
            } else {
              setIntervalId(
                setInterval(
                  () => setTxIdx((curr) => Math.min(curr + 1, maxVal)),
                  700
                )
              );
            }
          }}
        >
          {intervalId ? "⏸️" : "▶️"}
        </span>
      </div>
      <div className="w-fit mx-auto pb-2">
        <input
          className="w-[300px] md:w-[450px]"
          type="range"
          name="Transaction Index"
          min="0"
          max={maxVal}
          value={txIdx}
          onChange={(e) => setTxIdx(parseInt(e.target.value))}
        />
      </div>
    </>
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

  const formattedHistory = history
    .filter((tx) => {
      const parsed = iface.parseTransaction({
        data: tx.data,
        value: tx.value,
      });
      return (
        ethers.utils.getAddress(tx.to) === gameContractAddress &&
        parsed.name === "executeTyped"
      );
    })
    .map((tx) => {
      const parsed = iface.parseTransaction({
        data: tx.data,
        value: tx.value,
      });
      return {
        hash: tx.hash,
        from: tx.from,
        value: tx.value.toString(),
        word: parsed.args.word.map((idx) => LETTERS[idx]).join(""),
        position: parsed.args.position,
        direction: parsed.args.direction,
      };
    });

  const txns = [
    {
      hash: null,
      from: "0x1b16b25dbdc8ae5775290101332a5e7379eecf9f",
      value: null,
      word: "INFINITE",
      position: [0, 0],
      direction: 0,
    },
  ].concat(formattedHistory);

  const bounds = getBounds(txns);

  const viewBox = {
    x: bounds.min[0] - 1,
    y: bounds.min[1] - 1,
    w: bounds.max[0] - bounds.min[0] + 3,
    h: bounds.max[1] - bounds.min[1] + 3,
  };

  let grid = [];
  for (let dy = 0; dy < viewBox.h; dy++) {
    const row = [];
    for (let dx = 0; dx < viewBox.w; dx++) {
      row.push({ letter: null });
    }
    grid.push(row);
  }
  let gridUnstyled = JSON.parse(JSON.stringify(grid));

  const states = [
    {
      grid: JSON.parse(JSON.stringify(grid)),
      tx: null,
    },
  ];
  for (let tx of txns) {
    grid = JSON.parse(JSON.stringify(gridUnstyled));
    for (let i = 0; i < tx.word.length; i++) {
      if (tx.word[i] !== "_") {
        let thisPosition = [tx.position[0], tx.position[1]];
        if (tx.direction === 0) {
          thisPosition[0] += i;
        } else {
          thisPosition[1] += i;
        }
        grid[thisPosition[1] - viewBox.y][thisPosition[0] - viewBox.x] = {
          letter: tx.word[i],
          isNew: true,
        };
        gridUnstyled[thisPosition[1] - viewBox.y][thisPosition[0] - viewBox.x] =
          { letter: tx.word[i] };
      }
    }
    states.push({
      grid: JSON.parse(JSON.stringify(grid)),
      tx,
    });
  }

  return {
    props: {
      states: states,
    },
    // revalidate: 5,
  };
}
