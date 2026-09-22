function selectFunctions(functions, service) {
  if (service === undefined) return functions;
  const selected = functions.filter(({ name }) => name === service);
  if (selected.length !== 1) {
    throw new Error(`Unknown Lambda service: ${service}`);
  }
  return selected;
}

module.exports = { selectFunctions };
