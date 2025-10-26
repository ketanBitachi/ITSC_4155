afterEach(() => {
  jest.clearAllMocks();

  if (typeof document !== "undefined") {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  }
  if (global.localStorage && typeof global.localStorage.clear === "function") {
    global.localStorage.clear();
  }
});