import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider } from "antd";
import reactLogo from "@/assets/react.svg";
import { useState } from "react";
import viteLogo from "/vite.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <StyleProvider layer>
      <ConfigProvider>
        <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
          <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center gap-8 text-center">
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              <a
                href="https://vite.dev"
                target="_blank"
                rel="noreferrer"
                className="rounded-3xl transition-transform duration-300 hover:-translate-y-1"
              >
                <img
                  src={viteLogo}
                  className="h-24 w-24 p-5 transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_rgba(100,108,255,0.67)]"
                  alt="Vite logo"
                />
              </a>
              <a
                href="https://react.dev"
                target="_blank"
                rel="noreferrer"
                className="rounded-3xl transition-transform duration-300 hover:-translate-y-1"
              >
                <img
                  src={reactLogo}
                  className="h-24 w-24 p-5 transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_rgba(97,218,251,0.67)] motion-safe:animate-[spin_20s_linear_infinite]"
                  alt="React logo"
                />
              </a>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium tracking-[0.35em] text-cyan-300/80 uppercase">
                Tailwind + Ant Design Starter
              </p>
              <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Vite + React
              </h1>
            </div>

            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setCount((count) => count + 1)}
                  className="inline-flex items-center rounded-full border border-cyan-400/40 bg-slate-900 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-300 hover:bg-slate-800 focus:ring-2 focus:ring-cyan-300/70 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
                >
                  count is {count}
                </button>
                <p className="text-sm leading-7 text-slate-300">
                  Edit{" "}
                  <code className="rounded-md bg-slate-900 px-2 py-1 font-mono text-cyan-200">
                    src/App.tsx
                  </code>{" "}
                  and save to test HMR
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400">
              Click on the Vite and React logos to learn more
            </p>
          </div>
        </main>
      </ConfigProvider>
    </StyleProvider>
  );
}

export default App;
