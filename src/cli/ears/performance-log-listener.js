const chalk = require("chalk");
const bus = require("../../utl/bus");

const MS_PER_SECOND = 1000;
const DECIMAL_BASE = 10;
const MAX_EXPECTED_LENGTH = 9;
const K = 1024;

function formatTime(pNumber) {
  return Math.round(MS_PER_SECOND * pNumber)
    .toString(DECIMAL_BASE)
    .concat("ms")
    .padStart(MAX_EXPECTED_LENGTH);
}

function formatMemory(pBytes) {
  return Math.round(pBytes / K / K)
    .toString(DECIMAL_BASE)
    .concat("Mb")
    .padStart(MAX_EXPECTED_LENGTH);
}

function formatPerfLine(pTime, pPreviousTime, pMessage) {
  return `${formatTime(pTime - pPreviousTime)} ${formatMemory(
    process.memoryUsage().heapTotal
  )} ${formatMemory(process.memoryUsage().heapUsed)} ${pMessage}\n`;
}

function writeHeader(pStream, pMaxLogLevel) {
  return (_pMessage, pLevel = bus.levels.SUMMARY) => {
    if (pLevel <= pMaxLogLevel) {
      pStream.write(
        chalk.bold("  elapsed heapTotal  heapUsed after step...\n")
      );
    }
  };
}

function writeProgressMessage(pState, pStream, pMaxLogLevel) {
  return (pMessage, pLevel = bus.levels.SUMMARY) => {
    if (pLevel <= pMaxLogLevel) {
      const lTime = process.uptime();

      pStream.write(
        formatPerfLine(lTime, pState.previousTime, pState.previousMessage)
      );
      pState.previousMessage = pMessage;
      pState.previousTime = lTime;
    }
  };
}

function writeEndMessage(pState, pStream, pMaxLogLevel) {
  return (_pMessage, pLevel = 0) => {
    if (pLevel <= pMaxLogLevel) {
      const lTime = process.uptime();

      pStream.write(
        formatPerfLine(
          lTime,
          pState.previousTime,
          `really done (${formatTime(lTime).trim()})`
        )
      );
      pStream.end();
    }
  };
}

module.exports = function setUpTimeLogListener(
  pMaxLogLevel = bus.levels.INFO,
  pStream = process.stderr
) {
  let lState = {
    previousMessage: "start of node process",
    previousTime: 0,
  };

  bus.on("start", writeHeader(pStream, pMaxLogLevel));

  bus.on("progress", writeProgressMessage(lState, pStream, pMaxLogLevel));

  bus.on("end", writeEndMessage(lState, pStream, pMaxLogLevel));
};
